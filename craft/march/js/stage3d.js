import { createGlStage, THREE } from "./three-runtime.js";

function hostMarkup(label) {
  return `<div class="gl-host scene-3d gl-scene" data-play aria-label="${label}">
    <div class="gl-loading">Loading 3D…</div>
  </div>`;
}

/** Rainbow hill with a gold pot — tap when the leprechaun hint glows (fallback: overlay pick). */
export function mountRainbow3D(root, stage, ctx) {
  root.innerHTML = hostMarkup(stage.title);
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov: 55, fog: true });
  if (!gl) return null;
  container.querySelector(".gl-loading")?.remove();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 14),
    new THREE.MeshStandardMaterial({ color: 0x2b8a3e })
  );
  ground.rotation.x = -Math.PI / 2;
  gl.scene.add(ground);

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.7, 0.6, 16),
    new THREE.MeshStandardMaterial({ color: 0x212529 })
  );
  pot.position.set(2, 0.3, -1);
  gl.scene.add(pot);
  const gold = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd43b, emissive: 0xaa8800, emissiveIntensity: 0.3 })
  );
  gold.position.set(2, 0.75, -1);
  gl.scene.add(gold);

  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(4, 0.15, 8, 48, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xff6b6b })
  );
  arc.rotation.z = Math.PI;
  arc.position.set(0, 2.5, -3);
  gl.scene.add(arc);

  gl.camera.position.set(0, 4, 8);
  gl.camera.lookAt(0, 1, 0);

  const overlay = document.createElement("button");
  overlay.type = "button";
  overlay.className = "gl-overlay-btn pot-pick-btn";
  overlay.textContent = "🪙 Tap the gold pot!";
  container.append(overlay);
  overlay.addEventListener("click", () => {
    ctx.sfx?.stage?.(stage.key);
    ctx.onComplete();
  });

  return { destroy: () => gl.dispose() };
}
