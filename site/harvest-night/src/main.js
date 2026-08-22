// main.js — boot, game loop. Phase 1: just the farm and the player controller.

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { buildWorld, surfaceAt } from './world.js';
import { Player } from './player.js';
import { AudioManager } from './audio.js';
import { HUD } from './hud.js';
import { Objectives } from './objectives.js';
import { Scarecrow } from './scarecrow.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 500);

const { colliders, occluders, spawnPoint, ladders, platforms, keySpots, gate, scarecrowPost } = buildWorld(scene);

const audio = new AudioManager();

const player = new Player({
  camera,
  domElement: renderer.domElement,
  colliders,
  ladders,
  platforms,
  audio,
  getSurface: surfaceAt,
  spawnPoint,
});
scene.add(player.object);

const hud = new HUD();
const scarecrow = new Scarecrow({ scene, postPosition: scarecrowPost, occluders, audio });
const objectives = new Objectives({
  scene, keySpots, gate, colliders, hud, audio,
  onFirstKey: (p) => scarecrow.awaken(p),
  // Tonight's critter encounter, rolled by the page shell from the shared
  // character (null when today's cap is spent — then nothing spawns).
  critter: window.HARVEST_CRITTER || null,
});

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
  '<span style="font-size:13px;opacity:0.7;letter-spacing:0.5px">WASD move &middot; Shift sprint &middot; C crouch &middot; mouse to look (or &larr; &rarr; to turn if your browser blocks mouse look)</span>';
document.body.appendChild(overlay);

// Hide the overlay on click regardless of whether the browser actually grants
// pointer lock (some browsers/embeds silently refuse it) — WASD movement works
// without lock, so getting stuck behind a translucent overlay forever, unable
// to see the world, is worse than losing mouse-look. Clicking the canvas again
// re-requests lock.
overlay.addEventListener('click', () => {
  overlay.style.display = 'none';
  renderer.domElement.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== renderer.domElement) overlay.style.display = 'flex';
});
document.addEventListener('pointerlockerror', () => {
  console.warn('Pointer lock was refused by the browser — mouse look is unavailable, but WASD still works.');
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
  scarecrow.update(dt, camera, player);
  objectives.update(dt, player);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
