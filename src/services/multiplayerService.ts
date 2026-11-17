/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from './firebaseApp';
import {
  isVerifiedFirebaseUser,
  pickAvatarColorForUid,
  removeWorldPlayerFirestore,
  subscribeWorldPlayersFirestore,
  upsertWorldPlayerFirestore,
} from './firestoreService';

export interface OnlinePlayerState {
  id: string;
  uid?: string | null;
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

export interface JoinPlayerPayload {
  uid?: string | null;
  name: string;
  school: string;
  studentClass: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  isMoving: boolean;
  solvedQuestions: number;
  completedChapters: number;
  totalScore: number;
  activeChapterId: number | null;
}

export type MultiplayerDeltaEvent =
  | { type: 'init'; selfId: string | null; players: OnlinePlayerState[] }
  | { type: 'joined'; player: OnlinePlayerState }
  | {
      type: 'moved';
      id: string;
      x: number;
      y: number;
      z: number;
      yaw: number;
      isMoving: boolean;
    }
  | { type: 'updated'; player: OnlinePlayerState }
  | { type: 'left'; id: string };

export type SyncListener = (snapshot: {
  connected: boolean;
  cloudConnected: boolean;
  selfId: string | null;
  players: OnlinePlayerState[];
}) => void;

export type DeltaListener = (event: MultiplayerDeltaEvent) => void;

function resolveWsUrl(): string {
  const customUrl = (import.meta as any).env?.VITE_MULTIPLAYER_WS_URL as string | undefined;
  if (customUrl && customUrl.trim()) {
    return customUrl.trim();
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/city`;
}

class MultiplayerService {
  private ws: WebSocket | null = null;
  private wsConnected = false;
  private httpConnected = false;
  private firestoreConnected = false;
  private intentionalClose = false;
  private reconnectTimer: number | null = null;
  private reconnectAttempt = 0;

  private httpSelfId: string | null = null;
  private wsSelfId: string | null = null;
  private httpSupported = true;
  private httpPollTimer: number | null = null;
  private httpInFlight = false;

  private firestoreUnsub: (() => void) | null = null;
  private authUnsub: (() => void) | null = null;
  private firestoreHeartbeatTimer: number | null = null;
  private lastFsMoveSentAt = 0;
  private lastFsSentMoving = false;
  private lastFsSentX = 0;
  private lastFsSentZ = 0;

  private selfId: string | null = null;
  private wsPlayers = new Map<string, OnlinePlayerState>();
  private firestorePlayers = new Map<string, OnlinePlayerState>();
  private mergedPlayers = new Map<string, OnlinePlayerState>();
  private lastJoinPayload: JoinPlayerPayload | null = null;

  private lastMoveSentAt = 0;
  private lastSentMovingState = false;
  private lastSentX = 0;
  private lastSentZ = 0;
  private lastSentYaw = 0;

  private syncListeners = new Set<SyncListener>();
  private deltaListeners = new Set<DeltaListener>();
  private syncNotifyTimer: number | null = null;
  private pageHideBound = false;

  public connect(payload: JoinPlayerPayload) {
    this.lastJoinPayload = { ...payload };
    this.intentionalClose = false;
    this.bindPageHide();

    // Start / refresh Firestore global shared-map sync when user is Google-authenticated
    this.setupAuthAndFirestoreSync();
    if (isVerifiedFirebaseUser()) {
      this.pushFirestoreSelfState(true);
    }

    // Also maintain same-server WebSocket + HTTP /api/world/sync fallback for manual users & low-latency movement
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'player:join', payload: this.lastJoinPayload });
    } else if (!this.ws || this.ws.readyState !== WebSocket.CONNECTING) {
      this.openSocket();
    }

    this.ensureHttpFallbackLoop();
    this.syncMergedAndEmitDeltas(false);
  }

  private bindPageHide() {
    if (this.pageHideBound || typeof window === 'undefined') return;
    this.pageHideBound = true;
    const onLeave = () => {
      if (this.httpSelfId && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        try {
          const blob = new Blob([JSON.stringify({ id: this.httpSelfId })], {
            type: 'application/json',
          });
          navigator.sendBeacon('/api/world/leave', blob);
        } catch {
          // ignore
        }
      }
      if (isVerifiedFirebaseUser()) {
        removeWorldPlayerFirestore().catch(() => {});
      }
    };
    window.addEventListener('pagehide', onLeave);
    window.addEventListener('beforeunload', onLeave);
  }

  private setupAuthAndFirestoreSync() {
    if (this.authUnsub) {
      if (isVerifiedFirebaseUser() && !this.firestoreUnsub) {
        this.startFirestoreWorldListener();
      }
      return;
    }

    this.authUnsub = onAuthStateChanged(firebaseAuth, (user) => {
      if (this.intentionalClose || !this.lastJoinPayload) return;
      if (user && user.emailVerified) {
        this.lastJoinPayload.uid = user.uid;
        if (!this.firestoreUnsub) {
          this.startFirestoreWorldListener();
        }
        this.pushFirestoreSelfState(true);
      } else {
        this.stopFirestoreWorldListener();
        this.firestorePlayers.clear();
        this.syncMergedAndEmitDeltas(false);
      }
    });

    if (isVerifiedFirebaseUser()) {
      this.startFirestoreWorldListener();
    }
  }

  private startFirestoreWorldListener() {
    this.stopFirestoreWorldListener();
    if (!isVerifiedFirebaseUser()) return;

    try {
      this.firestoreUnsub = subscribeWorldPlayersFirestore((players) => {
        this.firestoreConnected = true;
        this.firestorePlayers.clear();
        for (const p of players) {
          this.firestorePlayers.set(p.uid || p.id, p);
        }
        this.syncMergedAndEmitDeltas(false);
      });
    } catch (err) {
      console.warn('Firestore worldPlayers listener failed:', err);
      this.firestoreConnected = false;
    }

    // Keep presence fresh even if student stands idle studying or looking around
    this.firestoreHeartbeatTimer = window.setInterval(() => {
      if (!this.intentionalClose && this.lastJoinPayload && isVerifiedFirebaseUser()) {
        this.pushFirestoreSelfState(true);
      }
    }, 22000);
  }

  private stopFirestoreWorldListener() {
    if (this.firestoreUnsub) {
      this.firestoreUnsub();
      this.firestoreUnsub = null;
    }
    if (this.firestoreHeartbeatTimer !== null) {
      clearInterval(this.firestoreHeartbeatTimer);
      this.firestoreHeartbeatTimer = null;
    }
    this.firestoreConnected = false;
  }

  private pushFirestoreSelfState(force: boolean) {
    if (!this.lastJoinPayload || !isVerifiedFirebaseUser()) return;

    const p = this.lastJoinPayload;
    const now = performance.now();
    const movedDist = Math.hypot(p.x - this.lastFsSentX, p.z - this.lastFsSentZ);
    const stoppedJustNow = this.lastFsSentMoving && !p.isMoving;

    if (!force && !stoppedJustNow) {
      if (now - this.lastFsMoveSentAt < 580) return;
      if (!p.isMoving && movedDist < 0.08) return;
    }

    this.lastFsMoveSentAt = now;
    this.lastFsSentMoving = p.isMoving;
    this.lastFsSentX = p.x;
    this.lastFsSentZ = p.z;

    upsertWorldPlayerFirestore({
      name: p.name,
      school: p.school,
      studentClass: p.studentClass,
      x: p.x,
      y: p.y,
      z: p.z,
      yaw: p.yaw,
      isMoving: p.isMoving,
      solvedQuestions: p.solvedQuestions,
      completedChapters: p.completedChapters,
      activeChapterId: p.activeChapterId,
    }).catch((err) => {
      console.warn('Firestore player sync failed:', err);
    });
  }

  private ensureHttpFallbackLoop() {
    if (this.httpPollTimer !== null || !this.httpSupported || typeof window === 'undefined') return;
    // Run an immediate HTTP sync if WS is not yet open (so players appear in <300ms even behind proxies!)
    if (!this.wsConnected) {
      this.pollHttpSync();
    }
    this.httpPollTimer = window.setInterval(() => {
      if (this.intentionalClose || !this.lastJoinPayload || !this.httpSupported) return;
      // Only poll HTTP when WebSocket is not actively connected
      if (!this.wsConnected) {
        this.pollHttpSync();
      }
    }, 450);
  }

  private async pollHttpSync() {
    if (this.httpInFlight || this.intentionalClose || !this.lastJoinPayload || !this.httpSupported) {
      return;
    }
    this.httpInFlight = true;
    try {
      const res = await fetch('/api/world/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: this.httpSelfId,
          ...this.lastJoinPayload,
        }),
      });
      if (res.status === 404 || res.status === 405) {
        // Static host (Netlify/Vercel) has no Express server; rely purely on Firestore global sync
        this.httpSupported = false;
        this.httpConnected = false;
        return;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        this.httpConnected = false;
        return;
      }
      const data = await res.json();
      if (data?.ok && Array.isArray(data.players)) {
        this.httpConnected = true;
        if (typeof data.selfId === 'string') {
          this.httpSelfId = data.selfId;
        }
        this.wsPlayers.clear();
        for (const p of data.players as OnlinePlayerState[]) {
          if (p && p.id) this.wsPlayers.set(p.id, p);
        }
        this.syncMergedAndEmitDeltas(false);
      }
    } catch {
      this.httpConnected = false;
    } finally {
      this.httpInFlight = false;
    }
  }

  private openSocket() {
    if (typeof window === 'undefined' || this.intentionalClose) return;

    const url = resolveWsUrl();
    try {
      const socket = new WebSocket(url);
      this.ws = socket;

      socket.onopen = () => {
        this.wsConnected = true;
        this.httpConnected = false;
        this.reconnectAttempt = 0;
        if (this.httpSelfId) {
          fetch('/api/world/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: this.httpSelfId }),
          }).catch(() => {});
          this.httpSelfId = null;
        }
        if (this.lastJoinPayload) {
          this.send({ type: 'player:join', payload: this.lastJoinPayload });
        }
        this.scheduleSyncNotify(true);
      };

      socket.onmessage = (evt) => {
        let data: any;
        try {
          data = JSON.parse(evt.data);
        } catch {
          return;
        }
        if (!data || typeof data.type !== 'string') return;

        if (data.type === 'world:init') {
          this.wsSelfId = typeof data.selfId === 'string' ? data.selfId : null;
          this.wsPlayers.clear();
          if (Array.isArray(data.players)) {
            for (const p of data.players as OnlinePlayerState[]) {
              if (p && p.id) this.wsPlayers.set(p.id, p);
            }
          }
          this.syncMergedAndEmitDeltas(false);
          return;
        }

        if (data.type === 'player:joined' && data.player?.id) {
          const player = data.player as OnlinePlayerState;
          this.wsPlayers.set(player.id, player);
          this.syncMergedAndEmitDeltas(false);
          return;
        }

        if (data.type === 'player:updated' && data.player?.id) {
          const player = data.player as OnlinePlayerState;
          this.wsPlayers.set(player.id, player);
          this.syncMergedAndEmitDeltas(false);
          return;
        }

        if (data.type === 'player:moved' && typeof data.id === 'string') {
          const existing = this.wsPlayers.get(data.id);
          if (existing) {
            existing.x = data.x;
            existing.y = data.y;
            existing.z = data.z;
            existing.yaw = data.yaw;
            existing.isMoving = Boolean(data.isMoving);
            existing.lastSeen = Date.now();
          }
          this.syncMergedAndEmitDeltas(false);
          return;
        }

        if (data.type === 'player:left' && typeof data.id === 'string') {
          if (this.wsPlayers.delete(data.id)) {
            this.syncMergedAndEmitDeltas(false);
          }
        }
      };

      socket.onclose = () => {
        this.wsConnected = false;
        this.ws = null;
        this.scheduleSyncNotify(true);
        if (!this.intentionalClose && this.lastJoinPayload) {
          this.pollHttpSync();
          this.scheduleReconnect();
        }
      };

      socket.onerror = () => {
        // Error triggers onclose; HTTP fallback + reconnect handled cleanly there
      };
    } catch {
      this.wsConnected = false;
      this.ws = null;
      if (!this.intentionalClose && this.lastJoinPayload) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null) return;
    const delay = Math.min(12000, 1500 * Math.pow(1.5, this.reconnectAttempt));
    this.reconnectAttempt += 1;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.intentionalClose && this.lastJoinPayload) {
        this.openSocket();
      }
    }, delay);
  }

  private syncMergedAndEmitDeltas(forceInit: boolean) {
    const myUid = isVerifiedFirebaseUser()
      ? firebaseAuth.currentUser?.uid || null
      : this.lastJoinPayload?.uid || null;
    const myServerId = this.wsSelfId || this.httpSelfId;
    const effectiveSelfId = myUid || myServerId;
    this.selfId = effectiveSelfId;

    const nextMerged = new Map<string, OnlinePlayerState>();

    // 1. Always represent self cleanly in the merged list
    if (this.lastJoinPayload && effectiveSelfId) {
      const jp = this.lastJoinPayload;
      const solved = Math.max(0, Math.min(55, Math.round(jp.solvedQuestions || 0)));
      nextMerged.set(effectiveSelfId, {
        id: effectiveSelfId,
        uid: myUid,
        name: jp.name || 'Siswa',
        school: jp.school || 'SMP',
        studentClass: jp.studentClass || '-',
        avatarColor: pickAvatarColorForUid(effectiveSelfId),
        x: jp.x,
        y: jp.y,
        z: jp.z,
        yaw: jp.yaw,
        isMoving: jp.isMoving,
        level: 1 + Math.floor(solved / 5),
        solvedQuestions: solved,
        completedChapters: jp.completedChapters || 0,
        totalScore: jp.totalScore || 0,
        activeChapterId: jp.activeChapterId ?? null,
        joinedAt: Date.now(),
        lastSeen: Date.now(),
      });
    }

    // 2. Add same-server WS / HTTP players (filtering out self)
    for (const p of this.wsPlayers.values()) {
      if (p.id === this.wsSelfId || p.id === this.httpSelfId) continue;
      if (myUid && (p.id === myUid || p.uid === myUid)) continue;
      const canonicalId = p.uid && p.uid.trim() ? p.uid : p.id;
      nextMerged.set(canonicalId, { ...p, id: canonicalId });
    }

    // 3. Merge cross-server Firestore players (filtering out self, preferring low-latency WS transform if same user)
    for (const fp of this.firestorePlayers.values()) {
      if (myUid && (fp.id === myUid || fp.uid === myUid)) continue;
      const canonicalId = fp.uid || fp.id;
      const existingWs = nextMerged.get(canonicalId);
      if (existingWs && existingWs.lastSeen >= fp.lastSeen - 1500) {
        // Keep freshest WS coordinates, update stats from Firestore if higher
        nextMerged.set(canonicalId, {
          ...existingWs,
          level: Math.max(existingWs.level, fp.level),
          solvedQuestions: Math.max(existingWs.solvedQuestions, fp.solvedQuestions),
          completedChapters: Math.max(existingWs.completedChapters, fp.completedChapters),
          activeChapterId: fp.activeChapterId ?? existingWs.activeChapterId,
        });
      } else {
        nextMerged.set(canonicalId, { ...fp, id: canonicalId });
      }
    }

    // 4. Diff prev vs nextMerged and emit clean deltas to ThreeCity
    if (forceInit) {
      this.mergedPlayers = nextMerged;
      this.emitDelta({
        type: 'init',
        selfId: this.selfId,
        players: Array.from(this.mergedPlayers.values()),
      });
      this.scheduleSyncNotify(true);
      return;
    }

    const prev = this.mergedPlayers;
    let structuralChange = false;

    for (const oldId of prev.keys()) {
      if (!nextMerged.has(oldId)) {
        structuralChange = true;
        if (oldId !== this.selfId) {
          this.emitDelta({ type: 'left', id: oldId });
        }
      }
    }

    for (const [id, nextP] of nextMerged.entries()) {
      if (id === this.selfId) continue;
      const oldP = prev.get(id);
      if (!oldP) {
        structuralChange = true;
        this.emitDelta({ type: 'joined', player: nextP });
      } else if (
        oldP.name !== nextP.name ||
        oldP.level !== nextP.level ||
        oldP.solvedQuestions !== nextP.solvedQuestions ||
        oldP.completedChapters !== nextP.completedChapters ||
        oldP.activeChapterId !== nextP.activeChapterId ||
        oldP.avatarColor !== nextP.avatarColor
      ) {
        structuralChange = true;
        this.emitDelta({ type: 'updated', player: nextP });
      } else if (
        Math.abs(oldP.x - nextP.x) > 0.002 ||
        Math.abs(oldP.y - nextP.y) > 0.002 ||
        Math.abs(oldP.z - nextP.z) > 0.002 ||
        Math.abs(oldP.yaw - nextP.yaw) > 0.002 ||
        oldP.isMoving !== nextP.isMoving
      ) {
        this.emitDelta({
          type: 'moved',
          id,
          x: nextP.x,
          y: nextP.y,
          z: nextP.z,
          yaw: nextP.yaw,
          isMoving: nextP.isMoving,
        });
      }
    }

    this.mergedPlayers = nextMerged;
    this.scheduleSyncNotify(structuralChange);
  }

  public updateMove(x: number, y: number, z: number, yaw: number, isMoving: boolean) {
    if (this.lastJoinPayload) {
      this.lastJoinPayload.x = x;
      this.lastJoinPayload.y = y;
      this.lastJoinPayload.z = z;
      this.lastJoinPayload.yaw = yaw;
      this.lastJoinPayload.isMoving = isMoving;
    }

    // Global cross-device / cross-URL Firestore sync (throttled ~580ms + stop flush)
    this.pushFirestoreSelfState(false);

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const now = performance.now();
    const movedDist = Math.hypot(x - this.lastSentX, z - this.lastSentZ);
    const yawDiff = Math.abs(yaw - this.lastSentYaw);
    const stoppedJustNow = this.lastSentMovingState && !isMoving;

    if (!stoppedJustNow) {
      if (now - this.lastMoveSentAt < 90) return;
      if (!isMoving && movedDist < 0.02 && yawDiff < 0.03) return;
    }

    this.lastMoveSentAt = now;
    this.lastSentMovingState = isMoving;
    this.lastSentX = x;
    this.lastSentZ = z;
    this.lastSentYaw = yaw;

    this.send({
      type: 'player:move',
      payload: { x, y, z, yaw, isMoving },
    });
  }

  public updateProgress(
    solvedQuestions: number,
    completedChapters: number,
    totalScore: number,
    activeChapterId: number | null
  ) {
    if (this.lastJoinPayload) {
      this.lastJoinPayload.solvedQuestions = solvedQuestions;
      this.lastJoinPayload.completedChapters = completedChapters;
      this.lastJoinPayload.totalScore = totalScore;
      this.lastJoinPayload.activeChapterId = activeChapterId;
    }

    this.pushFirestoreSelfState(true);

    this.send({
      type: 'player:progress',
      payload: { solvedQuestions, completedChapters, totalScore, activeChapterId },
    });
    this.syncMergedAndEmitDeltas(false);
  }

  public disconnect() {
    this.intentionalClose = true;
    this.lastJoinPayload = null;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.httpPollTimer !== null) {
      clearInterval(this.httpPollTimer);
      this.httpPollTimer = null;
    }
    if (this.syncNotifyTimer !== null) {
      clearTimeout(this.syncNotifyTimer);
      this.syncNotifyTimer = null;
    }
    if (this.authUnsub) {
      this.authUnsub();
      this.authUnsub = null;
    }
    this.stopFirestoreWorldListener();
    if (isVerifiedFirebaseUser()) {
      removeWorldPlayerFirestore().catch(() => {});
    }
    if (this.httpSelfId) {
      fetch('/api/world/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: this.httpSelfId }),
      }).catch(() => {});
      this.httpSelfId = null;
    }
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'player:leave', payload: {} });
      }
      this.ws.close();
      this.ws = null;
    }
    this.wsConnected = false;
    this.httpConnected = false;
    this.wsSelfId = null;
    this.selfId = null;
    this.wsPlayers.clear();
    this.firestorePlayers.clear();
    this.mergedPlayers.clear();
    this.emitDelta({ type: 'init', selfId: null, players: [] });
    this.notifySyncImmediate();
  }

  public getRemotePlayers(): OnlinePlayerState[] {
    const out: OnlinePlayerState[] = [];
    for (const p of this.mergedPlayers.values()) {
      if (p.id !== this.selfId) out.push(p);
    }
    return out;
  }

  public getAllPlayers(): OnlinePlayerState[] {
    return Array.from(this.mergedPlayers.values());
  }

  public getSnapshot() {
    return {
      connected: this.wsConnected || this.httpConnected || this.firestoreConnected,
      cloudConnected: this.firestoreConnected,
      selfId: this.selfId,
      players: Array.from(this.mergedPlayers.values()),
    };
  }

  public subscribeSync(listener: SyncListener): () => void {
    this.syncListeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  public subscribeDelta(listener: DeltaListener): () => void {
    this.deltaListeners.add(listener);
    return () => {
      this.deltaListeners.delete(listener);
    };
  }

  private emitDelta(event: MultiplayerDeltaEvent) {
    for (const listener of this.deltaListeners) {
      listener(event);
    }
  }

  private scheduleSyncNotify(immediate: boolean) {
    if (immediate) {
      if (this.syncNotifyTimer !== null) {
        clearTimeout(this.syncNotifyTimer);
        this.syncNotifyTimer = null;
      }
      this.notifySyncImmediate();
      return;
    }
    if (this.syncNotifyTimer !== null) return;
    this.syncNotifyTimer = window.setTimeout(() => {
      this.syncNotifyTimer = null;
      this.notifySyncImmediate();
    }, 250);
  }

  private notifySyncImmediate() {
    const snap = this.getSnapshot();
    for (const listener of this.syncListeners) {
      listener(snap);
    }
  }

  private send(data: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

export const multiplayerService = new MultiplayerService();
