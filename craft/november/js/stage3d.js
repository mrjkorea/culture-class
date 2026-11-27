/**
 * Thanksgiving craft play. Each stage is its own 3D action.
 * No photo backdrop: the props are the picture.
 */
import { createGlStage, THREE } from "./three-runtime.js";
import {
  buildBush,
  buildDiningTable,
  buildHayBale,
  buildPie,
  buildPlate,
  buildTurkey,
  texMat,
} from "./turkey-mesh.js?v=20261127-teacher-pin";

function popClick(gl, object, scaleBump = true) {
  if (!object) return;
  const mats = [];
  object.traverse?.((o) => {
    if (o.isMesh && o.material?.emissive) mats.push(o.material);
  });
  mats.forEach((m) => m.emissive.setHex(0xfff1c9));
  window.setTimeout(() => mats.forEach((m) => m.emissive.setHex(0x000000)), 160);
  if (scaleBump && object.scale) {
    const base = object.scale.clone();
    object.scale.multiplyScalar(1.16);
    window.setTimeout(() => object.scale?.copy(base), 160);
  }
  if (!gl?.scene) return;
  const origin = new THREE.Vector3();
  object.getWorldPosition(origin);
  const bits = [];
  for (let i = 0; i < 12; i += 1) {
    const bit = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 4),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffd56a : 0xfff6e4 })
    );
    bit.position.copy(origin);
    bit.userData.v = new THREE.Vector3((Math.random() - 0.5) * 1.8, 0.9 + Math.random() * 1.3, (Math.random() - 0.5) * 1.8);
    gl.scene.add(bit);
    bits.push(bit);
  }
  const t0 = performance.now();
  let last = t0;
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    bits.forEach((bit) => {
      bit.userData.v.y -= 4.5 * dt;
      bit.position.addScaledVector(bit.userData.v, dt);
      bit.scale.setScalar(Math.max(0.04, bit.scale.x - dt * 1.7));
    });
    if (now - t0 < 520) requestAnimationFrame(tick);
    else bits.forEach((bit) => {
      gl.scene.remove(bit);
      bit.geometry.dispose();
      bit.material.dispose();
    });
  }
  requestAnimationFrame(tick);
}

const FAMILY = [
  ["Mom", "엄마"],
  ["Dad", "아빠"],
  ["Grandma", "할머니"],
  ["Grandpa", "할아버지"],
  ["Uncle", "삼촌"],
  ["Aunt", "이모"],
  ["Brother", "오빠"],
  ["Sister", "언니"],
  ["Cousin", "사촌"],
  ["Baby", "아기"],
];

function hostMarkup(label, extraClass) {
  return `<div class="gl-host scene-3d gl-scene feast-gl ${extraClass}" data-play aria-label="${label}">
    <div class="gl-loading">Loading kitchen…</div>
  </div>`;
}

function begin(root, stage, extraClass, fov = 50) {
  root.innerHTML = hostMarkup(stage.title, extraClass);
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov, fog: false });
  if (!gl) return null;
  container.querySelector(".gl-loading")?.remove();
  gl.scene.background = new THREE.Color(0xf4e2c4);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(8, 24),
    new THREE.MeshLambertMaterial({ color: 0xe7c98a })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  gl.scene.add(floor);
  return { container, gl };
}

function end(container, gl, ...offs) {
  return {
    destroy() {
      offs.forEach((off) => off());
      gl.dispose();
    },
  };
}

function look(gl, x, y, z, tx, ty, tz) {
  gl.camera.position.set(x, y, z);
  gl.camera.lookAt(tx, ty, tz);
  gl.resize();
}

function wood() {
  return texMat(0x8b5a2b, "wood");
}

function nameLabel(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const g = canvas.getContext("2d");
  g.fillStyle = "#fff8e7";
  g.fillRect(0, 0, 256, 64);
  g.strokeStyle = "#8b5a2b";
  g.lineWidth = 6;
  g.strokeRect(4, 4, 248, 56);
  g.fillStyle = "#3a2410";
  g.font = "bold 36px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 128, 34);
  const tex = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.16),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  mesh.userData.label = true;
  return mesh;
}

function familyLabel(pair, lang) {
  if (lang === "ko") return pair[1];
  return pair[0];
}

