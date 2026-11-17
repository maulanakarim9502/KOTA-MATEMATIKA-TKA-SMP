/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
export const TEACHER_EMAIL = 'maulanakarim9502@gmail.com';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
// Cache OAuth access token strictly in memory (never in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    if (error?.code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      throw new Error(
        `Domain "${host}" belum didaftarkan di Firebase Authentication → Authorized Domains. Tambahkan domain tersebut di Firebase Console agar login Google aktif di Netlify/Vercel.`
      );
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentFirebaseUser = (): User | null => {
  return auth.currentUser;
};

export const subscribeFirebaseUser = (cb: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => cb(user));
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export function extractDriveFolderId(input: string): string | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;
  return undefined;
}

async function grantEditablePermissions(accessToken: string, fileId: string) {
  // 1. Grant anyone edit/writer access so teacher & shared links can open/edit seamlessly
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=false`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'writer',
        type: 'anyone',
      }),
    });
  } catch {
    // Non-fatal if organization policy restricts anyone-writer
  }

  // 2. Grant direct writer access to teacher account (maulanakarim9502@gmail.com)
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=false`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'writer',
        type: 'user',
        emailAddress: TEACHER_EMAIL,
      }),
    });
  } catch {
    // Non-fatal
  }
}

async function findOrCreateFolder(
  accessToken: string,
  folderName: string,
  parentId?: string
): Promise<{ id: string; name: string }> {
  const escapedName = folderName.replace(/'/g, "\\'");
  let q = `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  }

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return { id: searchData.files[0].id, name: searchData.files[0].name };
    }
  }

  const folderMetadata: Record<string, any> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    folderMetadata.parents = [parentId];
  }

  const createRes = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name&supportsAllDrives=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(folderMetadata),
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat folder "${folderName}" di Google Drive: ${errText}`);
  }

  const created = await createRes.json();
  await grantEditablePermissions(accessToken, created.id);
  return { id: created.id, name: created.name };
}

export interface UploadSolutionParams {
  studentName: string;
  studentSchool: string;
  studentClass: string;
  studentEmail: string;
  chapterId: number;
  chapterTitle: string;
  questionNumber: number;
  file: File | null;
  workNotes: string;
  teacherFolderInput?: string;
}

export interface UploadedDriveResult {
  fileId: string;
  fileName: string;
  folderPath: string;
}

