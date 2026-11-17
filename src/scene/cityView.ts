/**
 * What you see through the window: a Sydney skyline painted on a canvas
 * (night and day versions that cross-fade) plus streaks of rain falling
 * between the glass and the city.
 */
import * as THREE from 'three';
import { canvasTexture, rng } from './kit';
import { ROOM } from './room';

function paintSkyline(ctx: CanvasRenderingContext2D, w: number, h: number, night: boolean) {
  const r = rng(2026);
  const horizon = h * 0.74;

  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  if (night) {
    sky.addColorStop(0, '#05061a');
    sky.addColorStop(0.55, '#1b1546');
    sky.addColorStop(0.9, '#5b2c5e');
    sky.addColorStop(1, '#b0603f');
  } else {
    sky.addColorStop(0, '#6f86a8');
    sky.addColorStop(0.6, '#a9b8cc');
    sky.addColorStop(1, '#e6d5c3');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // clouds
  for (let i = 0; i < 26; i++) {
    const cx = r() * w, cy = r() * horizon * 0.7, cr = 60 + r() * 140;
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    cg.addColorStop(0, night ? 'rgba(60,50,110,0.35)' : 'rgba(240,240,248,0.5)');
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cg;
    ctx.fillRect(cx - cr, cy - cr * 0.5, cr * 2, cr);
  }

  const lights = night ? ['#ffd27a', '#ffe9b8', '#ff9d4d', '#9fd8ff', '#ffffff', '#ff6f91'] : ['#d6e2ee', '#c2d0de'];
  const tower = (x: number, bw: number, bh: number, body: string, lit: number) => {
    const y = horizon - bh;
    ctx.fillStyle = body;
    ctx.fillRect(x, y, bw, bh);
    const cell = 6;
    for (let wy = y + 5; wy < horizon - 4; wy += cell) {
      for (let wx = x + 3; wx < x + bw - 4; wx += cell) {
        if (r() < lit) {
          ctx.fillStyle = lights[Math.floor(r() * lights.length)];
          ctx.globalAlpha = night ? 0.55 + r() * 0.45 : 0.5;
          ctx.fillRect(wx, wy, 3, 3);
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  // far layer
  for (let x = -10; x < w; ) {
    const bw = 22 + r() * 40;
    tower(x, bw, h * (0.1 + r() * 0.2), night ? '#1c1a44' : '#8fa0b8', night ? 0.16 : 0.1);
    x += bw + r() * 6;
  }

  // Sydney Tower: slim shaft, golden turret, spire
  const tx = w * 0.53;
  const ttop = h * 0.22;
  ctx.fillStyle = night ? '#141233' : '#74859e';
  ctx.fillRect(tx - 3, ttop + 30, 6, horizon - ttop - 30);
  ctx.fillStyle = night ? '#e0a84a' : '#b8a27a';
  ctx.beginPath();
  ctx.moveTo(tx - 16, ttop + 30); ctx.lineTo(tx + 16, ttop + 30); ctx.lineTo(tx + 11, ttop + 48); ctx.lineTo(tx - 11, ttop + 48);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = night ? '#2a2550' : '#74859e';
  ctx.fillRect(tx - 12, ttop + 20, 24, 10);
  ctx.fillRect(tx - 1, ttop - 28, 2, 48);
  if (night) { ctx.fillStyle = '#ff4d4d'; ctx.fillRect(tx - 2, ttop - 31, 4, 4); }

  // mid layer towers
  for (let x = w * 0.42; x < w; ) {
    const bw = 30 + r() * 46;
    if (Math.abs(x + bw / 2 - tx) > 34) tower(x, bw, h * (0.16 + r() * 0.3), night ? '#0f0e28' : '#62748e', night ? 0.3 : 0.14);
    x += bw + 4 + r() * 16;
  }

  // Harbour Bridge: arch, deck, hangers, pylons
  const bl = w * 0.1, br = w * 0.36, deck = horizon - 26, peak = horizon - 118;
  ctx.strokeStyle = night ? '#0b0a20' : '#4d5d75';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(bl, deck + 6); ctx.quadraticCurveTo((bl + br) / 2, peak * 2 - deck, br, deck + 6); ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(bl, deck + 6); ctx.quadraticCurveTo((bl + br) / 2, peak * 2 - deck + 34, br, deck + 6); ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(bl - 40, deck); ctx.lineTo(br + 40, deck); ctx.stroke();
  ctx.lineWidth = 1;
  for (let i = 1; i < 22; i++) {
    const t = i / 22;
    const x = bl + (br - bl) * t;
    const y = (1 - t) * (1 - t) * (deck + 6) + 2 * (1 - t) * t * (peak * 2 - deck) + t * t * (deck + 6);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, deck); ctx.stroke();
    if (night) { ctx.fillStyle = '#ffe2a0'; ctx.fillRect(x - 1, y - 4, 2.5, 2.5); ctx.fillRect(x - 1, deck - 4, 2, 2); }
  }
  ctx.fillStyle = night ? '#0b0a20' : '#4d5d75';
  for (const px of [bl - 12, br - 6]) ctx.fillRect(px, deck - 34, 18, horizon - deck + 34);

  // Opera House: a row of overlapping shells
  const ox = w * 0.385, oy = horizon;
  const shell = (x: number, sw: number, sh: number, flip: boolean) => {
    ctx.beginPath();
    ctx.moveTo(x, oy);
    ctx.quadraticCurveTo(x + (flip ? sw * 0.9 : sw * 0.1), oy - sh * 0.9, x + (flip ? sw : 0), oy - sh);
    ctx.quadraticCurveTo(x + sw * 0.6, oy - sh * 0.5, x + sw, oy);
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = night ? '#d9cfe6' : '#f6f1ea';
  shell(ox, 34, 44, true); shell(ox + 20, 30, 34, true); shell(ox + 38, 24, 24, true);
  ctx.fillStyle = night ? '#a99cc4' : '#dcd4c8';
  shell(ox + 58, 26, 30, false); shell(ox + 72, 20, 20, false);
  ctx.fillStyle = night ? '#1a1838' : '#7d8799';
  ctx.fillRect(ox - 8, oy - 4, 110, 6);

  // near silhouettes at the edges
  for (const [x0, x1] of [[0, w * 0.08], [w * 0.62, w]] as const) {
    for (let x = x0; x < x1; ) {
      const bw = 44 + r() * 60;
      tower(x, bw, h * (0.2 + r() * 0.34), night ? '#08071a' : '#4f5f78', night ? 0.36 : 0.16);
      x += bw + 6;
    }
  }

  // harbour water with reflections
  const water = ctx.createLinearGradient(0, horizon, 0, h);
  water.addColorStop(0, night ? '#1a1640' : '#8497b0');
  water.addColorStop(1, night ? '#06051a' : '#5f7592');
  ctx.fillStyle = water;
  ctx.fillRect(0, horizon, w, h - horizon);
  for (let i = 0; i < 260; i++) {
    const x = r() * w, len = 10 + r() * 60;
    ctx.fillStyle = night ? lights[Math.floor(r() * lights.length)] : '#ffffff';
    ctx.globalAlpha = night ? 0.08 + r() * 0.25 : 0.12;
    ctx.fillRect(x, horizon + 2 + r() * 14, 2, len);
  }
  ctx.globalAlpha = 1;
  // haze over everything so it sits behind wet glass
  const haze = ctx.createLinearGradient(0, horizon - 150, 0, horizon + 30);
  haze.addColorStop(0, 'rgba(0,0,0,0)');
  haze.addColorStop(1, night ? 'rgba(255,140,90,0.16)' : 'rgba(255,255,255,0.28)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, horizon - 150, w, 180);
}

export interface CityView {
  group: THREE.Group;
  setDay(mix: number): void;
  update(time: number, dt: number): void;
}

export function buildCityView(rainCount: number): CityView {
  const g = new THREE.Group();
  const backZ = -ROOM.d / 2;
  const geo = new THREE.PlaneGeometry(7, 4.4);
  const nightMat = new THREE.MeshBasicMaterial({ map: canvasTexture(1024, 640, (c, w, h) => paintSkyline(c, w, h, true)), fog: false });
  nightMat.color.setScalar(1.25);
  const dayMat = new THREE.MeshBasicMaterial({ map: canvasTexture(1024, 640, (c, w, h) => paintSkyline(c, w, h, false)), transparent: true, opacity: 0 });
  const night = new THREE.Mesh(geo, nightMat);
  night.position.set(0.9, 2.3, backZ - 1.5);
  const day = new THREE.Mesh(geo, dayMat);
  day.position.set(0.9, 2.3, backZ - 1.49);
  // Stencil mask: the skyline and rain only draw where the window opening is,
  // so the backdrop never shows around the outside of the diorama walls.
  const win = ROOM.window;
  const mask = new THREE.Mesh(
    new THREE.PlaneGeometry(win.w, win.h),
    new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp }),
  );
  mask.position.set(win.x, win.y, backZ - 0.1);
  mask.renderOrder = -3;
  night.renderOrder = -2;
  day.renderOrder = -1;
  const clip = (m: THREE.Material) => { m.stencilWrite = true; m.stencilRef = 1; m.stencilFunc = THREE.EqualStencilFunc; };
  clip(nightMat); clip(dayMat);
  g.add(mask, night, day);

  // falling rain: short line segments recycled top to bottom
  const pos = new Float32Array(rainCount * 6);
  const speed = new Float32Array(rainCount);
  const seed = (i: number, y?: number) => {
    const x = -1.6 + Math.random() * 5.2;
    const yy = y ?? 0.3 + Math.random() * 4;
    const z = backZ - 0.25 - Math.random() * 1.0;
    pos.set([x, yy, z, x - 0.02, yy - 0.16, z], i * 6);
    speed[i] = 3.5 + Math.random() * 2.5;
  };
  for (let i = 0; i < rainCount; i++) seed(i);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: 0x9fb6ff, transparent: true, opacity: 0.35 });
  clip(rainMat);
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  g.add(rain);

  return {
    group: g,
    setDay(mix) {
      dayMat.opacity = mix;
      rainMat.color.set(0x9fb6ff).lerp(new THREE.Color(0xffffff), mix);
      rainMat.opacity = 0.35 - mix * 0.1;
    },
    update(_t, dt) {
      for (let i = 0; i < rainCount; i++) {
        const dy = speed[i] * dt;
        pos[i * 6 + 1] -= dy;
        pos[i * 6 + 4] -= dy;
        if (pos[i * 6 + 1] < 0.2) seed(i, 4.4);
      }
      rainGeo.attributes.position.needsUpdate = true;
    },
  };
}