export function mountHunt3D(root, stage, ctx) {
  const view = begin(root, stage, "gl-hunt", 52);
  if (!view) return null;
  const { container, gl } = view;
  const pool = 8;
  const hideCount = 3;
  const good = new Set();
  while (good.size < hideCount) good.add(Math.floor(Math.random() * pool));
  const hides = [];
  const cols = 4;
  for (let i = 0; i < pool; i += 1) {
    const hide = i % 2 === 0 ? buildHayBale(1.15) : buildBush(i + 4, 1.35);
    const col = i % cols;
    const row = Math.floor(i / cols);
    hide.position.set((col - 1.5) * 1.45, 0, (row - 0.5) * 1.5);
    hide.userData.index = i;
    hide.userData.alive = true;
    if (good.has(i)) {
      const turkey = buildTurkey(i + 20, 0.7);
      turkey.position.set(0, 0, 0.15);
      turkey.visible = false;
      hide.add(turkey);
      hide.userData.turkey = turkey;
    }
    hides.push(hide);
    gl.scene.add(hide);
  }
  look(gl, 0, 3.4, 4.6, 0, 0.3, 0);
  let found = 0;
  let finished = false;

  function settle(index) {
    const hide = hides[index];
    if (!hide?.userData.alive || finished) return;
    hide.userData.alive = false;
    ctx.sfx?.stage?.(stage.key);
    if (hide.userData.turkey) {
      hide.userData.turkey.visible = true;
      hide.userData.turkey.position.z = 0.55;
      found += 1;
      popClick(gl, hide);
      ctx.onProgress(found, hideCount);
      if (found >= hideCount) {
        finished = true;
        ctx.onComplete();
      }
      return;
    }
    hide.rotation.z = 0.4;
    ctx.onMiss?.();
  }

  function onPointer(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    const hits = gl.pick(hides, e.clientX, e.clientY);
    if (!hits.length) return;
    let node = hits[0].object;
    while (node && node.userData.index === undefined) node = node.parent;
    if (node) settle(node.userData.index);
  }
  container.addEventListener("pointerdown", onPointer);
  return end(container, gl, () => container.removeEventListener("pointerdown", onPointer));
}

export function mountPluck3D(root, stage, ctx) {
  const view = begin(root, stage, "gl-pluck", 46);
  if (!view) return null;
  const { container, gl } = view;
  const turkey = buildTurkey(7, 1.55, { withFeathers: true });
  turkey.position.y = 0.05;
  gl.scene.add(turkey);
  const feathers = turkey.userData.feathers.children.slice();
  const falling = [];
  look(gl, 0.55, 1.85, -3.6, 0, 0.9, 0);
  const total = feathers.length;
  let done = 0;
  let finished = false;

  gl.setFrame(() => {
    const now = performance.now();
    falling.forEach((f) => {
      const dt = Math.min(0.05, (now - (f.userData.last || now)) / 1000);
      f.userData.last = now;
      f.userData.vy = (f.userData.vy ?? -1.4) + 11 * dt;
      f.position.y -= f.userData.vy * dt;
      f.position.x += (f.userData.vx || 0) * dt;
      f.position.z += 0.8 * dt;
      f.rotation.x += 4 * dt;
      f.rotation.z += 3 * dt;
      const s = Math.max(0.05, f.scale.x - dt * 0.7);
      f.scale.setScalar(s);
      if (s <= 0.06) f.visible = false;
    });
  });

  function onPointer(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    const hits = gl.pick(feathers, e.clientX, e.clientY);
    let mesh = null;
    for (const hit of hits) {
      let node = hit.object;
      while (node && !node.userData.feather) node = node.parent;
      if (node && !node.userData.plucked) {
        mesh = node;
        break;
      }
    }
    if (!mesh) return;
    mesh.userData.plucked = true;
    popClick(gl, mesh, false);
    mesh.userData.vy = -1.4;
    mesh.userData.vx = Math.sign(mesh.position.x || (Math.random() - 0.5)) * 1.1;
    mesh.scale.setScalar(1.35);
    falling.push(mesh);
    done += 1;
    ctx.sfx?.stage?.(stage.key);
    ctx.onProgress(done, total);
    if (done >= total) {
      finished = true;
      ctx.onComplete();
    }
  }
  container.addEventListener("pointerdown", onPointer);
  return end(container, gl, () => container.removeEventListener("pointerdown", onPointer));
}

