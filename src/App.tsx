/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ThreeCity from './components/ThreeCity';
import WelcomeModal from './components/WelcomeModal';
import StudyModal from './components/StudyModal';
import { logoutGoogle, TEACHER_EMAIL } from './services/googleDriveService';
import { ambientMusic } from './services/ambientMusicService';
import {
  Volume2,
  VolumeX,
  Star,
  Building2,
  User,
  LogOut,
  Save,
  CheckCircle2,
  FolderCog,
  X,
  Music,
  Maximize2,
  Minimize2,
} from 'lucide-react';

function checkIsMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  const isCoarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return (
    window.innerWidth < 1024 &&
    (isCoarse || window.innerHeight < 580 || window.innerWidth < 768)
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>('Maulana Karim');
  const [studentSchool, setStudentSchool] = useState<string>('SMPN 1 Kota');
  const [studentClass, setStudentClass] = useState<string>('9A');
  const [studentEmail, setStudentEmail] = useState<string>('maulanakarim9502@gmail.com');

  const [userProgress, setUserProgress] = useState<
    Record<number, { solved: boolean; stars: number; attempts: number }>
  >({});
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [kickedChapterId, setKickedChapterId] = useState<number | null>(null);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState<boolean>(true);
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(() => checkIsMobileViewport());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [teacherModalOpen, setTeacherModalOpen] = useState<boolean>(false);
  const [teacherFolderValue, setTeacherFolderValue] = useState<string>(() => {
    try {
      return localStorage.getItem('tka_smp_teacher_drive_folder') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    const onResize = () => setIsMobileLayout(checkIsMobileViewport());
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('resize', onResize);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore if browser blocks fullscreen API (e.g. iOS Safari)
    }
  };

  // Load from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('tka_smp_roblox_user');
      if (savedUser) {
        const data = JSON.parse(savedUser);
        setStudentName(data.name || 'Siswa');
        setStudentSchool(data.school || 'SMPN 1 Kota');
        setStudentClass(data.studentClass || '9A');
        setStudentEmail(data.email || '');
        setIsLoggedIn(true);
      }
      const savedProg = localStorage.getItem('tka_smp_roblox_progress');
      if (savedProg) {
        setUserProgress(JSON.parse(savedProg));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Auto-start peaceful copyright-free background music on first user gesture
  useEffect(() => {
    if (!isMusicEnabled) {
      ambientMusic.stop();
      return;
    }

    const handleFirstInteraction = () => {
      if (isMusicEnabled && !ambientMusic.getIsPlaying()) {
        ambientMusic.start();
      }
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [isMusicEnabled]);

  useEffect(() => {
    return () => {
      ambientMusic.stop();
    };
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tka_smp_roblox_progress', JSON.stringify(userProgress));
    } catch (e) {
      console.error(e);
    }
  }, [userProgress]);

  const toggleMusic = () => {
    if (isMusicEnabled) {
      ambientMusic.stop();
      setIsMusicEnabled(false);
    } else {
      setIsMusicEnabled(true);
      ambientMusic.start();
    }
  };

  const speakText = (text: string) => {
    if (isVoiceMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.92;
    utterance.onstart = () => ambientMusic.duckForVoice(true);
    utterance.onend = () => ambientMusic.duckForVoice(false);
    utterance.onerror = () => ambientMusic.duckForVoice(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleLoginSuccess = (name: string, school: string, studentClassVal: string, email: string) => {
    setStudentName(name);
    setStudentSchool(school);
    setStudentClass(studentClassVal);
    setStudentEmail(email);
    setIsLoggedIn(true);
    localStorage.setItem(
      'tka_smp_roblox_user',
      JSON.stringify({ name, school, studentClass: studentClassVal, email })
    );
    if (isMusicEnabled) {
      ambientMusic.start();
    }
    speakText(
      `Selamat datang di kota petualangan Roblox TKA Matematika SMP, ${name} dari kelas ${studentClassVal} ${school}! Jelajahi ke-11 gedung bab dan selesaikan misinya.`
    );
  };

  const handleSaveTeacherFolder = () => {
    try {
      localStorage.setItem('tka_smp_teacher_drive_folder', teacherFolderValue.trim());
    } catch {
      // ignore storage quota
    }
    setTeacherModalOpen(false);
  };

  const isTeacherAccount = isLoggedIn && studentEmail.toLowerCase() === TEACHER_EMAIL.toLowerCase();

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setActiveChapterId(null);
    localStorage.removeItem('tka_smp_roblox_user');
    try {
      await logoutGoogle();
    } catch {
      // ignore if Firebase user was not signed in
    }
    speakText('Anda telah keluar dari akun.');
  };

  const handleSaveToGoogle = () => {
    try {
      localStorage.setItem('tka_smp_roblox_progress', JSON.stringify(userProgress));
      setSaveToast(true);
      speakText(
        'Progres belajar dan dekorasi gedung kota Anda berhasil disinkronkan dan disimpan ke akun Google!'
      );
      setTimeout(() => setSaveToast(false), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProgress = (qId: number, solved: boolean, stars: number, attempts: number) => {
    setUserProgress((prev) => ({
      ...prev,
      [qId]: { solved, stars, attempts },
    }));
    // Unlock kicked chapter once student solves a question in another building
    const chapterOfQuestion = Math.ceil(qId / 5);
    if (solved && kickedChapterId !== null && chapterOfQuestion !== kickedChapterId) {
      setKickedChapterId(null);
    }
  };

  const handleSelectChapter = (chId: number) => {
    if (chId === kickedChapterId) {
      speakText(
        `Gedung Bab ${chId} masih terkunci sementara karena jawaban salah tadi. Silakan cari gedung bab lain terlebih dahulu!`
      );
      return;
    }
    setActiveChapterId(chId);
  };

  const handleKickOut = (kickedId: number) => {
    setActiveChapterId(null);
    setKickedChapterId(kickedId);
  };

  const totalScore = Object.values(userProgress).reduce(
    (acc, p) => acc + (p.solved ? p.stars * 10 : 0),
    0
  );

  return (
    <div className="h-[100dvh] w-screen bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden relative">
      {/* WELCOME / GOOGLE LOGIN MODAL */}
      {!isLoggedIn && <WelcomeModal onLoginSuccess={handleLoginSuccess} speakText={speakText} />}

      {/* DESKTOP TOP HEADER BAR (Hidden on mobile so 3D game fills 1 full screen!) */}
      {!isMobileLayout && (
        <header className="bg-slate-900/95 backdrop-blur-md z-40 border-b border-indigo-500/30 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-none">
                Roblox TKA 3D Adventure
              </h1>
              <span className="text-[11px] text-blue-300 font-medium">
                11 Bab TKA Matematika SMP • Pemandu Voice AI
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {isLoggedIn && (
              <div className="hidden md:flex items-center bg-indigo-950/80 px-3.5 py-1.5 rounded-full border border-indigo-500/30 text-xs font-semibold space-x-2">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {studentName} • {studentClass} ({studentSchool})
                </span>
                <span className="text-amber-400 flex items-center">
                  <Star className="w-3 h-3 fill-amber-400 mr-1" />
                  {totalScore} Poin
                </span>
              </div>
            )}

            {/* TEACHER-ONLY FOLDER DRIVE SETTING (HIDDEN FROM STUDENTS) */}
            {isTeacherAccount && (
              <button
                onClick={() => setTeacherModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition"
                title="Pengaturan Folder Drive Guru"
              >
                <FolderCog className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Folder Drive Guru</span>
              </button>
            )}

            {/* SAVE TO GOOGLE BUTTON */}
            <button
              onClick={handleSaveToGoogle}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition transform hover:scale-105"
              title="Simpan Progres ke Google Cloud"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simpan ke Google</span>
            </button>

            {/* PEACEFUL BACKGROUND MUSIC TOGGLE */}
            <button
              onClick={toggleMusic}
              title={isMusicEnabled ? 'Matikan Musik Tenang' : 'Nyalakan Musik Tenang'}
              className={`px-2.5 py-2 rounded-xl border text-xs font-bold flex items-center space-x-1 transition ${
                isMusicEnabled
                  ? 'bg-sky-950/60 border-sky-700 text-sky-300 hover:bg-sky-900/70'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Music className="w-4 h-4" />
              <span className="hidden lg:inline">{isMusicEnabled ? 'Musik On' : 'Musik Off'}</span>
            </button>

            {/* VOICE MUTE TOGGLE */}
            <button
              onClick={() => setIsVoiceMuted(!isVoiceMuted)}
              title={isVoiceMuted ? 'Nyalakan Suara AI' : 'Bisukan Suara AI'}
              className={`p-2 rounded-xl border transition ${
                isVoiceMuted
                  ? 'bg-rose-950/50 border-rose-800 text-rose-400'
                  : 'bg-emerald-950/50 border-emerald-800 text-emerald-400'
              }`}
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* EXIT / LOGOUT BUTTON */}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                title="Keluar / Exit"
                className="bg-rose-600/80 hover:bg-rose-600 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-md"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* MOBILE-ONLY FLOATING COMPACT TOP-CENTER UTILITY BAR (NO TEXT OVERLAP, 1 FULL SCREEN) */}
      {isMobileLayout && isLoggedIn && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-1.5 bg-slate-950/75 backdrop-blur-md px-2 py-1 rounded-xl border border-white/15 shadow-lg">
          <button
            onClick={handleSaveToGoogle}
            title="Simpan ke Google"
            className="w-7 h-7 bg-emerald-600/90 hover:bg-emerald-500 rounded-lg flex items-center justify-center text-white"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleMusic}
            title={isMusicEnabled ? 'Matikan Musik' : 'Nyalakan Musik'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isMusicEnabled ? 'bg-sky-600/80 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsVoiceMuted(!isVoiceMuted)}
            title={isVoiceMuted ? 'Nyalakan Suara AI' : 'Bisukan Suara AI'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isVoiceMuted ? 'bg-rose-800/80 text-rose-200' : 'bg-indigo-600/80 text-white'
            }`}
          >
            {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            className="w-7 h-7 bg-slate-800/90 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-100"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          {isTeacherAccount && (
            <button
              onClick={() => setTeacherModalOpen(true)}
              title="Folder Drive Guru"
              className="w-7 h-7 bg-amber-600/90 rounded-lg flex items-center justify-center text-white"
            >
              <FolderCog className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleLogout}
            title="Keluar"
            className="w-7 h-7 bg-rose-600/90 hover:bg-rose-500 rounded-lg flex items-center justify-center text-white"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SUCCESS TOAST FOR GOOGLE SAVE */}
      {saveToast && (
        <div className="absolute top-14 sm:top-20 right-4 sm:right-6 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-400 z-50 flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-yellow-300 shrink-0" />
          <div className="text-[11px] sm:text-xs font-bold">
            Progres Disimpan ({studentEmail})!
          </div>
        </div>
      )}

      {/* FULL-SCREEN 3D ROBLOX ADVENTURE WORLD */}
      <main className={`flex-1 w-full overflow-hidden ${isMobileLayout ? 'p-0' : 'p-3 sm:p-4'}`}>
        <ThreeCity
          userProgress={userProgress}
          kickedChapterId={kickedChapterId}
          isMobileLayout={isMobileLayout}
          onSelectChapter={handleSelectChapter}
          speakText={speakText}
        />
      </main>

      {/* STUDY MODAL FOR ACTIVE CHAPTER */}
      {activeChapterId !== null && (
        <StudyModal
          chapterId={activeChapterId}
          studentName={studentName}
          studentSchool={studentSchool}
          studentClass={studentClass}
          studentEmail={studentEmail}
          userProgress={userProgress}
          onClose={() => setActiveChapterId(null)}
          onKickOut={handleKickOut}
          onUpdateProgress={handleUpdateProgress}
          speakText={speakText}
        />
      )}

      {/* TEACHER-ONLY DRIVE FOLDER CONFIG MODAL */}
      {teacherModalOpen && isTeacherAccount && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-950 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-amber-200">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base flex items-center space-x-2">
                <FolderCog className="w-5 h-5 text-amber-600" />
                <span>Folder Induk Google Drive Guru</span>
              </h3>
              <button
                onClick={() => setTeacherModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Khusus akun guru ({TEACHER_EMAIL}). Tempelkan link atau ID folder induk Google Drive tujuan jika ingin mengarahkan hasil kerja siswa ke folder khusus (otomatis disusun per Sekolah → Kelas → Bab).
            </p>
            <input
              type="text"
              value={teacherFolderValue}
              onChange={(e) => setTeacherFolderValue(e.target.value)}
              placeholder="Contoh: https://drive.google.com/drive/folders/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-950 bg-white focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setTeacherModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveTeacherFolder}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
              >
                Simpan Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
