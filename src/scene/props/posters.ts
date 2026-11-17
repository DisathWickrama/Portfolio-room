/**
 * Project posters on the left wall. One poster per entry in
 * data/portfolio.ts; art is painted on a canvas (no image files). Live
 * projects get a painter keyed by project id, 'slot' projects get an
 * "in development" frame.
 */
import * as THREE from 'three';
import { box, flat, canvasTexture, rng, CONDENSED } from '../kit';
import type { Project } from '../../data/portfolio';

type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number, p: Project) => void;

const paintLastShift: Painter = (ctx, w, h) => {
  const r = rng(13);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#060d10');
  sky.addColorStop(0.55, '#14262a');
  sky.addColorStop(1, '#0a1214');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // sick moon behind the fog
  const moon = ctx.createRadialGradient(w * 0.72, h * 0.3, 0, w * 0.72, h * 0.3, 150);
  moon.addColorStop(0, 'rgba(210,230,220,0.55)');
  moon.addColorStop(0.2, 'rgba(160,190,180,0.22)');
  moon.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = moon;
  ctx.fillRect(0, 0, w, h);
  const ground = h * 0.74;
  // treeline
  ctx.fillStyle = '#050a0b';
  for (let x = -10; x < w; x += 16 + r() * 14) {
    const th = 60 + r() * 110;
    ctx.beginPath(); ctx.moveTo(x, ground); ctx.lineTo(x + 13, ground - th); ctx.lineTo(x + 26, ground); ctx.fill();
  }
  // road
  ctx.fillStyle = '#0d1517';
  ctx.fillRect(0, ground, w, h - ground);
  ctx.fillStyle = '#1b2729';
  ctx.beginPath(); ctx.moveTo(w * 0.5, ground); ctx.lineTo(w * 0.62, ground); ctx.lineTo(w * 1.05, h); ctx.lineTo(w * 0.2, h); ctx.fill();
  ctx.fillStyle = '#c9b46a';
  for (let i = 0; i < 5; i++) {
    const t = i / 5, t2 = t + 0.1;
    const y1 = ground + (h - ground) * t * t, y2 = ground + (h - ground) * t2 * t2;
    const x1 = w * 0.56 + t * t * w * 0.07, x2 = w * 0.56 + t2 * t2 * w * 0.07;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + 2 + t * 8, y1); ctx.lineTo(x2 + 3 + t2 * 9, y2); ctx.lineTo(x2, y2); ctx.fill();
  }
  // roadhouse
  const bx = w * 0.1, bw = w * 0.42, by = ground - 86;
  ctx.fillStyle = '#070b0c';
  ctx.fillRect(bx, by, bw, 86);
  ctx.beginPath(); ctx.moveTo(bx - 14, by); ctx.lineTo(bx + bw * 0.5, by - 34); ctx.lineTo(bx + bw + 14, by); ctx.fill();
  ctx.fillRect(bx - 22, by + 26, bw + 60, 7); // awning
  ctx.fillRect(bx + bw + 30, by + 26, 5, 60);
  // lit window + door
  const glowW = ctx.createRadialGradient(bx + 52, by + 58, 0, bx + 52, by + 58, 90);
  glowW.addColorStop(0, 'rgba(255,170,70,0.55)');
  glowW.addColorStop(1, 'rgba(255,170,70,0)');
  ctx.fillStyle = glowW;
  ctx.fillRect(bx - 50, by - 30, 220, 180);
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(bx + 22, by + 42, 62, 32);
  ctx.fillStyle = '#070b0c';
  ctx.fillRect(bx + 52, by + 42, 3, 32);
  ctx.fillRect(bx + 60, by + 50, 9, 24); // someone standing inside
  ctx.beginPath(); ctx.arc(bx + 64.5, by + 48, 5, 0, 7); ctx.fill();
  ctx.fillStyle = '#3a1c10';
  ctx.fillRect(bx + 112, by + 40, 26, 46);
  // sign pole with red neon
  ctx.fillStyle = '#070b0c';
  ctx.fillRect(w * 0.8, ground - 190, 6, 190);
  ctx.fillRect(w * 0.8 - 44, ground - 200, 94, 44);
  const neon = ctx.createRadialGradient(w * 0.8 + 3, ground - 178, 0, w * 0.8 + 3, ground - 178, 110);
  neon.addColorStop(0, 'rgba(255,40,40,0.5)');
  neon.addColorStop(1, 'rgba(255,40,40,0)');
  ctx.fillStyle = neon;
  ctx.fillRect(w * 0.5, ground - 300, w * 0.5, 260);
  ctx.fillStyle = '#ff3b3b';
  ctx.font = `bold 30px ${CONDENSED}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OPEN', w * 0.8 + 3, ground - 177);
  // fog banks
  for (let i = 0; i < 16; i++) {
    const fx = r() * w, fy = ground - 60 + r() * 150, fr = 90 + r() * 130;
    const fog = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
    fog.addColorStop(0, 'rgba(170,195,190,0.2)');
    fog.addColorStop(1, 'rgba(170,195,190,0)');
    ctx.fillStyle = fog;
    ctx.save(); ctx.translate(fx, fy); ctx.scale(1.8, 0.42); ctx.translate(-fx, -fy);
    ctx.fillRect(fx - fr, fy - fr, fr * 2, fr * 2);
    ctx.restore();
  }
  // title
  ctx.fillStyle = '#e9e4d6';
  ctx.font = `bold 108px ${CONDENSED}`;
  ctx.fillText('LAST', w / 2, 86);
  ctx.fillStyle = '#ff3b3b';
  ctx.fillText('SHIFT', w / 2, 180);
  ctx.fillStyle = '#9fb3ae';
  ctx.font = `bold 21px ${CONDENSED}`;
  ctx.fillText('THE FOG CLOCKS IN AT MIDNIGHT', w / 2, 244);
  ctx.fillStyle = '#e9e4d6';
  ctx.fillRect(w / 2 - 92, h - 62, 184, 36);
  ctx.fillStyle = '#0a1214';
  ctx.font = `bold 24px ${CONDENSED}`;
  ctx.fillText('PLAY IT NOW', w / 2, h - 43);
};

const slotPalettes = [
  ['#1a1030', '#8b3dff', '#ff8a3c'],
  ['#0f1e2a', '#4bb3c9', '#f3e9dc'],
  ['#2a1418', '#ff6f91', '#ffd27a'],
];

const paintSlot = (index: number): Painter => (ctx, w, h, p) => {
  const [bg, a, b] = slotPalettes[index % slotPalettes.length];
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = a;
  ctx.lineWidth = 5;
  ctx.setLineDash([22, 14]);
  ctx.strokeRect(26, 26, w - 52, h - 52);
  ctx.setLineDash([]);
  // hazard stripes
  ctx.save();
  ctx.beginPath(); ctx.rect(26, h - 150, w - 52, 44); ctx.clip();
  for (let x = -h; x < w; x += 44) {
    ctx.fillStyle = b;
    ctx.beginPath(); ctx.moveTo(x, h - 106); ctx.lineTo(x + 22, h - 106); ctx.lineTo(x + 66, h - 150); ctx.lineTo(x + 44, h - 150); ctx.fill();
  }
  ctx.restore();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = a;
  ctx.font = `bold 250px ${CONDENSED}`;
  ctx.fillText('?', w / 2, h * 0.4);
  ctx.fillStyle = b;
  ctx.font = `bold 58px ${CONDENSED}`;
  ctx.fillText(p.title.toUpperCase(), w / 2, 84);
  ctx.font = `bold 26px ${CONDENSED}`;
  ctx.fillStyle = '#f3e9dc';
  ctx.fillText('IN DEVELOPMENT', w / 2, h - 70);
};

const painters: Record<string, Painter> = { 'last-shift': paintLastShift };

export interface Poster {
  project: Project;
  mesh: THREE.Group;
}

/** Builds posters facing +x, laid out along z. Caller positions the group on the wall. */
export function buildPosters(projects: Project[]): { group: THREE.Group; posters: Poster[] } {
  const group = new THREE.Group();
  const posters: Poster[] = [];
  const W = 0.78, H = 1.09, GAP = 0.34;
  let slot = 0;
  projects.forEach((p, i) => {
    const painter = painters[p.id] ?? paintSlot(slot++);
    const tex = canvasTexture(400, 560, (ctx, w, h) => painter(ctx, w, h, p));
    const holder = new THREE.Group();
    const art = new THREE.Mesh(new THREE.PlaneGeometry(W, H), flat(0xffffff, { map: tex, roughness: 0.8, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.22 }));
    art.rotation.y = Math.PI / 2;
    art.position.x = 0.022;
    art.receiveShadow = true;
    holder.add(art);
    holder.add(box(0.02, H + 0.06, W + 0.06, flat(0x1c1826), 0.008, 0, 0));
    // tape corners
    for (const [ty, tz] of [[H / 2, W / 2 - 0.08], [H / 2, -W / 2 + 0.08]] as const) {
      holder.add(box(0.004, 0.05, 0.12, flat(0xe6dccb), 0.026, ty, tz));
    }
    const total = projects.length * W + (projects.length - 1) * GAP;
    holder.position.set(0, (i % 2) * 0.07 - 0.03, total / 2 - W / 2 - i * (W + GAP));
    holder.rotation.x = (i % 2 ? 1 : -1) * 0.015;
    group.add(holder);
    posters.push({ project: p, mesh: holder });
  });
  return { group, posters };
}