export function mountStuff3D(root, stage, ctx) {
  const view = begin(root, stage, "gl-stuff", 46);
  if (!view) return null;
  const { container, gl } = view;
  const turkey = buildTurkey(3, 1.55);
  turkey.position.set(0.55, 0.05, 0);
  turkey.rotation.y = -0.4;
  gl.scene.add(turkey);
  const cavity = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 18, 14),
    new THREE.MeshLambertMaterial({ color: 0x1a0c08 })
  );
  cavity.position.set(0.02, 0.62, 0.38);
  turkey.add(cavity);
  const stuffing = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 14, 10),
    texMat(0xe6c36a, "potato")
  );
  stuffing.position.copy(cavity.position);
  stuffing.scale.setScalar(0.15);
  turkey.add(stuffing);
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 20, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    texMat(0xfff8ee, "plate", { side: THREE.DoubleSide })
  );
  bowl.position.set(-1.05, 0.22, 0.15);
  gl.scene.add(bowl);
  const dress = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 14, 10),
    texMat(0xe2b84a, "potato")
  );
  dress.position.set(-1.05, 0.34, 0.15);
  gl.scene.add(dress);
  const spoon = new THREE.Group();
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8),
    texMat(0xc0c6cc, "steel")
  );
  handle.rotation.z = 0.8;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    texMat(0xd5dbe0, "steel", { side: THREE.DoubleSide })
  );
  head.position.set(0.22, -0.22, 0);
  spoon.add(handle, head);
  spoon.position.set(-0.85, 0.85, 0.4);
  gl.scene.add(spoon);
  look(gl, 0, 1.7, 3.6, 0, 0.55, 0);
  const total = stage.clicks || 80;
  let done = 0;
  let finished = false;
  let scoopStart = 0;

  gl.setFrame(() => {
    if (!scoopStart) return;
    const t = Math.min(1, (performance.now() - scoopStart) / 420);
    const scoop = t < 0.5 ? t * 2 : (1 - t) * 2;
    spoon.position.x = -0.85 + scoop * 1.15;
    spoon.position.y = 0.7 - Math.sin(t * Math.PI) * 0.25;
    if (t >= 1) scoopStart = 0;
  });

  function onPointer(e) {
    if (finished || (scoopStart && performance.now() - scoopStart < 420) || (e.button !== undefined && e.button !== 0)) return;
    const hits = gl.pick([bowl, dress, spoon, turkey], e.clientX, e.clientY);
    if (!hits.length) return;
    done += 1;
    scoopStart = performance.now();
    popClick(gl, spoon);
    stuffing.scale.setScalar(0.2 + (done / total) * 1.3);
    dress.scale.setScalar(Math.max(0.25, 1 - done / total));
    ctx.sfx?.stage?.(stage.key);
    ctx.onProgress(done, total);
    if (done >= total) {
      finished = true;
      window.setTimeout(() => ctx.onComplete(), 500);
    }
  }
  container.addEventListener("pointerdown", onPointer);
  return end(container, gl, () => container.removeEventListener("pointerdown", onPointer));
}

