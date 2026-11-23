/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db, firebaseAuth } from './firebaseApp';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: firebaseAuth.currentUser?.uid,
      email: firebaseAuth.currentUser?.email,
      emailVerified: firebaseAuth.currentUser?.emailVerified,
      isAnonymous: firebaseAuth.currentUser?.isAnonymous,
      tenantId: firebaseAuth.currentUser?.tenantId,
      providerInfo:
        firebaseAuth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export type ProgressEntryMap = Record<string, { solved: boolean; stars: number; attempts: number }>;

export interface FirestoreUserProgressRecord {
  uid: string;
  name: string;
  school: string;
  studentClass: string;
  email: string;
  solvedCount: number;
  completedChapters: number;
  level: number;
  totalScore: number;
  progress: ProgressEntryMap;
  updatedAt: number;
}

export interface FirestoreWorldPlayerInput {
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
  activeChapterId: number | null;
}

export interface FirestoreWorldPlayerState {
  id: string;
  uid: string;
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

const MAP_ID = 'tka-city-main';
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

function sanitizeString(val: string | undefined | null, maxLen: number, fallback: string): string {
  const cleaned = (val || '').replace(/\s+/g, ' ').trim().slice(0, maxLen);
  return cleaned || fallback;
}

function clampNum(val: number, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, val));
}

