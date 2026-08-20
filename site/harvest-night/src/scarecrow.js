// scarecrow.js — the model and the AI state machine. Phase 3 covers DORMANT
// (mounted on its post, snaps to face you when it re-enters view), AWAKENED
// (steps off the post after key 1), and STALKING (the "only moves when you
// can't see it" rule). HUNTING/FRENZY/ATTACK land in later phases.

import * as THREE from 'three';
import { CONFIG } from './config.js';

const STATE = { DORMANT: 'dormant', AWAKENED: 'awakened', STALKING: 'stalking' };

// A couple of hard-snapped poses for the walk cycle — no easing between them.
// Stiffness is the point: it should read as a jerky lurch, not an animation.
const WALK_POSES = [
  { hipL: 0.5, hipR: -0.5, shoulderL: 0.08, shoulderR: -0.08 },
  { hipL: -0.5, hipR: 0.5, shoulderL: -0.08, shoulderR: 0.08 },
];
const REST_POSE = { hipL: 0, hipR: 0, shoulderL: 0, shoulderR: 0 };

function makePlaidTexture() {
  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8b3a3a';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#5f2626';
  for (let i = 0; i < size; i += 4) {
    ctx.fillRect(0, i, size, 1);
    ctx.fillRect(i, 0, 1, size);
  }
  ctx.fillStyle = '#a85a5a';
  for (let i = 2; i < size; i += 4) ctx.fillRect(0, i, size, 1);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 3);
  return tex;
}

function makeFaceTexture() {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d4681a';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#1a0d05';
  ctx.beginPath();
  ctx.moveTo(6, 9); ctx.lineTo(14, 9); ctx.lineTo(10, 17); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, 9); ctx.lineTo(26, 9); ctx.lineTo(22, 17); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(5, 22);
  [[8, 26], [11, 22], [14, 26], [17, 22], [20, 26], [23, 22], [27, 24]].forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.lineTo(27, 29); ctx.lineTo(5, 29); ctx.closePath();
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

export class Scarecrow {
  constructor({ scene, postPosition, occluders, audio }) {
    this.scene = scene;
    this.occluders = occluders || [];
    this.audio = audio;
    this.state = STATE.DORMANT;

    this._buildPost(postPosition);
    this._buildBody();
    this.body.position.copy(postPosition);
    scene.add(this.body);

    this.wasInFrustum = false;
    this.poseTimer = 0;
    this.poseIndex = 0;
    this.awakenTimer = 0;

    this._frustum = new THREE.Frustum();
    this._projScreenMatrix = new THREE.Matrix4();
    this._camInverse = new THREE.Matrix4();
    this._raycaster = new THREE.Raycaster();
    this._headWorldPos = new THREE.Vector3();
    this._camPos = new THREE.Vector3();
    this._toHead = new THREE.Vector3();
  }

