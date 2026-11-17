/**
 * Ambient rain: looped white noise split into a bright "hiss" band (rain on
 * glass) and a dark "rumble" band (rain on the roof), with a slow LFO so it
 * swells like gusts. Toggle fades in/out.
 */
import type { AudioEngine } from './engine';

export class RainAmbience {
  on = false;
  private gain?: GainNode;

  constructor(private engine: AudioEngine) {}

  private build() {
    const c = this.engine.ctx;
    const src = c.createBufferSource();
    src.buffer = this.engine.noiseBuffer();
    src.loop = true;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1100;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7500;
    const hiss = c.createGain(); hiss.gain.value = 0.085;
    const low = c.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = 420;
    const rumble = c.createGain(); rumble.gain.value = 0.32;
    const swell = c.createGain(); swell.gain.value = 0.85;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07;
    const depth = c.createGain(); depth.gain.value = 0.15;
    lfo.connect(depth).connect(swell.gain);
    this.gain = c.createGain();
    this.gain.gain.value = 0;
    src.connect(hp).connect(lp).connect(hiss).connect(swell);
    src.connect(low).connect(rumble).connect(swell);
    swell.connect(this.gain).connect(this.engine.master);
    src.start(); lfo.start();
  }

  set(on: boolean) {
    if (!this.engine.unlock()) return false;
    if (!this.gain) this.build();
    this.on = on;
    this.gain!.gain.setTargetAtTime(on ? 1 : 0, this.engine.ctx.currentTime, 0.4);
    return on;
  }
  toggle() { return this.set(!this.on); }
}
