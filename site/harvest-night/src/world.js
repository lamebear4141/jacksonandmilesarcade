// world.js — terrain, buildings, cornfield, props. Pure world-building; no
// game logic lives here. buildWorld() returns colliders (solid boxes the
// player can't walk through) and a spawn point.

import * as THREE from 'three';
import { CONFIG } from './config.js';

// ---------- Procedural textures (16x16 canvas noise, NearestFilter) ----------

function makeNoiseTexture(baseColorHex, size = 16, variance = 20) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const base = new THREE.Color(baseColorHex);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = (Math.random() - 0.5) * variance;
    const r = THREE.MathUtils.clamp(base.r * 255 + v, 0, 255);
    const g = THREE.MathUtils.clamp(base.g * 255 + v, 0, 255);
    const b = THREE.MathUtils.clamp(base.b * 255 + v, 0, 255);
    const idx = i * 4;
    img.data[idx] = r;
    img.data[idx + 1] = g;
    img.data[idx + 2] = b;
    img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#0a0e1a');
  grad.addColorStop(1, '#1a1430');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

function makeMoonTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,250,230,1)');
  grad.addColorStop(0.4, 'rgba(255,250,230,0.85)');
  grad.addColorStop(1, 'rgba(255,250,230,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

// ---------- Surface lookup, for footstep audio ----------

export function surfaceAt(x, z) {
  if (Math.abs(x) < 2.6 && z > -40 && z < 2) return 'dirt';
  return 'grass';
}

// ---------- World builder ----------

export function buildWorld(scene) {
  const colliders = [];
  const half = CONFIG.world.size / 2;

  // ---- Sky + moon ----
  const skyGeo = new THREE.SphereGeometry(400, 16, 12);
  const skyMat = new THREE.MeshBasicMaterial({ map: makeSkyTexture(), side: THREE.BackSide, fog: false });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  const moonMat = new THREE.MeshBasicMaterial({
    map: makeMoonTexture(), transparent: true, depthWrite: false, fog: false,
  });
  const moon = new THREE.Mesh(new THREE.PlaneGeometry(45, 45), moonMat);
  moon.position.set(70, 90, -120);
  moon.lookAt(0, 20, 0);
  scene.add(moon);

  // ---- Fog & lights ----
  scene.fog = new THREE.FogExp2(0x0d1020, CONFIG.fogDensity);
  scene.background = new THREE.Color(0x0d1020);

  scene.add(new THREE.AmbientLight(0x404060, 0.12));
  const moonLight = new THREE.DirectionalLight(0xaab4ff, 0.28);
  moonLight.position.set(70, 90, -120);
  scene.add(moonLight);

  // ---- Ground ----
  const grassTex = makeNoiseTexture('#2d3a1f', 16, 22);
  grassTex.repeat.set(CONFIG.world.size / 2, CONFIG.world.size / 2);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.world.size, CONFIG.world.size),
    new THREE.MeshLambertMaterial({ map: grassTex })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // ---- Dirt path (driveway through the farm) ----
  const dirtTex = makeNoiseTexture('#3d2f1f', 16, 24);
  dirtTex.repeat.set(2, 14);
  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 60),
    new THREE.MeshLambertMaterial({ map: dirtTex })
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.01, -19);
  scene.add(path);

  // ---- Fence (instanced posts, all four sides) ----
  const fenceTex = makeNoiseTexture('#5a4a35', 16, 18);
  const postGeo = new THREE.BoxGeometry(0.18, 1.3, 0.18);
  const postMat = new THREE.MeshLambertMaterial({ map: fenceTex });
  const postPositions = [];
  const spacing = 4;
  for (let x = -half; x <= half; x += spacing) {
    postPositions.push([x, -half]);
    postPositions.push([x, half]);
  }
  for (let z = -half + spacing; z < half; z += spacing) {
    postPositions.push([-half, z]);
    postPositions.push([half, z]);
  }
  const fence = new THREE.InstancedMesh(postGeo, postMat, postPositions.length);
  const dummy = new THREE.Object3D();
  postPositions.forEach(([x, z], i) => {
    dummy.position.set(x, 0.65, z);
    dummy.rotation.y = Math.random() * 0.1;
    dummy.updateMatrix();
    fence.setMatrixAt(i, dummy.matrix);
  });
  fence.instanceMatrix.needsUpdate = true;
  scene.add(fence);

  // ---- Building helper ----
  function addBuilding(x, z, w, h, d, color, opts = {}) {
    const group = new THREE.Group();
    const wallTex = makeNoiseTexture(color, 16, 16);
    const wallMat = new THREE.MeshLambertMaterial({ map: wallTex });
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    body.position.y = h / 2;
    group.add(body);

    if (opts.roof) {
      const roofMat = new THREE.MeshLambertMaterial({ color: opts.roofColor || '#3a2a20' });
      const roofH = opts.roofHeight || 2.5;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, roofH, 4), roofMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = h + roofH / 2 - 0.15;
      group.add(roof);
    }
    if (opts.trim) {
      const trimMat = new THREE.MeshLambertMaterial({ color: opts.trim });
      const band = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.3, d + 0.06), trimMat);
      band.position.y = h - 0.3;
      group.add(band);
    }
    group.position.set(x, 0, z);
    scene.add(group);

    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, h / 2, z),
      new THREE.Vector3(w, h, d)
    ));
    return group;
  }

  // Farmhouse — locked, decorative. Porch light works.
  addBuilding(-14, -22, 6, 4.5, 6, '#4a3a2a', { roof: true, roofHeight: 3, roofColor: '#2a1f18' });
  const porchLight = new THREE.PointLight(0xffa64a, 0.9, 11, 2);
  porchLight.position.set(-14, 3, -19.2);
  scene.add(porchLight);

  // Barn — big, red with light trim.
  addBuilding(-24, 8, 10, 7, 14, '#7a2f28', { roof: true, roofHeight: 4, roofColor: '#3a2018', trim: '#d8d4c8' });

  // Silo — tall boxy tower with a conical cap.
  addBuilding(22, 16, 5.5, 12, 5.5, '#8a7f6a', { roof: true, roofHeight: 2.4, roofColor: '#4a3a2a' });

  // ---- Water tower ----
  {
    const legMat = new THREE.MeshLambertMaterial({ color: '#5a5248' });
    const legGeo = new THREE.BoxGeometry(0.3, 8, 0.3);
    [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(([dx, dz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(26 + dx, 4, -10 + dz);
      scene.add(leg);
    });
    const tankMat = new THREE.MeshLambertMaterial({ color: '#6a6255' });
    const tank = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4, 4.5), tankMat);
    tank.position.set(26, 10, -10);
    scene.add(tank);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.6, 4), tankMat);
    cap.rotation.y = Math.PI / 4;
    cap.position.set(26, 12.8, -10);
    scene.add(cap);
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(26, 5, -10), new THREE.Vector3(3.2, 10, 3.2)
    ));
  }

  // ---- Tractor (prop, crouch behind it) ----
  {
    const bodyMat = new THREE.MeshLambertMaterial({ color: '#8a3a2a' });
    const wheelMat = new THREE.MeshLambertMaterial({ color: '#1a1a1a' });
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, 3.6), bodyMat);
    body.position.y = 1;
    group.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), bodyMat);
    cab.position.set(0, 1.9, -0.8);
    group.add(cab);
    [[0.9, 0.5, 1.2], [-0.9, 0.5, 1.2], [0.9, 0.5, -1.2], [-0.9, 0.5, -1.2]].forEach(([x, y, z]) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.5), wheelMat);
      w.position.set(x, y, z);
      group.add(w);
    });
    group.position.set(-8, 0, -6);
    group.rotation.y = 0.4;
    scene.add(group);
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(-8, 1, -6), new THREE.Vector3(2.8, 2, 4.2)
    ));
  }

  // ---- Cornfield (instanced stalks, two-tone) ----
  {
    const stalkGeo = new THREE.BoxGeometry(0.18, 1, 0.18);
    const stalkMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const colorA = new THREE.Color('#6b5a2a');
    const colorB = new THREE.Color('#4a3f1d');
    const cx = 0, cz = 26, cw = 34, cd = 22;
    const spacing2 = 1.1;
    const cells = [];
    for (let x = cx - cw / 2; x <= cx + cw / 2; x += spacing2) {
      for (let z = cz - cd / 2; z <= cz + cd / 2; z += spacing2) {
        const dx = x, dz = z - 30; // small clearing around the scarecrow post
        if (Math.sqrt(dx * dx + dz * dz) < 3) continue;
        cells.push([x + (Math.random() - 0.5) * 0.5, z + (Math.random() - 0.5) * 0.5]);
      }
    }
    const corn = new THREE.InstancedMesh(stalkGeo, stalkMat, cells.length);
    const d2 = new THREE.Object3D();
    for (let i = 0; i < cells.length; i++) {
      const [x, z] = cells[i];
      const h = 2.0 + Math.random() * 0.6;
      d2.position.set(x, h / 2, z);
      d2.rotation.y = Math.random() * Math.PI;
      d2.scale.set(1, h, 1);
      d2.updateMatrix();
      corn.setMatrixAt(i, d2.matrix);
      corn.setColorAt(i, Math.random() < 0.5 ? colorA : colorB);
    }
    corn.instanceMatrix.needsUpdate = true;
    corn.instanceColor.needsUpdate = true;
    scene.add(corn);
  }

  // ---- Scatter props ----
  function addHayBale(x, z, ry = 0) {
    const mat = new THREE.MeshLambertMaterial({ color: '#b89b4a' });
    const bale = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 0.8), mat);
    bale.position.set(x, 0.4, z);
    bale.rotation.y = ry;
    scene.add(bale);
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 0.4, z), new THREE.Vector3(1.1, 0.8, 0.8)
    ));
  }
  [[-20, 2], [-19, 3.2], [-6, -10], [3, -14], [-2, 18]].forEach(([x, z], i) => addHayBale(x, z, i));

  function addPumpkin(x, z, withLight = false) {
    const mat = new THREE.MeshLambertMaterial({ color: '#d4681a', emissive: '#7a2f00', emissiveIntensity: 0.6 });
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), mat);
    p.position.set(x, 0.35, z);
    scene.add(p);
    if (withLight) {
      const l = new THREE.PointLight(0xff8a2a, 0.55, 6, 2);
      l.position.set(x, 0.6, z);
      scene.add(l);
    }
  }
  [[-2, -28], [2, -24], [-16, -10], [10, -16], [18, 10], [-18, -2], [6, 4], [-4, 22]]
    .forEach(([x, z], i) => addPumpkin(x, z, i % 2 === 0));

  function addDeadTree(x, z) {
    const mat = new THREE.MeshLambertMaterial({ color: '#2a1f18' });
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.5, 0.35), mat);
    trunk.position.set(x, 1.75, z);
    scene.add(trunk);
    for (let i = 0; i < 3; i++) {
      const branch = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.2), mat);
      branch.position.set(x + (Math.random() - 0.5) * 0.6, 2.6 + i * 0.4, z + (Math.random() - 0.5) * 0.6);
      branch.rotation.z = (Math.random() - 0.5) * 1.2;
      branch.rotation.y = Math.random() * Math.PI;
      scene.add(branch);
    }
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 1.75, z), new THREE.Vector3(0.6, 3.5, 0.6)
    ));
  }
  [[14, -4], [-30, -16], [30, 4]].forEach(([x, z]) => addDeadTree(x, z));

  function addCrates(x, z) {
    const mat = new THREE.MeshLambertMaterial({ color: '#6a4a2a' });
    [[0, 0.3, 0], [0.5, 0.3, 0.2], [0, 0.9, 0]].forEach(([dx, dy, dz]) => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), mat);
      c.position.set(x + dx, dy, z + dz);
      scene.add(c);
    });
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x + 0.2, 0.5, z + 0.1), new THREE.Vector3(1.4, 1.2, 1.2)
    ));
  }
  addCrates(-20, 6);
  addCrates(18, 20);

  function addWell(x, z) {
    const mat = new THREE.MeshLambertMaterial({ color: '#5a5245' });
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.9, 8), mat);
    ring.position.set(x, 0.45, z);
    scene.add(ring);
    const postMat = new THREE.MeshLambertMaterial({ color: '#3a2a1a' });
    [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([dx, dz]) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), postMat);
      post.position.set(x + dx, 1.4, z + dz);
      scene.add(post);
    });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1, 4), postMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(x, 2.6, z);
    scene.add(roof);
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 0.45, z), new THREE.Vector3(1.8, 0.9, 1.8)
    ));
  }
  addWell(-8, -18);

  return {
    colliders,
    spawnPoint: new THREE.Vector3(0, 0, -30),
  };
}
