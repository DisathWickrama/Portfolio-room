/**
 * Mug with rising steam. Steam is a handful of soft sprites that drift up,
 * widen and fade, then loop.
 */
import * as THREE from 'three';
import { cyl, flat, softDot, type Prop } from '../kit';

export function buildMug(): Prop {
  const g = new THREE.Group();
  const body = flat(0xe9e1d6, { roughness: 0.6 });
  g.add(cyl(0.05, 0.043, 0.1, body, 10, 0, 0.05, 0));
  const coffee = cyl(0.043, 0.043, 0.005, flat(0x3b2219), 10, 0, 0.096, 0);
  coffee.castShadow = false;
  g.add(coffee);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.009, 5, 8, Math.PI), body);
  handle.position.set(0.05, 0.05, 0);
  handle.rotation.z = -Math.PI / 2;
  g.add(handle);
  const band = cyl(0.051, 0.049, 0.02, flat(0xff8a3c), 10, 0, 0.045, 0);
  g.add(band);

  const tex = softDot(64, 'rgba(255,255,255,0.9)');
  const puffs: { s: THREE.Sprite; off: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
    g.add(s);
    puffs.push({ s, off: i / 7 });
  }
  return {
    group: g,
    update(time) {
      for (const p of puffs) {
        const t = (time * 0.22 + p.off) % 1;
        p.s.position.set(Math.sin(time * 0.9 + p.off * 20) * 0.025 * (0.4 + t), 0.11 + t * 0.34, Math.cos(time * 0.7 + p.off * 13) * 0.02);
        const sc = 0.035 + t * 0.09;
        p.s.scale.set(sc, sc * 1.4, 1);
        p.s.material.opacity = Math.sin(t * Math.PI) * 0.22;
      }
    },
  };
}
