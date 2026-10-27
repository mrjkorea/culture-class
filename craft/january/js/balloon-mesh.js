import { THREE } from "./three-runtime.js";

export function buildBalloon(i, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 16, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1 })
  );
  body.position.y = 0.55;
  g.add(body);
  const knot = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.12, 8),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  knot.position.y = 0.12;
  knot.rotation.x = Math.PI;
  g.add(knot);
  const string = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4),
    new THREE.MeshStandardMaterial({ color: 0xdddddd })
  );
  string.position.y = -0.15;
  g.add(string);
  g.userData.balloonIndex = i;
  return g;
}

export function buildBallDropScene() {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0xffd43b, metalness: 0.5, roughness: 0.25 })
  );
  ball.position.y = 6;
  g.add(ball);
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 8, 12),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  );
  pole.position.y = 4;
  g.add(pole);
  g.userData.dropBall = ball;
  return g;
}
