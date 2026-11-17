/**
 * Lighting rig and the day/night blend.
 *
 * Owns the lights that are not attached to a prop (sky fill + the light coming
 * through the window) and a single `mix` value: 0 = 2am, 1 = rainy morning.
 * main.ts reads `mix` every frame and forwards it to anything else that cares
 * (skyline, lamp, string lights, bloom), so this file stays the one source of
 * truth for "what time is it".
 */
import * as THREE from 'three';
import { ROOM } from './room';

const NIGHT = { bg: 0x0b0a14, sky: 0x4a4f9c, ground: 0x241a2e, hemi: 1.15, win: 0x6f8cff, winI: 1.2, exposure: 1.15 };
const DAY = { bg: 0x8794ad, sky: 0xdfe6ff, ground: 0x8a7468, hemi: 2.1, win: 0xfff1dc, winI: 3.2, exposure: 1.0 };

export class DayNight {
  mix = 0;
  target = 0;
  readonly hemi = new THREE.HemisphereLight(NIGHT.sky, NIGHT.ground, NIGHT.hemi);
  readonly windowLight = new THREE.DirectionalLight(NIGHT.win, NIGHT.winI);
  private a = new THREE.Color();
  private b = new THREE.Color();

  constructor(private scene: THREE.Scene, private renderer: THREE.WebGLRenderer, shadows: boolean) {
    scene.background = new THREE.Color(NIGHT.bg);
    // comes from outside, through the window opening (walls cast the shadow)
    this.windowLight.position.set(ROOM.window.x + 1.2, 5.2, -ROOM.d / 2 - 4.5);
    this.windowLight.target.position.set(ROOM.window.x - 0.4, 0.2, 0.6);
    if (shadows) {
      this.windowLight.castShadow = true;
      const s = this.windowLight.shadow;
      s.mapSize.set(1024, 1024);
      s.camera.left = -5; s.camera.right = 5; s.camera.top = 5; s.camera.bottom = -5;
      s.camera.near = 0.5; s.camera.far = 16;
      s.bias = -0.0015;
      s.normalBias = 0.03;
    }
    scene.add(this.hemi, this.windowLight, this.windowLight.target);
    this.apply();
  }

  get isDay() { return this.target > 0.5; }
  toggle() { this.target = this.isDay ? 0 : 1; return this.isDay; }

  /** Ease mix toward target. Returns true while it is still changing. */
  update(dt: number) {
    if (this.mix === this.target) return false;
    const step = dt / 1.6;
    this.mix = this.target > this.mix ? Math.min(this.target, this.mix + step) : Math.max(this.target, this.mix - step);
    this.apply();
    return true;
  }

  private lerpColor(n: number, d: number) {
    return this.a.set(n).lerp(this.b.set(d), this.mix);
  }

  private apply() {
    const m = this.mix;
    (this.scene.background as THREE.Color).copy(this.lerpColor(NIGHT.bg, DAY.bg));
    this.hemi.color.copy(this.lerpColor(NIGHT.sky, DAY.sky));
    this.hemi.groundColor.copy(this.lerpColor(NIGHT.ground, DAY.ground));
    this.hemi.intensity = THREE.MathUtils.lerp(NIGHT.hemi, DAY.hemi, m);
    this.windowLight.color.copy(this.lerpColor(NIGHT.win, DAY.win));
    this.windowLight.intensity = THREE.MathUtils.lerp(NIGHT.winI, DAY.winI, m);
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(NIGHT.exposure, DAY.exposure, m);
  }
}