export function mountOven3D(root, stage, ctx) {
  const view = begin(root, stage, "gl-oven", 48);
  if (!view) return null;
  const { container, gl } = view;
  const wall = texMat(0x4a4e55, "oven");
  const shell = new THREE.Group();
  function panel(w, h, d, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wall);
    mesh.position.set(x, y, z);
    shell.add(mesh);
    return mesh;
  }
  panel(1.7, 0.08, 1.2, 0, 1.28, 0);
  panel(1.7, 0.1, 1.2, 0, 0.12, 0);
  panel(0.1, 1.16, 1.2, -0.8, 0.7, 0);
  panel(0.1, 1.16, 1.2, 0.8, 0.7, 0);
  panel(1.5, 1.16, 0.08, 0, 0.7, -0.54);
  const inside = new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 1.05),
    new THREE.MeshBasicMaterial({ color: 0x2a211c })
  );
  inside.position.set(0, 0.7, -0.49);
  shell.add(inside);
  const doorPivot = new THREE.Group();
  doorPivot.position.set(0, 0.35, 0.58);
  const doorMat = texMat(0x2f3338, "steel");
  function bar(w, h, x, y) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), doorMat);
    mesh.position.set(x, y, 0);
    return mesh;
  }
  const frame = [
    bar(1.22, 0.08, 0, 0.8),
    bar(1.22, 0.08, 0, 0.04),
    bar(0.08, 0.76, -0.57, 0.42),
    bar(0.08, 0.76, 0.57, 0.42),
  ];
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(1.02, 0.68, 0.02),
    new THREE.MeshLambertMaterial({
      color: 0xfff1d2,
      emissive: 0xff9a3c,
      emissiveIntensity: 0.12,
      transparent: true,
      opacity: 0.18,
    })
  );
  glass.position.set(0, 0.42, 0.02);
  const grab = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 1.05, 0.25),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  grab.position.y = 0.42;
  doorPivot.add(glass, grab, ...frame);
  doorPivot.rotation.x = -1.15;
  const turkey = buildTurkey(9, 0.62);
  turkey.position.set(0, 0.58, 0.08);
  const roastMats = [];
  turkey.traverse((o) => {
    if (o.isMesh && o.material?.color) {
      o.material = o.material.clone();
      o.userData.base = o.material.color.clone();
      roastMats.push(o);
    }
  });
  const heat = new THREE.PointLight(0xff7a22, 0, 2.4);
  heat.position.set(0, 0.75, 0.1);
  const oven = new THREE.Group();
  oven.add(shell, doorPivot, turkey, heat);
  gl.scene.add(oven);
  look(gl, 0, 1.35, 2.8, 0, 0.7, 0);
  const need = 8000;
  let held = 0;
  let holding = false;
  let holdStart = 0;
  let finished = false;
  const pale = new THREE.Color(0xf0d2b0);
  const gold = new THREE.Color(0xc4621a);

  function paint() {
    const t = Math.min(1, held / need);
    doorPivot.rotation.x = holding ? -0.08 : -1.15;
    roastMats.forEach((o) => {
      o.material.color.copy(o.userData.base).lerp(gold, t * 0.85);
      if (t < 0.05) o.material.color.copy(pale).lerp(o.userData.base, 0.35);
    });
    glass.material.emissiveIntensity = 0.12 + t * 1.4;
    heat.intensity = t * 2.4;
    ctx.onProgress(Math.floor(held / 1000), 8);
  }

  gl.setFrame(() => {
    if (finished) return;
    if (holding) held = Math.min(need, performance.now() - holdStart);
    if (holding && held >= need) {
      holding = false;
      finished = true;
      paint();
      ctx.onComplete();
      return;
    }
    paint();
  });

  function down(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    const hits = gl.pick([glass, grab, shell, ...frame], e.clientX, e.clientY);
    if (!hits.length) return;
    holding = true;
    holdStart = performance.now();
    popClick(gl, doorPivot);
    ctx.sfx?.stage?.(stage.key);
  }
  function up() {
    if (finished) return;
    if (holding) {
      holding = false;
      held = 0;
      paint();
    }
  }
  container.addEventListener("pointerdown", down);
  container.addEventListener("pointerup", up);
  container.addEventListener("pointerleave", up);
  container.addEventListener("pointercancel", up);
  return end(
    container,
    gl,
    () => container.removeEventListener("pointerdown", down),
    () => container.removeEventListener("pointerup", up),
    () => container.removeEventListener("pointerleave", up),
    () => container.removeEventListener("pointercancel", up)
  );
}

export function mountMash3D(root, stage, ctx) {
  const view = begin(root, stage, "gl-mash", 48);
  if (!view) return null;
  const { container, gl } = view;
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.48, 0.45, 16),
    texMat(0xd7dde2, "steel")
  );
  pot.position.y = 0.28;
  const spuds = new THREE.Group();
  for (let i = 0; i < 6; i += 1) {
    const spud = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 6),
      texMat(0xf3d7a1, "potato")
    );
    spud.scale.y = 0.75;
    spud.position.set(((i % 3) - 1) * 0.22, 0.42, (i < 3 ? -0.08 : 0.1));
    spuds.add(spud);
  }
  const masher = new THREE.Group();
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8),
    wood()
  );
  handle.position.y = 0.7;
  const plateMat = texMat(0x9aa3ab, "steel");
  for (let i = 0; i < 5; i += 1) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.035), plateMat);
    bar.position.set(0, 0.24, (i - 2) * 0.07);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 0.32), plateMat);
    cross.position.set((i - 2) * 0.1, 0.28, 0);
    masher.add(bar, cross);
  }
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.1), wood());
  grip.position.y = 1.12;
  masher.add(handle, grip);
  masher.position.y = 0.85;
  gl.scene.add(pot, spuds, masher);
  look(gl, 0.2, 1.5, 2.4, 0, 0.4, 0);
  const total = stage.clicks || 80;
  let done = 0;
  let finished = false;
  let smash = 0;

  gl.setFrame(() => {
    if (smash <= 0) {
      masher.position.y = 0.85;
      return;
    }
    smash -= 0.08;
    masher.position.y = 0.35 + Math.abs(smash) * 0.7;
  });

  function onPointer(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    const hits = gl.pick([pot, spuds, masher], e.clientX, e.clientY);
    if (!hits.length) return;
    done += 1;
    smash = 1;
    popClick(gl, masher);
    const squash = Math.max(0.28, 1 - done / total);
    spuds.children.forEach((spud) => {
      spud.scale.y = 0.75 * squash;
    });
    ctx.sfx?.stage?.(stage.key);
    ctx.onProgress(done, total);
    if (done >= total) {
      finished = true;
      ctx.onComplete();
    }
  }
  container.addEventListener("pointerdown", onPointer);
  return end(container, gl, () => container.removeEventListener("pointerdown", onPointer));
}

