/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { firebaseAuth as auth } from './firebaseApp';
import {
  isVerifiedFirebaseUser,
  loadUserProgressFirestore,
  saveSubmissionMetadataFirestore,
  saveUserProgressFirestore,
} from './firestoreService';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
export const TEACHER_EMAIL = 'maulanakarim9502@gmail.com';

const basicProvider = new GoogleAuthProvider();
const driveProvider = new GoogleAuthProvider();
SCOPES.forEach((scope) => driveProvider.addScope(scope));

let isSigningIn = false;
// Cache OAuth access token strictly in memory (never in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;

function formatGoogleAuthError(error: any): Error {
  const code = String(error?.code || '');
  const msg = String(error?.message || '');
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    return new Error(
      `Domain "${host}" belum didaftarkan di Firebase Authentication → Authorized Domains. Tambahkan domain tersebut di Firebase Console agar login Google aktif.`
    );
  }
  if (
    msg.toLowerCase().includes('access_denied') ||
    msg.toLowerCase().includes('verification') ||
    code === 'auth/operation-not-allowed'
  ) {
    return new Error(
      'Akun Google diblokir karena OAuth Consent Screen di Google Cloud Console masih mode "Testing" atau belum dipublikasikan ke "In Production". Untuk guru/pemilik project: buka Google Cloud Console → APIs & Services → OAuth consent screen → klik "PUBLISH APP" (atau tambahkan email siswa di Test users). Siswa tetap bisa masuk dengan mengisi Nama, Sekolah, Kelas & Email di bawah.'
    );
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return new Error(
      'Popup login Google ditutup sebelum selesai. Jika muncul layar "Google belum memverifikasi aplikasi ini", klik "Lanjutan (Advanced)" → "Buka gen-lang-client-0719606438.firebaseapp.com".'
    );
  }
  if (code === 'auth/popup-blocked') {
    return new Error('Popup browser diblokir. Izinkan popup untuk situs ini lalu coba lagi.');
  }
  return error instanceof Error ? error : new Error('Gagal login dengan akun Google.');
}

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

// Non-sensitive Google Sign-In (email & profile only — avoids sensitive drive.file verification block at login)
export const googleBasicSignIn = async (): Promise<{ user: User; accessToken: string | null } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, basicProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return { user: result.user, accessToken: credential?.accessToken || null };
  } catch (error: any) {
    console.error('Google Basic Sign-In error:', error);
    throw formatGoogleAuthError(error);
  } finally {
    isSigningIn = false;
  }
};

// Full Google Drive Sign-In (includes drive.file scope for uploading solutions & syncing Drive files)
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive Sign-In error:', error);
    throw formatGoogleAuthError(error);
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
  fileUrl?: string;
  storageType?: 'drive' | 'server' | 'drive+server';
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca file yang dipilih.'));
    reader.readAsDataURL(blob);
  });
}

async function compressImageForUpload(
  file: File
): Promise<{ blob: Blob; fileName: string; dataUrl: string }> {
  const maxBytes = 14 * 1024 * 1024;
  if (!file.type.startsWith('image/')) {
    if (file.size > maxBytes) {
      throw new Error('Ukuran file terlalu besar (maksimal 14 MB). Pilih file yang lebih kecil.');
    }
    const dataUrl = await blobToDataUrl(file);
    return { blob: file, fileName: file.name, dataUrl };
  }

  try {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Format gambar tidak dapat diproses canvas.'));
        image.src = objectUrl;
      });

      const maxDim = 1400;
      const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
      const targetW = Math.max(1, Math.round(img.width * scale));
      const targetH = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D tidak tersedia.');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const compressedBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.82);
      });

      if (compressedBlob && (compressedBlob.size < file.size || file.size > 400 * 1024)) {
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'foto_pengerjaan';
        const jpgName = `${baseName}.jpg`;
        const dataUrl = await blobToDataUrl(compressedBlob);
        return { blob: compressedBlob, fileName: jpgName, dataUrl };
      }
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    // Fallback to raw image if canvas compression is unsupported (e.g. HEIC)
  }

  if (file.size > maxBytes) {
    throw new Error('Ukuran foto terlalu besar (maksimal 14 MB). Coba perkecil resolusi foto.');
  }
  const dataUrl = await blobToDataUrl(file);
  return { blob: file, fileName: file.name, dataUrl };
}

