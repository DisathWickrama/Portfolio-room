/**
 * Generative lo-fi beat. Nothing is sampled: every sound is an oscillator or
 * filtered noise, scheduled a little ahead of time on the AudioContext clock.
 *
 *   sequencer (16th-note steps, swung)
 *     -> keys (soft electric-piano chords), bass, kick, snare, hats, lead
 *     -> bus -> wobbling delay (tape wow) -> low-pass -> soft clip -> volume
 *   plus a looping vinyl-crackle bed while playing.
 *
 * The chord loop is fixed (melancholic major-7th/9th progression); drum ghost
 * notes and the lead melody are random, so it never repeats exactly.
 */
import type { AudioEngine } from './engine';

const BPM = 72;
const S16 = 60 / BPM / 4;
const SWING = 0.3;
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

const BARS: { chord: number[]; bass: number }[] = [
  { chord: [53, 57, 60, 64, 67], bass: 41 }, // Fmaj9
  { chord: [52, 55, 59, 62, 66], bass: 40 }, // Em9
  { chord: [50, 53, 57, 60, 64], bass: 38 }, // Dm9
  { chord: [48, 52, 55, 59, 62], bass: 36 }, // Cmaj9
  { chord: [53, 57, 60, 64, 67], bass: 41 },
  { chord: [52, 55, 59, 62, 66], bass: 40 },
  { chord: [57, 60, 64, 67, 71], bass: 45 }, // Am9
  { chord: [55, 59, 62, 65, 69], bass: 43 }, // G9
];
const LEAD = [69, 72, 74, 76, 79, 81, 84];

export class Lofi {
  playing = false;
  volume = 0.7;
  private built = false;
  private bus!: GainNode;
  private keys!: GainNode;
  private echo!: GainNode;
  private vol!: GainNode;
  private crackle!: GainNode;
  private timer = 0;
  private step = 0;
  private next = 0;
  private lastLead = 3;

  constructor(private engine: AudioEngine) {}

  private build() {
    const c = this.engine.ctx;
    this.bus = c.createGain();
    this.keys = c.createGain();
    const keysLp = c.createBiquadFilter(); keysLp.type = 'lowpass'; keysLp.frequency.value = 1500;
    this.keys.connect(keysLp).connect(this.bus);
    // lead echo
    this.echo = c.createGain();
    const delay = c.createDelay(1); delay.delayTime.value = S16 * 3;
    const fb = c.createGain(); fb.gain.value = 0.38;
    const echoLp = c.createBiquadFilter(); echoLp.type = 'lowpass'; echoLp.frequency.value = 1800;
    this.echo.connect(this.bus);
    this.echo.connect(delay); delay.connect(echoLp).connect(fb).connect(delay); echoLp.connect(this.bus);
    // tape wow: a short delay whose time drifts
    const wow = c.createDelay(0.05); wow.delayTime.value = 0.012;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.31;
    const depth = c.createGain(); depth.gain.value = 0.0014;
    lfo.connect(depth).connect(wow.delayTime); lfo.start();
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3400; lp.Q.value = 0.4;
    const clip = c.createWaveShaper();
    const curve = new Float32Array(257);
    for (let i = 0; i < 257; i++) curve[i] = Math.tanh(((i - 128) / 128) * 1.6);
    clip.curve = curve;
    this.vol = c.createGain(); this.vol.gain.value = this.volume;
    this.bus.connect(wow).connect(lp).connect(clip).connect(this.vol).connect(this.engine.master);
    // vinyl crackle bed
    const n = c.sampleRate * 3;
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    let pop = 0;
    for (let i = 0; i < n; i++) {
      if (Math.random() < 0.00045) pop = (Math.random() * 0.7 + 0.2) * (Math.random() < 0.5 ? -1 : 1);
      d[i] = (Math.random() - 0.5) * 0.018 + pop;
      pop *= 0.82;
    }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    this.crackle = c.createGain(); this.crackle.gain.value = 0;
    src.connect(hp).connect(this.crackle).connect(this.vol);
    src.start();
    this.built = true;
  }

