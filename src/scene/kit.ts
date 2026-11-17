/**
 * Low-poly construction kit. Every model in the room is assembled from these
 * helpers so the look stays consistent (flat shading, few segments) and no
 * external mesh or texture file is ever needed.
 */
import * as THREE from 'three';

/** A thing in the scene: a group plus an optional per-frame update. */
export interface Prop {
  group: THREE.Group;
  update?(time: number, dt: number): void;
}

export function flat(color: number, opts: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, metalness: 0, ...opts });
}

export function glow(color: number, strength = 1) {
  const m = new THREE.MeshBasicMaterial({ color });
  m.color.multiplyScalar(strength);
  return m;
}

function shadowed<T extends THREE.Mesh>(m: T): T {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
  m.position.set(x, y, z);
  return m;
}

export function cyl(rTop: number, rBot: number, h: number, mat: THREE.Material, segs = 10, x = 0, y = 0, z = 0) {
  const m = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, segs), mat));
  m.position.set(x, y, z);
  return m;
}

export function blob(r: number, mat: THREE.Material, detail = 1) {
  return shadowed(new THREE.Mesh(new THREE.IcosahedronGeometry(r, detail), mat));
}

/** Draw a texture in code. `draw` gets a 2D context sized w x h. */
export function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Small seeded RNG (mulberry32) so procedural art is the same every load. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Soft round sprite texture (steam, markers, glows). */
export function softDot(size = 64, inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  return canvasTexture(size, size, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export const CONDENSED = "Impact, Haettenschweiler, 'Arial Narrow Bold', 'Arial Narrow', sans-serif";
