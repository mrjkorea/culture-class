/**
 * three.js Thanksgiving stages — large playfield + photo backdrops.
 */
import { scene3dUrl } from "./assets.js";
import { createGlStage, THREE } from "./three-runtime.js";
import {
  buildBush,
  buildDiningTable,
  buildFieldGround,
  buildOven,
  buildPie,
  buildPlate,
  buildPotatoPile,
  buildTurkey,
} from "./turkey-mesh.js";

function hostMarkup(label, { extraClass = "", backdropStyle = "" } = {}) {
  return `<div class="gl-host scene-3d gl-scene feast-gl ${extraClass}" data-play aria-label="${label}"${backdropStyle}>
    <div class="gl-loading">Loading kitchen…</div>
  </div>`;
}

function backdropStyle(ctx, sceneKey) {
  const url = scene3dUrl(ctx?.assetBase, ctx?.manifest, sceneKey);
  if (!url) return "";
  const safe = String(url).replace(/'/g, "%27").replace(/"/g, "%22");
  return ` style="background-image:url('${safe}')"`;
}

function applyPhotoBackdrop(gl, ctx, sceneKey, fallbackFn) {
  const photoUrl = scene3dUrl(ctx?.assetBase, ctx?.manifest, sceneKey);
  if (!photoUrl) {
    fallbackFn?.();
    return;
  }
  const loader = new THREE.TextureLoader();
  loader.load(
    photoUrl,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      gl.scene.background = tex;
    },
    undefined,
    () => fallbackFn?.()
  );
}

function findBushIndex(hit) {
  let o = hit.object;
  while (o) {
    if (o.userData?.bushIndex !== undefined) return o.userData.bushIndex;
    o = o.parent;
  }
  return -1;
}

function layoutCamera(gl, span) {
  gl.camera.position.set(0, span * 0.68, span * 1.05);
  gl.camera.lookAt(0, 0.35, 0);
  gl.resize();
  requestAnimationFrame(() => gl.resize());
}