export function mountGravy3D(root, stage, ctx) {
  const view = begin(root, stage, "gl-gravy", 48);
  if (!view) return null;
  const { container, gl } = view;
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 18, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0xf4efe6, side: THREE.DoubleSide })
  );
  bowl.position.y = 0.34;
  const gravy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.22, 0.08, 12),
    texMat(0x7a3e12, "gravy")
  );
  gravy.position.y = 0.2;
  gravy.scale.y = 0.05;
  const stream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.05, 0.7, 8),
    texMat(0x8a4518, "gravy", { transparent: true, opacity: 0 })
  );
  stream.position.set(0, 0.85, 0);
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 0.28, 10),
    texMat(0x5c6570, "steel")
  );
  pot.position.set(0, 1.25, 0);
  gl.scene.add(bowl, gravy, stream, pot);
  look(gl, 0, 1.7, 2.8, 0, 0.4, 0);
  let holding = false;
  let fill = 0;
  let off = 0;
  let finished = false;
  let px = 0;
  let py = 0;
  let last = 0;
  const pourPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const pourHit = new THREE.Vector3();

  gl.setFrame((t) => {
    const nowMs = performance.now();
    const dt = last ? Math.min(0.25, (nowMs - last) / 1000) : 0;
    last = nowMs;
    bowl.position.x = Math.sin(t * 0.85) * 0.95;
    gravy.position.x = bowl.position.x;
    if (!holding || finished) {
      stream.material.opacity = 0;
      return;
    }
    const rect = gl.renderer.domElement.getBoundingClientRect();
    gl.pointer.x = rect.width ? ((px - rect.left) / rect.width) * 2 - 1 : 0;
    gl.pointer.y = rect.height ? -((py - rect.top) / rect.height) * 2 + 1 : 0;
    gl.raycaster.setFromCamera(gl.pointer, gl.camera);
    if (gl.raycaster.ray.intersectPlane(pourPlane, pourHit)) {
      stream.position.x = pourHit.x;
      pot.position.x = pourHit.x;
    }
    stream.material.opacity = 0.9;
    const aimed = Math.abs(stream.position.x - bowl.position.x) < 0.38;
    if (aimed) {
      off = 0;
      fill = Math.min(1, fill + dt * 0.05);
    } else {
      off += dt;
      if (off > 0.12) fill = 0;
    }
    gravy.scale.y = 0.05 + fill * 8;
    gravy.position.y = 0.18 + gravy.scale.y * 0.035;
    ctx.onProgress(Math.round(fill * 20), 20);
    if (fill >= 1) {
      finished = true;
      holding = false;
      ctx.onComplete();
    }
  });

  function down(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    holding = true;
    px = e.clientX;
    py = e.clientY;
  }
  function move(e) {
    px = e.clientX;
    py = e.clientY;
  }
  function up() {
    holding = false;
  }
  container.addEventListener("pointerdown", down);
  container.addEventListener("pointermove", move);
  container.addEventListener("pointerup", up);
  container.addEventListener("pointerleave", up);
  return end(
    container,
    gl,
    () => container.removeEventListener("pointerdown", down),
    () => container.removeEventListener("pointermove", move),
    () => container.removeEventListener("pointerup", up),
    () => container.removeEventListener("pointerleave", up)
  );
}

export function mountPie3D(root, stage, ctx) {
  const view = begin(root, stage, "gl-pie", 46);
  if (!view) return null;
  const { container, gl } = view;
  const pie = buildPie(1.7);
  pie.position.y = 0.05;
  gl.scene.add(pie);
  const creamMat = texMat(0xfffaf3, "cream");
  const total = stage.clicks || 100;
  const spots = [];
  for (let i = 0; i < total; i += 1) {
    const dollop = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), creamMat.clone());
    const ringIndex = i % 5;
    const a = (i / total) * Math.PI * 10 + ringIndex;
    const ring = 0.06 + (ringIndex / 5) * 0.42;
    dollop.position.set(Math.cos(a) * ring, 0.3 + (i % 3) * 0.02, Math.sin(a) * ring);
    dollop.scale.setScalar(0.01);
    pie.add(dollop);
    spots.push(dollop);
  }
  const can = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.45, 10),
    texMat(0xf2f2f2, "steel")
  );
  can.position.set(0.7, 0.7, 0.3);
  can.rotation.z = 0.6;
  gl.scene.add(can);
  look(gl, 0.3, 1.45, 2.3, 0, 0.25, 0);
  let done = 0;
  let finished = false;

  function onPointer(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    const hits = gl.pick([pie, can], e.clientX, e.clientY);
    if (!hits.length) return;
    const dollop = spots[done];
    if (!dollop) return;
    dollop.scale.setScalar(1);
    done += 1;
    popClick(gl, dollop);
    can.rotation.z = 1.1;
    window.setTimeout(() => {
      can.rotation.z = 0.6;
    }, 160);
    ctx.sfx?.stage?.(stage.key);
    ctx.onProgress(done, total);
    if (done >= total) {
      finished = true;
      ctx.onComplete();
    }
  }
  container.addEventListener("pointerdown", onPointer);
  return end(container, gl, () => container.removeEventListener("pointerdown", onPointer));
}

