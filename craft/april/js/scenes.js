/**
 * April Easter craft — Waldo hunts, decorate, aim & roll (10 stages).
 */
import { mountEggRoll3D } from "./stage3d.js";
import {
  DYE_COLORS,
  eggSvg,
  huntLevelStyle,
  randomDecoy,
} from "./easter-art.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ensureEgg(ctx) {
  if (!ctx.craft.egg) {
    ctx.craft.egg = { clean: 0, fill: "#fff5f7", stickers: 0, face: false, aim: 35 };
  }
  return ctx.craft.egg;
}

function renderEggPreview(root, ctx) {
  const egg = ensureEgg(ctx);
  let el = root.querySelector(".egg-preview");
  if (!el) {
    el = document.createElement("div");
    el.className = "egg-preview";
    root.prepend(el);
  }
  el.innerHTML = eggSvg({
    fill: egg.fill,
    clean: egg.clean,
    stickers: egg.stickers,
    face: egg.face,
  });
}

function mountEggHunt(root, stage, ctx) {
  const level = stage.level || 1;
  const pool = stage.poolSize || 16;
  const { size, opacity } = huntLevelStyle(level);
  const eggAt = Math.floor(Math.random() * pool);
  root.innerHTML = `<div class="waldo-yard" data-level="${level}">${Array.from({ length: pool }, (_, i) => {
    const isEgg = i === eggAt;
    const label = isEgg ? "🥚" : randomDecoy();
    const style = isEgg
      ? `--sz:${size}px;--item-op:${opacity}`
      : `--sz:${32 + Math.random() * 16}px;--item-op:${0.75 + Math.random() * 0.25}`;
    return `<button type="button" class="waldo-item" data-i="${i}" style="${style}">${label}</button>`;
  }).join("")}</div><p class="hint">Tap the egg — not the garden clutter!</p>`;
  root.querySelectorAll(".waldo-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const i = Number(btn.dataset.i);
      ctx.sfx?.stage?.(stage.key);
      if (i === eggAt) {
        btn.classList.add("is-egg-found");
        ctx.onComplete();
      } else {
        btn.disabled = true;
        btn.style.opacity = "0.2";
        ctx.onMiss();
      }
    });
  });
  return { destroy() {} };
}

function mountWash(root, stage, ctx) {
  const total = stage.clicks || 35;
  let n = 0;
  const egg = ensureEgg(ctx);
  root.innerHTML = `<div class="egg-preview"></div><button type="button" class="mash-btn easter-mash" id="wash">Wash</button>`;
  renderEggPreview(root, ctx);
  root.querySelector("#wash").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    egg.clean = n / total;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    renderEggPreview(root, ctx);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountDye(root, stage, ctx) {
  const egg = ensureEgg(ctx);
  const buttons = DYE_COLORS
    .map(
      (c) =>
        `<button type="button" class="dye-pick" data-id="${c.id}" style="--c:${c.fill}" aria-label="${esc(c.label)}"></button>`
    )
    .join("");
  root.innerHTML = `<div class="dye-grid">${buttons}</div><div class="egg-preview"></div>`;
  renderEggPreview(root, ctx);
  root.querySelectorAll(".dye-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      const c = DYE_COLORS.find((x) => x.id === btn.dataset.id);
      egg.fill = c?.fill || egg.fill;
      egg.clean = 1;
      ctx.sfx?.stage?.(stage.key);
      renderEggPreview(root, ctx);
      ctx.onComplete();
    });
  });
  return { destroy() {} };
}

function mountFace(root, stage, ctx) {
  const total = stage.clicks || 40;
  let n = 0;
  const egg = ensureEgg(ctx);
  root.innerHTML = `<div class="egg-preview"></div><button type="button" class="mash-btn easter-mash" id="face">Stickers!</button>`;
  renderEggPreview(root, ctx);
  root.querySelector("#face").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    egg.stickers = Math.min(8, Math.floor(n / 5));
    if (n > total * 0.3) egg.face = true;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    renderEggPreview(root, ctx);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountAim(root, stage, ctx) {
  const egg = ensureEgg(ctx);
  root.innerHTML = `<div class="aim-stage">
    <div class="egg-preview"></div>
    <label class="aim-label">Angle: <span id="aim-val">${egg.aim}°</span></label>
    <input type="range" id="aim-slider" min="10" max="70" value="${egg.aim}">
    <button type="button" class="mash-btn easter-mash" id="aim-go">Lock aim</button>
  </div>`;
  renderEggPreview(root, ctx);
  const slider = root.querySelector("#aim-slider");
  const val = root.querySelector("#aim-val");
  slider.addEventListener("input", () => {
    egg.aim = Number(slider.value);
    val.textContent = `${egg.aim}°`;
  });
  root.querySelector("#aim-go").addEventListener("click", () => {
    ctx.sfx?.stage?.(stage.key);
    ctx.onComplete();
  });
  return { destroy() {} };
}

function mountRoll(root, stage, ctx) {
  const gl = mountEggRoll3D(root, stage, ctx);
  if (gl) return gl;
  const egg = ensureEgg(ctx);
  root.innerHTML = `<div class="roll-fallback">
    <p>Aim ${egg.aim}°</p>
    <button type="button" class="mash-btn easter-mash" id="roll">Roll!</button>
  </div>`;
  root.querySelector("#roll").addEventListener("click", () => {
    ctx.sfx?.stage?.(stage.key);
    ctx.onComplete();
  });
  return { destroy() {} };
}

export function mountStage(root, stage, ctx) {
  if (stage.type === "egg_hunt") return mountEggHunt(root, stage, ctx);
  if (stage.type === "wash") return mountWash(root, stage, ctx);
  if (stage.type === "dye") return mountDye(root, stage, ctx);
  if (stage.type === "face") return mountFace(root, stage, ctx);
  if (stage.type === "aim") return mountAim(root, stage, ctx);
  if (stage.type === "roll") return mountRoll(root, stage, ctx);
  return mountEggHunt(root, stage, ctx);
}
