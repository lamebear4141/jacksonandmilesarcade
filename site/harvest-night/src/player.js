// player.js — movement, mouse look, stamina, crouch, ladders. Flashlight lands in Phase 5.

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class Player {
  constructor({ camera, domElement, colliders, ladders, platforms, audio, getSurface, spawnPoint }) {
    this.camera = camera;
    this.domElement = domElement;
    this.colliders = colliders;
    this.ladders = ladders || [];
    this.platforms = platforms || [];
    this.audio = audio;
    this.getSurface = getSurface || (() => 'grass');

    // yawObject sits at ground level and turns left/right.
    // pitchObject sits at eye height (with head-bob offsets) and tilts up/down.
    this.yawObject = new THREE.Object3D();
    this.pitchObject = new THREE.Object3D();
    this.pitchObject.add(camera);
    this.yawObject.add(this.pitchObject);
    this.yawObject.position.copy(spawnPoint);
    // A three.js camera looks down its local -Z axis. With zero yaw that's world -Z,
    // which is *south*, back toward the gate. Yaw of PI points it at +Z ("north"),
    // into the farm, matching the spec.
    this.yawObject.rotation.y = Math.PI;

    this.input = {
      forward: false, back: false, left: false, right: false, sprint: false, interact: false,
      turnLeft: false, turnRight: false,
    };
    this.locked = false;
    this.crouching = false;
    this.frozen = false; // set true to stop taking input (e.g. once the player has won)

    this.stamina = CONFIG.staminaSeconds;
    this.exhausted = false; // true from the moment stamina hits 0 until it's back to full

    this.baseEyeHeight = CONFIG.world.eyeHeight;
    this.crouchEyeHeight = CONFIG.world.eyeHeight - 0.55;
    this.currentEyeHeight = this.baseEyeHeight;

    this.floorY = 0;      // height of the ground/platform currently under the player
    this.onLadder = false;

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
      if (!this.locked || this.frozen) return;
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
      case 'KeyA': this.input.left = down; break;
      case 'KeyD': this.input.right = down; break;
      // Arrow left/right turn the camera instead of strafing — a keyboard-only
      // fallback for browsers/environments that refuse the Pointer Lock API
      // (some do, silently, even with a real mouse plugged in).
      case 'ArrowLeft': this.input.turnLeft = down; break;
      case 'ArrowRight': this.input.turnRight = down; break;
      case 'ShiftLeft': case 'ShiftRight': this.input.sprint = down; break;
      case 'KeyE': this.input.interact = down; break;
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

  // A ladder only engages while you're actively pressing forward/back within its
  // radius — let go and you drop to whatever floor is under you (no fall damage,
  // per the spec, so an instant snap down reads as a feature, not a bug).
  _updateLadder(dt) {
    const px = this.yawObject.position.x, pz = this.yawObject.position.z;
    let nearest = null, nearestDistSq = Infinity;
    for (const l of this.ladders) {
      const dx = px - l.x, dz = pz - l.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < l.radius * l.radius && distSq < nearestDistSq) { nearest = l; nearestDistSq = distSq; }
    }

    const wantsToClimb = nearest && (this.input.forward || this.input.back);
    this.onLadder = !!wantsToClimb;
    if (!this.onLadder) return;

    this.yawObject.position.x = nearest.x;
    this.yawObject.position.z = nearest.z;
    let dy = 0;
    if (this.input.forward) dy += CONFIG.climbSpeed * dt;
    if (this.input.back) dy -= CONFIG.climbSpeed * dt;
    const newY = THREE.MathUtils.clamp(this.floorY + dy, nearest.bottomY, nearest.topY);

    // Reached the top while still climbing up — step off the ladder's column and onto
    // the platform, and move clear of the ladder's radius so it doesn't immediately
    // grab you again next frame (that was the bug: without this, holding forward at
    // the top just held you in place on the ladder forever with no way off).
    if (newY >= nearest.topY - 0.001 && dy > 0) {
      this.floorY = nearest.topY;
      const exitDist = nearest.radius + 0.6;
      const dir = nearest.exitDir || { x: 0, z: 1 };
      this.yawObject.position.x = nearest.x + dir.x * exitDist;
      this.yawObject.position.z = nearest.z + dir.z * exitDist;
      this.yawObject.position.y = this.floorY;
      this.onLadder = false;
      return;
    }

    this.floorY = newY;
    this.yawObject.position.y = this.floorY;
  }

  _isInPlatform(p, x, z) {
    return x >= p.minX && x <= p.maxX && z >= p.minZ && z <= p.maxZ;
  }

  // The floor height under the player only changes to a platform's height while
  // standing in its footprint AND already close to that height (i.e. you just
  // climbed a ladder up to it) — otherwise walking underneath a loft would yank
  // you up onto it. Stepping off a platform's edge without a ladder just drops
  // you back to the ground; see the ladder comment above for why that's fine.
  _updateFloorHeight() {
    const x = this.yawObject.position.x, z = this.yawObject.position.z;
    let target = 0;
    for (const p of this.platforms) {
      if (this._isInPlatform(p, x, z) && Math.abs(this.floorY - p.y) < 1.0) {
        target = p.y;
        break;
      }
    }
    this.floorY = target;
    this.yawObject.position.y = this.floorY;
  }

  update(dt) {
    if (this.frozen) return;

    // Keyboard turning (see _setKey) — works whether or not the mouse is pointer-locked.
    if (this.input.turnLeft) this.yawObject.rotation.y += CONFIG.mouse.keyTurnSpeed * dt;
    if (this.input.turnRight) this.yawObject.rotation.y -= CONFIG.mouse.keyTurnSpeed * dt;

    this._updateLadder(dt);

    if (this.onLadder) {
      // No head bob/footsteps while climbing; eye height still applies on top of floorY.
      this.pitchObject.position.set(0, this.currentEyeHeight, 0);
      this.camera.rotation.z = 0;
      this.bobTime = 0;
      this.footstepTimer = 0;
      return;
    }

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

    // Matches the actual world-space direction the camera (local -Z) faces at this yaw.
    const forward = new THREE.Vector3(-Math.sin(this.yawObject.rotation.y), 0, -Math.cos(this.yawObject.rotation.y));
    const right = new THREE.Vector3(-forward.z, 0, forward.x);

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

    this._updateFloorHeight();

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