export function mountPlates3D(root, stage, ctx) {
  const view = begin(root, stage, "gl-plates", 48);
  if (!view) return null;
  const { container, gl } = view;
  const tableScale = 1.15;
  const table = buildDiningTable(tableScale);
  gl.scene.add(table);
  const topY = 0.72 * tableScale + 0.08 * tableScale * 0.5 + 0.03;
  const spots = [];
  for (let i = 0; i < 10; i += 1) {
    const col = i % 5;
    const row = i < 5 ? -1 : 1;
    const spot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.05, 24),
      new THREE.MeshBasicMaterial({ color: 0xf0a35a })
    );
    spot.position.set((col - 2) * 0.42, topY, row * 0.36);
    const hit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.4, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hit.position.y = 0.12;
    spot.add(hit);
    spot.userData.index = i;
    spot.userData.open = true;
    spots.push(spot);
    gl.scene.add(spot);
  }
  look(gl, 0, 2.35, 2.55, 0, 0.7, 0);
  let done = 0;
  let finished = false;

  function onPointer(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    const hits = gl.pick(spots, e.clientX, e.clientY);
    if (!hits.length) return;
    let spot = hits[0].object;
    while (spot && spot.userData.index === undefined) spot = spot.parent;
    if (!spot) return;
    if (!spot.userData.open) return;
    spot.userData.open = false;
    const plate = buildPlate(1.05);
    plate.position.set(spot.position.x, spot.position.y + 0.03, spot.position.z);
    gl.scene.add(plate);
    popClick(gl, plate);
    spot.material.color.set(0xc8e6c0);
    done += 1;
    ctx.sfx?.stage?.(stage.key);
    ctx.onProgress(done, 10);
    if (done >= 10) {
      finished = true;
      ctx.onComplete();
    }
  }
  container.addEventListener("pointerdown", onPointer);
  return end(container, gl, () => container.removeEventListener("pointerdown", onPointer));
}

