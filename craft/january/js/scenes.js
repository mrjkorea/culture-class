/**
 * New Year's Party Craft — ten stages (no Halloween assets).
 */
import { mountBallDrop3D, mountBalloons3D } from "./stage3d.js";
import { HAT_COLORS, hatSvg } from "./ny-art.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mountMash(root, stage, ctx) {
  const total = stage.clicks || 40;
  let n = 0;
  root.innerHTML = `<button type="button" class="mash-btn ny-mash" id="mash">${esc(stage.title)}</button>`;
  const btn = root.querySelector("#mash");
  const tap = () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    if (n >= total) ctx.onComplete();
  };
  btn.addEventListener("click", tap);
  btn.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    tap();
  });
  return { destroy() {} };
}

function mountLuck2D(root, stage, ctx) {
  const pool = stage.poolSize;
  const good = new Set();
  while (good.size < stage.goodCount) good.add(Math.floor(Math.random() * pool));
  let found = 0;
  let finished = false;
  const cells = Array.from({ length: pool }, (_, i) => {
    const hue = (i * 37) % 360;
    return `<button type="button" class="luck-cell" data-i="${i}" style="--hue:${hue}"></button>`;
  }).join("");
  root.innerHTML = `<div class="luck-grid ny-luck" data-stage="${esc(stage.key)}">${cells}</div>`;
  root.querySelectorAll("[data-i]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (finished || btn.disabled) return;
      const i = Number(btn.dataset.i);
      ctx.sfx?.stage?.(stage.key);
      if (good.has(i)) {
        btn.classList.add("is-good");
        found += 1;
        if (found >= stage.goodCount) {
          finished = true;
          ctx.onComplete();
        }
      } else {
        btn.disabled = true;
        btn.classList.add("is-out");
        ctx.onMiss();
      }
    });
  });
  return { destroy() {} };
}

function mountPickHats(root, stage, ctx) {
  const opts = stage.options || 4;
  const buttons = HAT_COLORS.slice(0, opts)
    .map(
      (c, i) =>
        `<button type="button" class="hat-pick" data-id="${i}">${hatSvg(c)}</button>`
    )
    .join("");
  root.innerHTML = `<div class="hat-pick-grid">${buttons}</div>`;
  root.querySelectorAll(".hat-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll(".hat-pick").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      ctx.setHat?.(btn.dataset.id);
      ctx.onPick?.();
      ctx.onComplete();
    });
  });
  return { destroy() {} };
}

function mountCountdown(root, stage, ctx) {
  let n = 10;
  let interval = 0;
  const label = ctx.uiLang === "ko" ? "카운트다운 시작" : "Start countdown";
  root.innerHTML = `
    <div class="countdown-stage">
      <p class="countdown-num" id="cd-num">10</p>
      <button type="button" class="go big" id="cd-go">${esc(label)}</button>
    </div>`;
  const numEl = root.querySelector("#cd-num");
  const btn = root.querySelector("#cd-go");
  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    btn.disabled = true;
    ctx.onProgress(0, 10);
    ctx.speech?.playClip?.("countdown");
    interval = window.setInterval(() => {
      n -= 1;
      numEl.textContent = String(Math.max(n, 0));
      ctx.onProgress(10 - n, 10);
      if (n <= 0) {
        window.clearInterval(interval);
        ctx.onComplete();
      }
    }, 650);
  });
  return {
    destroy() {
      if (interval) window.clearInterval(interval);
    },
  };
}

export function mountStage(root, stage, ctx) {
  if (stage.key === "balloons" && stage.type === "luck_hunt") {
    const gl = mountBalloons3D(root, stage, ctx);
    if (gl) return gl;
  }
  if (stage.key === "balldrop" && stage.type === "luck_hunt") {
    const gl = mountBallDrop3D(root, stage, ctx);
    if (gl) return gl;
  }
  if (stage.type === "luck_hunt") return mountLuck2D(root, stage, ctx);
  if (stage.type === "pick") return mountPickHats(root, stage, ctx);
  if (stage.type === "countdown") return mountCountdown(root, stage, ctx);
  return mountMash(root, stage, ctx);
}