function normalizeYaw(yaw: number): number {
  if (typeof yaw !== 'number' || !Number.isFinite(yaw)) return Math.PI;
  let a = yaw % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function pickAvatarColorForUid(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function sanitizeProgressMap(
  raw: Record<number | string, { solved: boolean; stars: number; attempts: number }> | undefined
): ProgressEntryMap {
  const out: ProgressEntryMap = {};
  if (!raw || typeof raw !== 'object') return out;
  let count = 0;
  for (const [k, v] of Object.entries(raw)) {
    const qNum = Number(k);
    if (!Number.isInteger(qNum) || qNum < 1 || qNum > 55 || !v) continue;
    if (count >= 55) break;
    out[String(qNum)] = {
      solved: Boolean(v.solved),
      stars: Math.max(0, Math.min(3, Math.round(Number(v.stars) || 0))),
      attempts: Math.max(0, Math.min(999, Math.round(Number(v.attempts) || 0))),
    };
    count += 1;
  }
  return out;
}

export function isVerifiedFirebaseUser(): boolean {
  const u = firebaseAuth.currentUser;
  return Boolean(u && u.uid && u.emailVerified);
}

export async function loadUserProgressFirestore(
  uid: string
): Promise<FirestoreUserProgressRecord | null> {
  if (!isVerifiedFirebaseUser() || firebaseAuth.currentUser?.uid !== uid) return null;
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    const updatedMs =
      data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : Date.now();
    return {
      uid: String(data.uid || uid),
      name: String(data.name || 'Siswa'),
      school: String(data.school || ''),
      studentClass: String(data.studentClass || ''),
      email: String(data.email || ''),
      solvedCount: Number(data.solvedCount || 0),
      completedChapters: Number(data.completedChapters || 0),
      level: Number(data.level || 1),
      totalScore: Number(data.totalScore || 0),
      progress: sanitizeProgressMap(data.progress),
      updatedAt: updatedMs,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProgressFirestore(params: {
  name: string;
  school: string;
  studentClass: string;
  email: string;
  progress: Record<number | string, { solved: boolean; stars: number; attempts: number }>;
}): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified) return;

  const progress = sanitizeProgressMap(params.progress);
  const solvedCount = Math.min(
    55,
    Object.values(progress).filter((p) => p.solved).length
  );
  const completedChapters = Array.from({ length: 11 }, (_, idx) => {
    const chId = idx + 1;
    return [1, 2, 3, 4, 5].every((q) => progress[String((chId - 1) * 5 + q)]?.solved) ? 1 : 0;
  }).reduce((a: number, b: number) => a + b, 0);
  const level = Math.max(1, Math.min(12, 1 + Math.floor(solvedCount / 5)));
  const totalScore = Math.min(
    5000,
    Object.values(progress).reduce((acc, p) => acc + (p.solved ? p.stars * 10 : 0), 0)
  );

  const path = `users/${user.uid}`;
  try {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: sanitizeString(params.name, 40, 'Siswa'),
      school: sanitizeString(params.school, 60, ''),
      studentClass: sanitizeString(params.studentClass, 20, ''),
      email: sanitizeString(params.email || user.email, 100, ''),
      solvedCount,
      completedChapters,
      level,
      totalScore,
      progress,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertWorldPlayerFirestore(
  input: FirestoreWorldPlayerInput
): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified) return;

  const uid = user.uid;
  const solvedQuestions = Math.max(0, Math.min(55, Math.round(input.solvedQuestions || 0)));
  const completedChapters = Math.max(0, Math.min(11, Math.round(input.completedChapters || 0)));
  const level = Math.max(1, Math.min(12, 1 + Math.floor(solvedQuestions / 5)));
  const activeChapterId =
    typeof input.activeChapterId === 'number' &&
    input.activeChapterId >= 1 &&
    input.activeChapterId <= 11
      ? Math.round(input.activeChapterId)
      : 0;

  const path = `worldPlayers/${uid}`;
  try {
    await setDoc(doc(db, 'worldPlayers', uid), {
      uid,
      mapId: MAP_ID,
      name: sanitizeString(input.name, 40, 'Siswa'),
      school: sanitizeString(input.school, 60, 'SMP'),
      studentClass: sanitizeString(input.studentClass, 20, '-'),
      avatarColor: pickAvatarColorForUid(uid),
      x: Number(clampNum(input.x, -85, 85, 0).toFixed(3)),
      y: Number(clampNum(input.y, -15, 45, 0.2).toFixed(3)),
      z: Number(clampNum(input.z, -85, 85, 12).toFixed(3)),
      yaw: Number(normalizeYaw(input.yaw).toFixed(3)),
      isMoving: Boolean(input.isMoving),
      level,
      solvedQuestions,
      completedChapters,
      activeChapterId,
      isOnline: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeWorldPlayerFirestore(): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified) return;
  const path = `worldPlayers/${user.uid}`;
  try {
    await deleteDoc(doc(db, 'worldPlayers', user.uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeWorldPlayersFirestore(
  onPlayers: (players: FirestoreWorldPlayerState[]) => void
): () => void {
  if (!isVerifiedFirebaseUser()) {
    return () => {};
  }

  const path = 'worldPlayers';
  const q = query(
    collection(db, path),
    where('mapId', '==', MAP_ID),
    where('isOnline', '==', true)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const now = Date.now();
      const staleCutoff = now - 120_000;
      const list: FirestoreWorldPlayerState[] = [];

      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const updatedMs =
          d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : now;
        if (updatedMs < staleCutoff) return;

        const uid = String(d.uid || docSnap.id);
        const solvedQuestions = Number(d.solvedQuestions || 0);
        const completedChapters = Number(d.completedChapters || 0);
        const activeRaw = Number(d.activeChapterId || 0);

        list.push({
          id: uid,
          uid,
          name: String(d.name || 'Siswa'),
          school: String(d.school || 'SMP'),
          studentClass: String(d.studentClass || '-'),
          avatarColor: Number(d.avatarColor || pickAvatarColorForUid(uid)),
          x: Number(d.x || 0),
          y: Number(d.y || 0.2),
          z: Number(d.z || 12),
          yaw: Number(d.yaw || Math.PI),
          isMoving: Boolean(d.isMoving),
          level: Number(d.level || 1 + Math.floor(solvedQuestions / 5)),
          solvedQuestions,
          completedChapters,
          totalScore: solvedQuestions * 30,
          activeChapterId: activeRaw >= 1 && activeRaw <= 11 ? activeRaw : null,
          joinedAt: updatedMs,
          lastSeen: updatedMs,
        });
      });

      onPlayers(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export interface FirestoreSubmissionRecord {
  id: string;
  uid: string;
  studentName: string;
  school: string;
  studentClass: string;
  email: string;
  chapterId: number;
  chapterTitle: string;
  questionNumber: number;
  workNotes: string;
  fileName: string;
  hasAttachment: boolean;
  folderPath: string;
  serverFilePath: string;
  driveFileId: string;
  driveUrl: string;
  createdAt: number;
}

export async function saveSubmissionMetadataFirestore(params: {
  id: string;
  studentName: string;
  school: string;
  studentClass: string;
  email: string;
  chapterId: number;
  chapterTitle: string;
  questionNumber: number;
  workNotes: string;
  fileName: string;
  hasAttachment: boolean;
  folderPath: string;
  serverFilePath: string;
  driveFileId?: string;
  driveUrl?: string;
}): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified) return;

  const cleanId = (params.id || `sub_${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 128);
  const path = `submissions/${cleanId}`;
  try {
    await setDoc(doc(db, 'submissions', cleanId), {
      id: cleanId,
      uid: user.uid,
      studentName: sanitizeString(params.studentName, 40, 'Siswa'),
      school: sanitizeString(params.school, 60, ''),
      studentClass: sanitizeString(params.studentClass, 20, ''),
      email: sanitizeString(params.email || user.email, 100, ''),
      chapterId: Math.max(1, Math.min(11, Math.round(params.chapterId || 1))),
      chapterTitle: sanitizeString(params.chapterTitle, 80, 'Bab'),
      questionNumber: Math.max(1, Math.min(5, Math.round(params.questionNumber || 1))),
      workNotes: (params.workNotes || '').trim().slice(0, 2000),
      fileName: sanitizeString(params.fileName, 140, 'jawaban.txt'),
      hasAttachment: Boolean(params.hasAttachment),
      folderPath: sanitizeString(params.folderPath, 180, 'Arsip Guru'),
      serverFilePath: (params.serverFilePath || '').slice(0, 260),
      driveFileId: (params.driveFileId || '').slice(0, 128),
      driveUrl: (params.driveUrl || '').slice(0, 300),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listStudentSubmissionsFirestore(): Promise<FirestoreSubmissionRecord[]> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified) return [];
  const path = 'submissions';
  try {
    const isTeacher = user.email?.toLowerCase() === 'maulanakarim9502@gmail.com';
    const q = isTeacher
      ? query(collection(db, path))
      : query(collection(db, path), where('uid', '==', user.uid));
    const snap = await getDocs(q);
    const out: FirestoreSubmissionRecord[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      out.push({
        id: String(d.id || docSnap.id),
        uid: String(d.uid || ''),
        studentName: String(d.studentName || 'Siswa'),
        school: String(d.school || ''),
        studentClass: String(d.studentClass || ''),
        email: String(d.email || ''),
        chapterId: Number(d.chapterId || 1),
        chapterTitle: String(d.chapterTitle || ''),
        questionNumber: Number(d.questionNumber || 1),
        workNotes: String(d.workNotes || ''),
        fileName: String(d.fileName || ''),
        hasAttachment: Boolean(d.hasAttachment),
        folderPath: String(d.folderPath || ''),
        serverFilePath: String(d.serverFilePath || ''),
        driveFileId: String(d.driveFileId || ''),
        driveUrl: String(d.driveUrl || ''),
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now(),
      });
    });
    out.sort((a, b) => b.createdAt - a.createdAt);
    return out;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export interface TeacherDriveConfigRecord {
  id: string;
  folderId: string;
  folderUrl: string;
  folderName: string;
  teacherEmail: string;
  updatedAt: number;
}

export async function loadTeacherDriveConfigFirestore(): Promise<TeacherDriveConfigRecord | null> {
  if (!isVerifiedFirebaseUser()) return null;
  const path = 'settings/teacherDrive';
  try {
    const snap = await getDoc(doc(db, 'settings', 'teacherDrive'));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      id: String(d.id || 'teacherDrive'),
      folderId: String(d.folderId || ''),
      folderUrl: String(d.folderUrl || ''),
      folderName: String(d.folderName || ''),
      teacherEmail: String(d.teacherEmail || ''),
      updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : Date.now(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveTeacherDriveConfigFirestore(params: {
  folderId: string;
  folderUrl: string;
  folderName: string;
}): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || user.email?.toLowerCase() !== 'maulanakarim9502@gmail.com') {
    throw new Error('Hanya akun guru (maulanakarim9502@gmail.com) yang dapat menyimpan folder Drive tujuan.');
  }
  const path = 'settings/teacherDrive';
  try {
    await setDoc(doc(db, 'settings', 'teacherDrive'), {
      id: 'teacherDrive',
      folderId: (params.folderId || '').trim().slice(0, 128),
      folderUrl: (params.folderUrl || '').trim().slice(0, 256),
      folderName: sanitizeString(params.folderName, 120, 'Arsip Tugas TKA SMP'),
      teacherEmail: 'maulanakarim9502@gmail.com',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}