export function mountSilver3D(root, stage, ctx) {
  const view = begin(root, stage, "gl-silver", 50);
  if (!view) return null;
  const { container, gl } = view;
  const tableScale = 1.15;
  const table = buildDiningTable(tableScale);
  gl.scene.add(table);
  const topY = 0.72 * tableScale + 0.04 * tableScale;
  const metal = new THREE.MeshLambertMaterial({ color: 0xf4f7fa });
  const glassMat = new THREE.MeshLambertMaterial({
    color: 0x8ecff5,
    transparent: true,
    opacity: 0.82,
  });
  function band(color, y) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.07, 0.018, 8, 16),
      new THREE.MeshBasicMaterial({ color })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    return ring;
  }
  function fork() {
    const g = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.62, 12), metal);
    handle.position.y = 0.34;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.04), metal);
    neck.position.y = 0.68;
    g.add(handle, neck, band(0xf0a35a, 0.5));
    for (let i = 0; i < 4; i += 1) {
      const tine = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.28, 0.03), metal);
      tine.position.set((i - 1.5) * 0.05, 0.84, 0);
      g.add(tine);
    }
    return g;
  }
  function spoon() {
    const g = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.048, 0.62, 12), metal);
    handle.position.y = 0.34;
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), metal);
    bowl.scale.set(1, 0.55, 0.72);
    bowl.position.y = 0.78;
    g.add(handle, bowl, band(0xe07a2f, 0.5));
    return g;
  }
  function glassCup() {
    const g = new THREE.Group();
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.46, 20), glassMat);
    cup.position.y = 0.28;
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.02, 8, 20),
      new THREE.MeshBasicMaterial({ color: 0x2f6f9a })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.5;
    g.add(cup, rim);
    return g;
  }
  const kinds = [
    { kind: "fork", label: "Fork", color: 0xf0a35a, mesh: fork() },
    { kind: "spoon", label: "Spoon", color: 0xe07a2f, mesh: spoon() },
    { kind: "glass", label: "Glass", color: 0x2f6f9a, mesh: glassCup() },
  ];
  const spots = [];
  kinds.forEach((item, i) => {
    const x = (i - 1) * 0.62;
    item.mesh.position.set(x, topY, 0.38);
    item.home = item.mesh.position.clone();
    item.mesh.userData.kind = item.kind;
    const tag = nameLabel(item.label);
    tag.position.set(0, item.kind === "glass" ? 0.72 : 1.12, 0);
    tag.scale.setScalar(1.15);
    item.mesh.add(tag);
    item.tag = tag;
    gl.scene.add(item.mesh);
    const spot = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.28, 28),
      new THREE.MeshBasicMaterial({ color: item.color, side: THREE.DoubleSide })
    );
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(x, topY + 0.03, -0.28);
    spot.userData.kind = item.kind;
    const spotTag = nameLabel(item.label);
    spotTag.position.set(x, topY + 0.22, -0.28);
    spots.push(spot);
    gl.scene.add(spot, spotTag);
    item.spotTag = spotTag;
  });
  function frame() {
    gl.resize();
    const aspect = Math.max(0.45, gl.camera.aspect || 1);
    const fov = 46;
    gl.camera.fov = fov;
    gl.camera.aspect = aspect;
    gl.camera.updateProjectionMatrix();
    const halfH = Math.tan((fov * Math.PI) / 360);
    const halfW = halfH * aspect;
    const dist = Math.max(2.3, 1.2 / halfH, 1.15 / halfW);
    gl.camera.position.set(0, 1.2 + dist * 0.38, dist * 0.9);
    gl.camera.lookAt(0, 1.2, 0.05);
    kinds.forEach((item) => {
      item.tag.lookAt(gl.camera.position);
      item.spotTag.lookAt(gl.camera.position);
    });
  }
  frame();
  const frameObserver = new ResizeObserver(frame);
  frameObserver.observe(container);
  const need = 10;
  const counts = { fork: 0, spoon: 0, glass: 0 };
  const countBar = document.createElement("div");
  countBar.className = "silver-counts";
  kinds.forEach((item) => {
    const bit = document.createElement("span");
    bit.dataset.kind = item.kind;
    bit.textContent = `${item.label} 0/${need}`;
    countBar.append(bit);
  });
  container.append(countBar);
  let drag = null;
  let finished = false;
  let placed = 0;
  const dragY = topY + 0.08;
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -dragY);
  const hitPoint = new THREE.Vector3();

  function pileSlot(index, n) {
    const baseX = (index - 1) * 0.62;
    const col = n % 5;
    const row = Math.floor(n / 5);
    return {
      x: baseX + (col - 2) * 0.11,
      z: -0.46 + row * 0.18,
    };
  }

  function paintCounts() {
    countBar.querySelectorAll("span").forEach((bit) => {
      const item = kinds.find((row) => row.kind === bit.dataset.kind);
      bit.textContent = `${item.label} ${counts[item.kind]}/${need}`;
    });
  }

  function onDown(e) {
    if (finished || drag || (e.button !== undefined && e.button !== 0)) return;
    const hits = gl.pick(kinds.map((item) => item.mesh), e.clientX, e.clientY);
    if (!hits.length) return;
    let node = hits[0].object;
    while (node && !node.userData.kind) node = node.parent;
    drag = kinds.find((item) => item.mesh === node && !item.done);
    if (!drag) return;
    drag.mesh.position.y = dragY + 0.12;
    try { container.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  }
  function onMove(e) {
    if (!drag) return;
    const rect = gl.renderer.domElement.getBoundingClientRect();
    gl.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    gl.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    gl.raycaster.setFromCamera(gl.pointer, gl.camera);
    if (gl.raycaster.ray.intersectPlane(plane, hitPoint)) {
      drag.mesh.position.x = hitPoint.x;
      drag.mesh.position.z = hitPoint.z;
    }
  }
  function onUp() {
    if (!drag) return;
    const spot = spots.find((s) => s.userData.kind === drag.kind && !s.userData.filled);
    const close = spot && counts[drag.kind] < need && drag.mesh.position.distanceTo(spot.position) < 0.62;
    if (close) {
      const n = counts[drag.kind];
      const copy = drag.mesh.clone(true);
      const labels = [];
      copy.traverse((node) => {
        if (node.userData?.label) labels.push(node);
      });
      labels.forEach((node) => node.parent?.remove(node));
      copy.userData.kind = "";
      copy.scale.setScalar(0.32);
      const slot = pileSlot(kinds.indexOf(drag), n);
      copy.position.set(slot.x, topY, slot.z);
      gl.scene.add(copy);
      counts[drag.kind] += 1;
      placed += 1;
      paintCounts();
      drag.mesh.position.copy(drag.home);
      if (counts[drag.kind] >= need) {
        drag.done = true;
        drag.mesh.visible = false;
        spot.material.color.set(0x7dcea0);
      }
      ctx.sfx?.stage?.(stage.key);
      ctx.onProgress(placed, need * 3);
      if (placed >= need * 3) {
        finished = true;
        ctx.onComplete();
      }
    } else {
      drag.mesh.position.copy(drag.home);
    }
    drag = null;
  }
  container.addEventListener("pointerdown", onDown);
  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerup", onUp);
  container.addEventListener("pointercancel", onUp);
  return end(
    container,
    gl,
    () => frameObserver.disconnect(),
    () => container.removeEventListener("pointerdown", onDown),
    () => container.removeEventListener("pointermove", onMove),
    () => container.removeEventListener("pointerup", onUp),
    () => container.removeEventListener("pointercancel", onUp),
    () => countBar.remove()
  );
}

