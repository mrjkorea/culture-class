/**
 * Procedural low-poly pumpkins + knife (ski-jump / skier.js style: Box + Capsule, no GLB).
 */
import { THREE, seeded } from "./three-runtime.js";

function mat(color, extra = {}) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
}

export function pumpkinMaterials() {
  return {
    body: mat(0xff8c1a),
    rib: mat(0xe45300),
    stem: mat(0x3d9e42),
    leaf: mat(0x5cd65c),
    knifeBlade: mat(0xe8f4ff),
    knifeHandle: mat(0xff7a18),
  };
}

function box(w, h, d, m) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
}

function cap(r, len, m) {
  return new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 2, 6), m);
}

/** Low-poly pumpkin; optional lid group for cut stage. */
export function buildPumpkin(seed, scale = 1, { withLid = false } = {}) {
  const rng = seeded(seed);
  const mats = pumpkinMaterials();
  const root = new THREE.Group();
  const body = new THREE.Group();
  const ribs = 5;
  for (let i = 0; i < ribs; i += 1) {
    const t = (i / ribs) * Math.PI * 2;
    const lobe = cap(0.2 * scale, 0.52 * scale, i % 2 ? mats.rib : mats.body);
    lobe.position.set(Math.sin(t) * 0.28 * scale, 0.42 * scale, Math.cos(t) * 0.24 * scale);
    lobe.scale.set(1.05 + rng() * 0.08, 1, 0.92 + rng() * 0.06);
    body.add(lobe);
  }
  const belly = cap(0.24 * scale, 0.48 * scale, mats.body);
  belly.position.y = 0.4 * scale;
  body.add(belly);
  root.add(body);

  const stem = cap(0.05 * scale, 0.12 * scale, mats.stem);
  stem.position.y = 0.88 * scale;
  stem.rotation.z = (rng() - 0.5) * 0.5;
  const leaf = box(0.14 * scale, 0.04 * scale, 0.08 * scale, mats.leaf);
  leaf.position.set(0.08 * scale, 0.94 * scale, 0.04 * scale);
  leaf.rotation.set(0.4, 0.3, 0.6);

  if (withLid) {
    const lidGroup = new THREE.Group();
    const lid = cap(0.22 * scale, 0.08 * scale, mats.body);
    lid.position.y = 0.78 * scale;
    lid.scale.set(1.35, 0.65, 1.25);
    const stemTop = stem.clone();
    stemTop.position.y = 0.98 * scale;
    const leafTop = leaf.clone();
    leafTop.position.set(0.08 * scale, 1.02 * scale, 0.04 * scale);
    lidGroup.add(lid, stemTop, leafTop);
    root.add(lidGroup);
    root.userData.lid = lidGroup;
  } else {
    root.add(stem);
    root.add(leaf);
  }

  root.userData.body = body;
  root.scale.setScalar(0.92 + rng() * 0.16);
  root.rotation.y = (rng() - 0.5) * 0.5;
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = false;
  });
  return root;
}

export function buildKnife(scale = 1) {
  const mats = pumpkinMaterials();
  const knife = new THREE.Group();
  const blade = box(0.07 * scale, 0.55 * scale, 0.02 * scale, mats.knifeBlade);
  blade.position.y = 0.28 * scale;
  const guard = box(0.12 * scale, 0.04 * scale, 0.05 * scale, mats.knifeHandle);
  guard.position.y = 0.02 * scale;
  const handle = box(0.09 * scale, 0.22 * scale, 0.07 * scale, mats.knifeHandle);
  handle.position.y = -0.12 * scale;
  const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.015 * scale, 0.015 * scale, 0.02 * scale, 4), mats.knifeBlade);
  rivet.position.set(0, -0.06 * scale, 0.04 * scale);
  knife.add(blade, guard, handle, rivet);
  knife.position.set(0.55 * scale, 1.1 * scale, 0.35 * scale);
  knife.rotation.z = -0.35;
  return knife;
}

export function buildPatchGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 22, 1, 1),
    mat(0x5a9e3a)
  );
  ground.rotation.x = -Math.PI / 2;
  const vines = new THREE.Group();
  const vineMat = mat(0x3d7a32);
  for (let i = 0; i < 28; i += 1) {
    const rng = seeded(i * 3.7);
    const vine = box(0.08 + rng() * 0.06, 0.02, 0.3 + rng() * 0.4, vineMat);
    vine.position.set((rng() - 0.5) * 20, 0.02, (rng() - 0.5) * 14);
    vine.rotation.y = rng() * Math.PI;
    vines.add(vine);
  }
  const fencePosts = new THREE.Group();
  const postMat = mat(0x8b5a2b);
  for (let x = -10; x <= 10; x += 2.5) {
    const post = cap(0.06, 0.5, postMat);
    post.position.set(x, 0.28, -6.5);
    fencePosts.add(post);
  }
  return { ground, vines, fencePosts };
}
