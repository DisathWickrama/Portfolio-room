/**
 * CRT monitor on the desk. The screen is a canvas texture redrawn a few times
 * a second (standby animation), so it can glow and bloom. Clicking it is wired
 * in main.ts to fly the camera in and open the full-screen terminal.
 */
import * as THREE from 'three';
import { box, flat, CONDENSED, type Prop } from '../kit';

export interface Crt extends Prop {
  screen: THREE.Mesh;
  light: THREE.PointLight;
}

function hex(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}

export function buildCrt(): Crt {
  const g = new THREE.Group();
  const shell = flat(0xcdc3a8, { roughness: 0.7 });
  const dark = flat(0x2a2730);
  g.add(box(0.3, 0.04, 0.26, shell, 0, 0.02, -0.02));
  g.add(box(0.56, 0.46, 0.34, shell, 0, 0.29, 0));
  g.add(box(0.42, 0.34, 0.2, shell, 0, 0.29, -0.25));
  g.add(box(0.47, 0.36, 0.02, dark, 0, 0.31, 0.171));
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.01), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
  led.position.set(0.22, 0.09, 0.172);
  g.add(led);

  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = new THREE.MeshBasicMaterial({ map: tex });
  screenMat.color.setScalar(1.5);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.315), screenMat);
  screen.position.set(0, 0.31, 0.183);
  g.add(screen);

  const light = new THREE.PointLight(0xff7a2a, 0.9, 3.2, 2);
  light.position.set(0, 0.32, 0.5);
  g.add(light);

  // keyboard
  const kb = box(0.44, 0.025, 0.15, shell, 0.03, 0.013, 0.42);
  kb.rotation.x = 0.06;
  g.add(kb);
  const keys = box(0.4, 0.012, 0.11, dark, 0.03, 0.03, 0.42);
  keys.rotation.x = 0.06;
  g.add(keys);

  let frame = -1;
  const draw = (f: number) => {
    const w = 320, h = 240;
    ctx.fillStyle = '#0d0503';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#8b3dff';
    ctx.fillRect(0, 0, w, 22);
    ctx.fillStyle = '#0d0503';
    ctx.font = `bold 17px ${CONDENSED}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText('NOCTURNE // COMMAND', 8, 12);
    ctx.textAlign = 'right';
    ctx.fillText('02:00', w - 8, 12);
    // hex cluster
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const on = (f + i) % 3 === 0;
      hex(ctx, 64 + i * 46, 80 + (i % 2) * 26, 26);
      ctx.strokeStyle = '#ff6a13';
      ctx.stroke();
      if (on) { ctx.fillStyle = 'rgba(255,106,19,0.85)'; ctx.fill(); }
    }
    ctx.fillStyle = '#ff6a13';
    ctx.textAlign = 'left';
    ctx.font = `bold 44px ${CONDENSED}`;
    ctx.fillText('STANDBY', 150, 92);
    ctx.font = `bold 15px ${CONDENSED}`;
    ctx.fillStyle = '#c9a2ff';
    ctx.fillText('OPERATOR: DISATH', 152, 124);
    // bars
    for (let i = 0; i < 12; i++) {
      const v = 0.3 + 0.7 * Math.abs(Math.sin(f * 0.7 + i * 1.3));
      ctx.fillStyle = i % 4 === 0 ? '#8b3dff' : '#ff6a13';
      ctx.fillRect(20 + i * 24, 196 - v * 38, 16, v * 38);
    }
    if (f % 2 === 0) {
      ctx.fillStyle = '#ffd9b8';
      ctx.font = `bold 20px ${CONDENSED}`;
      ctx.textAlign = 'center';
      ctx.fillText('> CLICK TO BOOT <', w / 2, 220);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    tex.needsUpdate = true;
  };
  draw(0);

  return {
    group: g,
    screen,
    light,
    update(time) {
      const f = Math.floor(time * 2);
      if (f !== frame) { frame = f; draw(f); }
      light.intensity = 0.8 + Math.sin(time * 13) * 0.04 + (f % 2 === 0 ? 0.12 : 0);
    },
  };
}
