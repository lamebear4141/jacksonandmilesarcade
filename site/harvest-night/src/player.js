// player.js — movement, mouse look, stamina, crouch. Flashlight lands in Phase 5.

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class Player {
  constructor({ camera, domElement, colliders, audio, getSurface, spawnPoint }) {
    this.camera = camera;
    this.domElement = domElement;
    this.colliders = colliders;
    this.audio = audio;
    this.getSurface = getSurface || (() => 'grass');

    // yawObject sits at ground level and turns left/right.
    // pitchObject sits at eye height (with head-bob offsets) and tilts up/down.
    this.yawObject = new THREE.Object3D();
    this.pitchObject = new THREE.Object3D();
    this.pitchObject.add(camera);
    this.yawObject.add(this.pitchObject);
    this.yawObject.position.copy(spawnPoint);
    this.yawObject.rotation.y = 0; // facing +z, "north" into the farm

    this.input = { forward: false, back: false, left: false, right: false, sprint: false };
    this.locked = false;
    this.crouching = false;

    this.stamina = CONFIG.staminaSeconds;
    this.exhausted = false; // true from the moment stamina hits 0 until it's back to full

    this.baseEyeHeight = CONFIG.world.eyeHeight;
    this.crouchEyeHeight = CONFIG.world.eyeHeight - 0.55;
    this.currentEyeHeight = this.baseEyeHeight;

    this.bobTime = 0;
    this.footstepTimer = 0;

    this._bindEvents();
  }

  get object() { return this.yawObject; }
  get position() { return this.yawObject.position; }
  get isSprinting() { return this._sprinting || false; }
  get staminaFraction() { return this.stamina / CONFIG.staminaSeconds; }

  _bindEvents() {
    this.domElement.addEventListener('click', () => this.domElement.requestPointerLock());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.domElement;
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.yawObject.rotation.y -= e.movementX * CONFIG.mouse.sensitivity;
      this.pitchObject.rotation.x -= e.movementY * CONFIG.mouse.sensitivity;
      this.pitchObject.rotation.x = THREE.MathUtils.clamp(
        this.pitchObject.rotation.x, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05
      );
    });
    document.addEventListener('keydown', (e) => this._setKey(e.code, true));
    document.addEventListener('keyup', (e) => this._setKey(e.code, false));
  }

  _setKey(code, down) {
    switch (code) {
      case 'KeyW': case 'ArrowUp': this.input.forward = down; break;
      case 'KeyS': case 'ArrowDown': this.input.back = down; break;
      case 'KeyA': case 'ArrowLeft': this.input.left = down; break;
      case 'KeyD': case 'ArrowRight': this.input.right = down; break;
      case 'ShiftLeft': case 'ShiftRight': this.input.sprint = down; break;
      case 'KeyC': if (down) this.crouching = !this.crouching; break;
    }
  }

  // Push the player's circular footprint out of any overlapping collider box.
  _resolveCollisions(pos, radius = 0.4) {
    for (const box of this.colliders) {
      const closestX = THREE.MathUtils.clamp(pos.x, box.min.x, box.max.x);
      const closestZ = THREE.MathUtils.clamp(pos.z, box.min.z, box.max.z);
      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      const distSq = dx * dx + dz * dz;
      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq) || 0.0001;
        const overlap = radius - dist;
        pos.x += (dx / dist) * overlap;
        pos.z += (dz / dist) * overlap;
      }
    }
    return pos;
  }

  update(dt) {
    const moving = this.input.forward || this.input.back || this.input.left || this.input.right;
    // Once stamina hits zero, sprint is locked out until it's back to full — otherwise
    // it flickers between sprint and walk speed every frame right at the boundary.
    if (this.stamina <= 0) this.exhausted = true;
    if (this.exhausted && this.stamina >= CONFIG.staminaSeconds) this.exhausted = false;
    const sprinting = this.input.sprint && !this.exhausted && moving && !this.crouching;
    this._sprinting = sprinting;

    if (sprinting) {
      this.stamina = Math.max(0, this.stamina - dt);
    } else {
      this.stamina = Math.min(
        CONFIG.staminaSeconds,
        this.stamina + dt * (CONFIG.staminaSeconds / CONFIG.staminaRegenSeconds)
      );
    }

    const speed = this.crouching
      ? CONFIG.crouchSpeed
      : (sprinting ? CONFIG.sprintSpeed : CONFIG.walkSpeed);

    const forward = new THREE.Vector3(Math.sin(this.yawObject.rotation.y), 0, Math.cos(this.yawObject.rotation.y));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    const move = new THREE.Vector3();
    if (this.input.forward) move.add(forward);
    if (this.input.back) move.sub(forward);
    if (this.input.right) move.add(right);
    if (this.input.left) move.sub(right);
    const isActuallyMoving = move.lengthSq() > 0;
    if (isActuallyMoving) move.normalize().multiplyScalar(speed * dt);

    const half = CONFIG.world.size / 2 - 1;
    let newPos = this.yawObject.position.clone().add(move);
    newPos.x = THREE.MathUtils.clamp(newPos.x, -half, half);
    newPos.z = THREE.MathUtils.clamp(newPos.z, -half, half);
    newPos = this._resolveCollisions(newPos);
    this.yawObject.position.x = newPos.x;
    this.yawObject.position.z = newPos.z;

    // Smoothly ease eye height in/out of a crouch.
    const targetEye = this.crouching ? this.crouchEyeHeight : this.baseEyeHeight;
    this.currentEyeHeight += (targetEye - this.currentEyeHeight) * Math.min(1, dt * 8);

    // Head bob + sprint roll + footsteps.
    let bobY = 0, bobX = 0, roll = 0;
    if (isActuallyMoving) {
      const freq = sprinting ? CONFIG.headBob.sprintFrequency : CONFIG.headBob.walkFrequency;
      const amt = sprinting ? CONFIG.headBob.sprintAmount : CONFIG.headBob.walkAmount;
      this.bobTime += dt * freq;
      bobY = Math.abs(Math.sin(this.bobTime)) * amt;
      bobX = Math.cos(this.bobTime * 0.5) * amt * 0.5;
      if (sprinting) roll = Math.sin(this.bobTime * 0.5) * CONFIG.headBob.sprintRoll;

      this.footstepTimer -= dt;
      if (this.footstepTimer <= 0) {
        const interval = this.crouching
          ? CONFIG.footsteps.crouchInterval
          : (sprinting ? CONFIG.footsteps.sprintInterval : CONFIG.footsteps.walkInterval);
        this.footstepTimer = interval;
        if (this.audio) {
          this.audio.playFootstep(this.getSurface(this.yawObject.position.x, this.yawObject.position.z), this.crouching);
        }
      }
    } else {
      this.bobTime = 0;
      this.footstepTimer = 0;
    }

    this.pitchObject.position.set(bobX, this.currentEyeHeight + bobY, 0);
    this.camera.rotation.z = roll;
  }
}
