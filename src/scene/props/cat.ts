/**
 * Sleeping cat, curled up on the bed. Breathes slowly; little "z"s float up.
 */
import * as THREE from 'three';
import { blob, flat, canvasTexture, CONDENSED, type Prop } from '../kit';

export function buildCat(): Prop {
  const g = new THREE.Group();
  const fur = flat(0xd08a45);
  const cream = flat(0xf0d9b5);
  const body = blob(0.2, fur);
  body.scale.set(1.25, 0.6, 1.0);
  body.position.y = 0.11;
  g.add(body);
  const haunch = blob(0.13, fur);
  haunch.scale.set(1, 0.8, 1);
  haunch.position.set(-0.13, 0.11, 0.08);
  g.add(haunch);
  const head = blob(0.1, fur);
  head.scale.set(1, 0.85, 1);
  head.position.set(0.19, 0.09, 0.12);
  g.add(head);
  const muzzle = blob(0.045, cream);
  muzzle.position.set(0.23, 0.065, 0.19);
  g.add(muzzle);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 4), fur);
    ear.position.set(0.19 + s * 0.05, 0.175, 0.11 - s * 0.03);
    ear.rotation.z = -s * 0.25;
    ear.castShadow = true;
    g.add(ear);
  }
  // tail wraps round the front
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.032, 5, 12, Math.PI * 1.05), fur);
  tail.rotation.x = Math.PI / 2;
  tail.rotation.z = Math.PI * 0.95;
  tail.position.set(0.0, 0.035, 0.02);
  tail.castShadow = true;
  g.add(tail);
  // stripes
  const stripe = flat(0xa9652c);
  for (let i = 0; i < 3; i++) {
    const s = blob(0.05, stripe, 0);
    s.scale.set(0.35, 0.3, 2.6);
    s.position.set(-0.1 + i * 0.1, 0.215, 0);
    g.add(s);
  }

  const zTex = canvasTexture(64, 64, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 52px ${CONDENSED}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('z', 32, 30);
  });
  const zs: THREE.Sprite[] = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true, depthWrite: false, opacity: 0, color: 0xd8ccff }));
    g.add(s);
    zs.push(s);
  }

  return {
    group: g,
    update(time) {
      const breath = Math.sin(time * 1.3);
      body.scale.y = 0.6 + breath * 0.025;
      body.scale.x = 1.25 + breath * 0.012;
      zs.forEach((s, i) => {
        const t = (time * 0.25 + i / 3) % 1;
        s.position.set(0.25 + t * 0.18 + Math.sin(t * 9) * 0.02, 0.25 + t * 0.4, 0.1);
        const sc = 0.05 + t * 0.07;
        s.scale.set(sc, sc, 1);
        s.material.opacity = Math.sin(t * Math.PI) * 0.8;
      });
    },
  };
}
