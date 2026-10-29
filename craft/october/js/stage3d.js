/**
 * three.js interactive stages (patch luck hunt, cut top, wash).
 */
import { createGlStage, THREE } from "./three-runtime.js";
import { buildKnife, buildPatchGround, buildPumpkin } from "./pumpkin-mesh.js";

function hostMarkup(label) {
  return `<div class="gl-host scene-3d gl-scene" data-play aria-label="${label}">
    <div class="gl-loading">Loading 3D…</div>
  </div>`;
}

function findPumpkinIndex(hit) {
  let o = hit.object;
  while (o) {
    if (o.userData?.pumpkinIndex !== undefined) return o.userData.pumpkinIndex;
    o = o.parent;
  }
  return -1;
}

export function mountPatch3D(root, stage, ctx) {
  root.innerHTML = hostMarkup(stage.title);
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov: 54, fog: true });
  if (!gl) {
    return null;
  }
  container.querySelector(".gl-loading")?.remove();

  const good = new Set();
  const pool = stage.poolSize;
  while (good.size < stage.goodCount) {
    good.add(Math.floor(Math.random() * pool));
  }

  const { ground, vines, fencePosts } = buildPatchGround();
  gl.scene.add(ground, vines, fencePosts);

  const cols = Math.ceil(Math.sqrt(pool));
  const rows = Math.ceil(pool / cols);
  const pumpkins = [];
  const pickRoots = [];
  let found = 0;
  let finished = false;
  const spacing = pool > 24 ? 1.05 : 1.25;
  const pumpScale = pool > 24 ? 0.78 : 0.92;

  for (let i = 0; i < pool; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const px = (col - (cols - 1) / 2) * spacing;
    const pz = (row - (rows - 1) / 2) * (spacing * 0.95) + 0.6;
    const pump = buildPumpkin(i + 7, pumpScale);
    pump.position.set(px, 0, pz);
    pump.userData.pumpkinIndex = i;
    pump.userData.alive = true;
    pumpkins.push(pump);
    gl.scene.add(pump);

    const pick = new THREE.Mesh(
      new THREE.SphereGeometry(0.42 + pumpScale * 0.35, 10, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    pick.position.set(px, 0.38 * pumpScale, pz);
    pick.userData.pumpkinIndex = i;
    pick.userData.alive = true;
    pickRoots.push(pick);
    gl.scene.add(pick);
  }

  const span = Math.max(cols, rows) * spacing * 0.55 + 2.2;
  gl.camera.position.set(0, span * 0.85, span * 1.35);
  gl.camera.lookAt(0, 0.35, 0);
  gl.resize();
  requestAnimationFrame(() => gl.resize());

  let orbitT = 0;
  gl.setFrame((t) => {
    orbitT = t;
    if (!finished) {
      gl.camera.position.x = Math.sin(t * 0.15) * 0.6;
      gl.camera.lookAt(0, 0.35, 0);
    }
    pumpkins.forEach((p, i) => {
      if (!p.userData.alive) return;
      p.rotation.y = Math.sin(t * 0.8 + i) * 0.04;
    });
  });

  function squash(pump) {
    pump.userData.alive = false;
    const pi = pump.userData.pumpkinIndex;
    if (pi !== undefined) {
      const pick = pickRoots[pi];
      if (pick) pick.userData.alive = false;
    }
    const start = performance.now();
    const fromY = pump.scale.y;
    const tick = () => {
      const u = Math.min(1, (performance.now() - start) / 280);
      pump.scale.y = fromY * (1 - u * 0.35);
      pump.rotation.z = u * 0.35;
      pump.position.y = -u * 0.15;
      if (u < 1) requestAnimationFrame(tick);
    };
    tick();
    pump.traverse((c) => {
      if (c.isMesh && c.material?.color) c.material.color.multiplyScalar(0.72);
    });
  }

  function highlight(pump) {
    pump.traverse((c) => {
      if (c.isMesh && c.material) {
        c.material.emissive = new THREE.Color(0xffcc44);
        c.material.emissiveIntensity = 0.45;
      }
    });
    const start = performance.now();
    const tick = () => {
      const u = (performance.now() - start) / 400;
      pump.position.y = Math.sin(u * Math.PI * 2) * 0.08;
      if (u < 1.2) requestAnimationFrame(tick);
    };
    tick();
  }

  function settle(index) {
    const pump = pumpkins[index];
    if (!pump || finished || !pump.userData.alive) return;
    const ok = good.has(index);
    ctx.sfx?.stage?.(stage.key);
    if (ok) {
      highlight(pump);
      found += 1;
      if (found >= stage.goodCount) {
        finished = true;
        ctx.onComplete();
      }
      return;
    }
    squash(pump);
    ctx.onMiss();
  }

  function onPointer(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    const hits = gl.pick(pickRoots, e.clientX, e.clientY);
    if (!hits.length) return;
    const hit = hits.find((h) => {
      let o = h.object;
      while (o) {
        if (o.userData?.pumpkinIndex !== undefined && o.userData.alive !== false) return true;
        o = o.parent;
      }
      return false;
    });
    if (!hit) return;
    const idx = findPumpkinIndex(hit);
    if (idx >= 0) settle(idx);
  }

  container.addEventListener("pointerdown", onPointer);

  return {
    destroy() {
      container.removeEventListener("pointerdown", onPointer);
      gl.dispose();
    },
  };
}

export function mountCut3D(root, stage, ctx) {
  root.innerHTML = hostMarkup(stage.title);
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov: 46, fog: false });
  if (!gl) return null;
  container.querySelector(".gl-loading")?.remove();
  gl.renderer.setClearColor(0xffffff);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.4, 0.08, 16),
    new THREE.MeshLambertMaterial({ color: 0xf2f2f2, flatShading: true })
  );
  table.position.y = -0.05;
  gl.scene.add(table);

  const pumpkin = buildPumpkin(42, 1.85, { withLid: true });
  pumpkin.position.y = 0.05;
  gl.scene.add(pumpkin);

  const knife = buildKnife(1.2);
  gl.scene.add(knife);

  const ringGeo = new THREE.TorusGeometry(0.55, 0.04, 8, 32, Math.PI * 1.35);
  const ring = new THREE.Mesh(
    ringGeo,
    new THREE.MeshLambertMaterial({ color: 0x6a2408, flatShading: true })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.05;
  gl.scene.add(ring);

  gl.camera.position.set(0, 2.2, 4.2);
  gl.camera.lookAt(0, 0.9, 0);

  let done = 0;
  let finished = false;
  const total = stage.clicks;
  let knifePhase = 0;
  let knifeBaseY = knife.position.y;

  gl.setFrame((t) => {
    if (knifePhase > 0) {
      knifePhase -= 0.016;
      const wobble = Math.sin((1 - knifePhase) * Math.PI * 4) * 0.12;
      knife.position.y = knifeBaseY + wobble;
      knife.rotation.x = -0.2 + wobble * 0.8;
    }
    knife.position.x = 0.62 + Math.sin(t * 1.2) * 0.02;
  });

  function applyProgress(t) {
    const clamped = Math.max(0, Math.min(1, t));
    ring.scale.setScalar(0.3 + clamped * 0.7);
    ring.material.opacity = 0.35 + clamped * 0.65;
    ring.material.transparent = true;
    const lid = pumpkin.userData.lid;
    if (lid) {
      lid.position.y = clamped * 0.35;
      lid.rotation.z = clamped * 0.25;
    }
  }

  applyProgress(0);

  function step() {
    if (finished) return;
    done += 1;
    knifePhase = 1;
    knifeBaseY = 1.05 - (done / total) * 0.15;
    ctx.sfx?.stage?.(stage.key);
    applyProgress(done / total);
    ctx.onProgress(done, total);
    if (done >= total) {
      finished = true;
      ctx.onComplete();
    }
  }

  function onPointer(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    if (!e.target.closest(".gl-host")) return;
    e.preventDefault();
    step();
  }

  container.addEventListener("pointerdown", onPointer);

  return {
    destroy() {
      container.removeEventListener("pointerdown", onPointer);
      gl.dispose();
    },
  };
}

