/**
 * Record player. Purely visual: main.ts calls setPlaying() when the lo-fi
 * engine starts/stops, and the platter spins up while the tonearm swings in.
 */
import * as THREE from 'three';
import { box, cyl, flat, canvasTexture, type Prop } from '../kit';

export interface Vinyl extends Prop {
  setPlaying(on: boolean): void;
}

export function buildVinyl(): Vinyl {
  const g = new THREE.Group();
  g.add(box(0.56, 0.09, 0.44, flat(0x8a5a3c), 0, 0.045, 0));
  g.add(box(0.58, 0.012, 0.46, flat(0x2a2730), 0, 0.094, 0));
  g.add(cyl(0.185, 0.185, 0.02, flat(0x55505f, { metalness: 0.4, roughness: 0.5 }), 24, -0.06, 0.11, 0));

  const label = canvasTexture(256, 256, (ctx, w) => {
    const c = w / 2;
    ctx.fillStyle = '#0c0b10';
    ctx.fillRect(0, 0, w, w);
    for (let r = 122; r > 48; r -= 3) {
      ctx.strokeStyle = r % 9 === 2 ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.04)';
      ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#ff8a3c';
    ctx.beginPath(); ctx.arc(c, c, 44, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8b3dff';
    ctx.beginPath(); ctx.arc(c, c, 44, -0.4, 1.2); ctx.lineTo(c, c); ctx.fill();
    ctx.fillStyle = '#0c0b10';
    ctx.beginPath(); ctx.arc(c, c, 5, 0, Math.PI * 2); ctx.fill();
    // a highlight wedge so rotation is visible
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, 124, 0.2, 0.55); ctx.fill();
    ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, 124, 3.3, 3.65); ctx.fill();
  });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.008, 28), [
    flat(0x0c0b10),
    new THREE.MeshStandardMaterial({ map: label, roughness: 0.45 }),
    flat(0x0c0b10),
  ]);
  disc.position.set(-0.06, 0.125, 0);
  disc.castShadow = true;
  g.add(disc);
  g.add(cyl(0.008, 0.008, 0.03, flat(0xcfcfd6, { metalness: 0.6 }), 6, -0.06, 0.135, 0));

  // tonearm pivots at the back-right corner
  const arm = new THREE.Group();
  arm.position.set(0.21, 0.12, -0.15);
  const metal = flat(0xd6d0c4, { metalness: 0.6, roughness: 0.4 });
  g.add(cyl(0.03, 0.03, 0.05, flat(0x2a2730), 8, 0.21, 0.115, -0.15));
  const stick = box(0.012, 0.012, 0.3, metal, 0, 0.03, 0.14);
  arm.add(stick);
  arm.add(box(0.03, 0.02, 0.05, flat(0x2a2730), 0, 0.022, 0.29));
  arm.add(cyl(0.02, 0.02, 0.04, metal, 6, 0, 0.03, -0.03).rotateX(Math.PI / 2));
  g.add(arm);
  // knobs + pilot light
  g.add(cyl(0.02, 0.02, 0.02, flat(0xd9b27c), 8, 0.22, 0.11, 0.15));
  const pilotMat = new THREE.MeshBasicMaterial({ color: 0x40201a });
  const pilot = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 4), pilotMat);
  pilot.position.set(0.16, 0.104, 0.18);
  g.add(pilot);

  const REST = 0.12, ON = -0.42;
  let playing = false;
  let speed = 0;
  arm.rotation.y = REST;
  return {
    group: g,
    setPlaying(on) {
      playing = on;
      pilotMat.color.set(on ? 0xff7a2a : 0x40201a).multiplyScalar(on ? 2 : 1);
    },
    update(time, dt) {
      const k = 1 - Math.exp(-dt * 2.5);
      speed += ((playing ? 3.49 : 0) - speed) * k;
      disc.rotation.y -= speed * dt;
      const goal = playing ? ON + Math.sin(time * 3.49) * 0.006 : REST;
      arm.rotation.y += (goal - arm.rotation.y) * k;
    },
  };
}
