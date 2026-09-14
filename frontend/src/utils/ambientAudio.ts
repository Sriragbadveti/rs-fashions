// Ambient cinematic sound generator for RS Fashions "Our Story" page
// Generates a warm, meditative cinematic drone with gentle harmonics mimicking traditional resonance

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }

  public start() {
    try {
      this.init();
      if (!this.ctx) return;

      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      // Master gain for smooth fade-in
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.28, this.ctx.currentTime + 2.5);
      this.masterGain.connect(this.ctx.destination);

      // Low pass filter for warm, soothing vintage texture
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.setValueAtTime(420, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(2.5, this.ctx.currentTime);
      this.filter.connect(this.masterGain);

      // Warm chord notes (Root D2 = 73.4Hz, Fifth A2 = 110Hz, Octave D3 = 146.8Hz, Harmonic F#3 = 185Hz)
      const frequencies = [73.42, 110.0, 146.83, 185.0, 220.0];
      this.oscillators = [];

      frequencies.forEach((freq, idx) => {
        if (!this.ctx || !this.filter) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // Gentle detune for rich choral analog warmth
        const detuneAmount = (idx - 2) * 3.5;
        osc.detune.setValueAtTime(detuneAmount, this.ctx.currentTime);

        // Relative gain based on frequency
        const gainVal = 0.25 / (idx + 1);
        oscGain.gain.setValueAtTime(gainVal, this.ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(this.filter);
        osc.start();
        this.oscillators.push(osc);
      });

      // Subtle LFO modulation to simulate organic breathing / loom rhythm
      this.lfo = this.ctx.createOscillator();
      this.lfoGain = this.ctx.createGain();
      this.lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime); // ~5.5 second breath cycle
      this.lfoGain.gain.setValueAtTime(90, this.ctx.currentTime); // filter sweep

      this.lfo.connect(this.lfoGain);
      if (this.filter) {
        this.lfoGain.connect(this.filter.frequency);
      }
      this.lfo.start();

      this.isPlaying = true;
    } catch (e) {
      console.warn("Ambient audio context error:", e);
    }
  }

  public stop() {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;

    try {
      // Smooth fade out over 1.2 seconds
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);

      setTimeout(() => {
        this.oscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
        this.oscillators = [];

        if (this.lfo) {
          try {
            this.lfo.stop();
            this.lfo.disconnect();
          } catch {}
          this.lfo = null;
        }

        this.isPlaying = false;
      }, 1300);
    } catch (e) {
      console.warn("Ambient audio stop error:", e);
      this.isPlaying = false;
    }
  }
}

export const ambientSound = new AmbientSoundEngine();
