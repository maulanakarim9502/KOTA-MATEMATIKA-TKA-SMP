/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  FolderCog,
  X,
  RefreshCw,
  Search,
  Image as ImageIcon,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  Loader2,
  ZoomIn,
  FolderPlus,
} from 'lucide-react';
import { CHAPTERS_DATA } from '../data/tkaData';
import {
  isVerifiedFirebaseUser,
  listStudentSubmissionsFirestore,
} from '../services/firestoreService';
import {
  createAndShareTeacherDriveFolder,
  fetchGlobalTeacherDriveConfig,
  saveGlobalTeacherDriveConfig,
  TEACHER_EMAIL,
} from '../services/googleDriveService';

export interface UnifiedSubmissionItem {
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
  mimeType: string;
  hasAttachment: boolean;
  sizeBytes: number;
  folderPath: string;
  fileUrl: string;
  driveUrl: string;
  submittedAt: number;
}

interface TeacherSubmissionsModalProps {
  teacherFolderValue: string;
  onChangeTeacherFolder: (val: string) => void;
  onSaveTeacherFolder: () => void;
  onClose: () => void;
}

function isImageSubmission(item: UnifiedSubmissionItem): boolean {
  if (!item.fileUrl) return false;
  if (item.mimeType.startsWith('image/')) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(item.fileName);
}