export async function uploadSolutionToDrive(
  params: UploadSolutionParams
): Promise<UploadedDriveResult> {
  const cleanSchool = params.studentSchool.trim() || 'Sekolah Umum';
  const cleanClass = params.studentClass.trim() || 'Kelas 9';
  const cleanName = params.studentName.trim() || 'Siswa';
  const cleanChapter = params.chapterTitle.replace(/:/g, ' -').trim();

  const preparedFile = params.file ? await compressImageForUpload(params.file) : null;

  let driveUploaded: UploadedDriveResult | null = null;
  const accessToken = await getAccessToken();
  if (accessToken) {
    try {
      const envFolderId = (import.meta as any).env?.VITE_TEACHER_DRIVE_FOLDER_ID || '';
      const configuredFolderId = extractDriveFolderId(params.teacherFolderInput || envFolderId);

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

      if (preparedFile) {
        fileBlob = preparedFile.blob;
        const ext = preparedFile.fileName.includes('.')
          ? preparedFile.fileName.split('.').pop()
          : 'jpg';
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

      if (uploadRes.ok) {
        const uploaded = await uploadRes.json();
        await grantEditablePermissions(accessToken, uploaded.id);
        driveUploaded = {
          fileId: uploaded.id,
          fileName: uploaded.name,
          folderPath: `${cleanSchool} / Kelas ${cleanClass} / ${cleanChapter}`,
          storageType: 'drive',
        };
      }
    } catch (err) {
      console.warn('Google Drive API upload warning, continuing with Web Guru server:', err);
    }
  }

  // Primary Web Guru server submission (always stores photo + notes for Teacher Portal)
  let serverResult: {
    id: string;
    fileId: string;
    fileName: string;
    folderPath: string;
    relPath: string;
    fileUrl: string;
  } | null = null;
  let serverErrMessage = '';

  try {
    const serverRes = await fetch('/api/upload-solution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: cleanName,
        school: cleanSchool,
        studentClass: cleanClass,
        email: params.studentEmail,
        chapterId: params.chapterId,
        chapterTitle: params.chapterTitle,
        questionNumber: params.questionNumber,
        workNotes: params.workNotes,
        fileName: preparedFile?.fileName,
        fileData: preparedFile?.dataUrl,
      }),
    });

    const rawText = await serverRes.text();
    let parsed: any = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = null;
    }

    if (!serverRes.ok || !parsed?.ok) {
      serverErrMessage =
        parsed?.error ||
        (serverRes.status === 413
          ? 'Ukuran foto terlalu besar. Silakan gunakan foto dengan ukuran lebih kecil.'
          : `Gagal mengirim file ke web guru (HTTP ${serverRes.status}).`);
    } else {
      serverResult = {
        id: parsed.id || parsed.fileId || `sub_${Date.now()}`,
        fileId: parsed.fileId || parsed.id || `sub_${Date.now()}`,
        fileName: parsed.fileName || preparedFile?.fileName || `soal_${params.questionNumber}.txt`,
        folderPath: parsed.folderPath || `${cleanSchool} / Kelas ${cleanClass} / ${cleanName}`,
        relPath: parsed.relPath || '',
        fileUrl: parsed.fileUrl || '',
      };
    }
  } catch (networkErr: any) {
    serverErrMessage =
      networkErr?.message || 'Koneksi ke server web guru terputus. Coba beberapa saat lagi.';
  }

  if (!serverResult && !driveUploaded) {
    throw new Error(serverErrMessage || 'Gagal mengirim hasil pengerjaan ke web guru.');
  }

  const finalId = serverResult?.id || driveUploaded?.fileId || `sub_${Date.now()}`;
  const finalFileName =
    serverResult?.fileName || driveUploaded?.fileName || `soal_${params.questionNumber}.txt`;
  const finalFolderPath =
    serverResult?.folderPath ||
    driveUploaded?.folderPath ||
    `${cleanSchool} / Kelas ${cleanClass} / ${cleanName}`;

  // Best-effort Firestore metadata record (strictly metadata, no image binary)
  if (isVerifiedFirebaseUser()) {
    saveSubmissionMetadataFirestore({
      id: finalId,
      studentName: cleanName,
      school: cleanSchool,
      studentClass: cleanClass,
      email: params.studentEmail,
      chapterId: params.chapterId,
      chapterTitle: params.chapterTitle,
      questionNumber: params.questionNumber,
      workNotes: params.workNotes,
      fileName: finalFileName,
      hasAttachment: Boolean(preparedFile),
      folderPath: finalFolderPath,
      serverFilePath: serverResult?.relPath || '',
    }).catch((err) => {
      console.warn('Firestore submission metadata deferred:', err);
    });
  }

  return {
    fileId: finalId,
    fileName: finalFileName,
    folderPath: finalFolderPath,
    fileUrl: serverResult?.fileUrl,
    storageType: driveUploaded && serverResult ? 'drive+server' : driveUploaded ? 'drive' : 'server',
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
  const currentUser = auth.currentUser;
  const shouldLoadFirestore =
    isVerifiedFirebaseUser() &&
    currentUser?.uid &&
    (!studentEmail ||
      !currentUser.email ||
      currentUser.email.toLowerCase() === studentEmail.trim().toLowerCase());

  const [serverRec, driveRec, fsRec] = await Promise.all([
    fetchServerStudentRecord(accountKey),
    studentEmail ? loadProgressFromDrive(studentEmail, fallbackProfile?.name) : Promise.resolve(null),
    shouldLoadFirestore && currentUser?.uid
      ? loadUserProgressFirestore(currentUser.uid)
          .then((rec): SavedStudentRecord | null => {
            if (!rec) return null;
            const prog: StudentProgressMap = {};
            for (const [k, v] of Object.entries(rec.progress || {})) {
              const qId = Number(k);
              if (Number.isInteger(qId) && qId >= 1 && qId <= 55 && v) {
                prog[qId] = v;
              }
            }
            return {
              accountKey,
              profile: {
                name: rec.name,
                school: rec.school,
                studentClass: rec.studentClass,
                email: rec.email || studentEmail || '',
              },
              progress: prog,
              updatedAt: rec.updatedAt || Date.now(),
            };
          })
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const candidates = [localRec, serverRec, driveRec, fsRec].filter(
    Boolean
  ) as SavedStudentRecord[];
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

  const tasks: Promise<unknown>[] = [pushServerStudentRecord(record)];
  if (isVerifiedFirebaseUser()) {
    tasks.push(
      saveUserProgressFirestore({
        name: record.profile.name,
        school: record.profile.school,
        studentClass: record.profile.studentClass,
        email: record.profile.email,
        progress: record.progress,
      }).catch((err) => {
        console.warn('Firestore progress sync deferred:', err);
      })
    );
  }

  await Promise.all(tasks);

  if (options?.syncDrive !== false) {
    const driveRes = await saveProgressToDrive(record, options?.teacherFolderInput);
    return { driveSynced: driveRes.synced };
  }
  return { driveSynced: false };
}
