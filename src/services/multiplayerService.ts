/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

export interface JoinPlayerPayload {
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
  private connected = false;
  private intentionalClose = false;
  private reconnectTimer: number | null = null;
  private reconnectAttempt = 0;

  private selfId: string | null = null;
  private players = new Map<string, OnlinePlayerState>();
  private lastJoinPayload: JoinPlayerPayload | null = null;

  private lastMoveSentAt = 0;
  private lastSentMovingState = false;
  private lastSentX = 0;
  private lastSentZ = 0;
  private lastSentYaw = 0;

  private syncListeners = new Set<SyncListener>();
  private deltaListeners = new Set<DeltaListener>();
  private syncNotifyTimer: number | null = null;

  public connect(payload: JoinPlayerPayload) {
    this.lastJoinPayload = { ...payload };
    this.intentionalClose = false;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'player:join', payload: this.lastJoinPayload });
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.openSocket();
  }

  private openSocket() {
    if (typeof window === 'undefined' || this.intentionalClose) return;

    const url = resolveWsUrl();
    try {
      const socket = new WebSocket(url);
      this.ws = socket;

      socket.onopen = () => {
        this.connected = true;
        this.reconnectAttempt = 0;
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
          this.selfId = typeof data.selfId === 'string' ? data.selfId : null;
          this.players.clear();
          if (Array.isArray(data.players)) {
            for (const p of data.players as OnlinePlayerState[]) {
              if (p && p.id) this.players.set(p.id, p);
            }
          }
          this.emitDelta({
            type: 'init',
            selfId: this.selfId,
            players: Array.from(this.players.values()),
          });
          this.scheduleSyncNotify(true);
          return;
        }

        if (data.type === 'player:joined' && data.player?.id) {
          const player = data.player as OnlinePlayerState;
          this.players.set(player.id, player);
          this.emitDelta({ type: 'joined', player });
          this.scheduleSyncNotify(true);
          return;
        }

        if (data.type === 'player:updated' && data.player?.id) {
          const player = data.player as OnlinePlayerState;
          this.players.set(player.id, player);
          this.emitDelta({ type: 'updated', player });
          this.scheduleSyncNotify(true);
          return;
        }

        if (data.type === 'player:moved' && typeof data.id === 'string') {
          const existing = this.players.get(data.id);
          if (existing) {
            existing.x = data.x;
            existing.y = data.y;
            existing.z = data.z;
            existing.yaw = data.yaw;
            existing.isMoving = Boolean(data.isMoving);
          }
          this.emitDelta({
            type: 'moved',
            id: data.id,
            x: data.x,
            y: data.y,
            z: data.z,
            yaw: data.yaw,
            isMoving: Boolean(data.isMoving),
          });
          this.scheduleSyncNotify(false);
          return;
        }

        if (data.type === 'player:left' && typeof data.id === 'string') {
          if (this.players.delete(data.id)) {
            this.emitDelta({ type: 'left', id: data.id });
            this.scheduleSyncNotify(true);
          }
        }
      };

      socket.onclose = () => {
        this.connected = false;
        this.ws = null;
        this.scheduleSyncNotify(true);
        if (!this.intentionalClose && this.lastJoinPayload) {
          this.scheduleReconnect();
        }
      };

      socket.onerror = () => {
        // Error triggers onclose; reconnect handled cleanly there
      };
    } catch {
      this.connected = false;
      this.ws = null;
      if (!this.intentionalClose && this.lastJoinPayload) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null) return;
    const delay = Math.min(12000, 1200 * Math.pow(1.5, this.reconnectAttempt));
    this.reconnectAttempt += 1;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.intentionalClose && this.lastJoinPayload) {
        this.openSocket();
      }
    }, delay);
  }

  public updateMove(x: number, y: number, z: number, yaw: number, isMoving: boolean) {
    if (this.lastJoinPayload) {
      this.lastJoinPayload.x = x;
      this.lastJoinPayload.y = y;
      this.lastJoinPayload.z = z;
      this.lastJoinPayload.yaw = yaw;
      this.lastJoinPayload.isMoving = isMoving;
    }

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

    this.send({
      type: 'player:progress',
      payload: { solvedQuestions, completedChapters, totalScore, activeChapterId },
    });
  }

  public disconnect() {
    this.intentionalClose = true;
    this.lastJoinPayload = null;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.syncNotifyTimer !== null) {
      clearTimeout(this.syncNotifyTimer);
      this.syncNotifyTimer = null;
    }
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'player:leave', payload: {} });
      }
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.selfId = null;
    this.players.clear();
    this.emitDelta({ type: 'init', selfId: null, players: [] });
    this.notifySyncImmediate();
  }

  public getRemotePlayers(): OnlinePlayerState[] {
    const out: OnlinePlayerState[] = [];
    for (const p of this.players.values()) {
      if (p.id !== this.selfId) out.push(p);
    }
    return out;
  }

  public getAllPlayers(): OnlinePlayerState[] {
    return Array.from(this.players.values());
  }

  public getSnapshot() {
    return {
      connected: this.connected,
      selfId: this.selfId,
      players: Array.from(this.players.values()),
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