export default function TeacherSubmissionsModal({
  teacherFolderValue,
  onChangeTeacherFolder,
  onSaveTeacherFolder,
  onClose,
}: TeacherSubmissionsModalProps) {
  const [activeTab, setActiveTab] = useState<'submissions' | 'drive'>('submissions');
  const [submissions, setSubmissions] = useState<UnifiedSubmissionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [filterChapter, setFilterChapter] = useState<number>(0);
  const [previewItem, setPreviewItem] = useState<UnifiedSubmissionItem | null>(null);
  const [savedBanner, setSavedBanner] = useState<string>('');
  const [driveConfigBusy, setDriveConfigBusy] = useState<boolean>(false);
  const [driveConfigErr, setDriveConfigErr] = useState<string>('');

  const loadSubmissions = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const mergedMap = new Map<string, UnifiedSubmissionItem>();

      const [serverRes, fsList, globalCfg] = await Promise.all([
        fetch('/api/submissions')
          .then(async (r) => (r.ok ? r.json() : null))
          .catch(() => null),
        isVerifiedFirebaseUser()
          ? listStudentSubmissionsFirestore().catch(() => [])
          : Promise.resolve([]),
        fetchGlobalTeacherDriveConfig().catch(() => null),
      ]);

      if (globalCfg?.folderUrl && !teacherFolderValue) {
        onChangeTeacherFolder(globalCfg.folderUrl);
      }

      if (serverRes?.ok && Array.isArray(serverRes.submissions)) {
        for (const s of serverRes.submissions) {
          if (!s?.id) continue;
          mergedMap.set(String(s.id), {
            id: String(s.id),
            studentName: String(s.studentName || 'Siswa'),
            school: String(s.school || ''),
            studentClass: String(s.studentClass || ''),
            email: String(s.email || ''),
            chapterId: Number(s.chapterId || 1),
            chapterTitle: String(s.chapterTitle || `Bab ${s.chapterId || 1}`),
            questionNumber: Number(s.questionNumber || 1),
            workNotes: String(s.workNotes || ''),
            fileName: String(s.fileName || ''),
            mimeType: String(s.mimeType || ''),
            hasAttachment: Boolean(s.hasAttachment),
            sizeBytes: Number(s.sizeBytes || 0),
            folderPath: String(s.folderPath || ''),
            fileUrl: String(s.fileUrl || ''),
            driveUrl: String(s.driveUrl || ''),
            submittedAt: Number(s.submittedAt || Date.now()),
          });
        }
      }

      for (const f of fsList) {
        const existing = mergedMap.get(f.id);
        if (existing) {
          if (!existing.driveUrl && f.driveUrl) {
            existing.driveUrl = f.driveUrl;
          }
          continue;
        }
        const fallbackUrl = f.serverFilePath
          ? `/api/submissions/file?path=${encodeURIComponent(f.serverFilePath)}`
          : '';
        mergedMap.set(f.id, {
          id: f.id,
          studentName: f.studentName,
          school: f.school,
          studentClass: f.studentClass,
          email: f.email,
          chapterId: f.chapterId,
          chapterTitle: f.chapterTitle,
          questionNumber: f.questionNumber,
          workNotes: f.workNotes,
          fileName: f.fileName,
          mimeType: '',
          hasAttachment: f.hasAttachment,
          sizeBytes: 0,
          folderPath: f.folderPath,
          fileUrl: fallbackUrl,
          driveUrl: f.driveUrl || '',
          submittedAt: f.createdAt,
        });
      }

      const combined = Array.from(mergedMap.values()).sort((a, b) => b.submittedAt - a.submittedAt);
      setSubmissions(combined);
    } catch (err: any) {
      setLoadError(err?.message || 'Gagal memuat daftar tugas siswa dari server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const filteredSubmissions = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return submissions.filter((item) => {
      if (filterChapter > 0 && item.chapterId !== filterChapter) return false;
      if (!q) return true;
      return (
        item.studentName.toLowerCase().includes(q) ||
        item.school.toLowerCase().includes(q) ||
        item.studentClass.toLowerCase().includes(q) ||
        item.chapterTitle.toLowerCase().includes(q) ||
        item.workNotes.toLowerCase().includes(q) ||
        item.fileName.toLowerCase().includes(q)
      );
    });
  }, [submissions, searchText, filterChapter]);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-white text-slate-950 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 shadow">
              <FolderCog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Portal Web Guru — Arsip Foto & Tugas Siswa
              </h3>
              <p className="text-[11px] text-amber-300 font-medium">
                Akun Guru: {TEACHER_EMAIL}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('submissions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'submissions'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Kiriman Foto & Cara Kerja ({submissions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('drive')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'drive'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <FolderCog className="w-3.5 h-3.5" />
              <span>Folder Google Drive</span>
            </button>
          </div>

          {activeTab === 'submissions' && (
            <button
              type="button"
              onClick={loadSubmissions}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'submissions' ? (
            <>
              {/* Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Cari nama siswa, sekolah, kelas, atau isi catatan..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <select
                  value={filterChapter}
                  onChange={(e) => setFilterChapter(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={0}>Semua Bab (1 - 11)</option>
                  {CHAPTERS_DATA.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              {loadError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl font-medium">
                  {loadError}
                </div>
              )}

              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
                  <p className="text-xs font-semibold">Memuat arsip foto & tugas siswa...</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">
                    Belum ada kiriman tugas siswa yang cocok
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Setiap siswa yang menekan tombol kirim foto/cara kerja pada soal latihan akan langsung muncul di sini secara real-time.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredSubmissions.map((item) => {
                    const hasImg = isImageSubmission(item);
                    const dateStr = new Date(item.submittedAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    });

                    return (
                      <div
                        key={item.id}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-indigo-300 transition"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-900">
                                {item.studentName}
                              </h4>
                              <p className="text-[11px] text-slate-600 font-semibold">
                                {item.school || 'SMP'} • Kelas {item.studentClass || '-'}
                              </p>
                            </div>
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shrink-0">
                              Bab {item.chapterId} • Soal {item.questionNumber}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500">
                            {dateStr}
                            {item.sizeBytes > 0 && ` • ${Math.max(1, Math.round(item.sizeBytes / 1024))} KB`}
                          </p>

                          {hasImg && (
                            <button
                              type="button"
                              onClick={() => setPreviewItem(item)}
                              className="relative group w-full overflow-hidden rounded-xl border border-slate-300 bg-white"
                              title="Klik untuk memperbesar foto"
                            >
                              <img
                                src={item.fileUrl}
                                alt={`Hasil ${item.studentName} Soal ${item.questionNumber}`}
                                className="w-full h-40 object-cover"
                              />
                              <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/35 transition flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 bg-white/95 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow">
                                  <ZoomIn className="w-3.5 h-3.5" />
                                  <span>Perbesar Foto</span>
                                </span>
                              </div>
                            </button>
                          )}

                          {item.workNotes && (
                            <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 whitespace-pre-wrap">
                              <span className="font-bold text-slate-600 block text-[10px] uppercase mb-0.5">
                                Catatan Siswa:
                              </span>
                              {item.workNotes}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 gap-2">
                          <span className="text-[11px] text-slate-500 truncate">
                            {item.fileName || item.folderPath}
                          </span>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            {item.driveUrl && (
                              <a
                                href={item.driveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Drive</span>
                              </a>
                            )}
                            {item.fileUrl && (
                              <a
                                href={item.fileUrl}
                                download={item.fileName || 'hasil_siswa'}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Unduh</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4 max-w-xl">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
                <h4 className="font-extrabold text-sm text-amber-950">
                  Cara Termudah: Buat Folder Tugas Otomatis di Google Drive Anda
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Klik tombol di bawah untuk membuat folder khusus di Google Drive akun guru ({TEACHER_EMAIL}) dan otomatis membuka izin tulis agar semua siswa bisa menulis langsung file fotonya ke Drive Anda.
                </p>
                <button
                  type="button"
                  disabled={driveConfigBusy}
                  onClick={async () => {
                    setDriveConfigBusy(true);
                    setDriveConfigErr('');
                    setSavedBanner('');
                    try {
                      const cfg = await createAndShareTeacherDriveFolder();
                      onChangeTeacherFolder(cfg.folderUrl);
                      onSaveTeacherFolder();
                      setSavedBanner(
                        `Folder Google Drive "${cfg.folderName}" berhasil dibuat, dibuka untuk kiriman siswa, & disinkronkan ke semua siswa!`
                      );
                    } catch (err: any) {
                      setDriveConfigErr(err?.message || 'Gagal membuat folder Google Drive otomatis.');
                    } finally {
                      setDriveConfigBusy(false);
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow"
                >
                  {driveConfigBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FolderPlus className="w-4 h-4" />
                  )}
                  <span>
                    {driveConfigBusy
                      ? 'Membuat Folder & Mengatur Izin...'
                      : 'Buat Otomatis & Bagikan Folder Tugas di Drive Saya'}
                  </span>
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-xs font-extrabold text-slate-900 block">
                  Atau Tempel Link / ID Folder Google Drive yang Sudah Ada:
                </label>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Pastikan di Google Drive folder tersebut disetel Bagikan: <strong>Siapa saja yang memiliki link → Editor</strong> agar siswa bisa langsung menulis ke dalam folder Anda (disusun rapi per Sekolah → Kelas → Nama Siswa → Bab).
                </p>
                <input
                  type="text"
                  value={teacherFolderValue}
                  onChange={(e) => {
                    setSavedBanner('');
                    setDriveConfigErr('');
                    onChangeTeacherFolder(e.target.value);
                  }}
                  placeholder="Contoh: https://drive.google.com/drive/folders/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-950 bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {driveConfigErr && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl font-medium">
                  {driveConfigErr}
                </div>
              )}

              {savedBanner && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3 rounded-xl font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{savedBanner}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  disabled={driveConfigBusy}
                  onClick={async () => {
                    setDriveConfigBusy(true);
                    setDriveConfigErr('');
                    try {
                      const cfg = await saveGlobalTeacherDriveConfig(teacherFolderValue);
                      if (cfg.folderUrl) onChangeTeacherFolder(cfg.folderUrl);
                      onSaveTeacherFolder();
                      setSavedBanner('Pengaturan Folder Drive Guru tersimpan secara global untuk semua siswa.');
                    } catch (err: any) {
                      setDriveConfigErr(err?.message || 'Gagal menyimpan pengaturan folder Drive.');
                    } finally {
                      setDriveConfigBusy(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold"
                >
                  Simpan Folder Drive Guru
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inline Full Photo Preview Lightbox */}
      {previewItem && (
        <div
          className="fixed inset-0 bg-slate-950/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {previewItem.studentName} • {previewItem.school} ({previewItem.studentClass})
                </h4>
                <p className="text-xs text-slate-600">
                  {previewItem.chapterTitle} — Soal {previewItem.questionNumber}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={previewItem.fileUrl}
                  download={previewItem.fileName}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Unduh Foto</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <img
              src={previewItem.fileUrl}
              alt={previewItem.fileName}
              className="w-full max-h-[72vh] object-contain rounded-2xl bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
