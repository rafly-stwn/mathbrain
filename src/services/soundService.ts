import { useGameStore } from '../stores/gameStore';

/**
 * Lightweight, high-performance Web Audio API Sound Synthesizer.
 * Zero external audio files required, zero network latency, 100% offline.
 */
class SoundService {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  private isEnabled(): boolean {
    return useGameStore.getState().settings.soundEnabled;
  }

  /**
   * Crisp, soft UI button click / tap.
   */
  playClick() {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio context error fallback
    }
  }

  /**
   * Satisfying wooden/plastic tile placement snap on board.
   */
  playTilePlace() {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Body oscillator (thud)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.07);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      // Filter for warm tactile feel
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);

      // Subtle click overlay for snap feel
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'sine';
      click.frequency.setValueAtTime(1200, now);
      click.frequency.exponentialRampToValueAtTime(400, now + 0.02);

      clickGain.gain.setValueAtTime(0.1, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      click.connect(clickGain);
      clickGain.connect(ctx.destination);

      click.start(now);
      click.stop(now + 0.02);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Upward light pop when taking back / recalling a tile or undoing.
   */
  playTileRecall() {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.06);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Somber, mellow descending two-tone cue when surrendering / forfeit.
   */
  playSurrender() {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      // First tone (400Hz) then second tone (280Hz)
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(400, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.35);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0.2, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Sparkling uplifting chime for correct answer / equation validated.
   */
  playCorrect() {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.06 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.18);
      });
    } catch {
      // Audio fallback
    }
  }

  /**
   * Soft, non-jarring low thud for incorrect answer or invalid equation.
   */
  playWrong() {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.16);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Swift shuffling chime/swoosh for tile exchange.
   */
  playExchange() {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const clicks = [440, 520, 660];
      clicks.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        gain.gain.setValueAtTime(0.12, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.05);
      });
    } catch {
      // Audio fallback
    }
  }

  /**
   * Subtle tick for passing a turn.
   */
  playPass() {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.05);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Joyful victory / celebration fanfare for winning or completing puzzle.
   */
  playWin() {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const fanfare = [
        { freq: 523.25, time: 0, dur: 0.12 },     // C5
        { freq: 659.25, time: 0.12, dur: 0.12 },  // E5
        { freq: 783.99, time: 0.24, dur: 0.12 },  // G5
        { freq: 1046.5, time: 0.36, dur: 0.35 },  // C6 (held)
      ];
      const now = ctx.currentTime;

      fanfare.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.linearRampToValueAtTime(0.2, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch {
      // Audio fallback
    }
  }

  /**
   * Countdown beat tick (3, 2, 1).
   */
  playCountdown(isFinal: boolean = false) {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinal ? 1200 : 700, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Playful cartoon pop / boing for interactive stickers.
   */
  playStickerPop() {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio fallback
    }
  }
}

export const soundService = new SoundService();
