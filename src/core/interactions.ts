/**
 * Hotspots: things in the scene you can hover and click/tap.
 *
 * main.ts registers an object + label + callback. This module raycasts from
 * the pointer, shows a tooltip and a soft highlight on hover, and fires the
 * callback on click. Each hotspot also gets a small pulsing marker so the
 * interactive objects are discoverable without hovering (important on touch).
 */
import * as THREE from 'three';
import { softDot } from '../scene/kit';

export interface Hotspot {
  id: string;
  label: string;
  object: THREE.Object3D;
  onClick: () => void;
  /** Local-space offset for the pulsing marker. */
  markerOffset?: THREE.Vector3;
}

interface Entry extends Hotspot {
  marker: THREE.Sprite;
  mats: { m: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial; base: THREE.Color; basic: boolean }[];
}

export class Interactions {
  /** Pointer in normalised device coords, smoothed elsewhere for parallax. */
  readonly pointer = new THREE.Vector2();
  enabled = true;
  markersVisible = true;
  private entries: Entry[] = [];
  private ray = new THREE.Raycaster();
  private hovered: Entry | null = null;
  private down = new THREE.Vector2();
  private markerTex = softDot(64, 'rgba(255,190,120,1)', 'rgba(255,120,40,0)');
  private markerFade = 1;

  constructor(private camera: THREE.Camera, private dom: HTMLElement, private tooltip: HTMLElement, private scene: THREE.Scene) {
    dom.addEventListener('pointermove', (e) => this.onMove(e));
    dom.addEventListener('pointerdown', (e) => this.down.set(e.clientX, e.clientY));
    dom.addEventListener('pointerup', (e) => this.onUp(e));
    dom.addEventListener('pointerleave', () => this.setHover(null));
  }

  add(h: Hotspot) {
    const mats: Entry['mats'] = [];
    h.object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if (m instanceof THREE.MeshStandardMaterial) mats.push({ m, base: m.emissive.clone(), basic: false });
      }
    });
    const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.markerTex, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    marker.renderOrder = 10;
    h.object.updateWorldMatrix(true, false);
    marker.position.copy(h.markerOffset ?? new THREE.Vector3()).applyMatrix4(h.object.matrixWorld);
    this.scene.add(marker);
    this.entries.push({ ...h, marker, mats });
  }

  private find(e: PointerEvent): Entry | null {
    const r = this.dom.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    if (!this.enabled) return null;
    this.ray.setFromCamera(this.pointer, this.camera);
    let best: Entry | null = null;
    let bestD = Infinity;
    for (const en of this.entries) {
      const hit = this.ray.intersectObject(en.object, true)[0];
      if (hit && hit.distance < bestD) { best = en; bestD = hit.distance; }
    }
    return best;
  }

  private onMove(e: PointerEvent) {
    const en = this.find(e);
    if (e.pointerType !== 'touch') {
      this.setHover(en);
      this.tooltip.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 14}px)`;
    }
  }

  private onUp(e: PointerEvent) {
    if (Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 10) return;
    const en = this.find(e);
    if (en) { this.setHover(null); en.onClick(); }
  }

  private setHover(en: Entry | null) {
    if (en === this.hovered) return;
    if (this.hovered) for (const x of this.hovered.mats) (x.m as THREE.MeshStandardMaterial).emissive.copy(x.base);
    this.hovered = en;
    if (en) for (const x of en.mats) (x.m as THREE.MeshStandardMaterial).emissive.copy(x.base).add(new THREE.Color(0x3a1c08));
    this.dom.style.cursor = en ? 'pointer' : '';
    this.tooltip.textContent = en ? en.label : '';
    this.tooltip.classList.toggle('show', !!en);
  }

  update(time: number, dt: number) {
    const goal = this.enabled && this.markersVisible ? 1 : 0;
    this.markerFade += (goal - this.markerFade) * (1 - Math.exp(-dt * 5));
    if (!this.enabled && this.hovered) this.setHover(null);
    this.entries.forEach((en, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 + i * 1.7);
      const d = en.marker.position.distanceTo(this.camera.position);
      const s = (0.02 + pulse * 0.012) * d;
      en.marker.scale.set(s, s, 1);
      en.marker.material.opacity = (0.35 + pulse * 0.45) * this.markerFade;
    });
  }
}
