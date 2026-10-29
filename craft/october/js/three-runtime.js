/**
 * Lightweight WebGL host (ski-jump style auto quality / DPR).
 * three.js r162 — last release with WebGL1 fallback on old Chromebooks.
 */
import * as THREE from "three";

const WEAK_GPU_RE =
  /swiftshader|llvmpipe|softpipe|basic render|microsoft basic|software|mesa offscreen|intel.*(gma|hd graphics( [2-5]\d{3}|\s*$|\)|,)|g41)/i;

function gpuName(renderer) {
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return String(
      ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    );
  } catch {
    return "";
  }
}

function makeRenderer(container) {
  const dpr0 = window.devicePixelRatio || 1;
  const tries = [
    { antialias: dpr0 < 1.5, powerPreference: "high-performance", alpha: false },
    { antialias: false, powerPreference: "default", alpha: false },
    { antialias: false, powerPreference: "low-power", precision: "mediump", alpha: false },
  ];
  let renderer = null;
  for (const opts of tries) {
    try {
      const r = new THREE.WebGLRenderer(opts);
      if (r.getContext()) {
        renderer = r;
        break;
      }
    } catch {
      /* next */
    }
  }
  if (!renderer) return null;
  const weak = !renderer.capabilities.isWebGL2 || WEAK_GPU_RE.test(gpuName(renderer));
  const dpr = Math.min(dpr0, weak ? 1 : 1.75);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0xffffff);
  renderer.domElement.className = "gl-stage";
  renderer.domElement.setAttribute("role", "img");
  container.appendChild(renderer.domElement);
  return { renderer, weak, dpr };
}

export function createGlStage(container, { fov = 52, fog = true } = {}) {
  const built = makeRenderer(container);
  if (!built) return null;
  const { renderer, weak } = built;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  if (fog) scene.fog = new THREE.Fog(0xffffff, 18, 55);
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 120);
  scene.add(new THREE.HemisphereLight(0xfff0d0, 0x6a8f4a, 1.35));
  const sun = new THREE.DirectionalLight(0xfff6e8, 1.1);
  sun.position.set(4, 9, 6);
  scene.add(sun);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let frame = 0;
  let running = true;
  let onFrame = null;

  function resize() {
    const w = container.clientWidth || 320;
    const h = container.clientHeight || 240;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function loop(now) {
    if (!running) return;
    frame = requestAnimationFrame(loop);
    if (onFrame) onFrame(now * 0.001);
    renderer.render(scene, camera);
  }

  resize();
  frame = requestAnimationFrame(loop);
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
  ro?.observe(container);

  return {
    scene,
    camera,
    renderer,
    raycaster,
    pointer,
    weak,
    resize,
    setFrame(fn) {
      onFrame = fn;
    },
    pick(meshes, clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width) return [];
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(meshes, true);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      ro?.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

export function seeded(n) {
  let s = (Math.sin((n + 1) * 12.9898) * 43758.5453) % 1;
  if (s < 0) s += 1;
  return () => {
    s = (s * 16807) % 1;
    return s;
  };
}

export { THREE };