export async function uploadSolutionToDrive(
  params: UploadSolutionParams
): Promise<UploadedDriveResult> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('NEED_GOOGLE_AUTH');
  }

  const envFolderId = (import.meta as any).env?.VITE_TEACHER_DRIVE_FOLDER_ID || '';
  const configuredFolderId = extractDriveFolderId(params.teacherFolderInput || envFolderId);

  const cleanSchool = params.studentSchool.trim() || 'Sekolah Umum';
  const cleanClass = params.studentClass.trim() || 'Kelas 9';
  const cleanName = params.studentName.trim() || 'Siswa';
  const cleanChapter = params.chapterTitle.replace(/:/g, ' -').trim();

  // Structured Hierarchy: [Teacher Root] -> Sekolah -> Kelas -> Bab
  const rootFolder = configuredFolderId
    ? { id: configuredFolderId, name: 'Folder Guru' }
    : await findOrCreateFolder(accessToken, 'Arsip TKA SMP - Maulana Karim');

  const schoolFolder = await findOrCreateFolder(accessToken, cleanSchool, rootFolder.id);
  const classFolder = await findOrCreateFolder(accessToken, `Kelas ${cleanClass}`, schoolFolder.id);
  const chapterFolder = await findOrCreateFolder(accessToken, cleanChapter, classFolder.id);

  const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-');
  const baseTitle = `${cleanName} (${cleanClass} - ${cleanSchool}) - Soal ${params.questionNumber} (${timestamp})`;

  let fileBlob: Blob;
  let uploadFileName: string;

  if (params.file) {
    fileBlob = params.file;
    const ext = params.file.name.includes('.') ? params.file.name.split('.').pop() : 'dat';
    uploadFileName = `${baseTitle}.${ext}`;
  } else {
    const textContent = [
      `HASIL CARA PENGERJAAN TKA MATEMATIKA SMP`,
      `==========================================`,
      `Nama Siswa   : ${cleanName}`,
      `Sekolah      : ${cleanSchool}`,
      `Kelas        : ${cleanClass}`,
      `Akun Google  : ${params.studentEmail}`,
      `Bab          : ${params.chapterTitle}`,
      `Nomor Soal   : Soal ${params.questionNumber}`,
      `Waktu Kirim  : ${new Date().toLocaleString('id-ID')}`,
      ``,
      `Langkah-Langkah / Cara Pengerjaan:`,
      params.workNotes || '(Tidak ada catatan teks tambahan)',
    ].join('\n');
    fileBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    uploadFileName = `${baseTitle}.txt`;
  }

  const metadata = {
    name: uploadFileName,
    parents: [chapterFolder.id],
    description: `Siswa: ${cleanName} | Sekolah: ${cleanSchool} | Kelas: ${cleanClass} | Email: ${params.studentEmail} | ${params.chapterTitle} Soal ${params.questionNumber}\nCatatan: ${params.workNotes || '-'}`,
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json;charset=UTF-8' })
  );
  form.append('file', fileBlob);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name&supportsAllDrives=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Gagal mengunggah ke Google Drive (${uploadRes.status}): ${errText}`);
  }

  const uploaded = await uploadRes.json();
  // Ensure anyone/teacher can edit & review the file
  await grantEditablePermissions(accessToken, uploaded.id);

  return {
    fileId: uploaded.id,
    fileName: uploaded.name,
    folderPath: `${cleanSchool} / Kelas ${cleanClass} / ${cleanChapter}`,
  };
}

// ============================================================================
// PER-STUDENT PROGRESS & PROFILE SYNC (LOCAL + SERVER + GOOGLE DRIVE)
// ============================================================================

export type StudentProgressMap = Record<number, { solved: boolean; stars: number; attempts: number }>;

export interface SavedStudentRecord {
  accountKey: string;
  profile: {
    name: string;
    school: string;
    studentClass: string;
    email: string;
  };
  progress: StudentProgressMap;
  updatedAt: number;
}

const LOCAL_RECORD_PREFIX = 'tka_smp_record_v2:';
const ACTIVE_SESSION_KEY = 'tka_smp_active_session_v2';
const EXPLICIT_LOGOUT_KEY = 'tka_smp_explicit_logout';

export function buildAccountKey(
  email: string,
  name: string,
  school: string,
  studentClass: string
): string {
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail && cleanEmail.includes('@')) {
    return `email:${cleanEmail}`;
  }
  return `local:${school.trim().toLowerCase()}::${studentClass.trim().toLowerCase()}::${name.trim().toLowerCase()}`;
}

export function mergeStudentProgress(
  a: StudentProgressMap | undefined,
  b: StudentProgressMap | undefined
): StudentProgressMap {
  const merged: StudentProgressMap = {};
  const apply = (src?: StudentProgressMap) => {
    if (!src) return;
    for (const [key, val] of Object.entries(src)) {
      const qId = Number(key);
      if (!Number.isInteger(qId) || qId < 1 || qId > 55 || !val) continue;
      const prev = merged[qId];
      if (!prev) {
        merged[qId] = {
          solved: Boolean(val.solved),
          stars: Math.max(0, Math.min(3, Number(val.stars) || 0)),
          attempts: Math.max(0, Math.min(999, Number(val.attempts) || 0)),
        };
      } else {
        merged[qId] = {
          solved: Boolean(prev.solved || val.solved),
          stars: Math.max(prev.stars || 0, Math.min(3, Number(val.stars) || 0)),
          attempts: Math.max(prev.attempts || 0, Math.min(999, Number(val.attempts) || 0)),
        };
      }
    }
  };
  apply(a);
  apply(b);
  return merged;
}

export function saveActiveSessionMeta(record: SavedStudentRecord) {
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(record.profile));
    localStorage.setItem(`${LOCAL_RECORD_PREFIX}${record.accountKey}`, JSON.stringify(record));
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
  } catch {
    // ignore quota
  }
}

export function clearActiveSessionMeta() {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    localStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');
  } catch {
    // ignore
  }
}

export function wasExplicitlyLoggedOut(): boolean {
  try {
    return localStorage.getItem(EXPLICIT_LOGOUT_KEY) === 'true';
  } catch {
    return false;
  }
}

export function loadActiveSessionProfile(): SavedStudentRecord['profile'] | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.name === 'string' && parsed.name.trim()) {
      return {
        name: parsed.name,
        school: parsed.school || '',
        studentClass: parsed.studentClass || '',
        email: parsed.email || '',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function loadLocalStudentRecord(accountKey: string): SavedStudentRecord | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_RECORD_PREFIX}${accountKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedStudentRecord;
    if (!parsed || !parsed.profile) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalStudentRecord(record: SavedStudentRecord) {
  try {
    localStorage.setItem(`${LOCAL_RECORD_PREFIX}${record.accountKey}`, JSON.stringify(record));
  } catch {
    // ignore
  }
}

export async function fetchServerStudentRecord(accountKey: string): Promise<SavedStudentRecord | null> {
  try {
    const res = await fetch(`/api/progress?key=${encodeURIComponent(accountKey)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.found && data?.record) {
      return data.record as SavedStudentRecord;
    }
    return null;
  } catch {
    return null;
  }
}

export async function pushServerStudentRecord(record: SavedStudentRecord): Promise<void> {
  try {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
  } catch {
    // Non-fatal on static hosts
  }
}

function getProgressDriveFileName(studentEmail: string, studentName: string): string {
  const safeId = (studentEmail || studentName || 'siswa')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '_');
  return `TKA_Progres_${safeId}.json`;
}

