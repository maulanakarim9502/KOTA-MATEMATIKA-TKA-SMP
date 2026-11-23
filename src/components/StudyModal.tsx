/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CHAPTERS_DATA, QUESTIONS_DATA, ChapterModule, Question } from '../data/tkaData';
import { QUESTION_RECOMMENDED_VIDEOS } from '../data/questionVideos';
import InteriorRoomShowcase from './InteriorRoomShowcase';
import {
  googleSignIn,
  hasDriveAccessToken,
  uploadSolutionToDrive,
  UploadedDriveResult,
} from '../services/googleDriveService';
import {
  Volume2,
  Mic,
  MicOff,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Check,
  X,
  BookOpen,
  Building2,
  Tv,
  UploadCloud,
  FileText,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Image as ImageIcon,
  Trash2,
  ArrowRight,
  Lock,
  Sparkles,
} from 'lucide-react';

interface StudyModalProps {
  chapterId: number;
  studentName: string;
  studentSchool: string;
  studentClass: string;
  studentEmail: string;
  userProgress: Record<number, { solved: boolean; stars: number; attempts: number }>;
  onClose: () => void;
  onKickOut: (kickedChapterId: number) => void;
  onGoToNextChapter?: (nextChapterId: number) => void;
  onUpdateProgress: (qId: number, solved: boolean, stars: number, attempts: number) => void;
  speakText: (text: string) => void;
}