export function mountHunt3D(root, stage, ctx) {
  root.innerHTML = hostMarkup(stage.title, {
    extraClass: "gl-hunt",
    backdropStyle: backdropStyle(ctx, "hunt"),
  });
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov: 58, fog: false });
  if (!gl) return null;
  container.querySelector(".gl-loading")?.remove();

  const good = new Set();
  const pool = stage.poolSize || 16;
  while (good.size < (stage.goodCount || 1)) {
    good.add(Math.floor(Math.random() * pool));
  }
  let found = false;
  let finished = false;

  applyPhotoBackdrop(gl, ctx, "hunt", () => {
    const { ground, hay } = buildFieldGround();
    gl.scene.add(ground, hay);
  });

  const cols = Math.ceil(Math.sqrt(pool));
  const rows = Math.ceil(pool / cols);
  const bushes = [];
  const pickRoots = [];
  const spacing = pool > 12 ? 1.05 : 1.2;
  const bushScale = pool > 12 ? 1.1 : 1.35;

  for (let i = 0; i < pool; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const px = (col - (cols - 1) / 2) * spacing;
    const pz = (row - (rows - 1) / 2) * (spacing * 0.92) + 0.4;
    const bush = buildBush(i + 3, bushScale);
    bush.position.set(px, 0, pz);
    bush.userData.bushIndex = i;
    bush.userData.alive = true;
    bushes.push(bush);
    gl.scene.add(bush);

    if (good.has(i)) {
      const turkey = buildTurkey(i + 99, bushScale * 0.85);
      turkey.position.set(px, 0, pz + 0.05);
      turkey.visible = false;
      turkey.userData.hiddenTurkey = true;
      turkey.userData.bushIndex = i;
      gl.scene.add(turkey);
      bush.userData.turkey = turkey;
    }

    const pick = new THREE.Mesh(
      new THREE.SphereGeometry(0.5 + bushScale * 0.35, 10, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    pick.position.set(px, 0.35 * bushScale, pz);
    pick.userData.bushIndex = i;
    pick.userData.alive = true;
    pickRoots.push(pick);
    gl.scene.add(pick);
  }

  const span = Math.max(cols, rows) * spacing * 0.5 + 1.4;
  layoutCamera(gl, span);

  gl.setFrame((t) => {
    if (finished) return;
    gl.camera.position.x = Math.sin(t * 0.12) * 0.45;
    gl.camera.lookAt(0, 0.35, 0);
    bushes.forEach((b, i) => {
      if (!b.userData.alive) return;
      b.rotation.y = Math.sin(t * 0.6 + i) * 0.03;
    });
  });

  function settle(index) {
    if (finished) return;
    const bush = bushes[index];
    if (!bush?.userData.alive) return;
    ctx.sfx?.stage?.(stage.key);
    if (good.has(index)) {
      found = true;
      finished = true;
      const turkey = bush.userData.turkey;
      if (turkey) {
        turkey.visible = true;
        turkey.position.y = 0.15;
      }
      bush.traverse((c) => {
        if (c.isMesh && c.material?.emissive) {
          c.material.emissive = new THREE.Color(0xffcc44);
          c.material.emissiveIntensity = 0.35;
        }
      });
      ctx.onProgress(1, 1);
      ctx.onComplete();
      return;
    }
    bush.userData.alive = false;
    pickRoots[index].userData.alive = false;
    bush.traverse((c) => {
      if (c.isMesh && c.material?.color) c.material.color.multiplyScalar(0.65);
    });
    bush.rotation.z = 0.25;
    ctx.onMiss?.();
  }

  function onPointer(e) {
    if (finished || found || (e.button !== undefined && e.button !== 0)) return;
    const hits = gl.pick(pickRoots, e.clientX, e.clientY);
    if (!hits.length) return;
    const hit = hits.find((h) => h.object.userData?.alive !== false);
    if (!hit) return;
    const idx = findBushIndex(hit);
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

export function mountPluck3D(root, stage, ctx) {
  root.innerHTML = hostMarkup(stage.title, {
    extraClass: "gl-pluck",
    backdropStyle: backdropStyle(ctx, "pluck"),
  });
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov: 52, fog: false });
  if (!gl) return null;
  container.querySelector(".gl-loading")?.remove();
  applyPhotoBackdrop(gl, ctx, "pluck");

  const turkey = buildTurkey(7, 2.4, { withFeathers: true });
  turkey.position.y = 0.05;
  gl.scene.add(turkey);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.5, 0.1, 16),
    new THREE.MeshLambertMaterial({ color: 0xf0ebe0, flatShading: true })
  );
  table.position.y = -0.02;
  gl.scene.add(table);

  gl.camera.position.set(0, 1.85, 3.4);
  gl.camera.lookAt(0, 0.9, 0);
  gl.resize();

  const total = stage.clicks || 28;
  let done = 0;
  let finished = false;
  const pickMeshes = [];
  turkey.traverse((c) => {
    if (c.isMesh) pickMeshes.push(c);
  });

  function pluckFeather() {
    const feathers = turkey.userData.feathers;
    if (feathers && feathers.children.length) {
      const f = feathers.children[feathers.children.length - 1];
      f.position.y -= 0.08;
      f.rotation.x += 0.4;
      window.setTimeout(() => feathers.remove(f), 400);
    }
  }

  function step() {
    if (finished) return;
    done += 1;
    pluckFeather();
    ctx.sfx?.stage?.(stage.key);
    ctx.onProgress(done, total);
    turkey.rotation.y += 0.08;
    if (done >= total) {
      finished = true;
      ctx.onComplete();
    }
  }

  function onPointer(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    const hits = gl.pick(pickMeshes, e.clientX, e.clientY);
    if (!hits.length) return;
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

export function mountOven3D(root, stage, ctx) {
  root.innerHTML = hostMarkup(stage.title, {
    extraClass: "gl-oven",
    backdropStyle: backdropStyle(ctx, "oven"),
  });
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov: 50, fog: false });
  if (!gl) return null;
  container.querySelector(".gl-loading")?.remove();
  applyPhotoBackdrop(gl, ctx, "oven");

  const oven = buildOven(1.85);
  oven.position.y = 0.05;
  gl.scene.add(oven);

  gl.camera.position.set(0, 1.55, 3.1);
  gl.camera.lookAt(0, 0.75, 0);
  gl.resize();

  const need = stage.holdRequiredMs || 60000;
  let accumulated = 0;
  let holding = false;
  let raf = 0;
  let last = 0;
  let lastSec = -1;
  let finished = false;
  const door = oven.userData.door;
  const windowMesh = oven.userData.window;

  const paint = () => {
    const t = Math.min(1, accumulated / need);
    const sec = Math.min(60, Math.floor(accumulated / 1000));
    if (sec !== lastSec) {
      lastSec = sec;
      ctx.onProgress(sec, 60);
    }
    if (windowMesh?.material) {
      windowMesh.material.emissiveIntensity = 0.25 + t * 0.85;
    }
    if (door) door.rotation.x = holding ? -0.35 * t : -0.08 * t;
  };

  const tick = (now) => {
    if (holding && !finished) {
      const dt = last ? now - last : 0;
      accumulated += dt;
      paint();
      if (accumulated >= need) {
        stopHold();
        finished = true;
        ctx.sfx?.win?.();
        ctx.onComplete();
        return;
      }
    }
    last = now;
    raf = requestAnimationFrame(tick);
  };

  const stopHold = () => {
    holding = false;
    container.classList.remove("is-holding-oven");
    paint();
  };

  const startHold = (e) => {
    if (finished || accumulated >= need) return;
    if (e?.pointerType === "mouse" && e.button !== 0) return;
    holding = true;
    container.classList.add("is-holding-oven");
    ctx.sfx?.stage?.(stage.key);
    if (!raf) raf = requestAnimationFrame(tick);
  };

  function onPointerDown(e) {
    const hits = gl.pick([door, oven.userData.window, oven], e.clientX, e.clientY);
    if (!hits.length) return;
    startHold(e);
  }

  container.addEventListener("pointerdown", onPointerDown);
  container.addEventListener("pointerup", stopHold);
  container.addEventListener("pointerleave", stopHold);
  container.addEventListener("pointercancel", stopHold);
  raf = requestAnimationFrame(tick);
  paint();

  return {
    destroy() {
      holding = false;
      cancelAnimationFrame(raf);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerup", stopHold);
      container.removeEventListener("pointerleave", stopHold);
      container.removeEventListener("pointercancel", stopHold);
      gl.dispose();
    },
  };
}

