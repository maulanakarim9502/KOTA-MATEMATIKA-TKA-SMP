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