export default function StudyModal({
  chapterId,
  studentName,
  studentSchool,
  studentClass,
  studentEmail,
  userProgress,
  onClose,
  onKickOut,
  onGoToNextChapter,
  onUpdateProgress,
  speakText,
}: StudyModalProps) {
  const chapter: ChapterModule = CHAPTERS_DATA.find((c) => c.id === chapterId) || CHAPTERS_DATA[0];
  const cQuestions = QUESTIONS_DATA.filter((q) => q.chapterId === chapterId);

  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const firstQuestionId = cQuestions[0]?.id;
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>(
    (firstQuestionId && QUESTION_RECOMMENDED_VIDEOS[firstQuestionId]?.[0]?.url) ||
      chapter.videoUrls[0]?.url ||
      ''
  );
  const [isVideoWatched, setIsVideoWatched] = useState<boolean>(() =>
    cQuestions.some((q) => Boolean(userProgress[q.id]?.solved))
  );

  const [userAnswer, setUserAnswer] = useState<string>('');
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showExpl, setShowExpl] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isKickingOut, setIsKickingOut] = useState<boolean>(false);

  const uploadCacheKey = `tka_smp_uploads_v1:${(studentEmail || studentName || 'siswa').toLowerCase()}`;

  // Web Guru & Drive Work Upload states per question
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [workNotes, setWorkNotes] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [driveBlockedFallback, setDriveBlockedFallback] = useState<boolean>(false);
  const [driveReady, setDriveReady] = useState<boolean>(() => hasDriveAccessToken());
  const [uploadedByQuestion, setUploadedByQuestion] = useState<Record<number, UploadedDriveResult>>(() => {
    try {
      const raw = localStorage.getItem(uploadCacheKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentQ: Question = cQuestions[currentQIndex] || cQuestions[0];
  const questionVideos = QUESTION_RECOMMENDED_VIDEOS[currentQ.id] || [];
  const activeRecommendedVideo = questionVideos.find((v) => v.url === selectedVideoUrl);
  const selectedWatchUrl = selectedVideoUrl.includes('/embed/')
    ? selectedVideoUrl.replace('/embed/', '/watch?v=')
    : selectedVideoUrl;
  const solvedCountInChapter = cQuestions.filter((q) => userProgress[q.id]?.solved).length;
  const isQuestionSolved = Boolean(userProgress[currentQ.id]?.solved) || feedback === 'correct';

  useEffect(() => {
    setCurrentQIndex(0);
    const firstId = cQuestions[0]?.id;
    const defaultUrl =
      (firstId && QUESTION_RECOMMENDED_VIDEOS[firstId]?.[0]?.url) || chapter.videoUrls[0]?.url || '';
    setSelectedVideoUrl(defaultUrl);
    setIsVideoWatched(cQuestions.some((q) => Boolean(userProgress[q.id]?.solved)));
  }, [chapterId]);

  useEffect(() => {
    const looksLikeImg =
      selectedFile &&
      ((selectedFile.type && selectedFile.type.startsWith('image/')) ||
        /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(selectedFile.name || ''));
    if (!selectedFile || !looksLikeImg) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const alreadySolved = Boolean(userProgress[currentQ.id]?.solved);
    const recUrl = QUESTION_RECOMMENDED_VIDEOS[currentQ.id]?.[0]?.url || chapter.videoUrls[0]?.url || '';
    if (recUrl) {
      setSelectedVideoUrl(recUrl);
    }
    setHintLevel(0);
    setShowHint(false);
    setShowExpl(alreadySolved);
    setFeedback(alreadySolved ? 'correct' : 'idle');
    setFeedbackMsg(
      alreadySolved
        ? 'Soal ini sudah kamu selesaikan! Kamu bisa melihat pembahasan dan mengirim/memperbarui foto cara pengerjaan.'
        : ''
    );
    setUserAnswer('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setWorkNotes('');
    setUploadError('');
    setDriveBlockedFallback(false);
    setDriveReady(hasDriveAccessToken());
  }, [currentQ]);

  const persistUploadedEntry = (qId: number, res: UploadedDriveResult) => {
    setUploadedByQuestion((prev) => {
      const next = { ...prev, [qId]: res };
      try {
        localStorage.setItem(uploadCacheKey, JSON.stringify(next));
      } catch {
        // ignore quota
      }
      return next;
    });
  };

  const executeUpload = async (useDriveAuth: boolean) => {
    setUploadError('');
    if (!selectedFile && !workNotes.trim()) {
      setUploadError('Silakan pilih foto/PDF cara pengerjaan atau tulis langkah pengerjaanmu terlebih dahulu.');
      return;
    }

    setIsUploading(true);
    setDriveBlockedFallback(false);
    try {
      // IMPORTANT: Authorize Google Drive FIRST directly from click gesture before any image compression awaits
      if (useDriveAuth && !hasDriveAccessToken()) {
        await googleSignIn();
        setDriveReady(hasDriveAccessToken());
      }

      let teacherFolderId = '';
      try {
        teacherFolderId = localStorage.getItem('tka_smp_teacher_drive_folder') || '';
      } catch {
        teacherFolderId = '';
      }

      const res = await uploadSolutionToDrive({
        studentName,
        studentSchool,
        studentClass,
        studentEmail,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        questionNumber: currentQ.numberInChapter,
        file: selectedFile,
        workNotes,
        teacherFolderInput: teacherFolderId,
      });
      persistUploadedEntry(currentQ.id, res);
      clearSelectedFile();
      setWorkNotes('');
      setDriveReady(hasDriveAccessToken());
      speakText(
        res.driveUrl
          ? `Mantap ${studentName}! Foto pengerjaan soal nomor ${currentQ.numberInChapter} sudah langsung masuk ke Google Drive guru. Sekarang kamu bisa lanjut!`
          : `Mantap ${studentName}! Hasil pengerjaan soal nomor ${currentQ.numberInChapter} tersimpan ke arsip guru.`
      );
    } catch (err: any) {
      const msg = err?.message || 'Gagal mengunggah hasil pengerjaan.';
      setUploadError(msg);
      if (useDriveAuth) {
        setDriveBlockedFallback(true);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.onresult = (e: any) => {
      const txt = e.results[0][0].transcript.toLowerCase();
      if (txt.includes('petunjuk')) handleShowHint();
      if (txt.includes('periksa')) handleCheck();
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleShowHint = () => {
    const nextLvl = Math.min(3, hintLevel + 1) as 1 | 2 | 3;
    setHintLevel(nextLvl);
    setShowHint(true);
    speakText(`Petunjuk untuk ${studentName}: ${currentQ.hints[nextLvl - 1]}`);
  };

  const handleCheck = () => {
    if (!userAnswer) {
      setFeedback('incorrect');
      setFeedbackMsg('Silakan pilih salah satu jawaban terlebih dahulu sebelum memeriksa.');
      return;
    }

    const isCorrect = userAnswer.trim().toUpperCase() === currentQ.correctAnswer.trim().toUpperCase();
    const prev = userProgress[currentQ.id] || { solved: false, stars: 3, attempts: 0 };
    const attempts = prev.attempts + 1;
    const earnedStars = Math.max(1, 4 - attempts);

    if (isCorrect) {
      setFeedback('correct');
      setShowExpl(true);
      const msg = `Hebat sekali ${studentName}! ${currentQ.voiceScript.correct} Pembahasan sekarang sudah terbuka! Unggah foto cara pengerjaanmu ke Google Drive guru untuk lanjut ke level berikutnya.`;
      setFeedbackMsg(msg);
      speakText(msg);
      onUpdateProgress(currentQ.id, true, Math.max(prev.stars, earnedStars), attempts);
    } else {
      // WRONG ANSWER: Kick student out of this building and instruct them to find another building!
      setFeedback('incorrect');
      setShowExpl(false);
      setIsKickingOut(true);
      const kickMsg = `Jawaban belum tepat, ${studentName}! Kamu dikeluarkan dari ${chapter.title}. Ayo cari gedung bab lain di kota untuk dibangun terlebih dahulu!`;
      setFeedbackMsg(kickMsg);
      speakText(kickMsg);
      onUpdateProgress(currentQ.id, prev.solved, Math.max(1, prev.stars - 1), attempts);

      setTimeout(() => {
        onKickOut(chapter.id);
      }, 2200);
    }
  };

  const currentUploaded = uploadedByQuestion[currentQ.id];

  return (
    <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-indigo-100 flex flex-col">
        {/* Modal Header */}
        <div className="bg-indigo-900 text-white p-5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-800 rounded-xl flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                {chapter.title}
              </span>
              <h3 className="font-bold text-base sm:text-lg">{chapter.subtitle}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isKickingOut}
            className="p-2 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 flex-1">
          {/* KICK-OUT FULL ALERT OVERLAY BANNER */}
          {isKickingOut && (
            <div className="bg-rose-600 text-white p-5 rounded-2xl shadow-xl border-2 border-rose-300 flex items-center space-x-4 animate-pulse">
              <AlertTriangle className="w-9 h-9 text-yellow-300 shrink-0" />
              <div>
                <h4 className="font-black text-base">KAMU DI-KICK DARI GEDUNG INI!</h4>
                <p className="text-xs text-rose-100">
                  Jawabanmu salah! Mengembalikanmu ke kota 3D — silakan cari gedung bab lain untuk dibangun terlebih dahulu.
                </p>
              </div>
            </div>
          )}

          {/* EMPTY-TO-FURNISHED INTERIOR VISUAL SHOWCASE */}
          <InteriorRoomShowcase chapterTitle={chapter.title} solvedCount={solvedCountInChapter} />

          {/* VIDEO SELECTION & PLAYER (SESUAI SOAL AKTIF + MATERI BAB) */}
          <div className="space-y-4 bg-slate-50 p-5 rounded-3xl border border-slate-200">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center">
                  <Tv className="w-4 h-4 mr-2 text-indigo-600" />
                  <span>Video Pembahasan Khusus Soal {currentQ.numberInChapter}:</span>
                </h4>
                {selectedWatchUrl && (
                  <a
                    href={selectedWatchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white px-3 py-1 rounded-xl border border-indigo-200 flex items-center space-x-1"
                  >
                    <span>Buka di YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {questionVideos.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-emerald-700" />
                    <span>Cocok untuk Soal {currentQ.numberInChapter}:</span>
                  </span>
                  {questionVideos.map((v, idx) => (
                    <button
                      key={`q-${currentQ.id}-${idx}`}
                      type="button"
                      onClick={() => setSelectedVideoUrl(v.url)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        selectedVideoUrl === v.url
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {v.title} ({v.channel})
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 px-1">
                  Video Materi Bab {chapter.id}:
                </span>
                {chapter.videoUrls
                  .filter((cv) => !questionVideos.some((qv) => qv.url === cv.url))
                  .map((v, idx) => (
                    <button
                      key={`ch-${chapter.id}-${idx}`}
                      type="button"
                      onClick={() => setSelectedVideoUrl(v.url)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        selectedVideoUrl === v.url
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {v.title}
                    </button>
                  ))}
              </div>

              {activeRecommendedVideo && (
                <p className="text-[11px] text-emerald-950 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                  <strong>Alasan Rekomendasi Soal {currentQ.numberInChapter}:</strong>{' '}
                  {activeRecommendedVideo.reason}
                </p>
              )}
            </div>

            <div className="bg-slate-900 rounded-2xl overflow-hidden min-h-[240px] flex items-center justify-center">
              <iframe
                src={selectedVideoUrl}
                title={`${chapter.title} - Soal ${currentQ.numberInChapter}`}
                className="w-full h-full min-h-[240px] border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            <button
              onClick={() => {
                setIsVideoWatched(true);
                speakText(
                  `Bagus sekali ${studentName}! Video telah disimak. Silakan kerjakan 5 soal latihan dan unggah cara pengerjaanmu ke Google Drive.`
                );
              }}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow transition flex items-center justify-center space-x-2 ${
                isVideoWatched
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isVideoWatched
                  ? 'Video Selesai Disimak (5 Soal Terbuka)'
                  : 'Tandai "Saya Sudah Menonton Video"'}
              </span>
            </button>
          </div>

          {/* 5 QUESTIONS & WORK UPLOAD */}
          {isVideoWatched ? (
            <div className="space-y-6">
              {/* Question Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center space-x-2">
                  {cQuestions.map((q, idx) => {
                    const solved = userProgress[q.id]?.solved;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQIndex(idx)}
                        className={`w-9 h-9 rounded-xl font-bold text-xs transition flex items-center justify-center ${
                          currentQIndex === idx
                            ? 'bg-indigo-600 text-white shadow'
                            : solved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Soal {currentQIndex + 1} dari 5 ({currentQ.type === 'pg' ? 'Pilihan Ganda' : 'Benar / Salah'})
                </span>
              </div>

              {/* Question Box */}
              <div className="space-y-4 bg-indigo-50/40 p-5 rounded-3xl border border-indigo-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800 uppercase">
                    Soal {currentQIndex + 1} ({currentQ.type === 'pg' ? 'Pilihan Ganda' : 'Benar / Salah'})
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => speakText(currentQ.voiceScript.readQuestion)}
                      className="px-3 py-1.5 bg-white rounded-xl border border-indigo-200 text-indigo-700 font-semibold text-xs flex items-center space-x-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Dengar Soal</span>
                    </button>
                    <button
                      onClick={toggleVoice}
                      className={`px-3 py-1.5 rounded-xl border font-semibold text-xs flex items-center space-x-1 ${
                        isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-white text-violet-700 border-violet-200'
                      }`}
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>{isListening ? 'Mendengarkan...' : 'Suara'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-slate-900 font-semibold text-sm sm:text-base leading-relaxed">
                  {currentQ.question}
                </p>
                <div className="text-xs text-slate-500 flex justify-between">
                  <span>
                    Sumber: <strong>{currentQ.source}</strong>
                  </span>
                  <a
                    href={currentQ.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline flex items-center"
                  >
                    <span>Cek Sumber Resmi</span> <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>

              {/* OPTIONS / ANSWERS */}
              <div className="space-y-3 max-w-2xl mx-auto">
                {currentQ.type === 'pg'
                  ? currentQ.options?.map((opt, idx) => {
                      const optLetter = opt.charAt(0);
                      const isSelected = userAnswer === optLetter;
                      return (
                        <div
                          key={idx}
                          onClick={() => !isKickingOut && setUserAnswer(optLetter)}
                          className={`p-4 rounded-2xl border cursor-pointer transition text-xs sm:text-sm font-medium flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <span>{opt}</span>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-white bg-white/20' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                          </div>
                        </div>
                      );
                    })
                  : ['Benar', 'Salah'].map((ans, idx) => {
                      const isSelected = userAnswer === ans;
                      return (
                        <div
                          key={idx}
                          onClick={() => !isKickingOut && setUserAnswer(ans)}
                          className={`p-4 rounded-2xl border cursor-pointer transition text-sm font-bold flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <span>{ans}</span>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-white bg-white/20' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                          </div>
                        </div>
                      );
                    })}
              </div>

              {/* ACTIONS & FEEDBACK (PEMBAHASAN ONLY UNLOCKS AFTER SOLVING) */}
              <div className="space-y-4 pt-3 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleShowHint}
                      disabled={isKickingOut}
                      className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs flex items-center space-x-1"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      <span>Petunjuk ({hintLevel}/3)</span>
                    </button>

                    {isQuestionSolved ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowExpl(true);
                          speakText(`Pembahasan untuk ${studentName}: ${currentQ.explanation.join('. ')}`);
                        }}
                        className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs flex items-center space-x-1 shadow"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Dengar Pembahasan</span>
                      </button>
                    ) : (
                      <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 font-semibold text-[11px] flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Pembahasan terbuka setelah dijawab benar</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCheck}
                    disabled={isKickingOut}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow transition flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Periksa Jawaban</span>
                  </button>
                </div>

                {/* Hint Box */}
                {showHint && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 space-y-1">
                    <p className="font-bold">💡 Petunjuk Level {hintLevel}:</p>
                    <p>{currentQ.hints[hintLevel - 1]}</p>
                  </div>
                )}

                {/* Feedback Banner */}
                {feedback !== 'idle' && (
                  <div
                    className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                      feedback === 'correct'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {feedback === 'correct' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 flex-1">
                      <h5 className="font-bold text-xs">
                        {feedback === 'correct'
                          ? 'Benar! Perabotan Gedung Bertambah & Pembahasan Terbuka!'
                          : 'Salah Jawaban — Keluar dari Gedung!'}
                      </h5>
                      <p className="text-xs leading-relaxed">{feedbackMsg}</p>
                    </div>
                  </div>
                )}

                {/* Explanation Box — STRICTLY UNLOCKED ONLY AFTER FINISHING/SOLVING */}
                {isQuestionSolved && showExpl && (
                  <div className="bg-violet-50 border border-violet-200 p-4 rounded-2xl text-xs text-violet-950 space-y-1.5 shadow-sm">
                    <p className="font-extrabold text-violet-900 flex items-center space-x-1.5">
                      <BookOpen className="w-4 h-4 text-violet-600" />
                      <span>Pembahasan Lengkap (Terbuka Setelah Selesai Mengerjakan):</span>
                    </p>
                    {currentQ.explanation.map((st, i) => (
                      <p key={i} className="leading-relaxed">
                        {st}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* DIRECT GOOGLE DRIVE UPLOAD TO TEACHER FOLDER & LEVEL PROGRESSION */}
              <div className="bg-blue-50/80 border-2 border-blue-200 rounded-3xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <UploadCloud className="w-5 h-5 text-blue-600" />
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">
                        Kirim Foto Cara Mengerjakan ke Google Drive Guru (Soal {currentQ.numberInChapter})
                      </h5>
                      <p className="text-[11px] text-slate-700">
                        Ditulis langsung dengan akunmu (<strong className="text-slate-950">{studentEmail || studentName}</strong>) • {studentSchool || 'SMP'} Kelas {studentClass || '-'}
                      </p>
                    </div>
                  </div>

                  {currentUploaded ? (
                    <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {currentUploaded.driveUrl ? 'Terkirim ke Google Drive Guru' : 'Terkirim ke Arsip Web Guru'}
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                        driveReady
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {driveReady ? 'Google Drive Aktif' : 'Akun Drive akan dihubungkan saat Kirim'}
                    </span>
                  )}
                </div>

                {currentUploaded && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 space-y-2 text-xs text-emerald-950">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-bold">Tersimpan rapi:</span> {currentUploaded.fileName}
                        <span className="block text-[11px] text-emerald-800">{currentUploaded.folderPath}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {currentUploaded.driveUrl && (
                          <a
                            href={currentUploaded.driveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Buka di Drive</span>
                          </a>
                        )}
                        {currentUploaded.fileUrl && (
                          <a
                            href={currentUploaded.fileUrl}
                            download={currentUploaded.fileName}
                            className="bg-white border border-emerald-300 text-emerald-800 font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Unduh Bukti</span>
                          </a>
                        )}
                      </div>
                    </div>
                    {currentUploaded.driveWarning && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                        {currentUploaded.driveWarning}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1 text-blue-600" /> Pilih Foto / Scan PDF Cara Pengerjaan (Otomatis dikompres)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      setUploadError('');
                      setSelectedFile(e.target.files?.[0] || null);
                    }}
                    className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-xl p-2 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-bold"
                  />
                  {selectedFile && (
                    <div className="bg-white border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Pratinjau foto pengerjaan"
                            className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{selectedFile.name}</p>
                          <p className="text-[11px] text-emerald-700 font-semibold">
                            Siap dikirim ({Math.max(1, Math.round(selectedFile.size / 1024))} KB)
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearSelectedFile}
                        disabled={isUploading}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shrink-0"
                        title="Hapus pilihan file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800">
                    Catatan Langkah Pengerjaan (Dikirim bersama foto / sebagai teks cara kerja):
                  </label>
                  <textarea
                    rows={2}
                    value={workNotes}
                    onChange={(e) => setWorkNotes(e.target.value)}
                    placeholder="Contoh: Diketahui skala 1:250.000, jarak peta 6 cm -> 6 x 250.000 = 1.500.000 cm = 15 km."
                    className="w-full px-3 py-2 text-xs text-slate-950 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-1.5 text-[11px] text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    File dikirim langsung ke folder Google Drive guru menggunakan akun Google kamu untuk membuka soal & level selanjutnya.
                  </span>
                </div>

                {uploadError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl font-medium space-y-2">
                    <p>{uploadError}</p>
                    {driveBlockedFallback && (
                      <button
                        type="button"
                        onClick={() => executeUpload(false)}
                        disabled={isUploading}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs"
                      >
                        Kirim via Cadangan Web Guru (Tanpa Popup Google Drive)
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => executeUpload(true)}
                    disabled={isUploading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow transition"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UploadCloud className="w-4 h-4" />
                    )}
                    <span>
                      {isUploading
                        ? 'Mengunggah ke Google Drive Guru...'
                        : currentUploaded
                          ? `Kirim Ulang Foto Soal ${currentQ.numberInChapter} ke Drive Guru`
                          : `Kirim Foto Soal ${currentQ.numberInChapter} ke Google Drive Guru`}
                    </span>
                  </button>

                  {isQuestionSolved && currentUploaded && (
                    currentQIndex < cQuestions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQIndex(currentQIndex + 1)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg transition"
                      >
                        <span>Lanjut ke Soal {currentQIndex + 2}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : chapter.id < 11 && onGoToNextChapter ? (
                      <button
                        type="button"
                        onClick={() => onGoToNextChapter(chapter.id + 1)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg transition"
                      >
                        <span>Level Bab {chapter.id} Selesai! Lanjut ke Bab {chapter.id + 1}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onClose}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg transition"
                      >
                        <span>Semua Level Tuntas! Kembali ke Kota 3D</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>

                {isQuestionSolved && !currentUploaded && (
                  <p className="text-[11px] font-bold text-indigo-800 bg-indigo-100/80 border border-indigo-200 px-3 py-2 rounded-xl">
                    Langkah berikutnya: Kirim foto atau catatan cara pengerjaanmu ke Google Drive Guru di atas untuk membuka tombol lanjut ke {currentQIndex < cQuestions.length - 1 ? `Soal ${currentQIndex + 2}` : chapter.id < 11 ? `Bab / Level ${chapter.id + 1}` : 'Kota 3D'}.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-10 text-center space-y-3 bg-slate-50 rounded-3xl border border-slate-200">
              <BookOpen className="w-12 h-12 text-indigo-400 mx-auto animate-pulse" />
              <h4 className="font-bold text-indigo-900 text-base">
                Silakan Simak Video Penjelasan Terlebih Dahulu
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Klik tombol <strong>"Tandai 'Saya Sudah Menonton Video'"</strong> di atas untuk membuka 5 soal latihan dan mengisi perabotan gedung kosong ini.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
