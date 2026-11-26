/**
 * Procedural low-poly Thanksgiving props (turkey, field, kitchen).
 */
import { THREE, seeded } from "./three-runtime.js";

export function texMat(color, _name, extra = {}) {
  return new THREE.MeshLambertMaterial({ color, flatShading: false, ...extra });
}

function mat(color, extra = {}) {
  return texMat(color, null, extra);
}

let featherGeo;
function featherGeometry() {
  if (featherGeo) return featherGeo;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.55);
  shape.bezierCurveTo(0.2, 0.18, 0.14, -0.32, 0, -0.55);
  shape.bezierCurveTo(-0.14, -0.32, -0.2, 0.18, 0, 0.55);
  featherGeo = new THREE.ShapeGeometry(shape, 8);
  return featherGeo;
}

export function turkeyMaterials() {
  return {
    body: mat(0x8b4518),
    breast: mat(0xa65b32),
    head: mat(0xc45c26),
    wattle: mat(0xc41e3a),
    beak: mat(0xffb000),
    feather: mat(0x6b3a22),
    tail: mat(0x8a3a22),
    bush: mat(0x2f7a34),
    hay: mat(0xd4a017),
    potato: mat(0xf3d7a1),
    pieCrust: mat(0xd4a574),
    pieFill: mat(0xe07a2f),
    metal: mat(0xd5dde4),
    wood: mat(0x8b5a2b),
    oven: mat(0x3a3e44),
    cream: mat(0xfffaf3),
    gravy: mat(0x7a3e12),
    plate: mat(0xf7f4ee),
    ovenGlow: mat(0xff6b35, { emissive: 0xff4500, emissiveIntensity: 0.4 }),
  };
}

function cap(r, len, m) {
  return new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 16), m);
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

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14 * scale, 16, 12), mats.head);
  head.position.set(0, 0.82 * scale, 0.28 * scale);
  root.add(head);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022 * scale, 8, 6), mat(0x1c140e));
  eye.position.set(-0.045 * scale, 0.86 * scale, 0.39 * scale);
  const eye2 = eye.clone();
  eye2.position.x = 0.045 * scale;
  root.add(eye, eye2);

  const beak = box(0.06 * scale, 0.04 * scale, 0.1 * scale, mats.beak);
  beak.position.set(0, 0.8 * scale, 0.42 * scale);
  root.add(beak);

  const wattle = cap(0.03 * scale, 0.08 * scale, mats.wattle);
  wattle.position.set(0, 0.72 * scale, 0.38 * scale);
  root.add(wattle);

  if (!withFeathers) {
    const tail = new THREE.Group();
    for (let i = 0; i < 14; i += 1) {
      const fan = new THREE.Mesh(featherGeometry(), mats.tail);
      fan.scale.set(0.26 * scale, 0.58 * scale, 1);
      const spread = -1.15 + (i / 13) * 2.3;
      fan.position.set(Math.sin(spread) * 0.28 * scale, 0.48 * scale, -0.34 * scale);
      fan.rotation.z = -spread * 0.85;
      fan.rotation.x = 0.55;
      tail.add(fan);
    }
    root.add(tail);
  }

  const wingL = cap(0.08 * scale, 0.28 * scale, mats.feather);
  wingL.position.set(-0.28 * scale, 0.5 * scale, 0.05 * scale);
  wingL.rotation.z = 0.45;
  const wingR = wingL.clone();
  wingR.position.x = 0.28 * scale;
  wingR.rotation.z = -0.45;
  root.add(wingL, wingR);

  if (withFeathers) {
    const feathers = new THREE.Group();
    const count = 24;
    for (let i = 0; i < count; i += 1) {
      const shade = mats.feather.clone();
      shade.color.setHSL(0.06 + (i % 5) * 0.015, 0.5, 0.28 + (i % 4) * 0.07);
      const f = new THREE.Mesh(featherGeometry(), shade);
      f.scale.set(0.34 * scale, 0.78 * scale, 1);
      const spread = -1.35 + (i / (count - 1)) * 2.7;
      const layer = i % 3;
      f.position.set(
        Math.sin(spread) * (0.22 + layer * 0.05) * scale,
        (0.72 + layer * 0.16) * scale,
        (-0.32 - layer * 0.06) * scale
      );
      f.rotation.z = -spread * 0.95;
      f.rotation.x = 0.35 + layer * 0.12;
      f.userData.feather = true;
      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 1.15, 0.3),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      f.add(hit);
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
  const bush = new THREE.Group();
  for (let i = 0; i < 9; i += 1) {
    const leaf = mat(i % 2 ? 0x246b30 : 0x3d9142);
    const clump = new THREE.Mesh(new THREE.SphereGeometry(0.2 * scale, 14, 10), leaf);
    clump.position.set((rng() - 0.5) * 0.28 * scale, 0.28 * scale + rng() * 0.12 * scale, (rng() - 0.5) * 0.28 * scale);
    bush.add(clump);
  }
  bush.userData.bush = true;
  return bush;
}

export function buildHayBale(scale = 1) {
  const mats = turkeyMaterials();
  const bale = new THREE.Group();
  const body = box(0.7 * scale, 0.42 * scale, 0.45 * scale, mats.hay);
  body.position.y = 0.22 * scale;
  const band = box(0.72 * scale, 0.06 * scale, 0.47 * scale, mat(0x8a5a20));
  band.position.y = 0.22 * scale;
  bale.add(body, band);
  for (let i = 0; i < 10; i += 1) {
    const straw = box(0.025 * scale, 0.55 * scale, 0.025 * scale, mats.hay);
    straw.position.set((i - 4.5) * 0.06 * scale, 0.46 * scale, ((i % 2) - 0.5) * 0.16 * scale);
    straw.rotation.z = (i - 5) * 0.12;
    bale.add(straw);
  }
  bale.userData.hay = true;
  return bale;
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
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.52 * scale, 0.045 * scale, 8, 28), mats.pieCrust);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.12 * scale;
  pie.add(crust, fill, lip);
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
  const mats = turkeyMaterials();
  const plate = new THREE.Group();
  const disk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2 * scale, 0.22 * scale, 0.03 * scale, 24),
    mats.plate
  );
  disk.position.y = 0.02 * scale;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.21 * scale, 0.028 * scale, 8, 28),
    mat(0xe4ddd0)
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.04 * scale;
  plate.add(disk, rim);
  return plate;
}