export function mountMash3D(root, stage, ctx) {
  root.innerHTML = hostMarkup(stage.title, {
    extraClass: "gl-mash",
    backdropStyle: backdropStyle(ctx, "mash"),
  });
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov: 52, fog: false });
  if (!gl) return null;
  container.querySelector(".gl-loading")?.remove();
  applyPhotoBackdrop(gl, ctx, "mash");

  const pile = buildPotatoPile(12, 1.6);
  pile.position.y = 0.05;
  gl.scene.add(pile);

  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0xf5f5f5, flatShading: true, side: THREE.DoubleSide })
  );
  bowl.position.set(0, 0.02, 0);
  bowl.rotation.x = Math.PI;
  gl.scene.add(bowl);

  gl.camera.position.set(0, 1.45, 2.85);
  gl.camera.lookAt(0, 0.45, 0);
  gl.resize();

  const total = stage.clicks || 32;
  let done = 0;
  let finished = false;
  const pickMeshes = [];
  pile.traverse((c) => {
    if (c.isMesh) pickMeshes.push(c);
  });

  function step() {
    if (finished) return;
    done += 1;
    pile.scale.y = Math.max(0.35, 1 - (done / total) * 0.55);
    pile.rotation.y += 0.12;
    ctx.sfx?.stage?.(stage.key);
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

export function mountPie3D(root, stage, ctx) {
  root.innerHTML = hostMarkup(stage.title, {
    extraClass: "gl-pie",
    backdropStyle: backdropStyle(ctx, "pie"),
  });
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov: 52, fog: false });
  if (!gl) return null;
  container.querySelector(".gl-loading")?.remove();
  applyPhotoBackdrop(gl, ctx, "pie");

  const pie = buildPie(1.75);
  pie.position.y = 0.08;
  gl.scene.add(pie);

  gl.camera.position.set(0, 1.35, 2.6);
  gl.camera.lookAt(0, 0.35, 0);
  gl.resize();

  const total = stage.clicks || 12;
  let done = 0;
  let finished = false;
  const pickMeshes = [];
  pie.traverse((c) => {
    if (c.isMesh) pickMeshes.push(c);
  });

  function step() {
    if (finished) return;
    done += 1;
    pie.rotation.y += 0.35;
    pie.scale.setScalar(1 + (done / total) * 0.08);
    ctx.sfx?.stage?.(stage.key);
    ctx.onProgress(done, total);
    if (done >= total) {
      finished = true;
      ctx.onComplete();
    }
  }

  function onPointer(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    const hits = gl.pick(pickMeshes, e.clientX, e.clientY);
    if (!hits.length) return;
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

export function mountPlates3D(root, stage, ctx) {
  root.innerHTML = hostMarkup(stage.title, {
    extraClass: "gl-plates",
    backdropStyle: backdropStyle(ctx, "plates"),
  });
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov: 54, fog: false });
  if (!gl) return null;
  container.querySelector(".gl-loading")?.remove();
  applyPhotoBackdrop(gl, ctx, "plates");

  const table = buildDiningTable(1.1);
  gl.scene.add(table);

  const total = stage.clicks || 6;
  const plateSpots = [];
  for (let i = 0; i < total; i += 1) {
    const t = (i / Math.max(1, total - 1)) * 0.75 - 0.375;
    const spot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.3, 0.02, 12),
      new THREE.MeshLambertMaterial({
        color: 0xffe56a,
        flatShading: true,
        transparent: true,
        opacity: 0.55,
      })
    );
    spot.position.set(t * 2.2, 0.78, 0);
    spot.userData.spotIndex = i;
    spot.userData.open = true;
    plateSpots.push(spot);
    gl.scene.add(spot);
  }

  gl.camera.position.set(0, 2.1, 3.5);
  gl.camera.lookAt(0, 0.75, 0);
  gl.resize();

  let done = 0;
  let finished = false;

  function place(index) {
    const spot = plateSpots[index];
    if (!spot?.userData.open || finished) return;
    spot.userData.open = false;
    const plate = buildPlate(1.15);
    plate.position.copy(spot.position);
    plate.position.y += 0.04;
    gl.scene.add(plate);
    spot.material.opacity = 0.15;
    done += 1;
    ctx.sfx?.stage?.(stage.key);
    ctx.onProgress(done, total);
    if (done >= total) {
      finished = true;
      ctx.onComplete();
    }
  }

  function onPointer(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    const hits = gl.pick(plateSpots, e.clientX, e.clientY);
    if (!hits.length) return;
    const idx = hits[0].object.userData.spotIndex;
    if (idx !== undefined) place(idx);
  }

  container.addEventListener("pointerdown", onPointer);
  return {
    destroy() {
      container.removeEventListener("pointerdown", onPointer);
      gl.dispose();
    },
  };
}