export function mountSeat3D(root, stage, ctx) {
  const view = begin(root, stage, "gl-seat", 48);
  if (!view) return null;
  const { container, gl } = view;
  const table = buildDiningTable(1.8);
  gl.scene.add(table);
  const lang = ctx.uiLang === "ko" ? "ko" : "en";
  const chairs = [];
  FAMILY.forEach((pair, i) => {
    const side = i < 5 ? -1 : 1;
    const along = ((i % 5) - 2) * 0.62;
    const chair = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.38), wood());
    seat.position.y = 0.48;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.06), wood());
    back.position.set(0, 0.72, side * -0.16);
    chair.add(seat, back);
    const label = nameLabel(familyLabel(pair, lang));
    label.position.set(0, 1.05, 0);
    chair.add(label);
    chair.position.set(along * 1.8, 0, side * 0.95);
    chair.userData.name = pair[0];
    const pick = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 1.05, 0.55),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    pick.position.y = 0.55;
    pick.userData.name = pair[0];
    chair.add(pick);
    chairs.push(chair);
    gl.scene.add(chair);
  });
  look(gl, 0, 3.6, 4.2, 0, 0.7, 0);
  const tray = document.createElement("div");
  tray.className = "name-tray";
  const order = FAMILY.slice();
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  order.forEach((pair) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "name-chip";
    chip.textContent = familyLabel(pair, lang);
    chip.dataset.name = pair[0];
    tray.append(chip);
  });
  container.append(tray);
  let dragChip = null;
  let finished = false;
  let seated = 0;
  const peopleMat = new THREE.MeshLambertMaterial({ color: 0xf1c7a3 });

  function onDown(e) {
    const chip = e.target.closest?.(".name-chip");
    if (!chip || chip.disabled || finished) return;
    dragChip = chip;
    chip.classList.add("is-dragging");
  }
  function onMove(e) {
    if (!dragChip) return;
    dragChip.style.position = "fixed";
    dragChip.style.left = `${e.clientX - 30}px`;
    dragChip.style.top = `${e.clientY - 16}px`;
    dragChip.style.zIndex = "6";
  }
  function onUp(e) {
    if (!dragChip || finished) return;
    const hits = gl.pick(chairs, e.clientX, e.clientY);
    let node = hits[0]?.object;
    while (node && !node.userData.name) node = node.parent;
    const chip = dragChip;
    dragChip = null;
    chip.classList.remove("is-dragging");
    chip.style.position = "";
    chip.style.left = "";
    chip.style.top = "";
    if (!node || node.userData.filled || node.userData.name !== chip.dataset.name) {
      chip.classList.add("is-wrong");
      window.setTimeout(() => chip.classList.remove("is-wrong"), 280);
      return;
    }
    node.userData.filled = true;
    const person = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.22, 2, 6), peopleMat);
    person.position.set(0, 0.75, 0);
    node.add(person);
    popClick(gl, person);
    chip.disabled = true;
    chip.classList.add("is-seated");
    seated += 1;
    ctx.sfx?.stage?.(stage.key);
    ctx.onProgress(seated, 10);
    if (seated >= 10) {
      finished = true;
      ctx.onComplete();
    }
  }
  container.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  return end(
    container,
    gl,
    () => container.removeEventListener("pointerdown", onDown),
    () => window.removeEventListener("pointermove", onMove),
    () => window.removeEventListener("pointerup", onUp),
    () => tray.remove()
  );
}
