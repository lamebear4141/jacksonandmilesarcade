// main.js — boot, game loop. Phase 1: just the farm and the player controller.

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { buildWorld, surfaceAt } from './world.js';
import { Player } from './player.js';
import { AudioManager } from './audio.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 500);

const { colliders, spawnPoint } = buildWorld(scene);

const audio = new AudioManager();

const player = new Player({
  camera,
  domElement: renderer.domElement,
  colliders,
  audio,
  getSurface: surfaceAt,
  spawnPoint,
});
scene.add(player.object);

// ---- Click-to-play overlay (pointer lock requires a user gesture) ----
const overlay = document.createElement('div');
overlay.id = 'clickOverlay';
Object.assign(overlay.style, {
  position: 'fixed', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexDirection: 'column', gap: '10px',
  background: 'rgba(5,5,10,0.72)', color: '#ffa640',
  fontFamily: '"Trebuchet MS", monospace, sans-serif',
  fontSize: '22px', letterSpacing: '1px', cursor: 'pointer', zIndex: 100, textAlign: 'center',
});
overlay.innerHTML = 'CLICK TO ENTER THE FARM' +
  '<span style="font-size:13px;opacity:0.7;letter-spacing:0.5px">WASD move &middot; Shift sprint &middot; C crouch &middot; mouse to look</span>';
document.body.appendChild(overlay);
overlay.addEventListener('click', () => renderer.domElement.requestPointerLock());
document.addEventListener('pointerlockchange', () => {
  overlay.style.display = document.pointerLockElement === renderer.domElement ? 'none' : 'flex';
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  player.update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
