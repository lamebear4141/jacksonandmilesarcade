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

  // The spec's suggested intensities (ambient ~0.12, moon ~0.28) are tuned for
  // three.js's older "legacy lights" mode. Modern three.js (r155+) removed that
  // mode, so those numbers render as literal black on MeshLambertMaterial now —
  // confirmed by direct pixel sampling. These values reproduce the same *dark,
  // moon-and-lantern-only* mood the spec describes, just recalibrated so the
  // ground is dim but actually visible.
  scene.add(new THREE.AmbientLight(0x404060, 5));
  const moonLight = new THREE.DirectionalLight(0xaab4ff, 10);
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
  const porchLight = new THREE.PointLight(0xffa64a, 35, 11, 2);
  porchLight.position.set(-14, 3, -19.2);
  scene.add(porchLight);

  // ---- Hollow-building helper: four walls with a door gap in one, plus a roof.
  // Used for the barn and silo, which the player has to walk into. ----
  function addWallSeg(cx, cz, w, d, h, mat) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    wall.position.set(cx, h / 2, cz);
    scene.add(wall);
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(cx, h / 2, cz), new THREE.Vector3(w, h, d)
    ));
  }

  const ladders = [];
  const platforms = [];
  let barnLoft, siloTop;

  // ---- Barn — enterable, two floors. Key 1 is on the hayloft. ----
  {
    const cx = -24, cz = 8, w = 10, d = 14, h = 7, t = 0.3;
    const x0 = cx - w / 2, x1 = cx + w / 2; // -29 .. -19
    const z0 = cz - d / 2, z1 = cz + d / 2; // 1 .. 15
    const wallMat = new THREE.MeshLambertMaterial({ map: makeNoiseTexture('#7a2f28', 16, 16) });

    addWallSeg(x0, cz, t, d, h, wallMat);                 // west wall
    addWallSeg(cx, z1, w, t, h, wallMat);                 // north wall (back)
    addWallSeg(cx, z0, w, t, h, wallMat);                 // south wall
    // east wall, split for a doorway facing the driveway
    addWallSeg(x1, cz - 4.125, t, d - 8.25, h, wallMat);
    addWallSeg(x1, cz + 4.125, t, d - 8.25, h, wallMat);

    const roofMat = new THREE.MeshLambertMaterial({ color: '#3a2018' });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 4, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(cx, h + 4 / 2 - 0.15, cz);
    scene.add(roof);

    const floorMat = new THREE.MeshLambertMaterial({ map: makeNoiseTexture('#4a2f1a', 16, 14) });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.6, d - 0.6), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0.02, cz);
    scene.add(floor);

    // Hayloft along the back (north) wall.
    const loft = { minX: x0 + t, maxX: x1 - t, minZ: z1 - 3.7, maxZ: z1 - t, y: 3.4 };
    platforms.push(loft);
    const loftMesh = new THREE.Mesh(
      new THREE.BoxGeometry(loft.maxX - loft.minX, 0.25, loft.maxZ - loft.minZ),
      floorMat
    );
    loftMesh.position.set(cx, loft.y - 0.12, (loft.minZ + loft.maxZ) / 2);
    scene.add(loftMesh);

    const ladder = { x: cx, z: loft.minZ - 0.5, bottomY: 0, topY: loft.y, radius: 0.7, exitDir: { x: 0, z: 1 } };
    ladders.push(ladder);
    const railMat = new THREE.MeshLambertMaterial({ color: '#c9b98a' });
    for (const dx of [-0.35, 0.35]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, ladder.topY, 0.08), railMat);
      rail.position.set(ladder.x + dx, ladder.topY / 2, ladder.z);
      scene.add(rail);
    }
    for (let ry = 0.3; ry < ladder.topY; ry += 0.35) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.06), railMat);
      rung.position.set(ladder.x, ry, ladder.z);
      scene.add(rung);
    }

    barnLoft = loft;
  }

  // ---- Silo — tall, hollow, one straight ladder up a dark shaft. Key 2 at the top. ----
  {
    const cx = 22, cz = 16, w = 5.5, d = 5.5, h = 12, t = 0.3;
    const x0 = cx - w / 2, x1 = cx + w / 2; // 19.25 .. 24.75
    const z0 = cz - d / 2, z1 = cz + d / 2; // 13.25 .. 18.75
    const wallMat = new THREE.MeshLambertMaterial({ map: makeNoiseTexture('#8a7f6a', 16, 14) });

    addWallSeg(x0, cz, t, d, h, wallMat);   // west
    addWallSeg(x1, cz, t, d, h, wallMat);   // east
    addWallSeg(cx, z1, w, t, h, wallMat);   // north
    // south wall, split for a doorway
    addWallSeg(cx - 1.6875, z0, w / 2 - 1.15, t, h, wallMat);
    addWallSeg(cx + 1.6875, z0, w / 2 - 1.15, t, h, wallMat);

    const roofMat = new THREE.MeshLambertMaterial({ color: '#4a3a2a' });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 2.4, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(cx, h + 2.4 / 2 - 0.15, cz);
    scene.add(roof);

    const top = { minX: x0 + 0.75, maxX: x1 - 0.75, minZ: z0 + 0.75, maxZ: z1 - 0.75, y: 10.6 };
    platforms.push(top);
    const topMat = new THREE.MeshLambertMaterial({ color: '#4a4238' });
    const topMesh = new THREE.Mesh(new THREE.BoxGeometry(top.maxX - top.minX, 0.25, top.maxZ - top.minZ), topMat);
    topMesh.position.set(cx, top.y - 0.12, cz);
    scene.add(topMesh);

    const ladder = { x: cx, z: cz, bottomY: 0, topY: top.y, radius: 0.9, exitDir: { x: 0, z: 1 } };
    ladders.push(ladder);
    const railMat = new THREE.MeshLambertMaterial({ color: '#8a8272' });
    for (const dx of [-0.4, 0.4]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, ladder.topY, 0.08), railMat);
      rail.position.set(ladder.x + dx, ladder.topY / 2, ladder.z);
      scene.add(rail);
    }
    for (let ry = 0.3; ry < ladder.topY; ry += 0.35) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.06), railMat);
      rung.position.set(ladder.x, ry, ladder.z);
      scene.add(rung);
    }

    siloTop = top;
  }

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
      const l = new THREE.PointLight(0xff8a2a, 20, 6, 2);
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

  // ---- Front gate — chained shut. Opens when all three keys are handed in. ----
  let gate;
  {
    const gx = 0, gz = -38;
    const postMat = new THREE.MeshLambertMaterial({ color: '#4a3a2a' });
    [-2.3, 2.3].forEach((dx) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), postMat);
      post.position.set(gx + dx, 1.1, gz);
      scene.add(post);
      colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(gx + dx, 1.1, gz), new THREE.Vector3(0.3, 2.2, 0.3)
      ));
    });

    const hinge = new THREE.Group();
    hinge.position.set(gx - 2.15, 0, gz);
    scene.add(hinge);
    const panelMat = new THREE.MeshLambertMaterial({ color: '#3a2a1a' });
    const panel = new THREE.Mesh(new THREE.BoxGeometry(4.3, 1.8, 0.12), panelMat);
    panel.position.set(2.15, 1.0, 0);
    hinge.add(panel);

    const chainMat = new THREE.MeshLambertMaterial({ color: '#2a2a2a' });
    const chain = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3), chainMat);
    chain.position.set(2.15, 1.0, 0.1);
    hinge.add(chain);

    const gateCollider = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(gx, 1.0, gz), new THREE.Vector3(4.6, 1.8, 0.4)
    );
    colliders.push(gateCollider);

    gate = { hinge, panel, chain, collider: gateCollider, position: new THREE.Vector3(gx, 1.0, gz) };
  }

  return {
    colliders,
    spawnPoint: new THREE.Vector3(0, 0, -30),
    ladders,
    platforms,
    keySpots: {
      barn: new THREE.Vector3(-24, barnLoft.y + 0.35, (barnLoft.minZ + barnLoft.maxZ) / 2),
      silo: new THREE.Vector3(22, siloTop.y + 0.35, 16),
      corn: new THREE.Vector3(0, 1.0, 30),
    },
    gate,
  };
}