  _buildPost(pos) {
    const group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: '#4a3626' });
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.15), mat);
    vertical.position.y = 1.1;
    group.add(vertical);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.12), mat);
    cross.position.y = 1.55;
    group.add(cross);
    group.position.copy(pos);
    this.scene.add(group);
  }

  _buildBody() {
    const body = new THREE.Group();

    const legMat = new THREE.MeshLambertMaterial({ color: '#3a3226' });
    this.hips = [];
    [-0.13, 0.13].forEach((x) => {
      const hip = new THREE.Group();
      hip.position.set(x, 0.9, 0);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), legMat);
      leg.position.y = -0.45;
      hip.add(leg);
      body.add(hip);
      this.hips.push(hip);
    });

    const torsoMat = new THREE.MeshLambertMaterial({ map: makePlaidTexture() });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.32), torsoMat);
    torso.position.y = 1.32;
    body.add(torso);

    const strawMat = new THREE.MeshLambertMaterial({ color: '#b89b62' });
    const gloveMat = new THREE.MeshLambertMaterial({ color: '#2a2420' });
    this.shoulders = [];
    [-1, 1].forEach((side) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.30, 1.65, 0);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, 0.16), strawMat);
      arm.position.x = side * 0.3;
      shoulder.add(arm);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), gloveMat);
      hand.position.x = side * 0.62;
      shoulder.add(hand);
      body.add(shoulder);
      this.shoulders.push(shoulder);
    });

    // Pumpkin head — face texture on the front (+Z local) face, plain elsewhere.
    const pumpkinMat = new THREE.MeshLambertMaterial({ color: '#d4681a' });
    const faceMat = new THREE.MeshLambertMaterial({ map: makeFaceTexture() });
    const headMats = [pumpkinMat, pumpkinMat, pumpkinMat, pumpkinMat, faceMat, pumpkinMat];
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), headMats);
    head.position.y = 2.0;
    body.add(head);
    this.head = head;

    // Two glowing red points, visible through fog before anything else.
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#ff3300' });
    [-0.09, 0.09].forEach((x) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), eyeMat);
      eye.position.set(x, 2.05, 0.22);
      body.add(eye);
    });
    const eyeLight = new THREE.PointLight(0xff2200, 8, 4, 2);
    eyeLight.position.set(0, 2.05, 0.2);
    body.add(eyeLight);

    const tuftMat = new THREE.MeshLambertMaterial({ color: '#c9ac6e' });
    [
      [-0.62, 1.65, 0.05], [-0.62, 1.6, -0.05], [0.62, 1.65, 0.05], [0.62, 1.6, -0.05],
      [0, 1.75, 0.18], [0.12, 1.78, -0.1],
    ].forEach(([x, y, z]) => {
      const tuft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.05), tuftMat);
      tuft.position.set(x, y, z);
      tuft.rotation.z = (Math.random() - 0.5) * 1.2;
      tuft.rotation.x = (Math.random() - 0.5) * 1.2;
      body.add(tuft);
    });

    this.body = body;
  }

  _applyPose(pose) {
    this.hips[0].rotation.x = pose.hipL;
    this.hips[1].rotation.x = pose.hipR;
    this.shoulders[0].rotation.z = pose.shoulderL;
    this.shoulders[1].rotation.z = pose.shoulderR;
  }

  // Called once, the moment the player picks up the first key.
  awaken(player) {
    if (this.state !== STATE.DORMANT) return;
    this.state = STATE.AWAKENED;
    this.awakenTimer = 0;
    this._awakenFrom = this.body.position.clone();
    this._awakenTo = this._awakenFrom.clone().add(new THREE.Vector3(0, 0, -1.3));
    this.body.rotation.y = Math.PI; // face south, out of the corn, generally toward the player
    if (this.audio) this.audio.playAwaken(this._computePan(player));
  }

  _computePan(player) {
    if (!player) return 0;
    const dx = this.body.position.x - player.position.x;
    const dz = this.body.position.z - player.position.z;
    const yaw = player.yawObject.rotation.y;
    const rightX = Math.cos(yaw), rightZ = -Math.sin(yaw);
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;
    return THREE.MathUtils.clamp((dx * rightX + dz * rightZ) / dist, -1, 1);
  }

  _updateFrustumAndOcclusion(camera) {
    camera.updateMatrixWorld();
    this._camInverse.copy(camera.matrixWorld).invert();
    this._projScreenMatrix.multiplyMatrices(camera.projectionMatrix, this._camInverse);
    this._frustum.setFromProjectionMatrix(this._projScreenMatrix);
    const inFrustum = this._frustum.containsPoint(this._headWorldPos);

    let occluded = false;
    if (inFrustum) {
      camera.getWorldPosition(this._camPos);
      this._toHead.copy(this._headWorldPos).sub(this._camPos);
      const dist = this._toHead.length();
      this._toHead.normalize();
      this._raycaster.set(this._camPos, this._toHead);
      this._raycaster.far = Math.max(0.1, dist - 0.15);
      occluded = this._raycaster.intersectObjects(this.occluders, true).length > 0;
    }
    return { inFrustum, visible: inFrustum && !occluded };
  }

  update(dt, camera, player) {
    this.head.getWorldPosition(this._headWorldPos);

    if (this.state === STATE.DORMANT) {
      const { inFrustum } = this._updateFrustumAndOcclusion(camera);
      if (inFrustum && !this.wasInFrustum) {
        const dx = player.position.x - this.body.position.x;
        const dz = player.position.z - this.body.position.z;
        this.body.rotation.y = Math.atan2(dx, dz);
      }
      this.wasInFrustum = inFrustum;
      return;
    }

    if (this.state === STATE.AWAKENED) {
      this.awakenTimer += dt;
      const stepT = Math.min(1, this.awakenTimer / CONFIG.scarecrow.awakenStepDuration);
      this.body.position.lerpVectors(this._awakenFrom, this._awakenTo, stepT);
      if (this.awakenTimer >= CONFIG.scarecrow.awakenStepDuration + CONFIG.scarecrow.awakenPause) {
        this.state = STATE.STALKING;
        this.poseTimer = 0;
      }
      return;
    }

    // STALKING — the core rule: it only moves while you can't see it.
    const { visible } = this._updateFrustumAndOcclusion(camera);
    if (visible) {
      return; // frozen completely, mid-stride, arms out
    }

    this.poseTimer += dt;
    if (this.poseTimer >= CONFIG.scarecrow.poseInterval) {
      this.poseTimer = 0;
      this.poseIndex = (this.poseIndex + 1) % WALK_POSES.length;
      this._applyPose(WALK_POSES[this.poseIndex]);
    }

    const dx = player.position.x - this.body.position.x;
    const dz = player.position.z - this.body.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > CONFIG.scarecrow.stopDistance) {
      const nx = dx / dist, nz = dz / dist;
      const speed = CONFIG.scarecrowSpeed.stalking * (CONFIG.babyMode ? 0.6 : 1);
      this.body.position.x += nx * speed * dt;
      this.body.position.z += nz * speed * dt;
      this.body.rotation.y = Math.atan2(nx, nz);
    }
  }
}
