import { createGlStage, THREE } from "./three-runtime.js";

function hostMarkup(label) {
  return `<div class="gl-host scene-3d gl-scene" data-play aria-label="${label}">
    <div class="gl-loading">Loading 3D…</div>
  </div>`;
}

/** Mailbox row — tap the slot to drop the card. */
export function mountMailbox3D(root, stage, ctx) {
  root.innerHTML = hostMarkup(stage.title);
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov: 50, fog: true });
  if (!gl) return null;
  container.querySelector(".gl-loading")?.remove();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 12),
    new THREE.MeshStandardMaterial({ color: 0xf8d7da })
  );
  ground.rotation.x = -Math.PI / 2;
  gl.scene.add(ground);

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.6, 1),
    new THREE.MeshStandardMaterial({ color: 0xe64980 })
  );
  box.position.set(0, 0.8, 0);
  gl.scene.add(box);
  const slot = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.15, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x212529 })
  );
  slot.position.set(0, 1.45, 0.2);
  gl.scene.add(slot);

  gl.camera.position.set(0, 3, 5);
  gl.camera.lookAt(0, 1, 0);

  const overlay = document.createElement("button");
  overlay.type = "button";
  overlay.className = "mailbox-drop-target gl-overlay-btn";
  overlay.textContent = "📬 Drop card in slot";
  container.append(overlay);
  overlay.addEventListener("click", () => {
    ctx.sfx?.stage?.(stage.key);
    let t = 0;
    const anim = () => {
      t += 0.05;
      slot.position.y = 1.45 - t * 0.3;
      if (t < 1) requestAnimationFrame(anim);
      else ctx.onComplete();
    };
    anim();
  });

  return { destroy: () => gl.dispose() };
}
