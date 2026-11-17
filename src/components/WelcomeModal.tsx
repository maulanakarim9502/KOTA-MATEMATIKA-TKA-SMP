/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  User,
  Volume2,
  CheckCircle2,
  ArrowRight,
  School,
  GraduationCap,
  CloudCheck,
  Loader2,
  Mail,
} from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';
import {
  buildAccountKey,
  googleBasicSignIn,
  loadBestStudentRecord,
  StudentProgressMap,
  subscribeFirebaseUser,
} from '../services/googleDriveService';

interface WelcomeModalProps {
  onLoginSuccess: (
    name: string,
    school: string,
    studentClass: string,
    email: string,
    restoredProgress?: StudentProgressMap
  ) => void;
  speakText: (text: string) => void;
}

export default function WelcomeModal({ onLoginSuccess, speakText }: WelcomeModalProps) {
  const [nameInput, setNameInput] = useState<string>('');
  const [schoolInput, setSchoolInput] = useState<string>('');
  const [classInput, setClassInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [driveConnected, setDriveConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [restoredProgress, setRestoredProgress] = useState<StudentProgressMap>({});
  const [step, setStep] = useState<'check' | 'ready'>('check');

  // Auto-detect already signed-in browser Google account & restore saved profile/progress
  useEffect(() => {
    const unsub = subscribeFirebaseUser(async (user) => {
      if (!user?.email) return;
      const gEmail = user.email;
      const gName = user.displayName || '';
      setEmailInput((prev) => prev || gEmail);
      setNameInput((prev) => prev || gName);

      const accountKey = buildAccountKey(gEmail, gName, '', '');
      const saved = await loadBestStudentRecord(accountKey, gEmail, {
        name: gName,
        school: '',
        studentClass: '',
        email: gEmail,
      });

      if (saved) {
        if (saved.profile.name) setNameInput(saved.profile.name);
        if (saved.profile.school) setSchoolInput(saved.profile.school);
        if (saved.profile.studentClass) setClassInput(saved.profile.studentClass);
        setEmailInput(saved.profile.email || gEmail);
        setRestoredProgress(saved.progress || {});

        const solvedCount = Object.values(saved.progress || {}).filter((p) => p.solved).length;
        const level = 1 + Math.floor(solvedCount / 5);
        setStatusNote(
          solvedCount > 0
            ? `Akun Google (${gEmail}) terdeteksi • Progres tersimpan: Lv.${level} (${solvedCount}/55 Soal)`
            : `Akun Google browser terdeteksi: ${gEmail}`
        );
      } else {
        setStatusNote(`Akun Google browser terdeteksi: ${gEmail}`);
      }
    });
    return () => unsub();
  }, []);

  const validateFields = () => {
    if (!nameInput.trim() || !schoolInput.trim() || !classInput.trim()) {
      setAuthError('Mohon lengkapi Nama Siswa, Asal Sekolah, dan Kelas terlebih dahulu.');
      return false;
    }
    setAuthError('');
    return true;
  };

  const handleGoogleConnect = async () => {
    setIsConnecting(true);
    setAuthError('');
    try {
      const res = await googleBasicSignIn();
      if (!res?.user) return;

      const gEmail = res.user.email || emailInput;
      const gName = nameInput.trim() || res.user.displayName || 'Siswa';
      setEmailInput(gEmail);
      setDriveConnected(Boolean(res.accessToken));

      const accountKey = buildAccountKey(gEmail, gName, schoolInput, classInput);
      const saved = await loadBestStudentRecord(accountKey, gEmail, {
        name: gName,
        school: schoolInput.trim(),
        studentClass: classInput.trim(),
        email: gEmail,
      });

      const resolvedName = (nameInput.trim() || saved?.profile.name || gName).trim();
      const resolvedSchool = (schoolInput.trim() || saved?.profile.school || '').trim();
      const resolvedClass = (classInput.trim() || saved?.profile.studentClass || '').trim();
      const resolvedProg = saved?.progress || {};

      setNameInput(resolvedName);
      if (resolvedSchool) setSchoolInput(resolvedSchool);
      if (resolvedClass) setClassInput(resolvedClass);
      setRestoredProgress(resolvedProg);

      const solvedCount = Object.values(resolvedProg).filter((p) => p.solved).length;
      const level = 1 + Math.floor(solvedCount / 5);

      if (resolvedName && resolvedSchool && resolvedClass) {
        setStatusNote(
          solvedCount > 0
            ? `Berhasil memuat progres Google Drive & Cloud: Lv.${level} (${solvedCount}/55 Soal)`
            : `Akun Google ${gEmail} berhasil terhubung!`
        );
        setStep('ready');
        speakText(
          solvedCount > 0
            ? `Selamat datang kembali ${resolvedName}! Progres belajarmu di level ${level} dengan ${solvedCount} soal selesai berhasil dimuat. Siap melanjutkan petualangan Kota 3D?`
            : `Halo ${resolvedName} dari kelas ${resolvedClass}, ${resolvedSchool}! Akun Google ${gEmail} berhasil terhubung otomatis. Apakah kamu siap belajar hari ini?`
        );
      } else {
        setStatusNote(
          `Akun Google (${gEmail}) terhubung! Silakan lengkapi Asal Sekolah & Kelas di atas, lalu klik Lanjut.`
        );
      }
    } catch (err: any) {
      setAuthError(
        err?.message ||
          'Login Google dibatalkan atau terblokir. Silakan izinkan popup atau isi data sekolah & kelas lalu klik Lanjut.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleContinueStandard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;

    const cleanEmail = emailInput.trim();
    const accountKey = buildAccountKey(
      cleanEmail,
      nameInput.trim(),
      schoolInput.trim(),
      classInput.trim()
    );
    const saved = await loadBestStudentRecord(accountKey, cleanEmail, {
      name: nameInput.trim(),
      school: schoolInput.trim(),
      studentClass: classInput.trim(),
      email: cleanEmail,
    });
    if (saved?.progress) {
      setRestoredProgress(saved.progress);
    }

    const solvedCount = Object.values(saved?.progress || {}).filter((p) => p.solved).length;
    setStep('ready');
    speakText(
      solvedCount > 0
        ? `Selamat datang kembali ${nameInput.trim()}! Progresmu sebanyak ${solvedCount} soal sudah dimuat. Siap melanjutkan Kota TKA 3D?`
        : `Halo ${nameInput.trim()} dari kelas ${classInput.trim()}, ${schoolInput.trim()}! Apakah kamu sudah siap belajar dan menjelajahi Kota TKA 3D hari ini?`
    );
  };

  const handleConfirmReady = () => {
    const solvedCount = Object.values(restoredProgress).filter((p) => p.solved).length;
    speakText(
      solvedCount > 0
        ? `Ayo lanjutkan petualangan ${nameInput.trim()}! Bangun kembali gedung bab dan kirim hasil kerjamu ke Google Drive guru!`
        : `Hebat sekali ${nameInput.trim()}! Mari mulai petualangan di Kota TKA 3D, masuk ke gedung bab, isi perabotannya, dan kirim hasil kerjamu ke Google Drive guru!`
    );
    onLoginSuccess(
      nameInput.trim(),
      schoolInput.trim(),
      classInput.trim(),
      emailInput.trim(),
      restoredProgress
    );
  };

  const restoredSolvedCount = Object.values(restoredProgress).filter((p) => p.solved).length;
  const restoredLevel = 1 + Math.floor(restoredSolvedCount / 5);

  return (
    <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl border border-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-600 to-violet-500 w-28 h-28 rounded-bl-full opacity-10 flex items-center justify-center">
          <Award className="w-14 h-14 text-indigo-600" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" /> Login Siswa & Sinkron Google Drive
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950">Masuk Petualangan Kota TKA 3D</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Hubungkan akun Google browsermu agar progres belajar, level, dan dekorasi gedung tersimpan otomatis di Google Drive siswa & guru.
          </p>
        </div>

        {step === 'check' ? (
          <form onSubmit={handleContinueStandard} className="space-y-3.5">
            {/* Primary Google Browser Account Sign-In */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3 space-y-2">
              <GoogleSignInButton
                onClick={handleGoogleConnect}
                disabled={isConnecting}
                label={
                  isConnecting
                    ? 'Menghubungkan Akun Google...'
                    : emailInput
                      ? `Lanjutkan dengan Google (${emailInput})`
                      : 'Sign in with Google (Otomatis Akun Browser)'
                }
              />
              {isConnecting && (
                <div className="flex items-center justify-center space-x-1.5 text-[11px] font-bold text-indigo-700">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memeriksa akun & memuat progres tersimpan...</span>
                </div>
              )}
              {statusNote && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold px-3 py-2 rounded-xl flex items-center space-x-2">
                  <CloudCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{statusNote}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 flex items-center">
                <User className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Nama Lengkap / Panggilan Siswa
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Masukkan nama lengkapmu..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-sm font-bold text-slate-950 bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 flex items-center">
                  <School className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Asal Sekolah
                </label>
                <input
                  type="text"
                  value={schoolInput}
                  onChange={(e) => setSchoolInput(e.target.value)}
                  placeholder="Contoh: SMPN 1 Kota"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-sm font-bold text-slate-950 bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 flex items-center">
                  <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Kelas
                </label>
                <input
                  type="text"
                  value={classInput}
                  onChange={(e) => setClassInput(e.target.value)}
                  placeholder="Contoh: 9A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-sm font-bold text-slate-950 bg-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Email Siswa (opsional jika popup Google terblokir)
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Contoh: nama.siswa@gmail.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs sm:text-sm font-semibold text-slate-950 bg-white"
              />
            </div>

            {authError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl font-medium">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-xl shadow transition flex items-center justify-center space-x-2 text-xs sm:text-sm"
            >
              <span>Lanjut Masuk ke Kota 3D</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="space-y-5 text-center py-3">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600 border border-indigo-200 shadow-inner">
              <Volume2 className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-950">Halo, {nameInput}!</h3>
              <p className="text-xs font-bold text-indigo-700">
                {schoolInput} • Kelas {classInput}
                {emailInput ? ` (${emailInput})` : ''}
              </p>
              {restoredSolvedCount > 0 && (
                <div className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-extrabold">
                  <CloudCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    Progres Dipulihkan: Lv.{restoredLevel} • {restoredSolvedCount}/55 Soal Selesai
                  </span>
                </div>
              )}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                {driveConnected ? 'Akun Google & Google Drive otomatis terhubung! ' : ''}
                Voice AI siap memandumu. Apakah kamu sudah siap melanjutkan petualangan Kota 3D hari ini?
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleConfirmReady}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 text-sm"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {restoredSolvedCount > 0
                    ? `Lanjutkan Petualangan (Lv.${restoredLevel})`
                    : 'Ya, Saya Sudah Siap Belajar! (Mulai Petualangan)'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStep('check')}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 underline"
              >
                Ubah Nama / Sekolah / Kelas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
