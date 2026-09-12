// Web Audio API Synthesizer & Haptic Engine for RS Fashions

class SoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private haptic(pattern: number | number[] = 15) {
    if (typeof window !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  // 1. Mouse Click (Sharp, tactile mechanical switch click)
  playClick() {
    this.haptic(10);
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.03);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // 2. New Notification (Soft ascending notification chime)
  playNotification() {
    this.haptic([30, 50, 40]);
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [587.33, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.08, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.3);
    });
  }

  // 3. Clear Notification (Crisp paper crease / soft crumple flutter)
  playPaperCrease() {
    this.haptic(20);
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Buffer for white noise (paper texture)
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(3, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start(now);
  }

  // 4. Refresh / Sync (Mechanical gun reload: dual metallic click-clack slide)
  playGunReload() {
    this.haptic([20, 40, 60]);
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First metallic click (slide back)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(320, now);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.06);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.06);

    // Second metallic clack lock (slide forward)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(640, now + 0.09);
    osc2.frequency.exponentialRampToValueAtTime(220, now + 0.16);
    gain2.gain.setValueAtTime(0.12, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.16);
  }

  // 5. Logout (Proper warm descending power-down chord chime)
  playLogout() {
    this.haptic([40, 80, 100]);
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [440, 329.63, 220].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + idx * 0.1 + 0.35);

      gain.gain.setValueAtTime(0.09, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.35);
    });
  }
}

export const sound = new SoundEngine();