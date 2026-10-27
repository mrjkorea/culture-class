import { createGlStage, THREE } from "./three-runtime.js";

function hostMarkup(label) {
  return `<div class="gl-host scene-3d gl-scene" data-play aria-label="${label}">
    <div class="gl-loading">Loading 3D…</div>
  </div>`;
}

/** Egg rolls downhill toward a finish ribbon; uses aim angle from craft state. */
export function mountEggRoll3D(root, stage, ctx) {
  root.innerHTML = hostMarkup(stage.title);
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov: 50, fog: true });
  if (!gl) return null;
  container.querySelector(".gl-loading")?.remove();

  const hill = new THREE.Mesh(
    new THREE.BoxGeometry(14, 0.4, 20),
    new THREE.MeshStandardMaterial({ color: 0x69db7c })
  );
  hill.rotation.x = -0.35;
  hill.position.set(0, 0, -2);
  gl.scene.add(hill);

  const eggColor = ctx.craft?.egg?.fill || "#fcc2d7";
  const egg = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 16),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(eggColor) })
  );
  egg.position.set(-4, 2.5, 4);
  gl.scene.add(egg);

  const finish = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 1.2, 4),
    new THREE.MeshStandardMaterial({ color: 0xff6b6b })
  );
  finish.position.set(3.5, 0.6, -6);
  gl.scene.add(finish);

  gl.camera.position.set(0, 5, 10);
  gl.camera.lookAt(0, 0, -2);

  const aim = (ctx.craft?.egg?.aim ?? 35) * (Math.PI / 180);
  const overlay = document.createElement("button");
  overlay.type = "button";
  overlay.className = "gl-overlay-btn roll-go-btn";
  overlay.textContent = "🥚 Roll!";
  container.append(overlay);

  overlay.addEventListener("click", () => {
    ctx.sfx?.stage?.(stage.key);
    let t = 0;
    const vx = Math.cos(aim) * 0.12;
    const vz = -Math.sin(aim) * 0.15 - 0.08;
    const anim = () => {
      t += 1;
      egg.position.x += vx;
      egg.position.z += vz;
      egg.position.y = Math.max(0.4, 2.5 - t * 0.04);
      egg.rotation.z += 0.2;
      if (t < 55 && egg.position.z > -7.5) requestAnimationFrame(anim);
      else ctx.onComplete();
    };
    anim();
  });

  return { destroy: () => gl.dispose() };
}