  play() {
    if (this.playing || !this.engine.unlock()) return;
    if (!this.built) this.build();
    const c = this.engine.ctx;
    this.playing = true;
    this.next = c.currentTime + 0.12;
    this.bus.gain.cancelScheduledValues(c.currentTime);
    this.bus.gain.setTargetAtTime(1, c.currentTime, 0.05);
    this.crackle.gain.setTargetAtTime(0.5, c.currentTime, 0.3);
    this.timer = window.setInterval(() => this.schedule(), 40);
    this.schedule();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this.timer);
    const t = this.engine.ctx.currentTime;
    this.bus.gain.setTargetAtTime(0, t, 0.12);
    this.crackle.gain.setTargetAtTime(0, t, 0.2);
  }

  toggle() { if (this.playing) this.pause(); else this.play(); return this.playing; }

  setVolume(v: number) {
    this.volume = v;
    if (this.built) this.vol.gain.setTargetAtTime(v, this.engine.ctx.currentTime, 0.03);
  }

  private schedule() {
    const c = this.engine.ctx;
    while (this.next < c.currentTime + 0.22) {
      const s = this.step % 16;
      this.playStep(Math.floor(this.step / 16) % BARS.length, s, this.next + (s % 2 ? S16 * SWING : 0));
      this.next += S16;
      this.step++;
    }
  }

  private playStep(bar: number, s: number, t: number) {
    const { chord, bass } = BARS[bar];
    if (s === 0) {
      chord.forEach((m, i) => this.key(m, t + i * 0.022, 0.13));
      this.bassNote(bass, t, 0.5, 1.1);
    }
    if (s === 6) chord.slice(1).forEach((m, i) => this.key(m, t + i * 0.015, 0.075, 1.4));
    if (s === 10) this.bassNote(bass + (bar % 2 ? 7 : 0), t, 0.36, 0.7);
    if (s === 14 && Math.random() < 0.4) this.bassNote(bass + 12, t, 0.22, 0.3);
    if (s === 0 || s === 10 || (s === 7 && Math.random() < 0.35)) this.kick(t);
    if (s === 4 || s === 12) this.snare(t);
    if (s % 2 === 0) this.hat(t, s % 4 === 2 ? 0.075 : 0.045, s === 14 && bar % 2 === 1);
    else if (Math.random() < 0.22) this.hat(t, 0.025, false);
    if ((s % 2 === 0 || s === 3 || s === 11) && Math.random() < (bar % 4 === 3 ? 0.42 : 0.24)) this.lead(t);
  }

  private env(g: AudioParam, t: number, peak: number, attack: number, decay: number) {
    g.setValueAtTime(0.0001, t);
    g.linearRampToValueAtTime(peak, t + attack);
    g.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  private tone(type: OscillatorType, freq: number, t: number, peak: number, attack: number, decay: number, out: AudioNode, detune = 0) {
    const c = this.engine.ctx;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const g = c.createGain();
    this.env(g.gain, t, peak, attack, decay);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + attack + decay + 0.05);
    return o;
  }

  private key(midi: number, t: number, vel: number, dur = 2.4) {
    const f = mtof(midi);
    this.tone('sine', f, t, vel, 0.012, dur, this.keys);
    this.tone('triangle', f, t, vel * 0.35, 0.012, dur * 0.6, this.keys, 7);
    this.tone('sine', f * 2, t, vel * 0.12, 0.005, 0.25, this.keys); // tine
  }

  private bassNote(midi: number, t: number, vel: number, dur: number) {
    this.tone('sine', mtof(midi), t, vel, 0.02, dur, this.bus);
    this.tone('triangle', mtof(midi), t, vel * 0.18, 0.02, dur * 0.5, this.bus);
  }

  private kick(t: number) {
    const o = this.tone('sine', 120, t, 0.85, 0.004, 0.3, this.bus);
    o.frequency.setValueAtTime(125, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.11);
    // sidechain-style duck so the chords breathe with the kick
    this.keys.gain.setValueAtTime(0.55, t);
    this.keys.gain.linearRampToValueAtTime(1, t + 0.32);
  }

  private noise(t: number, peak: number, decay: number, type: BiquadFilterType, freq: number, q = 0.8) {
    const c = this.engine.ctx;
    const src = c.createBufferSource();
    src.buffer = this.engine.noiseBuffer();
    const f = c.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    this.env(g.gain, t, peak, 0.002, decay);
    src.connect(f).connect(g).connect(this.bus);
    src.start(t, Math.random() * 1.5);
    src.stop(t + decay + 0.05);
  }

  private snare(t: number) {
    this.noise(t, 0.3, 0.17, 'bandpass', 1900, 0.7);
    this.tone('triangle', 185, t, 0.16, 0.002, 0.09, this.bus);
  }

  private hat(t: number, vel: number, open: boolean) {
    this.noise(t, vel, open ? 0.16 : 0.035, 'highpass', 6800);
  }

  private lead(t: number) {
    // random walk over a pentatonic scale keeps it melodic
    this.lastLead = Math.max(0, Math.min(LEAD.length - 1, this.lastLead + Math.floor(Math.random() * 5) - 2));
    const f = mtof(LEAD[this.lastLead]);
    this.tone('sine', f, t, 0.075, 0.03, 0.7, this.echo);
    this.tone('triangle', f / 2, t, 0.03, 0.03, 0.5, this.echo);
  }
}
