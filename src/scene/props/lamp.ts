/**
 * Desk lamp: the warm key light of the room. `setPower` lets day/night dim it.
 */
import * as THREE from 'three';
import { cyl, flat, type Prop } from '../kit';

export interface Lamp extends Prop {
  setPower(p: number): void;
}

export function buildLamp(shadows: boolean): Lamp {
  const g = new THREE.Group();
  const metal = flat(0x3f6f6a, { roughness: 0.5, metalness: 0.3 });
  g.add(cyl(0.11, 0.13, 0.03, metal, 12, 0, 0.015, 0));
  const lower = cyl(0.014, 0.014, 0.42, metal, 6, 0.06, 0.22, 0);
  lower.rotation.z = -0.3;
  g.add(lower);
  const upper = cyl(0.014, 0.014, 0.4, metal, 6, 0.0, 0.52, 0);
  upper.rotation.z = 0.75;
  g.add(upper);
  const head = new THREE.Group();
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.16, 10, 1, true), flat(0x3f6f6a, { side: THREE.DoubleSide, roughness: 0.5, metalness: 0.3 }));
  shade.castShadow = false;
  head.add(shade);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), bulbMat);
  bulb.position.y = -0.05;
  head.add(bulb);
  head.position.set(-0.17, 0.64, 0);
  head.rotation.z = -0.5;
  g.add(head);

  const spot = new THREE.SpotLight(0xffb060, 14, 6, 1.05, 0.7, 1.6);
  spot.position.copy(head.position);
  spot.target.position.set(-0.75, -0.3, 0.45);
  if (shadows) {
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.002;
    spot.shadow.normalBias = 0.02;
  }
  const fill = new THREE.PointLight(0xff9a50, 5, 7, 1.8);
  fill.position.set(-0.25, 0.75, 0.25);
  g.add(spot, spot.target, fill);

  const warm = new THREE.Color(0xffd9a0);
  return {
    group: g,
    setPower(p) {
      spot.intensity = 14 * p;
      fill.intensity = 5 * p;
      bulbMat.color.copy(warm).multiplyScalar(0.35 + p * 2.2);
    },
  };
}
