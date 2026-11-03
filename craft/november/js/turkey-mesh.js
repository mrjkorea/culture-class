/**
 * Procedural low-poly Thanksgiving props (turkey, field, kitchen).
 */
import { THREE, seeded } from "./three-runtime.js";

function mat(color, extra = {}) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
}

export function turkeyMaterials() {
  return {
    body: mat(0x8b5a2b),
    breast: mat(0xa0522d),
    head: mat(0xc45c26),
    wattle: mat(0xc41e3a),
    beak: mat(0xff8c00),
    feather: mat(0x654321),
    tail: mat(0xb22222),
    bush: mat(0x3d7a32),
    hay: mat(0xc9a227),
    potato: mat(0xf5e6c8),
    pieCrust: mat(0xd4a574),
    pieFill: mat(0xc45c26),
    metal: mat(0xd8d8d8),
    wood: mat(0x5c4033),
    oven: mat(0x555555),
    ovenGlow: mat(0xff6b35, { emissive: 0xff4500, emissiveIntensity: 0.4 }),
  };
}

function cap(r, len, m) {
  return new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 2, 6), m);
}

function box(w, h, d, m) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
}

/** Low-poly turkey; feathers group for pluck stage. */
export function buildTurkey(seed, scale = 1, { withFeathers = false } = {}) {
  const rng = seeded(seed);
  const mats = turkeyMaterials();
  const root = new THREE.Group();

  const body = cap(0.32 * scale, 0.55 * scale, mats.body);
  body.position.y = 0.45 * scale;
  body.rotation.z = (rng() - 0.5) * 0.12;
  root.add(body);

  const breast = cap(0.22 * scale, 0.35 * scale, mats.breast);
  breast.position.set(0, 0.52 * scale, 0.12 * scale);
  root.add(breast);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14 * scale, 8, 6), mats.head);
  head.position.set(0, 0.82 * scale, 0.28 * scale);
  root.add(head);

  const beak = box(0.06 * scale, 0.04 * scale, 0.1 * scale, mats.beak);
  beak.position.set(0, 0.8 * scale, 0.42 * scale);
  root.add(beak);

  const wattle = cap(0.03 * scale, 0.08 * scale, mats.wattle);
  wattle.position.set(0, 0.72 * scale, 0.38 * scale);
  root.add(wattle);

  const tail = new THREE.Group();
  for (let i = 0; i < 5; i += 1) {
    const fan = box(0.04 * scale, 0.35 * scale, 0.12 * scale, mats.tail);
    fan.position.set((i - 2) * 0.06 * scale, 0.55 * scale, -0.28 * scale);
    fan.rotation.z = (i - 2) * 0.22;
    tail.add(fan);
  }
  root.add(tail);

  const wingL = cap(0.08 * scale, 0.28 * scale, mats.feather);
  wingL.position.set(-0.28 * scale, 0.5 * scale, 0.05 * scale);
  wingL.rotation.z = 0.45;
  const wingR = wingL.clone();
  wingR.position.x = 0.28 * scale;
  wingR.rotation.z = -0.45;
  root.add(wingL, wingR);

  if (withFeathers) {
    const feathers = new THREE.Group();
    for (let i = 0; i < 18; i += 1) {
      const f = box(0.03 * scale, 0.14 * scale, 0.02 * scale, mats.feather);
      const t = (i / 18) * Math.PI * 2;
      f.position.set(Math.sin(t) * 0.26 * scale, 0.55 * scale + rng() * 0.15 * scale, Math.cos(t) * 0.2 * scale);
      f.rotation.y = t;
      f.userData.feather = true;
      feathers.add(f);
    }
    root.add(feathers);
    root.userData.feathers = feathers;
  }

  root.scale.setScalar(0.95 + rng() * 0.1);
  root.rotation.y = (rng() - 0.5) * 0.4;
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = false;
  });
  return root;
}

