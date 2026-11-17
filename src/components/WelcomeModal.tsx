/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Award, Sparkles, User, Volume2, CheckCircle2, ArrowRight, School, GraduationCap } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';
import { googleSignIn } from '../services/googleDriveService';

interface WelcomeModalProps {
  onLoginSuccess: (name: string, school: string, studentClass: string, email: string) => void;
  speakText: (text: string) => void;
}

export default function WelcomeModal({ onLoginSuccess, speakText }: WelcomeModalProps) {
  const [nameInput, setNameInput] = useState<string>('Maulana Karim');
  const [schoolInput, setSchoolInput] = useState<string>('SMPN 1 Kota');
  const [classInput, setClassInput] = useState<string>('9A');
  const [emailInput, setEmailInput] = useState<string>('maulanakarim9502@gmail.com');
  const [driveConnected, setDriveConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [step, setStep] = useState<'check' | 'ready'>('check');

  const validateFields = () => {
    if (!nameInput.trim() || !schoolInput.trim() || !classInput.trim()) {
      setAuthError('Mohon lengkapi Nama Siswa, Asal Sekolah, dan Kelas terlebih dahulu.');
      return false;
    }
    setAuthError('');
    return true;
  };

  const handleGoogleConnect = async () => {
    if (!validateFields()) return;
    setIsConnecting(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        const gEmail = res.user.email || emailInput;
        setEmailInput(gEmail);
        setDriveConnected(true);
        setStep('ready');
        speakText(
          `Halo ${nameInput} dari kelas ${classInput}, ${schoolInput}! Akun Google ${gEmail} berhasil terhubung otomatis. Apakah kamu sudah siap belajar dan menjelajahi Kota 3D TKA hari ini?`
        );
      }
    } catch {
      setAuthError(
        'Login Google dibatalkan atau terblokir. Kamu tetap bisa lanjut masuk dan menghubungkan akun Google browsermu saat mengirim hasil kerja.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleContinueStandard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;
    setStep('ready');
    speakText(
      `Halo ${nameInput} dari kelas ${classInput}, ${schoolInput}! Apakah kamu sudah siap belajar dan menjelajahi Kota TKA 3D hari ini?`
    );
  };

  const handleConfirmReady = () => {
    speakText(
      `Hebat sekali ${nameInput}! Mari mulai petualangan di Kota TKA 3D, masuk ke gedung bab, isi perabotannya, dan kirim hasil kerjamu ke Google Drive guru!`
    );
    onLoginSuccess(
      nameInput.trim(),
      schoolInput.trim(),
      classInput.trim(),
      emailInput.trim()
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-600 to-violet-500 w-28 h-28 rounded-bl-full opacity-10 flex items-center justify-center">
          <Award className="w-14 h-14 text-indigo-600" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" /> Identitas Siswa & Google Sync
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950">Masuk Petualangan Kota TKA 3D</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Data sekolah, kelas, dan nama siswa digunakan untuk mencatat hasil pengerjaanmu secara rapi per sekolah, kelas, dan bab.
          </p>
        </div>

        {step === 'check' ? (
          <form onSubmit={handleContinueStandard} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 flex items-center">
                <User className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Nama Lengkap / Panggilan Siswa
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Contoh: Maulana Karim"
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
                  placeholder="Contoh: SMPN 1 Jakarta"
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

            {authError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl font-medium">
                {authError}
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <GoogleSignInButton
                onClick={handleGoogleConnect}
                disabled={isConnecting}
                label={
                  isConnecting
                    ? 'Menghubungkan Akun Google...'
                    : 'Sign in with Google (Otomatis Akun Browser)'
                }
              />

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-xl shadow transition flex items-center justify-center space-x-2 text-xs sm:text-sm"
              >
                <span>Lanjut Masuk ke Kota 3D</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5 text-center py-3">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600 border border-indigo-200 shadow-inner">
              <Volume2 className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-950">Halo, {nameInput}!</h3>
              <p className="text-xs font-bold text-indigo-700">
                {schoolInput} • Kelas {classInput} ({emailInput})
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                {driveConnected ? 'Akun Google browsermu berhasil terhubung! ' : ''}
                Voice AI siap memandumu. Apakah kamu sudah siap belajar dan membangun Kota 3D TKA hari ini?
              </p>
            </div>

            <button
              onClick={handleConfirmReady}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 text-sm"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Ya, Saya Sudah Siap Belajar! (Mulai Petualangan)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
