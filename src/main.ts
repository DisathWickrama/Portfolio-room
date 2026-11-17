/**
 * Composition root. Builds the renderer, scene, UI and audio, wires them
 * together and runs the frame loop. (First commit: just proves the pipeline.)
 */
import * as THREE from 'three';
import './style.css';

const mount = document.getElementById('app')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0a14);
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 60);
camera.position.set(4.6, 3.4, 5.6);
camera.lookAt(0, 1, 0);

const floor = new THREE.Mesh(
  new THREE.BoxGeometry(6, 0.2, 5),
  new THREE.MeshStandardMaterial({ color: 0x4a3a4f, flatShading: true }),
);
scene.add(floor, new THREE.HemisphereLight(0x8080ff, 0x201020, 1.2));

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
renderer.setAnimationLoop(() => renderer.render(scene, camera));