export function buildBush(seed, scale = 1) {
  const rng = seeded(seed);
  const mats = turkeyMaterials();
  const bush = new THREE.Group();
  for (let i = 0; i < 4; i += 1) {
    const clump = cap(0.18 * scale, 0.22 * scale, mats.bush);
    clump.position.set((rng() - 0.5) * 0.35 * scale, 0.18 * scale + rng() * 0.08 * scale, (rng() - 0.5) * 0.35 * scale);
    bush.add(clump);
  }
  bush.userData.bush = true;
  return bush;
}

export function buildFieldGround() {
  const mats = turkeyMaterials();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 22, 1, 1),
    mat(0x8b6914)
  );
  ground.rotation.x = -Math.PI / 2;
  const hay = new THREE.Group();
  for (let i = 0; i < 24; i += 1) {
    const rng = seeded(i * 2.1);
    const bale = box(0.35 + rng() * 0.2, 0.12, 0.55 + rng() * 0.25, mats.hay);
    bale.position.set((rng() - 0.5) * 18, 0.06, (rng() - 0.5) * 12);
    bale.rotation.y = rng() * Math.PI;
    hay.add(bale);
  }
  return { ground, hay };
}

export function buildPotatoPile(seed, scale = 1) {
  const rng = seeded(seed);
  const mats = turkeyMaterials();
  const pile = new THREE.Group();
  for (let i = 0; i < 14; i += 1) {
    const spud = cap(0.12 * scale, 0.18 * scale, mats.potato);
    spud.position.set((rng() - 0.5) * 0.7 * scale, 0.08 * scale + rng() * 0.12 * scale, (rng() - 0.5) * 0.6 * scale);
    spud.rotation.set(rng() * 0.5, rng() * Math.PI, rng() * 0.4);
    pile.add(spud);
  }
  return pile;
}

export function buildPie(scale = 1) {
  const mats = turkeyMaterials();
  const pie = new THREE.Group();
  const crust = new THREE.Mesh(new THREE.CylinderGeometry(0.55 * scale, 0.58 * scale, 0.12 * scale, 16), mats.pieCrust);
  crust.position.y = 0.06 * scale;
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.48 * scale, 0.5 * scale, 0.06 * scale, 16), mats.pieFill);
  fill.position.y = 0.14 * scale;
  pie.add(crust, fill);
  return pie;
}

export function buildOven(scale = 1) {
  const mats = turkeyMaterials();
  const oven = new THREE.Group();
  const body = box(1.4 * scale, 1.1 * scale, 0.9 * scale, mats.oven);
  body.position.y = 0.55 * scale;
  const window = box(0.85 * scale, 0.55 * scale, 0.05 * scale, mats.ovenGlow);
  window.position.set(0, 0.5 * scale, 0.46 * scale);
  window.userData.glow = true;
  const door = box(0.9 * scale, 0.6 * scale, 0.08 * scale, mat(0x444444));
  door.position.set(0, 0.35 * scale, 0.48 * scale);
  door.userData.door = true;
  oven.add(body, window, door);
  oven.userData.window = window;
  oven.userData.door = door;
  return oven;
}

export function buildDiningTable(scale = 1) {
  const mats = turkeyMaterials();
  const table = new THREE.Group();
  const top = box(2.4 * scale, 0.08 * scale, 1.2 * scale, mats.wood);
  top.position.y = 0.72 * scale;
  table.add(top);
  for (const [x, z] of [
    [-1, -0.45],
    [1, -0.45],
    [-1, 0.45],
    [1, 0.45],
  ]) {
    const leg = box(0.1 * scale, 0.72 * scale, 0.1 * scale, mats.wood);
    leg.position.set(x * scale, 0.36 * scale, z * scale);
    table.add(leg);
  }
  return table;
}

export function buildPlate(scale = 1) {
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * scale, 0.24 * scale, 0.04 * scale, 14),
    mat(0xf5f5f5)
  );
  plate.position.y = 0.02 * scale;
  return plate;
}
