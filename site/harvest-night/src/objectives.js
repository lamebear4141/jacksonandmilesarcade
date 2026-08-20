// objectives.js — the three keys, the gate, and the win condition. Picking up
// the first key wakes the scarecrow (via the onFirstKey callback) — Phase 3+
// handles what it actually does with that; this module just fires the cue.

import * as THREE from 'three';
import { CONFIG } from './config.js';

const KEY_DEFS = [
  { id: 'barn', hint: 'The corn is moving.' },
  { id: 'silo', hint: 'Something creaked in the corn.' },
  { id: 'corn', hint: 'All three keys. Now get to the gate — and don\'t look back.' },
];

function makeKeyMesh() {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({
    color: '#d4a628', emissive: '#8a5a10', emissiveIntensity: 0.9,
  });
  const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), mat);
  group.add(body);
  const light = new THREE.PointLight(0xffcf6a, 14, 7, 2);
  group.add(light);
  return group;
}

export class Objectives {
  constructor({ scene, keySpots, gate, colliders, hud, audio, onFirstKey }) {
    this.scene = scene;
    this.gate = gate;
    this.colliders = colliders;
    this.hud = hud;
    this.audio = audio;
    this.onFirstKey = onFirstKey;

    this.keys = KEY_DEFS.map((def) => {
      const position = keySpots[def.id];
      const mesh = makeKeyMesh();
      mesh.position.copy(position);
      scene.add(mesh);
      return { ...def, position, mesh, collected: false };
    });

    this.collectedCount = 0;
    this.gateHoldTime = 0;
    this.won = false;
    this.startTime = performance.now();
    this.spinPhase = 0;

    this.hud.setKeyCount(0);
    this.hud.showHint('Three keys are hidden on the farm — the barn, the silo, and the cornfield. Find them, then get to the gate.');
  }

  get elapsedSeconds() {
    return (performance.now() - this.startTime) / 1000;
  }

  _nearestUncollectedKey(player) {
    let nearest = null, nearestDist = Infinity;
    for (const key of this.keys) {
      if (key.collected) continue;
      const dist = player.position.distanceTo(key.position);
      if (dist < nearestDist) { nearest = key; nearestDist = dist; }
    }
    return nearest && nearestDist <= CONFIG.interactRange ? nearest : null;
  }

  _collect(key, player) {
    key.collected = true;
    this.scene.remove(key.mesh);
    this.collectedCount++;
    this.hud.setKeyCount(this.collectedCount);
    this.audio.playChime();
    this.hud.showHint(key.hint);
    if (this.collectedCount === 1 && this.onFirstKey) this.onFirstKey(player);
  }

  _distanceToGateXZ(player) {
    const dx = player.position.x - this.gate.position.x;
    const dz = player.position.z - this.gate.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  _unlockGate(player) {
    this.won = true;
    player.frozen = true;
    this.audio.playGateUnlock();
    // Swing the gate open and drop its collider so the path out is actually clear.
    const idx = this.colliders.indexOf(this.gate.collider);
    if (idx !== -1) this.colliders.splice(idx, 1);
    this.gate.chain.visible = false;
    this.hud.setHoldProgress(0);
    this.hud.hidePrompt();
    this.hud.showWinScreen(this.elapsedSeconds);
  }

  update(dt, player) {
    // Keys: spin + bob, and handle the nearest one in range.
    this.spinPhase += dt;
    for (const key of this.keys) {
      if (key.collected) continue;
      key.mesh.rotation.y += CONFIG.keyVisual.spinSpeed * dt;
      key.mesh.position.y = key.position.y + Math.sin(this.spinPhase * CONFIG.keyVisual.bobSpeed) * CONFIG.keyVisual.bobAmount;
    }

    if (this.won) return;

    const nearKey = this._nearestUncollectedKey(player);
    const gateDist = this._distanceToGateXZ(player);
    const nearGate = gateDist <= CONFIG.interactRange;

    // Swing the gate open proportional to hold progress, purely visual — the
    // collider only actually drops once the hold completes.
    const holdFraction = this.gateHoldTime / CONFIG.gateHoldSeconds;
    this.gate.hinge.rotation.y = -holdFraction * (Math.PI / 2.4);

    if (nearGate && this.collectedCount >= 3) {
      if (player.input.interact) {
        this.gateHoldTime = Math.min(CONFIG.gateHoldSeconds, this.gateHoldTime + dt);
        this.hud.showPrompt('Hold [E] to unlock the gate...');
        this.hud.setHoldProgress(this.gateHoldTime / CONFIG.gateHoldSeconds);
        if (this.gateHoldTime >= CONFIG.gateHoldSeconds) {
          this._unlockGate(player);
          return;
        }
      } else {
        this.gateHoldTime = 0;
        this.hud.setHoldProgress(0);
        this.hud.showPrompt('[E] Hold to unlock the gate');
      }
    } else if (nearGate) {
      this.gateHoldTime = 0;
      this.hud.setHoldProgress(0);
      const need = 3 - this.collectedCount;
      this.hud.showPrompt(`The gate is chained shut. You need ${need} more key${need === 1 ? '' : 's'}.`);
    } else if (nearKey) {
      this.gateHoldTime = 0;
      this.hud.setHoldProgress(0);
      this.hud.showPrompt('[E] Take key');
      if (player.input.interact && !this._prevInteract) {
        this._collect(nearKey, player);
        this.hud.hidePrompt();
      }
    } else {
      this.gateHoldTime = 0;
      this.hud.setHoldProgress(0);
      this.hud.hidePrompt();
    }

    this._prevInteract = player.input.interact;
  }
}
