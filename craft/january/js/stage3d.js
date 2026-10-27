import { createGlStage, THREE } from "./three-runtime.js";
import { buildBallDropScene, buildBalloon } from "./balloon-mesh.js";

const BALLOON_COLORS = [0xff6b6b, 0xffd43b, 0x74c0fc, 0x51cf66, 0xff922b, 0xda77f2];

function hostMarkup(label) {
  return `<div class="gl-host scene-3d gl-scene" data-play aria-label="${label}">
    <div class="gl-loading">Loading 3D…</div>
  </div>`;
}

export function mountBalloons3D(root, stage, ctx) {
  root.innerHTML = hostMarkup(stage.title);
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov: 48, fog: true });
  if (!gl) return null;
  container.querySelector(".gl-loading")?.remove();

  const good = new Set();
  const pool = stage.poolSize;
  while (good.size < stage.goodCount) good.add(Math.floor(Math.random() * pool));

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 14),
    new THREE.MeshStandardMaterial({ color: 0x1a2a4a })
  );
  floor.rotation.x = -Math.PI / 2;
  gl.scene.add(floor);

  const cols = Math.ceil(Math.sqrt(pool));
  const balloons = [];
  let found = 0;
  let finished = false;
  const pickRoots = [];

  for (let i = 0; i < pool; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const b = buildBalloon(i, BALLOON_COLORS[i % BALLOON_COLORS.length]);
    b.position.set((col - cols / 2) * 1.1, 0, (row - pool / cols / 2) * 1.1);
    b.userData.alive = true;
    balloons.push(b);
    pickRoots.push(b);
    gl.scene.add(b);
  }

  gl.camera.position.set(0, 4, 9);
  gl.camera.lookAt(0, 1, 0);
  gl.setFrame((t) => {
    balloons.forEach((b, i) => {
      if (!b.userData.alive) return;
      b.position.y = Math.sin(t * 1.2 + i) * 0.08 + 0.05;
    });
  });

  function onPick(i) {
    if (finished) return;
    const b = balloons[i];
    if (!b?.userData.alive) return;
    ctx.sfx?.stage?.(stage.key);
    if (good.has(i)) {
      b.userData.alive = false;
      found += 1;
      if (found >= stage.goodCount) {
        finished = true;
        ctx.onComplete();
      }
    } else {
      b.userData.alive = false;
      b.visible = false;
      ctx.onMiss();
    }
  }

  function onPointer(e) {
    const hits = gl.pick(pickRoots, e.clientX, e.clientY);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData?.balloonIndex !== undefined) {
          onPick(o.userData.balloonIndex);
          return;
        }
        o = o.parent;
      }
    }
  }
  gl.renderer.domElement.addEventListener("pointerdown", onPointer);

  return {
    destroy() {
      gl.renderer.domElement.removeEventListener("pointerdown", onPointer);
      gl.dispose();
    },
  };
}

export function mountBallDrop3D(root, stage, ctx) {
  root.innerHTML = hostMarkup(stage.title);
  const container = root.querySelector(".gl-host");
  const gl = createGlStage(container, { fov: 50, fog: true });
  if (!gl) return null;
  container.querySelector(".gl-loading")?.remove();

  const scene = buildBallDropScene();
  gl.scene.add(scene);
  const ball = scene.userData.dropBall;
  gl.camera.position.set(0, 5, 10);
  gl.camera.lookAt(0, 4, 0);

  const spots = stage.poolSize || 12;
  const good = Math.floor(Math.random() * spots);
  let finished = false;

  const overlay = document.createElement("div");
  overlay.className = "balldrop-tap-row";
  for (let i = 0; i < spots; i += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "balldrop-spot";
    btn.textContent = String(i + 1);
    btn.addEventListener("click", () => {
      if (finished) return;
      ctx.sfx?.stage?.(stage.key);
      if (i === good) {
        finished = true;
        let y = 6;
        const drop = () => {
          y -= 0.12;
          ball.position.y = y;
          if (y > 0.8) requestAnimationFrame(drop);
          else ctx.onComplete();
        };
        drop();
      } else {
        btn.disabled = true;
        ctx.onMiss();
      }
    });
    overlay.append(btn);
  }
  container.append(overlay);

  gl.setFrame(() => {
    ball.rotation.y += 0.02;
  });

  return {
    destroy() {
      gl.dispose();
    },
  };
}