export async function loadProgressFromDrive(
  studentEmail: string,
  studentName = ''
): Promise<SavedStudentRecord | null> {
  const accessToken = await getAccessToken();
  if (!accessToken || !studentEmail) return null;

  try {
    const fileName = getProgressDriveFileName(studentEmail, studentName);
    const escaped = fileName.replace(/'/g, "\\'");
    const q = `name='${escaped}' and trashed=false`;
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const fileId = searchData?.files?.[0]?.id as string | undefined;
    if (!fileId) return null;

    const dlRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!dlRes.ok) return null;
    const parsed = (await dlRes.json()) as SavedStudentRecord;
    if (parsed && parsed.profile && parsed.progress) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveProgressToDrive(
  record: SavedStudentRecord,
  teacherFolderInput?: string
): Promise<{ synced: boolean; fileId?: string }> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { synced: false };
  }

  try {
    const envFolderId = (import.meta as any).env?.VITE_TEACHER_DRIVE_FOLDER_ID || '';
    const configuredFolderId = extractDriveFolderId(teacherFolderInput || envFolderId);

    const cleanSchool = record.profile.school.trim() || 'Sekolah Umum';
    const cleanClass = record.profile.studentClass.trim() || 'Kelas 9';
    const cleanEmail = record.profile.email.trim().toLowerCase();
    const fileName = getProgressDriveFileName(cleanEmail, record.profile.name);

    // Build / find structured folder hierarchy shared with teacher maulanakarim9502@gmail.com
    const rootFolder = configuredFolderId
      ? { id: configuredFolderId, name: 'Folder Guru' }
      : await findOrCreateFolder(accessToken, 'Arsip TKA SMP - Maulana Karim');
    const schoolFolder = await findOrCreateFolder(accessToken, cleanSchool, rootFolder.id);
    const classFolder = await findOrCreateFolder(accessToken, `Kelas ${cleanClass}`, schoolFolder.id);
    const progressFolder = await findOrCreateFolder(accessToken, 'Progres Siswa', classFolder.id);

    const escaped = fileName.replace(/'/g, "\\'");
    const q = `name='${escaped}' and '${progressFolder.id}' in parents and trashed=false`;
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    let existingFileId: string | undefined;
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      existingFileId = searchData?.files?.[0]?.id;
    }

    const jsonBlob = new Blob([JSON.stringify(record, null, 2)], {
      type: 'application/json;charset=UTF-8',
    });

    if (existingFileId) {
      const patchRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media&supportsAllDrives=true`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json;charset=UTF-8',
          },
          body: jsonBlob,
        }
      );
      if (patchRes.ok) {
        return { synced: true, fileId: existingFileId };
      }
    }

    const metadata = {
      name: fileName,
      parents: [progressFolder.id],
      description: `Progres Belajar TKA SMP | Siswa: ${record.profile.name} | Sekolah: ${cleanSchool} | Kelas: ${cleanClass} | Email: ${cleanEmail}`,
    };
    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json;charset=UTF-8' })
    );
    form.append('file', jsonBlob);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id&supportsAllDrives=true',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      }
    );
    if (!uploadRes.ok) {
      return { synced: false };
    }
    const created = await uploadRes.json();
    await grantEditablePermissions(accessToken, created.id);
    return { synced: true, fileId: created.id };
  } catch {
    return { synced: false };
  }
}

export async function loadBestStudentRecord(
  accountKey: string,
  studentEmail?: string,
  fallbackProfile?: SavedStudentRecord['profile']
): Promise<SavedStudentRecord | null> {
  const localRec = loadLocalStudentRecord(accountKey);
  const [serverRec, driveRec] = await Promise.all([
    fetchServerStudentRecord(accountKey),
    studentEmail ? loadProgressFromDrive(studentEmail, fallbackProfile?.name) : Promise.resolve(null),
  ]);

  const candidates = [localRec, serverRec, driveRec].filter(Boolean) as SavedStudentRecord[];
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const newest = candidates[0];

  let mergedProgress: StudentProgressMap = {};
  for (const c of candidates) {
    mergedProgress = mergeStudentProgress(mergedProgress, c.progress);
  }

  const pickField = (getter: (r: SavedStudentRecord) => string): string => {
    for (const c of candidates) {
      const v = getter(c)?.trim();
      if (v) return v;
    }
    return '';
  };

  const bestRecord: SavedStudentRecord = {
    accountKey,
    profile: {
      name: pickField((r) => r.profile.name) || fallbackProfile?.name || 'Siswa',
      school: pickField((r) => r.profile.school) || fallbackProfile?.school || '',
      studentClass: pickField((r) => r.profile.studentClass) || fallbackProfile?.studentClass || '',
      email: pickField((r) => r.profile.email) || studentEmail || fallbackProfile?.email || '',
    },
    progress: mergedProgress,
    updatedAt: newest.updatedAt || Date.now(),
  };

  saveLocalStudentRecord(bestRecord);
  return bestRecord;
}

export async function syncStudentRecordAll(
  record: SavedStudentRecord,
  options?: { syncDrive?: boolean; teacherFolderInput?: string }
): Promise<{ driveSynced: boolean }> {
  saveLocalStudentRecord(record);
  await pushServerStudentRecord(record);

  if (options?.syncDrive !== false) {
    const driveRes = await saveProgressToDrive(record, options?.teacherFolderInput);
    return { driveSynced: driveRes.synced };
  }
  return { driveSynced: false };
}
