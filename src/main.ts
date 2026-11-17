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
import { Hud } from './ui/hud';
import { Terminal } from './ui/terminal';
import { ProjectPanel, VinylPanel } from './ui/panels';
import { AudioEngine } from './audio/engine';
import { Lofi } from './audio/lofi';
import { RainAmbience } from './audio/rain';

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

  // ---- camera views ----------------------------------------------------------------
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const portrait = () => innerWidth / innerHeight < 0.9;
  const homeView = (): View => {
    const target = V(-0.35, 1.25, -0.7);
    const dir = V(4.6, 2.55, 6.4).normalize();
    const aspect = innerWidth / innerHeight;
    const dist = 8.9 * Math.max(1, Math.pow(1.45 / aspect, 0.78));
    return { position: target.clone().addScaledVector(dir, dist), target };
  };
  const crtView = (): View => {
    const p = crt.screen.getWorldPosition(V(0, 0, 0));
    const n = crt.screen.getWorldDirection(V(0, 0, 0));
    return { position: p.clone().addScaledVector(n, portrait() ? 1.15 : 0.62), target: p };
  };
  const posterView = (i: number): View => {
    const p = posters.posters[i].mesh.getWorldPosition(V(0, 0, 0));
    // leave room for the info panel: right side on desktop, bottom sheet on phones
    if (portrait()) return { position: V(p.x + 3.9, p.y - 0.45, p.z), target: V(p.x, p.y - 0.58, p.z) };
    return { position: V(p.x + 2.3, p.y + 0.05, p.z - 0.5), target: V(p.x, p.y, p.z - 0.5) };
  };
  const vinylView = (): View => {
    const p = vinyl.group.getWorldPosition(V(0, 0, 0));
    if (portrait()) return { position: V(p.x, p.y + 1.4, p.z + 2.0), target: V(p.x, p.y - 0.35, p.z) };
    return { position: V(p.x - 0.15, p.y + 0.95, p.z + 1.55), target: V(p.x + 0.22, p.y + 0.05, p.z) };
  };
  // start pulled back; the intro button eases the camera in
  const home = homeView();
  const rig = new CameraRig(camera, { position: home.target.clone().add(V(7.5, 7.5, 10.5)), target: home.target.clone() });
  rig.home = home;

  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  ui.appendChild(tooltip);
  const hotspots = new Interactions(camera, renderer.domElement, tooltip, scene);
  const post = new Post(renderer, scene, camera, q);

  // ---- audio ---------------------------------------------------------------------------
  const engine = new AudioEngine();
  const lofi = new Lofi(engine);
  const rainAudio = new RainAmbience(engine);

  // ---- focus modes: where the camera is and which overlay is up ---------------------------
  type Mode = 'home' | 'crt' | 'poster' | 'vinyl';
  let mode: Mode = 'home';
  let posterIndex = 0;
  let lampOn = true;

  const setMode = (m: Mode) => {
    mode = m;
    hud.setFocused(m !== 'home');
    hotspots.enabled = m === 'home';
    if (m !== 'poster') projectPanel.hide();
    if (m !== 'vinyl') vinylPanel.hide();
    if (m !== 'crt') { terminal.close(); hud.setHidden(false); }
  };
  const goHome = () => {
    if (mode === 'home') return;
    setMode('home');
    rig.goHome();
  };
  const focusCrt = () => {
    setMode('crt');
    rig.focus(crtView(), { duration: 1.5, parallax: 0, onArrive: () => { if (mode === 'crt') { terminal.open(); hud.setHidden(true); } } });
  };
  const focusPoster = (i: number) => {
    posterIndex = (i + projects.length) % projects.length;
    const wasPoster = mode === 'poster';
    setMode('poster');
    rig.focus(posterView(posterIndex), { duration: wasPoster ? 0.8 : 1.4, parallax: 0.3 });
    projectPanel.show(projects[posterIndex], posterIndex, projects.length);
  };
  const focusVinyl = () => {
    setMode('vinyl');
    rig.focus(vinylView(), { duration: 1.4, parallax: 0.3 });
    vinylPanel.show();
  };

  const setMusic = (on: boolean) => {
    if (on) lofi.play(); else lofi.pause();
    vinyl.setPlaying(lofi.playing);
    hud.setMusic(lofi.playing);
    vinylPanel.setPlaying(lofi.playing);
    return lofi.playing;
  };
  const setRain = (on: boolean) => { const r = rainAudio.set(on); hud.setRain(r); return r; };
  const toggleDay = () => {
    const isDay = dayNight.toggle();
    hud.setDay(isDay);
    terminal.syncDay(isDay);
    return isDay;
  };

  // ---- UI ----------------------------------------------------------------------------------
  const hud = new Hud(ui, {
    onBack: goHome,
    onToggleDay: toggleDay,
    onToggleRain: () => setRain(!rainAudio.on),
    onToggleMusic: () => setMusic(!lofi.playing),
    onNav: (id) => (id === 'terminal' ? focusCrt() : id === 'projects' ? focusPoster(0) : focusVinyl()),
  }, q.mobile);
  const terminal = new Terminal(ui, {
    onExit: goHome,
    toggleMusic: () => setMusic(!lofi.playing),
    toggleDay,
    toggleRain: () => setRain(!rainAudio.on),
  });
  const projectPanel = new ProjectPanel(ui, { onClose: goHome, onStep: (d) => focusPoster(posterIndex + d) });
  const vinylPanel = new VinylPanel(ui, { onClose: goHome, onToggle: () => setMusic(!lofi.playing), onVolume: (v) => lofi.setVolume(v) }, lofi.volume);

  // ---- hotspots ---------------------------------------------------------------------------------
  hotspots.add({ id: 'crt', label: 'Boot the terminal', object: crt.group, onClick: focusCrt, markerOffset: V(0, 0.62, 0) });
  posters.posters.forEach((p, i) =>
    hotspots.add({ id: p.project.id, label: p.project.status === 'live' ? `${p.project.title} · view project` : `${p.project.title} · coming soon`, object: p.mesh, onClick: () => focusPoster(i), markerOffset: V(0.06, 0.66, 0) }),
  );
  hotspots.add({ id: 'vinyl', label: 'Record player', object: vinyl.group, onClick: focusVinyl, markerOffset: V(0, 0.3, 0) });
  hotspots.add({ id: 'cat', label: 'Zzz…', object: cat.group, noMarker: true, onClick: () => { engine.unlock(); engine.purr(); hud.toast('purrrrr…'); } });
  hotspots.add({ id: 'mug', label: 'Coffee', object: mug.group, noMarker: true, onClick: () => hud.toast('Still warm. Third one tonight.') });
  hotspots.add({ id: 'lamp', label: 'Lamp', object: lamp.group, noMarker: true, onClick: () => { lampOn = !lampOn; applyDay(dayNight.mix); } });
  hotspots.onMiss = () => { if (mode === 'poster' || mode === 'vinyl') goHome(); };
  addEventListener('keydown', (e) => { if (e.key === 'Escape') goHome(); });

  hud.showIntro(ui, () => {
    rig.goHome(2.8);
    engine.unlock();
    setRain(true);
  });

  // ---- frame loop -------------------------------------------------------------------
  const applyDay = (mix: number) => {
    city.setDay(mix);
    glass.setDay(mix);
    lamp.setPower(lampOn ? 1 - mix * 0.9 : 0);
    room.setStringLights(1 - mix * 0.85);
    post.setDay(mix);
  };
  applyDay(0);

  let coveredFor = 0;
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
    // the terminal covers the whole canvas: skip drawing the room to save battery
    if (terminal.isOpen) { coveredFor += dt; if (coveredFor > 0.6) return; } else coveredFor = 0;
    post.render(time);
  });

  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    post.setSize(innerWidth, innerHeight, q.pixelRatio);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    rig.setHome(homeView());
    // keep the focused framing right when a phone rotates
    if (mode === 'poster') rig.focus(posterView(posterIndex), { duration: 0.5, parallax: 0.3 });
    else if (mode === 'vinyl') rig.focus(vinylView(), { duration: 0.5, parallax: 0.3 });
    else if (mode === 'crt') rig.focus(crtView(), { duration: 0.5, parallax: 0 });
  });

  // debugging handle for screenshots / console poking
  Object.assign(window, { __room: { rig, focusCrt, focusPoster, focusVinyl, goHome, toggleDay, terminal, engine, setMusic } });
}

/** No WebGL: skip the room and make the terminal the whole site. */
function fallback() {
  document.body.classList.add('nogl');
  const noop = () => false;
  new Terminal(document.getElementById('ui')!, { onExit: () => {}, toggleMusic: noop, toggleDay: noop, toggleRain: noop }).open();
}

if (hasWebGL()) {
  try { start(); } catch (err) { console.error(err); document.getElementById('app')!.replaceChildren(); document.getElementById('ui')!.replaceChildren(); fallback(); }
} else fallback();
