/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';

export interface OnlinePlayerState {
  id: string;
  name: string;
  school: string;
  studentClass: string;
  avatarColor: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  isMoving: boolean;
  level: number;
  solvedQuestions: number;
  completedChapters: number;
  totalScore: number;
  activeChapterId: number | null;
  joinedAt: number;
  lastSeen: number;
}

interface ClientSession {
  id: string;
  ws: WebSocket;
  joined: boolean;
  isAlive: boolean;
}

const AVATAR_PALETTE = [
  0xef4444,
  0xec4899,
  0x8b5cf6,
  0x06b6d4,
  0xf97316,
  0x10b981,
  0xeab308,
  0x3b82f6,
  0x14b8a6,
  0xf43f5e,
];

function clampNumber(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, val));
}

function sanitizeText(val: unknown, maxLen: number, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  const cleaned = val.replace(/\s+/g, ' ').trim().slice(0, maxLen);
  return cleaned || fallback;
}

function pickAvatarColor(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function computeLevel(solvedQuestions: number): number {
  return 1 + Math.floor(Math.max(0, Math.min(55, solvedQuestions)) / 5);
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Allow Google Sign-In popups cleanly
  app.use((_req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });

  app.use(express.json({ limit: '128kb' }));

  // Persistent per-student progress & profile store (.data/progress.json)
  interface ProgressEntry {
    solved: boolean;
    stars: number;
    attempts: number;
  }
  interface StoredStudentRecord {
    accountKey: string;
    profile: {
      name: string;
      school: string;
      studentClass: string;
      email: string;
    };
    progress: Record<string, ProgressEntry>;
    updatedAt: number;
  }

  const dataDir = path.resolve(import.meta.dirname, '.data');
  const progressFilePath = path.join(dataDir, 'progress.json');
  const progressStore = new Map<string, StoredStudentRecord>();

  try {
    if (fs.existsSync(progressFilePath)) {
      const raw = fs.readFileSync(progressFilePath, 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, StoredStudentRecord>;
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          if (v && v.accountKey && v.profile && v.progress) {
            progressStore.set(k, v);
          }
        }
      }
    }
  } catch {
    // Start fresh if file unreadable
  }

  const flushProgressToDisk = () => {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      const obj: Record<string, StoredStudentRecord> = {};
      for (const [k, v] of progressStore.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(progressFilePath, JSON.stringify(obj), 'utf-8');
    } catch (err) {
      console.error('Failed to persist student progress:', err);
    }
  };

  const mergeProgressRecords = (
    a: Record<string, ProgressEntry>,
    b: Record<string, ProgressEntry>
  ): Record<string, ProgressEntry> => {
    const merged: Record<string, ProgressEntry> = { ...a };
    for (const [qId, entryB] of Object.entries(b)) {
      const qNum = Number(qId);
      if (!Number.isInteger(qNum) || qNum < 1 || qNum > 55 || !entryB) continue;
      const entryA = merged[qId];
      if (!entryA) {
        merged[qId] = {
          solved: Boolean(entryB.solved),
          stars: Math.max(0, Math.min(3, Number(entryB.stars) || 0)),
          attempts: Math.max(0, Math.min(999, Number(entryB.attempts) || 0)),
        };
      } else {
        merged[qId] = {
          solved: Boolean(entryA.solved || entryB.solved),
          stars: Math.max(entryA.stars || 0, Math.min(3, Number(entryB.stars) || 0)),
          attempts: Math.max(entryA.attempts || 0, Math.min(999, Number(entryB.attempts) || 0)),
        };
      }
    }
    return merged;
  };

  // Authoritative in-memory world state for the single shared city map
  const players = new Map<string, OnlinePlayerState>();
  const sessions = new Map<string, ClientSession>();

  const sendJson = (ws: WebSocket, data: unknown) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  const broadcastExcept = (excludeId: string | null, data: unknown) => {
    const serialized = JSON.stringify(data);
    for (const session of sessions.values()) {
      if (session.id !== excludeId && session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(serialized);
      }
    }
  };

  const broadcastAll = (data: unknown) => {
    broadcastExcept(null, data);
  };

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      onlinePlayers: players.size,
      timestamp: Date.now(),
    });
  });

  app.get('/api/progress', (req, res) => {
    const key = typeof req.query.key === 'string' ? req.query.key.trim().toLowerCase().slice(0, 160) : '';
    if (!key) {
      res.status(400).json({ found: false, error: 'Missing key' });
      return;
    }
    const existing = progressStore.get(key);
    if (!existing) {
      res.json({ found: false });
      return;
    }
    res.json({ found: true, record: existing });
  });

  app.post('/api/progress', (req, res) => {
    const body = req.body as Partial<StoredStudentRecord> | undefined;
    const rawKey = typeof body?.accountKey === 'string' ? body.accountKey.trim().toLowerCase().slice(0, 160) : '';
    if (!rawKey) {
      res.status(400).json({ ok: false, error: 'Invalid accountKey' });
      return;
    }
    const existing = progressStore.get(rawKey);
    const incomingProfile = body?.profile;
    const mergedProfile = {
      name: sanitizeText(incomingProfile?.name, 40, existing?.profile.name || 'Siswa'),
      school: sanitizeText(incomingProfile?.school, 50, existing?.profile.school || ''),
      studentClass: sanitizeText(incomingProfile?.studentClass, 16, existing?.profile.studentClass || ''),
      email: sanitizeText(incomingProfile?.email, 80, existing?.profile.email || ''),
    };
    const incomingProgress =
      body?.progress && typeof body.progress === 'object'
        ? (body.progress as Record<string, ProgressEntry>)
        : {};
    const mergedProgress = mergeProgressRecords(existing?.progress || {}, incomingProgress);
    const updated: StoredStudentRecord = {
      accountKey: rawKey,
      profile: mergedProfile,
      progress: mergedProgress,
      updatedAt: Date.now(),
    };
    progressStore.set(rawKey, updated);
    flushProgressToDisk();
    res.json({ ok: true, record: updated });
  });

  const wss = new WebSocketServer({ server, path: '/ws/city' });

  wss.on('connection', (ws) => {
    const playerId = crypto.randomUUID();
    const session: ClientSession = {
      id: playerId,
      ws,
      joined: false,
      isAlive: true,
    };
    sessions.set(playerId, session);

    // Send initial authoritative world snapshot
    sendJson(ws, {
      type: 'world:init',
      selfId: playerId,
      players: Array.from(players.values()),
    });

    ws.on('pong', () => {
      session.isAlive = true;
      const existing = players.get(playerId);
      if (existing) {
        existing.lastSeen = Date.now();
      }
    });

    ws.on('message', (raw) => {
      session.isAlive = true;
      let msg: { type?: string; payload?: Record<string, unknown> };
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (!msg || typeof msg.type !== 'string') return;
      const payload = (msg.payload && typeof msg.payload === 'object' ? msg.payload : {}) as Record<
        string,
        unknown
      >;
      const now = Date.now();

      if (msg.type === 'player:join') {
        const name = sanitizeText(payload.name, 30, 'Siswa');
        const school = sanitizeText(payload.school, 36, 'SMP');
        const studentClass = sanitizeText(payload.studentClass, 12, '-');
        const solvedQuestions = Math.round(clampNumber(payload.solvedQuestions, 0, 55, 0));
        const completedChapters = Math.round(clampNumber(payload.completedChapters, 0, 11, 0));
        const totalScore = Math.round(clampNumber(payload.totalScore, 0, 5000, 0));
        const activeChapterId =
          typeof payload.activeChapterId === 'number' &&
          payload.activeChapterId >= 1 &&
          payload.activeChapterId <= 11
            ? Math.round(payload.activeChapterId)
            : null;

        const existing = players.get(playerId);
        const state: OnlinePlayerState = {
          id: playerId,
          name,
          school,
          studentClass,
          avatarColor: existing?.avatarColor ?? pickAvatarColor(`${name}-${playerId}`),
          x: clampNumber(payload.x, -80, 80, existing?.x ?? 0),
          y: clampNumber(payload.y, -10, 40, existing?.y ?? 0.2),
          z: clampNumber(payload.z, -80, 80, existing?.z ?? 12),
          yaw: clampNumber(payload.yaw, -Math.PI * 4, Math.PI * 4, existing?.yaw ?? Math.PI),
          isMoving: Boolean(payload.isMoving),
          level: computeLevel(solvedQuestions),
          solvedQuestions,
          completedChapters,
          totalScore,
          activeChapterId,
          joinedAt: existing?.joinedAt ?? now,
          lastSeen: now,
        };

        const alreadyJoined = session.joined;
        session.joined = true;
        players.set(playerId, state);

        if (alreadyJoined) {
          broadcastAll({ type: 'player:updated', player: state });
        } else {
          // Confirm own sanitized state & notify others idempotently
          sendJson(ws, { type: 'player:updated', player: state });
          broadcastExcept(playerId, { type: 'player:joined', player: state });
        }
        return;
      }

      if (msg.type === 'player:move') {
        const player = players.get(playerId);
        if (!player) return;

        player.x = clampNumber(payload.x, -80, 80, player.x);
        player.y = clampNumber(payload.y, -10, 40, player.y);
        player.z = clampNumber(payload.z, -80, 80, player.z);
        player.yaw = clampNumber(payload.yaw, -Math.PI * 4, Math.PI * 4, player.yaw);
        player.isMoving = Boolean(payload.isMoving);
        player.lastSeen = now;

        broadcastExcept(playerId, {
          type: 'player:moved',
          id: playerId,
          x: player.x,
          y: player.y,
          z: player.z,
          yaw: player.yaw,
          isMoving: player.isMoving,
        });
        return;
      }

      if (msg.type === 'player:progress') {
        const player = players.get(playerId);
        if (!player) return;

        const solvedQuestions = Math.round(
          clampNumber(payload.solvedQuestions, 0, 55, player.solvedQuestions)
        );
        const completedChapters = Math.round(
          clampNumber(payload.completedChapters, 0, 11, player.completedChapters)
        );
        const totalScore = Math.round(clampNumber(payload.totalScore, 0, 5000, player.totalScore));
        const activeChapterId =
          payload.activeChapterId === null
            ? null
            : typeof payload.activeChapterId === 'number' &&
                payload.activeChapterId >= 1 &&
                payload.activeChapterId <= 11
              ? Math.round(payload.activeChapterId)
              : player.activeChapterId;

        player.solvedQuestions = solvedQuestions;
        player.completedChapters = completedChapters;
        player.totalScore = totalScore;
        player.level = computeLevel(solvedQuestions);
        player.activeChapterId = activeChapterId;
        player.lastSeen = now;

        broadcastAll({ type: 'player:updated', player });
        return;
      }

      if (msg.type === 'player:leave') {
        if (players.delete(playerId)) {
          session.joined = false;
          broadcastExcept(playerId, { type: 'player:left', id: playerId });
        }
      }
    });

    ws.on('close', () => {
      sessions.delete(playerId);
      if (players.delete(playerId)) {
        broadcastExcept(playerId, { type: 'player:left', id: playerId });
      }
    });

    ws.on('error', () => {
      sessions.delete(playerId);
      if (players.delete(playerId)) {
        broadcastExcept(playerId, { type: 'player:left', id: playerId });
      }
    });
  });

  // Periodic heartbeat to purge disconnected mobile/tab ghosts promptly
  const heartbeatInterval = setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
      if (!session.isAlive) {
        session.ws.terminate();
        sessions.delete(id);
        if (players.delete(id)) {
          broadcastAll({ type: 'player:left', id });
        }
        continue;
      }
      session.isAlive = false;
      if (session.ws.readyState === WebSocket.OPEN) {
        session.ws.ping();
      }
      const player = players.get(id);
      if (player && now - player.lastSeen > 120000) {
        // Keep active idle players alive as long as pong succeeds
        player.lastSeen = now;
      }
    }
  }, 15000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(import.meta.dirname, 'dist');

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/ws/')) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
