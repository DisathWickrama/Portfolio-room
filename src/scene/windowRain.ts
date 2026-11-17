/**
 * Rain on the window glass. One transparent quad with a small procedural
 * shader: several layers of droplets slide down in columns, each leaving a
 * fading trail, plus a few static beads. Additive, so drops catch the city
 * lights behind them.
 */
import * as THREE from 'three';
import { ROOM } from './room';

const frag = /* glsl */ `
uniform float uTime;
uniform float uAmount;
uniform vec3 uTint;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float layer(vec2 uv, float cols, float speed, float seed) {
  uv.x *= cols;
  float col = floor(uv.x);
  float n = hash(vec2(col, seed));
  uv.y = uv.y * (2.0 + n * 2.0) + uTime * speed * (0.35 + n * 0.9) + n * 31.0;
  float row = floor(uv.y);
  vec2 f = vec2(fract(uv.x), fract(uv.y));
  float n2 = hash(vec2(col + seed, row));
  if (n2 > 0.55 * uAmount + 0.1) return 0.0;
  float cx = 0.5 + (n2 - 0.3) * 0.9 + sin(uv.y * 6.0 + n * 6.28) * 0.06;
  float dx = abs(f.x - cx);
  // head near the bottom of the cell (pattern scrolls down), trail above it
  float head = smoothstep(0.16, 0.0, length(vec2(dx, (f.y - 0.12) * 0.35)));
  float trail = smoothstep(0.07, 0.0, dx) * smoothstep(0.12, 0.2, f.y) * pow(1.0 - f.y, 1.6);
  return head + trail * 0.45;
}

void main() {
  vec2 uv = vUv * vec2(${(ROOM.window.w / ROOM.window.h).toFixed(3)}, 1.0);
  float d = layer(uv, 22.0, 0.55, 1.0) + layer(uv + 0.37, 34.0, 0.8, 5.0) * 0.7 + layer(uv + 0.11, 13.0, 0.3, 9.0);
  // static beads
  vec2 b = uv * 46.0;
  vec2 bi = floor(b);
  float bn = hash(bi);
  float bead = smoothstep(0.28, 0.0, length(fract(b) - 0.5 - (vec2(hash(bi + 1.7), hash(bi + 9.1)) - 0.5) * 0.5)) * step(0.78, bn);
  d += bead * 0.5 * uAmount;
  float fogged = 0.05 + 0.04 * hash(floor(vUv * 300.0));
  vec3 col = uTint * (d * 0.6 + fogged);
  gl_FragColor = vec4(col, 1.0);
}`;

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export function buildWindowRain() {
  const win = ROOM.window;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAmount: { value: 1 },
      uTint: { value: new THREE.Color(0.55, 0.65, 1.0) },
    },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(win.w, win.h), mat);
  mesh.position.set(win.x, win.y, -ROOM.d / 2 - 0.1);
  const night = new THREE.Color(0.55, 0.65, 1.0);
  const day = new THREE.Color(0.75, 0.78, 0.82);
  return {
    mesh,
    update(time: number) { mat.uniforms.uTime.value = time; },
    setDay(mix: number) { (mat.uniforms.uTint.value as THREE.Color).copy(night).lerp(day, mix); },
  };
}
