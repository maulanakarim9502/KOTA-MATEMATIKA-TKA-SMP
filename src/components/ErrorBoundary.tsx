/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Terjadi kesalahan pada aplikasi.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendly = 'Maaf, terjadi gangguan saat memuat layanan.';
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed?.error) {
          friendly = `Gangguan sinkronisasi data (${parsed.operationType || 'database'}): ${parsed.error}`;
        }
      } catch {
        if (this.state.errorMessage) {
          friendly = this.state.errorMessage;
        }
      }

      return (
        <div className="min-h-screen w-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-6 space-y-4 shadow-2xl text-center">
            <h2 className="text-lg font-extrabold text-rose-300">
              Terjadi Gangguan Koneksi Data
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed break-words">
              {friendly}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
