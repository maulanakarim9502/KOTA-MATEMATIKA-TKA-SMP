/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, Lock } from 'lucide-react';

interface InteriorRoomShowcaseProps {
  chapterTitle: string;
  solvedCount: number; // 0..5
}

const FURNITURE_STAGES = [
  { id: 1, label: 'Karpet & Meja Belajar' },
  { id: 2, label: 'Rak Buku & Tanaman' },
  { id: 3, label: 'Komputer & Papan Tulis' },
  { id: 4, label: 'Sofa Santai & Smart TV' },
  { id: 5, label: 'Lampu Kristal & Trofi Emas' },
];

export default function InteriorRoomShowcase({
  chapterTitle,
  solvedCount,
}: InteriorRoomShowcaseProps) {
  return (
    <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 border border-indigo-500/30 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Tampilan Interior Gedung ({solvedCount}/5 Perabotan Terpasang)
          </span>
          <h4 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
            {solvedCount === 0
              ? `Ruangan ${chapterTitle} Masih Kosong — Jawab Benar untuk Mengisi Perabotan!`
              : solvedCount === 5
              ? `Interior ${chapterTitle} Telah Terisi Penuh & Mewah!`
              : `Mengisi Interior ${chapterTitle} (${solvedCount} dari 5 Bagian Terbangun)`}
          </h4>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-extrabold ${
            solvedCount === 5
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
              : solvedCount === 0
              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
          }`}
        >
          {solvedCount === 0 ? 'Ruangan Kosong' : `${solvedCount * 20}% Terisi`}
        </span>
      </div>

      {/* ARCHITECTURAL PERSPECTIVE INTERIOR SCENE (Starts empty, populates smoothly 1..5) */}
      <div className="relative w-full aspect-[16/7] min-h-[210px] rounded-2xl overflow-hidden border border-slate-700 shadow-inner bg-slate-800">
        <svg viewBox="0 0 800 350" className="w-full h-full block" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="wallBackGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={solvedCount >= 5 ? '#f8fafc' : '#e2e8f0'} />
              <stop offset="100%" stopColor={solvedCount >= 5 ? '#e2e8f0' : '#cbd5e1'} />
            </linearGradient>
            <linearGradient id="wallLeftGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="wallRightGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="floorEmptyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9ca3af" />
              <stop offset="100%" stopColor="#6b7280" />
            </linearGradient>
            <linearGradient id="floorWoodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            <linearGradient id="skyWindowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
            <linearGradient id="sunBeamGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(254, 249, 195, 0.42)" />
              <stop offset="100%" stopColor="rgba(254, 249, 195, 0.0)" />
            </linearGradient>
          </defs>

          {/* Ceiling */}
          <polygon points="0,0 800,0 680,55 120,55" fill="#f1f5f9" />
          {/* Left Side Wall */}
          <polygon points="0,0 120,55 120,245 0,350" fill="url(#wallLeftGrad)" />
          {/* Right Side Wall */}
          <polygon points="800,0 680,55 680,245 800,350" fill="url(#wallRightGrad)" />
          {/* Back Wall */}
          <rect x="120" y="55" width="560" height="190" fill="url(#wallBackGrad)" />

          {/* Floor: Bare concrete when 0/5, warm polished oak planks when >= 1 */}
          <polygon
            points="120,245 680,245 800,350 0,350"
            fill={solvedCount >= 1 ? 'url(#floorWoodGrad)' : 'url(#floorEmptyGrad)'}
          />
          {/* Baseboard trim */}
          <rect x="120" y="238" width="560" height="7" fill="#475569" />
          <polygon points="0,338 120,238 120,245 0,350" fill="#334155" />
          <polygon points="800,338 680,238 680,245 800,350" fill="#334155" />

          {/* Tall Center Architectural Window (Always visible even in empty room!) */}
          <rect x="330" y="78" width="140" height="125" rx="4" fill="#1e293b" />
          <rect x="337" y="85" width="126" height="111" fill="url(#skyWindowGrad)" />
          {/* Clouds visible outside window */}
          <ellipse cx="375" cy="115" rx="22" ry="10" fill="#ffffff" opacity="0.85" />
          <ellipse cx="428" cy="130" rx="26" ry="11" fill="#ffffff" opacity="0.8" />
          {/* Window mullions */}
          <rect x="398" y="85" width="4" height="111" fill="#1e293b" />
          <rect x="337" y="138" width="126" height="4" fill="#1e293b" />
          {/* Sunlight ray onto empty/furnished floor */}
          <polygon points="337,196 463,196 540,350 260,350" fill="url(#sunBeamGrad)" />

          {/* Empty room echo mark if 0/5 */}
          {solvedCount === 0 && (
            <g opacity="0.55">
              <rect x="295" y="268" width="210" height="32" rx="16" fill="#1e293b" />
              <text
                x="400"
                y="289"
                fill="#f8fafc"
                fontSize="13"
                fontWeight="bold"
                textAnchor="middle"
              >
                GEDUNG KOSONG (BELUM ADA PERABOTAN)
              </text>
            </g>
          )}

          {/* === ITEM 1: Karpet + Meja Belajar Kayu + Kursi === */}
          <AnimatePresence>
            {solvedCount >= 1 && (
              <motion.g
                initial={{ opacity: 0, y: -25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                {/* Woven Rug */}
                <polygon points="270,270 530,270 580,335 220,335" fill="#3b82f6" opacity="0.85" />
                <polygon points="282,276 518,276 562,328 238,328" fill="#60a5fa" opacity="0.65" />
                {/* Study Desk */}
                <rect x="325" y="220" width="150" height="12" rx="3" fill="#78350f" />
                <rect x="335" y="232" width="10" height="48" fill="#451a03" />
                <rect x="455" y="232" width="10" height="48" fill="#451a03" />
                {/* Desk Lamp & Open Book */}
                <rect x="342" y="205" width="24" height="15" fill="#fef08a" rx="2" />
                <line x1="452" y1="220" x2="452" y2="195" stroke="#1e293b" strokeWidth="4" />
                <polygon points="440,195 464,195 458,184 446,184" fill="#f59e0b" />
                {/* Ergonomic Chair */}
                <rect x="382" y="242" width="36" height="10" rx="4" fill="#1e293b" />
                <rect x="386" y="214" width="28" height="28" rx="6" fill="#2563eb" />
                <rect x="397" y="252" width="6" height="26" fill="#334155" />
                <rect x="382" y="276" width="36" height="5" rx="2" fill="#0f172a" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* === ITEM 2: Rak Buku Matematika + Tanaman Hias (Sisi Kiri) === */}
          <AnimatePresence>
            {solvedCount >= 2 && (
              <motion.g
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45 }}
              >
                {/* Tall Wooden Bookcase */}
                <rect x="138" y="95" width="96" height="152" rx="3" fill="#78350f" />
                <rect x="145" y="103" width="82" height="32" fill="#451a03" />
                <rect x="145" y="142" width="82" height="32" fill="#451a03" />
                <rect x="145" y="181" width="82" height="32" fill="#451a03" />
                <rect x="145" y="220" width="82" height="22" fill="#451a03" />
                {/* Colorful Math Books */}
                {[
                  { x: 150, c: '#ef4444' },
                  { x: 162, c: '#3b82f6' },
                  { x: 174, c: '#10b981' },
                  { x: 190, c: '#f59e0b' },
                  { x: 204, c: '#8b5cf6' },
                ].map((b, idx) => (
                  <g key={idx}>
                    <rect x={b.x} y="109" width="9" height="26" fill={b.c} rx="1" />
                    <rect x={b.x + 2} y="148" width="9" height="26" fill={b.c} rx="1" />
                    <rect x={b.x - 1} y="187" width="9" height="26" fill={b.c} rx="1" />
                  </g>
                ))}
                {/* Potted Plant */}
                <polygon points="244,230 274,230 268,262 250,262" fill="#b45309" />
                <circle cx="259" cy="212" r="18" fill="#16a34a" />
                <circle cx="247" cy="220" r="12" fill="#22c55e" />
                <circle cx="271" cy="220" r="12" fill="#15803d" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* === ITEM 3: Meja Komputer Riset & Papan Tulis Rumus (Sisi Kanan) === */}
          <AnimatePresence>
            {solvedCount >= 3 && (
              <motion.g
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45 }}
              >
                {/* Wall Whiteboard with Math Formulas */}
                <rect x="520" y="82" width="138" height="82" rx="4" fill="#ffffff" stroke="#334155" strokeWidth="5" />
                <text x="540" y="108" fill="#2563eb" fontSize="14" fontWeight="bold">
                  a² + b² = c²
                </text>
                <text x="540" y="128" fill="#16a34a" fontSize="13" fontWeight="bold">
                  f(x) = mx + c
                </text>
                <text x="540" y="148" fill="#dc2626" fontSize="12" fontWeight="bold">
                  V = π × r² × t
                </text>
                {/* Computer Desk & Dual Monitor */}
                <rect x="515" y="218" width="145" height="11" fill="#1e293b" />
                <rect x="525" y="229" width="10" height="45" fill="#0f172a" />
                <rect x="640" y="229" width="10" height="45" fill="#0f172a" />
                <rect x="536" y="176" width="54" height="36" rx="3" fill="#0f172a" />
                <rect x="540" y="180" width="46" height="28" fill="#38bdf8" />
                <rect x="596" y="176" width="54" height="36" rx="3" fill="#0f172a" />
                <rect x="600" y="180" width="46" height="28" fill="#818cf8" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* === ITEM 4: Sofa Santai Empuk & Smart TV (Area Depan Kiri) === */}
          <AnimatePresence>
            {solvedCount >= 4 && (
              <motion.g
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45 }}
              >
                {/* Modern Lounge Sofa */}
                <rect x="52" y="246" width="136" height="44" rx="10" fill="#4f46e5" />
                <rect x="44" y="262" width="22" height="38" rx="6" fill="#4338ca" />
                <rect x="174" y="262" width="22" height="38" rx="6" fill="#4338ca" />
                <rect x="62" y="276" width="116" height="26" rx="6" fill="#6366f1" />
                {/* Cushions */}
                <rect x="74" y="256" width="24" height="20" rx="5" fill="#facc15" />
                <rect x="142" y="256" width="24" height="20" rx="5" fill="#f43f5e" />
                {/* Coffee Table */}
                <ellipse cx="145" cy="316" rx="48" ry="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* === ITEM 5: Lampu Gantung Kristal, AC & Lemari Trofi Emas === */}
          <AnimatePresence>
            {solvedCount >= 5 && (
              <motion.g
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Crystal Chandelier */}
                <line x1="400" y1="0" x2="400" y2="34" stroke="#f59e0b" strokeWidth="4" />
                <ellipse cx="400" cy="40" rx="46" ry="10" fill="#fef08a" stroke="#f59e0b" strokeWidth="2" />
                {[-30, -15, 0, 15, 30].map((ox, idx) => (
                  <circle key={idx} cx={400 + ox} cy="48" r="5" fill="#fde047" />
                ))}
                {/* Wall AC */}
                <rect x="165" y="64" width="110" height="24" rx="6" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
                <line x1="175" y1="81" x2="265" y2="81" stroke="#38bdf8" strokeWidth="2" />
                {/* Golden Trophy Pedestal (Front Right) */}
                <rect x="635" y="264" width="54" height="58" rx="4" fill="#1e293b" stroke="#facc15" strokeWidth="2" />
                <polygon points="650,235 674,235 668,255 656,255" fill="#facc15" />
                <rect x="659" y="255" width="6" height="9" fill="#eab308" />
                <circle cx="662" cy="233" r="6" fill="#fef08a" />
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </div>

      {/* 5 FURNITURE PROGRESS CHIPS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {FURNITURE_STAGES.map((stage) => {
          const unlocked = solvedCount >= stage.id;
          return (
            <div
              key={stage.id}
              className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold flex items-center space-x-1.5 transition ${
                unlocked
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}
            >
              {unlocked ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <span className="truncate">{stage.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