export function mountWash3D(root, stage, ctx) {
  root.innerHTML = hostMarkup(stage.title);
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov: 48, fog: false });
  if (!gl) return null;
  container.querySelector(".gl-loading")?.remove();
  gl.renderer.setClearColor(0xffffff);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshLambertMaterial({ color: 0xf5f5f5, flatShading: true })
  );
  floor.rotation.x = -Math.PI / 2;
  gl.scene.add(floor);

  const pumpkin = buildPumpkin(11, 1.35);
  pumpkin.position.y = 0.1;
  gl.scene.add(pumpkin);

  const dirtMat = new THREE.MeshLambertMaterial({
    color: 0x5c331c,
    flatShading: true,
    transparent: true,
    opacity: 0.85,
  });
  const dirt = new THREE.Mesh(new THREE.SphereGeometry(0.95, 10, 8), dirtMat);
  dirt.position.y = 0.55;
  dirt.scale.set(1, 0.85, 1);
  gl.scene.add(dirt);

  const sponge = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.2, 0.5),
    new THREE.MeshLambertMaterial({ color: 0xffeb3b, flatShading: true })
  );
  sponge.position.set(0.9, 0.8, 0.6);
  gl.scene.add(sponge);

  gl.camera.position.set(0, 1.8, 3.6);
  gl.camera.lookAt(0, 0.7, 0);

  let done = 0;
  let finished = false;
  const total = stage.clicks;

  function step(clientX, clientY) {
    if (finished) return;
    done += 1;
    const hits = gl.pick([pumpkin, dirt], clientX, clientY);
    if (hits.length) {
      const rect = gl.renderer.domElement.getBoundingClientRect();
      sponge.position.x = ((clientX - rect.left) / rect.width - 0.5) * 2.2;
      sponge.position.z = ((clientY - rect.top) / rect.height - 0.5) * -1.8;
    }
    ctx.sfx?.splash?.();
    const t = done / total;
    dirtMat.opacity = Math.max(0, 0.85 * (1 - t));
    ctx.onProgress(done, total);
    if (done >= total) {
      finished = true;
      ctx.onComplete();
    }
  }

  function onPointer(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    if (!e.target.closest(".gl-host")) return;
    e.preventDefault();
    step(e.clientX, e.clientY);
  }

  container.addEventListener("pointerdown", onPointer);

  return {
    destroy() {
      container.removeEventListener("pointerdown", onPointer);
      gl.dispose();
    },
  };
}
