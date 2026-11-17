/**
 * Composition root: the only file that knows about everything.
 *
 *   scene/*  build what you see        core/*  camera, hotspots, post
 *   audio/*  make what you hear        ui/*    DOM overlays
 *
 * Flow: input -> handlers here -> scene / audio / UI. Modules do not import
 * each other sideways; main.ts passes callbacks between them.
 */
import * as THREE from 'three';
import './style.css';
import { detectQuality, hasWebGL } from './core/quality';
import { Post } from './core/post';
import { CameraRig, type View } from './core/cameraRig';
import { Interactions } from './core/interactions';
import { buildRoom, ROOM } from './scene/room';
import { buildCityView } from './scene/cityView';
import { buildWindowRain } from './scene/windowRain';
import { DayNight } from './scene/dayNight';
import { buildCrt } from './scene/props/crt';
import { buildLamp } from './scene/props/lamp';
import { buildMug } from './scene/props/mug';
import { buildCat } from './scene/props/cat';
import { buildVinyl } from './scene/props/vinyl';
import { buildPosters } from './scene/props/posters';
import { projects } from './data/portfolio';
import type { Prop } from './scene/kit';

function start() {
  const q = detectQuality();
  const mount = document.getElementById('app')!;
  const ui = document.getElementById('ui')!;

  // ---- renderer ---------------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(q.pixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = q.shadows;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 60);

  // ---- world --------------------------------------------------------------------
  const dayNight = new DayNight(scene, renderer, q.shadows);
  const room = buildRoom();
  const city = buildCityView(q.rainLines);
  const glass = buildWindowRain();
  scene.add(room.group, city.group, glass.mesh);

  const backZ = -ROOM.d / 2;
  const crt = buildCrt();
  crt.group.position.set(-0.2, ROOM.deskTop, backZ + 0.42);
  crt.group.rotation.y = 0.3;
  const lamp = buildLamp(q.shadows);
  lamp.group.position.set(1.3, ROOM.deskTop, backZ + 0.3);
  const mug = buildMug();
  mug.group.position.set(0.72, ROOM.deskTop, backZ + 0.66);
  mug.group.rotation.y = -0.8;
  const cat = buildCat();
  cat.group.position.set(-ROOM.w / 2 + 0.7, 0.57, backZ + 1.85);
  cat.group.rotation.y = 0.5;
  const vinyl = buildVinyl();
  vinyl.group.position.set(2.35, ROOM.cabinetTop, backZ + 0.35);
  const posters = buildPosters(projects);
  posters.group.position.set(-ROOM.w / 2 + 0.001, 2.08, -0.45);
  const props: Prop[] = [crt, lamp, mug, cat, vinyl];
  for (const p of props) scene.add(p.group);
  scene.add(posters.group);

  // ---- camera ---------------------------------------------------------------------
  const homeView = (): View => {
    const target = new THREE.Vector3(-0.35, 1.25, -0.7);
    const dir = new THREE.Vector3(4.6, 2.55, 6.4).normalize();
    const aspect = innerWidth / innerHeight;
    const dist = 8.9 * Math.max(1, Math.pow(1.45 / aspect, 0.85));
    return { position: target.clone().addScaledVector(dir, dist), target };
  };
  const rig = new CameraRig(camera, homeView());

  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  ui.appendChild(tooltip);
  const hotspots = new Interactions(camera, renderer.domElement, tooltip, scene);
  const post = new Post(renderer, scene, camera, q);

  // ---- frame loop -------------------------------------------------------------------
  const applyDay = (mix: number) => {
    city.setDay(mix);
    glass.setDay(mix);
    lamp.setPower(1 - mix * 0.9);
    room.setStringLights(1 - mix * 0.85);
    post.setDay(mix);
  };
  applyDay(0);

  let last = performance.now();
  let time = 0;
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    time += dt;
    if (dayNight.update(dt)) applyDay(dayNight.mix);
    for (const p of props) p.update?.(time, dt);
    city.update(time, dt);
    glass.update(time);
    hotspots.update(time, dt);
    rig.update(dt, hotspots.pointer);
    post.render(time);
  });

  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    post.setSize(innerWidth, innerHeight, q.pixelRatio);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    rig.setHome(homeView());
  });

  // debugging handle for screenshots / console poking
  Object.assign(window, { __room: { rig, dayNight, hotspots, posters, crt, vinyl, cat } });
}

if (hasWebGL()) start();
