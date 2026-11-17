/**
 * The room shell and furniture: floor, two walls (the other two are open so
 * the camera can look in, diorama style), the window frame, desk, chair, bed,
 * bookshelf, record cabinet, rug and string lights.
 *
 * Exports ROOM (shared dimensions) so props and camera views can position
 * themselves relative to the same numbers.
 */
import * as THREE from 'three';
import { box, cyl, flat, glow, canvasTexture, rng, CONDENSED } from './kit';

export const ROOM = {
  w: 6,
  d: 5,
  h: 3.2,
  window: { x: 0.7, y: 1.95, w: 2.0, h: 1.4 },
  deskTop: 0.81,
  cabinetTop: 0.62,
};

export interface Room {
  group: THREE.Group;
  /** 0 = off, 1 = full glow. Driven by day/night. */
  setStringLights(power: number): void;
}

export function buildRoom(): Room {
  const g = new THREE.Group();
  const { w, d, h } = ROOM;
  const win = ROOM.window;
  const backZ = -d / 2;
  const leftX = -w / 2;

  // ---- floor -------------------------------------------------------------
  g.add(box(w + 0.2, 0.3, d + 0.2, flat(0x2a2030), -0.1, -0.15, -0.1));
  const planks = canvasTexture(512, 512, (ctx, cw, ch) => {
    const r = rng(7);
    const rows = 10;
    for (let i = 0; i < rows; i++) {
      let x = -r() * 200;
      while (x < cw) {
        const len = 140 + r() * 160;
        const l = 30 + r() * 10;
        ctx.fillStyle = `hsl(${18 + r() * 8}, 26%, ${l}%)`;
        ctx.fillRect(x, (i * ch) / rows, len, ch / rows);
        ctx.fillStyle = 'rgba(20,10,10,0.55)';
        ctx.fillRect(x, (i * ch) / rows, 2, ch / rows);
        x += len;
      }
      ctx.fillStyle = 'rgba(20,10,10,0.6)';
      ctx.fillRect(0, (i * ch) / rows, cw, 2);
    }
  });
  const floorTop = new THREE.Mesh(new THREE.PlaneGeometry(w, d), flat(0xffffff, { map: planks, roughness: 0.75 }));
  floorTop.rotation.x = -Math.PI / 2;
  floorTop.position.y = 0.001;
  floorTop.receiveShadow = true;
  g.add(floorTop);

  // ---- walls ---------------------------------------------------------------
  const wallMat = flat(0x5b5478);
  const trimMat = flat(0x2f2a40);
  // left wall (solid, holds the posters)
  g.add(box(0.2, h, d + 0.2, wallMat, leftX - 0.1, h / 2, -0.1));
  // back wall = four pieces around the window opening
  const wl = win.x - win.w / 2;
  const wr = win.x + win.w / 2;
  const wb = win.y - win.h / 2;
  const wt = win.y + win.h / 2;
  g.add(box(wl - leftX, h, 0.2, wallMat, (wl + leftX) / 2, h / 2, backZ - 0.1));
  g.add(box(w / 2 - wr, h, 0.2, wallMat, (wr + w / 2) / 2, h / 2, backZ - 0.1));
  g.add(box(win.w, wb, 0.2, wallMat, win.x, wb / 2, backZ - 0.1));
  g.add(box(win.w, h - wt, 0.2, wallMat, win.x, (h + wt) / 2, backZ - 0.1));
  // skirting
  g.add(box(w, 0.12, 0.04, trimMat, 0, 0.06, backZ + 0.02));
  g.add(box(0.04, 0.12, d, trimMat, leftX + 0.02, 0.06, 0));

  // window frame, mullions, sill
  const frameMat = flat(0xe6dccb);
  g.add(box(win.w + 0.12, 0.07, 0.26, frameMat, win.x, wt + 0.03, backZ - 0.08));
  g.add(box(win.w + 0.12, 0.07, 0.26, frameMat, win.x, wb - 0.03, backZ - 0.08));
  g.add(box(0.07, win.h, 0.26, frameMat, wl - 0.03, win.y, backZ - 0.08));
  g.add(box(0.07, win.h, 0.26, frameMat, wr + 0.03, win.y, backZ - 0.08));
  g.add(box(0.04, win.h, 0.05, frameMat, win.x, win.y, backZ - 0.08));
  g.add(box(win.w, 0.04, 0.05, frameMat, win.x, win.y + 0.15, backZ - 0.08));
  g.add(box(win.w + 0.3, 0.05, 0.22, frameMat, win.x, wb - 0.07, backZ + 0.09));
  // short curtains either side
  const curtain = flat(0x7c4f6a, { side: THREE.DoubleSide });
  for (const sx of [wl - 0.18, wr + 0.18]) {
    for (let i = 0; i < 4; i++) {
      const fold = box(0.09, win.h + 0.35, 0.05, curtain, sx + (i - 1.5) * 0.085, win.y - 0.02, backZ + 0.05 + (i % 2) * 0.03);
      g.add(fold);
    }
  }
  g.add(cyl(0.015, 0.015, win.w + 0.9, flat(0x2a2030), 6, win.x, wt + 0.2, backZ + 0.07).rotateZ(Math.PI / 2));

  // ---- rug -----------------------------------------------------------------
  const rug = cyl(1.25, 1.25, 0.02, flat(0x9c5a4e), 28, 0.3, 0.012, 0.35);
  rug.castShadow = false;
  g.add(rug);
  const rugIn = cyl(0.9, 0.9, 0.022, flat(0xd9a66b), 28, 0.3, 0.014, 0.35);
  rugIn.castShadow = false;
  g.add(rugIn);
  const rugIn2 = cyl(0.55, 0.55, 0.024, flat(0x6e4a6e), 28, 0.3, 0.016, 0.35);
  rugIn2.castShadow = false;
  g.add(rugIn2);

  // ---- desk + chair ----------------------------------------------------------
  const wood = flat(0x7a5540);
  const woodDark = flat(0x4f372d);
  const deskX = 0.45;
  const deskZ = backZ + 0.5;
  g.add(box(2.3, 0.06, 0.95, wood, deskX, ROOM.deskTop - 0.03, deskZ));
  for (const [lx, lz] of [[-1.08, -0.4], [-1.08, 0.4]] as const) {
    g.add(box(0.07, 0.75, 0.07, woodDark, deskX + lx, 0.375, deskZ + lz));
  }
  g.add(box(0.6, 0.72, 0.85, woodDark, deskX + 0.8, 0.39, deskZ)); // drawer unit
  for (let i = 0; i < 3; i++) {
    g.add(box(0.5, 0.18, 0.02, wood, deskX + 0.8, 0.62 - i * 0.22, deskZ + 0.43));
    g.add(box(0.12, 0.025, 0.03, flat(0xd9b27c), deskX + 0.8, 0.62 - i * 0.22, deskZ + 0.45));
  }
  // desk clutter: alarm clock stuck on 2:00, notebook, pencil
  const clockFace = new THREE.MeshBasicMaterial({
    map: canvasTexture(128, 64, (ctx, cw, ch) => {
      ctx.fillStyle = '#120404';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#ff4a2e';
      ctx.font = `bold 50px ${CONDENSED}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('2:00', cw / 2, ch / 2 + 3);
    }),
  });
  clockFace.color.setScalar(1.6);
  const clock = new THREE.Group();
  clock.add(box(0.2, 0.1, 0.07, flat(0x2a2730), 0, 0.05, 0));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.075), clockFace);
  face.position.set(0, 0.052, 0.036);
  clock.add(face);
  clock.position.set(deskX + 0.02, ROOM.deskTop, deskZ - 0.22);
  clock.rotation.y = 0.45;
  g.add(clock);
  const notebook = box(0.26, 0.018, 0.34, flat(0x8b3dff), deskX + 0.5, ROOM.deskTop + 0.009, deskZ + 0.22);
  notebook.rotation.y = 0.3;
  g.add(notebook);
  const page = box(0.22, 0.004, 0.3, flat(0xf4eee6), deskX + 0.5, ROOM.deskTop + 0.02, deskZ + 0.22);
  page.rotation.y = 0.3;
  g.add(page);
  const pencil = cyl(0.006, 0.006, 0.17, flat(0xffc247), 5, deskX + 0.52, ROOM.deskTop + 0.03, deskZ + 0.2);
  pencil.rotation.set(Math.PI / 2, 0, 0.9);
  g.add(pencil);

  const chair = new THREE.Group();
  const chairMat = flat(0x3a3550);
  chair.add(box(0.46, 0.06, 0.46, chairMat, 0, 0.46, 0));
  chair.add(box(0.46, 0.5, 0.05, chairMat, 0, 0.74, 0.21));
  chair.add(cyl(0.03, 0.03, 0.44, woodDark, 6, 0, 0.22, 0));
  chair.add(cyl(0.22, 0.26, 0.04, woodDark, 5, 0, 0.03, 0));
  chair.position.set(0.25, 0, -1.05);
  chair.rotation.y = -0.45;
  g.add(chair);

  // ---- bed (back-left corner) -------------------------------------------------
  const bedX = leftX + 0.68;
  const bedZ = backZ + 1.2;
  g.add(box(1.25, 0.28, 2.3, woodDark, bedX, 0.2, bedZ));
  g.add(box(1.25, 0.7, 0.08, woodDark, bedX, 0.45, backZ + 0.06)); // headboard
  g.add(box(1.15, 0.2, 2.2, flat(0xe9e1d6), bedX, 0.44, bedZ));
  g.add(box(1.19, 0.14, 1.45, flat(0x35607a), bedX, 0.5, bedZ + 0.4)); // blanket
  g.add(box(1.19, 0.05, 0.25, flat(0x4b7c96), bedX, 0.56, bedZ - 0.3)); // folded edge
  const pillow = box(0.75, 0.13, 0.42, flat(0xf4eee6), bedX, 0.6, backZ + 0.36);
  pillow.rotation.y = 0.08;
  g.add(pillow);

  // ---- bookshelf (left wall, near the front) ----------------------------------
  const shelf = new THREE.Group();
  shelf.add(box(0.34, 1.15, 0.04, woodDark, 0, 0.575, -0.62));
  shelf.add(box(0.34, 1.15, 0.04, woodDark, 0, 0.575, 0.62));
  for (const sy of [0.04, 0.4, 0.76, 1.13]) shelf.add(box(0.34, 0.04, 1.24, wood, 0, sy, 0));
  const r = rng(42);
  const bookCols = [0xc45c4a, 0xd9a66b, 0x4b7c96, 0x7c4f6a, 0xe9e1d6, 0x5f8a6b, 0x8b3dff, 0xff8a3c];
  for (const sy of [0.06, 0.42, 0.78]) {
    let z = -0.56;
    while (z < 0.45) {
      const bw = 0.04 + r() * 0.05;
      const bh = 0.2 + r() * 0.1;
      if (r() > 0.12) {
        const b = box(0.2 + r() * 0.06, bh, bw, flat(bookCols[Math.floor(r() * bookCols.length)]), 0.02, sy + bh / 2, z + bw / 2);
        if (r() > 0.85) b.rotation.x = 0.18;
        shelf.add(b);
      }
      z += bw + 0.006;
    }
  }
  // plant on top
  shelf.add(cyl(0.09, 0.07, 0.14, flat(0xc9714f), 8, 0, 1.22, 0.3));
  const leafMat = flat(0x4f8a5c);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.3 + r() * 0.15, 4), leafMat);
    const a = (i / 6) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.05, 1.42, 0.3 + Math.sin(a) * 0.05);
    leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    leaf.castShadow = true;
    shelf.add(leaf);
  }
  shelf.position.set(leftX + 0.19, 0, 1.45);
  g.add(shelf);

  // ---- record cabinet (right of desk) ------------------------------------------
  const cabX = 2.35;
  g.add(box(0.95, ROOM.cabinetTop - 0.08, 0.6, woodDark, cabX, (ROOM.cabinetTop - 0.08) / 2 + 0.08, backZ + 0.35));
  g.add(box(0.99, 0.04, 0.64, wood, cabX, ROOM.cabinetTop - 0.02, backZ + 0.35));
  for (const lx of [-0.4, 0.4]) g.add(box(0.05, 0.08, 0.5, woodDark, cabX + lx, 0.04, backZ + 0.35));
  // record sleeves standing in the open cabinet front
  const sleeveCols = [0xff8a3c, 0x8b3dff, 0x4b7c96, 0xe9e1d6, 0xc45c4a, 0x5f8a6b, 0xd9a66b];
  for (let i = 0; i < 14; i++) {
    g.add(box(0.035, 0.36, 0.02, flat(sleeveCols[i % sleeveCols.length]), cabX - 0.36 + i * 0.055, 0.3, backZ + 0.66));
  }

  // ---- string lights along both walls --------------------------------------------
  const bulbMat = glow(0xffc27a, 1.6);
  const bulbGeo = new THREE.SphereGeometry(0.028, 6, 5);
  const wireMat = new THREE.LineBasicMaterial({ color: 0x1c1826 });
  const strand = (from: THREE.Vector3, to: THREE.Vector3, n: number, sagAmt: number) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n * 4; i++) {
      const t = i / (n * 4);
      const p = from.clone().lerp(to, t);
      const seg = (t * n) % 1;
      p.y -= Math.sin(seg * Math.PI) * sagAmt;
      pts.push(p);
      if (i % 2 === 1) {
        const b = new THREE.Mesh(bulbGeo, bulbMat);
        b.position.copy(p).y -= 0.03;
        g.add(b);
      }
    }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat));
  };
  strand(new THREE.Vector3(leftX + 0.06, 2.95, d / 2 - 0.2), new THREE.Vector3(leftX + 0.06, 2.95, backZ + 0.06), 4, 0.22);
  strand(new THREE.Vector3(leftX + 0.06, 2.95, backZ + 0.05), new THREE.Vector3(w / 2 - 0.1, 2.95, backZ + 0.05), 5, 0.2);

  const baseBulb = new THREE.Color(0xffc27a);
  return {
    group: g,
    setStringLights(power: number) {
      bulbMat.color.copy(baseBulb).multiplyScalar(0.25 + power * 1.5);
    },
  };
}
