/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Procedural Web Audio API Peaceful Ambient Music Engine.
 * 100% original & copyright-free — synthesizes warm lo-fi/ambient pads
 * and gentle pentatonic chimes in real time without external audio files.
 */

class AmbientMusicService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private isPlaying = false;
  private schedulerTimer: number | null = null;
  private duckResetTimer: number | null = null;
  private chordStep = 0;
  private chimeStep = 0;

  // Rich idle volume matching the Voice AI guide presence
  private baseVolume = 0.72;

  // Peaceful, dreamy major 7th / 9th chord progression (Hz)
  private readonly chords: number[][] = [
    // Cmaj9 (C3, G3, B3, D4, E4)
    [130.81, 196.0, 246.94, 293.66, 329.63],
    // Am9 (A2, E3, G3, B3, C4)
    [110.0, 164.81, 196.0, 246.94, 261.63],
    // Fmaj7 (F2, C3, E3, A3, C4)
    [87.31, 130.81, 164.81, 220.0, 261.63],
    // G6 (G2, D3, B3, E4)
    [98.0, 146.83, 246.94, 329.63],
  ];

  // Soft C major pentatonic notes for delicate kalimba/bell sparkles
  private readonly chimeNotes: number[] = [
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.0,  // A5
    1046.5, // C6
  ];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0001;

      this.compressorNode = this.ctx.createDynamicsCompressor();
      this.compressorNode.threshold.value = -16;
      this.compressorNode.knee.value = 18;
      this.compressorNode.ratio.value = 4;
      this.compressorNode.attack.value = 0.01;
      this.compressorNode.release.value = 0.2;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 1450;
      this.filterNode.Q.value = 0.65;

      // Soft spacious echo tail
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.value = 0.42;

      this.delayFeedback = this.ctx.createGain();
      this.delayFeedback.gain.value = 0.34;

      this.filterNode.connect(this.masterGain);
      this.filterNode.connect(this.delayNode);
      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.masterGain);

      this.masterGain.connect(this.compressorNode);
      this.compressorNode.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Will resume on next user interaction
      });
    }

    return this.ctx;
  }

  private playWarmPadChord(notes: number[], durationSec: number) {
    if (!this.ctx || !this.filterNode) return;
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.filterNode) return;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx - 2) * 3.5, now);

      const peak = idx === 0 ? 0.18 : 0.115;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peak, now + 1.4);
      noteGain.gain.setValueAtTime(peak * 0.92, now + durationSec - 1.8);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(noteGain);
      noteGain.connect(this.filterNode);

      osc.start(now);
      osc.stop(now + durationSec + 0.15);
    });
  }

  private playSoftChime(freq: number, delaySec: number) {
    if (!this.ctx || !this.filterNode) return;
    const start = this.ctx.currentTime + delaySec;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.085, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.5);

    osc.connect(gain);
    gain.connect(this.filterNode);

    osc.start(start);
    osc.stop(start + 2.6);
  }

  private scheduleBar = () => {
    if (!this.isPlaying) return;
    const chord = this.chords[this.chordStep % this.chords.length];
    this.chordStep++;

    this.playWarmPadChord(chord, 5.4);

    const noteA = this.chimeNotes[(this.chimeStep * 2) % this.chimeNotes.length];
    const noteB = this.chimeNotes[(this.chimeStep * 3 + 2) % this.chimeNotes.length];
    this.chimeStep++;

    this.playSoftChime(noteA, 0.8);
    if (this.chimeStep % 2 === 0) {
      this.playSoftChime(noteB, 2.7);
    }
  };

  public start() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    if (this.isPlaying) {
      this.masterGain.gain.setTargetAtTime(this.baseVolume, ctx.currentTime, 0.35);
      return;
    }

    this.isPlaying = true;
    this.masterGain.gain.setTargetAtTime(this.baseVolume, ctx.currentTime, 0.65);

    this.scheduleBar();
    this.schedulerTimer = window.setInterval(this.scheduleBar, 4800);
  }

  public stop() {
    this.isPlaying = false;
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.duckResetTimer !== null) {
      clearTimeout(this.duckResetTimer);
      this.duckResetTimer = null;
    }
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
    }
  }

  /**
   * Gently lower music a little bit while Voice AI is speaking, then restore smoothly.
   */
  public duckForVoice(isSpeaking: boolean) {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;

    if (this.duckResetTimer !== null) {
      clearTimeout(this.duckResetTimer);
      this.duckResetTimer = null;
    }

    const target = isSpeaking ? this.baseVolume * 0.56 : this.baseVolume;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.22);

    // Safety fallback in case browser speechSynthesis misses onend event
    if (isSpeaking) {
      this.duckResetTimer = window.setTimeout(() => {
        if (this.ctx && this.masterGain && this.isPlaying) {
          this.masterGain.gain.setTargetAtTime(this.baseVolume, this.ctx.currentTime, 0.3);
        }
      }, 9000);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const ambientMusic = new AmbientMusicService();
