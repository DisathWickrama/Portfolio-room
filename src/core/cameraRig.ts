/**
 * Camera rig. The camera is never moved directly: callers hand the rig a
 * View (where to stand, what to look at) and it tweens there with an
 * ease-in-out curve. On top of the tween it adds a small pointer parallax so
 * the room feels alive while idle.
 */
import * as THREE from 'three';

export interface View {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class CameraRig {
  home: View;
  private from: View;
  private to: View;
  private pos = new THREE.Vector3();
  private look = new THREE.Vector3();
  private t = 1;
  private duration = 1.4;
  private onArrive?: () => void;
  private sway = new THREE.Vector2();
  private parallax = 1;
  private parallaxGoal = 1;
  private tmp = new THREE.Vector3();
  private right = new THREE.Vector3();

  constructor(readonly camera: THREE.PerspectiveCamera, home: View) {
    this.home = home;
    this.from = { position: home.position.clone(), target: home.target.clone() };
    this.to = { position: home.position.clone(), target: home.target.clone() };
    this.pos.copy(home.position);
    this.look.copy(home.target);
  }

  get atHome() { return this.to.position.equals(this.home.position); }

  /** Tween to a view. `parallax` scales the idle sway (0 = locked off). */
  focus(view: View, opts: { duration?: number; parallax?: number; onArrive?: () => void } = {}) {
    this.from = { position: this.pos.clone(), target: this.look.clone() };
    this.to = { position: view.position.clone(), target: view.target.clone() };
    this.duration = opts.duration ?? 1.4;
    this.parallaxGoal = opts.parallax ?? 0.25;
    this.onArrive = opts.onArrive;
    this.t = 0;
  }

  goHome(duration = 1.5) {
    this.focus(this.home, { duration, parallax: 1 });
  }

  /** Replace the home view (e.g. on resize); follows it if currently home. */
  setHome(view: View) {
    const wasHome = this.atHome;
    this.home = view;
    if (wasHome) this.focus(view, { duration: 0.6, parallax: 1 });
  }

  update(dt: number, pointer: THREE.Vector2) {
    if (this.t < 1) {
      this.t = Math.min(1, this.t + dt / this.duration);
      const k = ease(this.t);
      this.pos.lerpVectors(this.from.position, this.to.position, k);
      this.look.lerpVectors(this.from.target, this.to.target, k);
      if (this.t === 1 && this.onArrive) {
        const cb = this.onArrive;
        this.onArrive = undefined;
        cb();
      }
    }
    const k = 1 - Math.exp(-dt * 3);
    this.sway.lerp(pointer, k);
    this.parallax += (this.parallaxGoal - this.parallax) * k;

    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.look);
    // slide sideways/up in camera space, then re-aim: a gentle orbit
    this.right.setFromMatrixColumn(this.camera.matrixWorld, 0);
    const dist = this.pos.distanceTo(this.look);
    const amt = 0.045 * dist * this.parallax;
    this.tmp.copy(this.right).multiplyScalar(this.sway.x * amt);
    this.tmp.y += this.sway.y * amt * 0.6;
    this.camera.position.add(this.tmp);
    this.camera.lookAt(this.look);
  }
}
