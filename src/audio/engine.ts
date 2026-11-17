/**
 * Shared Web Audio plumbing. One AudioContext for the whole app, created
 * lazily on the first user gesture (browsers block audio before that).
 * lofi.ts and rain.ts both connect into `master`.
 */
export class AudioEngine {
  ctx!: AudioContext;
  master!: GainNode;
  ready = false;
  private noise?: AudioBuffer;

  /** Call from a click/tap handler. Safe to call repeatedly. */
  unlock() {
    if (!this.ready) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return false;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 3;
      this.master.connect(comp).connect(this.ctx.destination);
      this.ready = true;
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) void this.ctx.suspend();
        else void this.ctx.resume();
      });
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return true;
  }

  /** Two seconds of white noise, shared by rain, hats, snares and crackle. */
  noiseBuffer() {
    if (!this.noise) {
      const n = this.ctx.sampleRate * 2;
      this.noise = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.noise;
  }

  /** A short cat purr: low noise, amplitude-modulated at ~25 Hz. */
  purr() {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuffer();
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 170;
    const am = c.createGain();
    const lfo = c.createOscillator();
    lfo.frequency.value = 24;
    const depth = c.createGain();
    depth.gain.value = 0.5;
    am.gain.value = 0.5;
    lfo.connect(depth).connect(am.gain);
    const env = c.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.9, t + 0.25);
    env.gain.linearRampToValueAtTime(0.7, t + 1.2);
    env.gain.linearRampToValueAtTime(0, t + 1.9);
    src.connect(lp).connect(am).connect(env).connect(this.master);
    src.start(t); lfo.start(t);
    src.stop(t + 2); lfo.stop(t + 2);
  }
}
