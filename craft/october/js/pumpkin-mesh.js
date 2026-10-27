import { THREE, seeded } from "./three-runtime.js";

export function pumpkinMaterials() {
  const body = new THREE.MeshLambertMaterial({ color: 0xff8c1a, flatShading: true });
  const rib = new THREE.MeshLambertMaterial({ color: 0xe45300, flatShading: true });
  const stem = new THREE.MeshLambertMaterial({ color: 0x3d9e42, flatShading: true });
  const leaf = new THREE.MeshLambertMaterial({ color: 0x5cd65c, flatShading: true });
  const knifeBlade = new THREE.MeshLambertMaterial({ color: 0xe8f4ff, flatShading: true });
  const knifeHandle = new THREE.MeshLambertMaterial({ color: 0xff7a18, flatShading: true });
  return { body, rib, stem, leaf, knifeBlade, knifeHandle };
}

/** Low-poly pumpkin; optional lid group for cut stage. */
export function buildPumpkin(seed, scale = 1, { withLid = false } = {}) {
  const rng = seeded(seed);
  const mats = pumpkinMaterials();
  const root = new THREE.Group();
  const body = new THREE.Group();
  const lobes = 3;
  for (let i = 0; i < lobes; i += 1) {
    const geo = new THREE.SphereGeometry(0.46 * scale, 9, 7);
    const mesh = new THREE.Mesh(geo, i === 1 ? mats.body : mats.rib);
    const t = (i / lobes) * Math.PI * 2;
    mesh.position.set(Math.sin(t) * 0.22 * scale, 0, Math.cos(t) * 0.18 * scale);
    mesh.scale.set(1, 1.02 + rng() * 0.1, 0.92 + rng() * 0.06);
    body.add(mesh);
  }
  body.position.y = 0.42 * scale;
  root.add(body);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.08 * scale, 0.2 * scale, 6), mats.stem);
  stem.position.y = 0.92 * scale;
  stem.rotation.z = (rng() - 0.5) * 0.5;
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.14 * scale, 0.04 * scale, 0.08 * scale), mats.leaf);
  leaf.position.set(0.08 * scale, 0.98 * scale, 0.04 * scale);
  leaf.rotation.set(0.4, 0.3, 0.6);

  if (withLid) {
    const lidGroup = new THREE.Group();
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(0.38 * scale, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.42),
      mats.body
    );
    lid.position.y = 0.78 * scale;
    const stemTop = stem.clone();
    stemTop.position.y = 1.02 * scale;
    const leafTop = leaf.clone();
    leafTop.position.set(0.08 * scale, 1.05 * scale, 0.04 * scale);
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
  return root;
}

export function buildKnife(scale = 1) {
  const mats = pumpkinMaterials();
  const knife = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07 * scale, 0.55 * scale, 0.02 * scale), mats.knifeBlade);
  blade.position.y = 0.28 * scale;
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.12 * scale, 0.04 * scale, 0.05 * scale), mats.knifeHandle);
  guard.position.y = 0.02 * scale;
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.09 * scale, 0.22 * scale, 0.07 * scale), mats.knifeHandle);
  handle.position.y = -0.12 * scale;
  knife.add(blade, guard, handle);
  knife.position.set(0.55 * scale, 1.1 * scale, 0.35 * scale);
  knife.rotation.z = -0.35;
  return knife;
}

export function buildPatchGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 22, 1, 1),
    new THREE.MeshLambertMaterial({ color: 0x5a9e3a, flatShading: true })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  const vines = new THREE.Group();
  for (let i = 0; i < 24; i += 1) {
    const rng = seeded(i * 3.7);
    const vine = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 + rng() * 0.06, 0.02, 0.3 + rng() * 0.4),
      new THREE.MeshLambertMaterial({ color: 0x3d7a32, flatShading: true })
    );
    vine.position.set((rng() - 0.5) * 20, 0.02, (rng() - 0.5) * 14);
    vine.rotation.y = rng() * Math.PI;
    vines.add(vine);
  }
  return { ground, vines };
}
