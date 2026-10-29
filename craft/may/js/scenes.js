/**
 * May Buddhism path craft — calm Eightfold Path stages (10).
 */
import { gateSvg, lampSvg, lotusSvg } from "./path-art.js";

const KIND = ["Thank you", "Peace", "Hello friend", "You matter", "Be gentle"];
const MEAN = ["Go away", "That's dumb", "I hate", "Shut up", "You're slow", "Not fair"];

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function gateHintText(step, ctx) {
  const left = 3 - step;
  if (left <= 0) return "";
  if (step === 0) return ctx.t?.("gateTapHint") || "Tap 3 times";
  return ctx.t?.("gateTapLeft", { left }) || `Tap ${left} more`;
}

function mountGate(root, stage, ctx) {
  let step = 0;
  const btnLabel = esc(ctx.t?.("gateBtn") || "Enter the path");
  const hint = esc(gateHintText(0, ctx));
  root.innerHTML = `<div class="gate-stage">${gateSvg(0)}<button type="button" class="calm-btn" id="gate-btn">${btnLabel}</button><p class="hint gate-hint" id="gate-hint">${hint}</p></div>`;
  const box = root.querySelector(".gate-stage");
  const hintEl = root.querySelector("#gate-hint");
  root.querySelector("#gate-btn").addEventListener("click", () => {
    step += 1;
    ctx.sfx?.stage?.(stage.key);
    box.querySelector(".gate-svg").outerHTML = gateSvg(step / 3);
    if (hintEl) hintEl.textContent = gateHintText(step, ctx);
    if (step >= 3) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountFog(root, stage, ctx) {
  const pool = stage.poolSize || 12;
  const need = stage.goodCount || 4;
  let cleared = 0;
  root.innerHTML = `<div class="fog-field">${Array.from({ length: pool }, (_, i) => `<button type="button" class="fog-cloud" data-i="${i}">☁️</button>`).join("")}</div>`;
  root.querySelectorAll(".fog-cloud").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.style.opacity = "0";
      cleared += 1;
      ctx.onProgress(cleared, need);
      ctx.sfx?.stage?.(stage.key);
      if (cleared >= need) ctx.onComplete();
    });
  });
  return { destroy() {} };
}

function mountLamp(root, stage, ctx) {
  const total = stage.clicks || 25;
  let n = 0;
  root.innerHTML = `<div class="lamp-stage">${lampSvg(0)}<button type="button" class="calm-btn" id="lamp">Light the lamp</button></div>`;
  const wrap = root.querySelector(".lamp-stage");
  root.querySelector("#lamp").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const lamp = wrap.querySelector(".lamp-svg");
    if (lamp) lamp.outerHTML = lampSvg(n / total);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountKindWords(root, stage, ctx) {
  const pool = stage.poolSize || 10;
  const need = stage.goodCount || 4;
  const good = new Set();
  while (good.size < need) good.add(Math.floor(Math.random() * pool));
  const words = [];
  for (let i = 0; i < pool; i += 1) {
    words.push(good.has(i) ? KIND[i % KIND.length] : MEAN[i % MEAN.length]);
  }
  let found = 0;
  root.innerHTML = `<div class="word-sort">${words
    .map((w, i) => `<button type="button" class="word-chip" data-i="${i}">${esc(w)}</button>`)
    .join("")}</div>`;
  root.querySelectorAll(".word-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const i = Number(btn.dataset.i);
      ctx.sfx?.stage?.(stage.key);
      if (good.has(i)) {
        btn.classList.add("is-kind");
        btn.disabled = true;
        found += 1;
        ctx.onProgress(found, need);
        if (found >= need) ctx.onComplete();
      } else {
        btn.classList.add("is-mean");
        btn.disabled = true;
        ctx.onMiss();
      }
    });
  });
  return { destroy() {} };
}

function mountOffering(root, stage, ctx) {
  const foods = ["🍎", "🍚", "🍊", "🥖", "🫖"];
  const total = stage.clicks || foods.length;
  let placed = 0;
  root.innerHTML = `<div class="offering-board"><div class="altar">🪔</div><div class="food-tray">${foods
    .map((f, i) => `<button type="button" class="food-item" data-i="${i}">${f}</button>`)
    .join("")}</div></div>`;
  root.querySelectorAll(".food-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.classList.add("on-altar");
      placed += 1;
      ctx.onProgress(placed, total);
      ctx.sfx?.stage?.(stage.key);
      if (placed >= total) ctx.onComplete();
    });
  });
  return { destroy() {} };
}

function mountSweep(root, stage, ctx) {
  const total = stage.clicks || 40;
  let n = 0;
  root.innerHTML = `<div class="sweep-stage"><div class="path-line"></div><button type="button" class="calm-btn" id="sweep">Sweep 🧹</button></div>`;
  const line = root.querySelector(".path-line");
  root.querySelector("#sweep").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    if (line) line.style.width = `${(n / total) * 100}%`;
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountWalk(root, stage, ctx) {
  const total = stage.clicks || 45;
  let n = 0;
  root.innerHTML = `<div class="walk-path"><div class="walker" id="walker">🚶</div><button type="button" class="calm-btn mash-btn" id="walk">Keep walking</button><p class="hint">Tap or hold</p></div>`;
  const walker = root.querySelector("#walker");
  const btn = root.querySelector("#walk");
  let tick = null;

  const step = () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    if (walker) walker.style.left = `${Math.min(92, (n / total) * 90)}%`;
    if (n >= total) {
      stopHold();
      ctx.onComplete();
    }
  };

  const stopHold = () => {
    if (tick) window.clearInterval(tick);
    tick = null;
    btn?.classList.remove("is-holding");
  };

  const startHold = () => {
    if (n >= total || tick) return;
    btn?.classList.add("is-holding");
    step();
    tick = window.setInterval(step, 90);
  };

  btn.addEventListener("click", step);
  btn.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startHold();
  });
  btn.addEventListener("pointerup", stopHold);
  btn.addEventListener("pointerleave", stopHold);
  btn.addEventListener("pointercancel", stopHold);

  return {
    destroy() {
      stopHold();
    },
  };
}

function mountBreathe(root, stage, ctx) {
  const cycles = stage.cycles || 4;
  const holdMs = stage.holdMs || 2000;
  let done = 0;
  root.innerHTML = `<div class="breathe-stage">${lotusSvg(done * 5)}<button type="button" class="calm-btn breathe-btn" id="breathe">Hold to breathe</button><p class="hint">Press and hold</p></div>`;
  const wrap = root.querySelector(".breathe-stage");
  const btn = root.querySelector("#breathe");
  let holdTimer = 0;
  let holding = false;

  const onHoldDone = () => {
    done += 1;
    ctx.onProgress(done, cycles);
    ctx.sfx?.stage?.(stage.key);
    const lotus = wrap.querySelector(".lotus-svg");
    if (lotus) lotus.outerHTML = lotusSvg(done * 5);
    if (done >= cycles) ctx.onComplete();
  };

  const startHold = () => {
    holding = true;
    btn.classList.add("is-holding");
    holdTimer = window.setTimeout(() => {
      if (!holding) return;
      holding = false;
      btn.classList.remove("is-holding");
      onHoldDone();
    }, holdMs);
  };
  const endHold = () => {
    holding = false;
    btn.classList.remove("is-holding");
    clearTimeout(holdTimer);
  };

  btn.addEventListener("pointerdown", startHold);
  btn.addEventListener("pointerup", endHold);
  btn.addEventListener("pointerleave", endHold);
  return { destroy() {} };
}

function mountBell(root, stage, ctx) {
  root.innerHTML = `<div class="bell-stage"><button type="button" class="bell-btn" id="bell">🔔 Ring gently</button></div>`;
  root.querySelector("#bell").addEventListener("click", () => {
    ctx.sfx?.stage?.(stage.key);
    ctx.sfx?.bell?.();
    ctx.onComplete();
  });
  return { destroy() {} };
}

function mountLotus(root, stage, ctx) {
  const total = stage.clicks || 20;
  let n = 0;
  root.innerHTML = `<div class="lotus-finale">${lotusSvg(0)}<button type="button" class="calm-btn" id="bow">Quiet bow</button></div>`;
  const wrap = root.querySelector(".lotus-finale");
  root.querySelector("#bow").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const lotus = wrap.querySelector(".lotus-svg");
    if (lotus) lotus.outerHTML = lotusSvg(n);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

export function mountStage(root, stage, ctx) {
  if (stage.type === "gate") return mountGate(root, stage, ctx);
  if (stage.type === "fog") return mountFog(root, stage, ctx);
  if (stage.type === "lamp") return mountLamp(root, stage, ctx);
  if (stage.type === "kind_words") return mountKindWords(root, stage, ctx);
  if (stage.type === "offering") return mountOffering(root, stage, ctx);
  if (stage.type === "sweep") return mountSweep(root, stage, ctx);
  if (stage.type === "walk") return mountWalk(root, stage, ctx);
  if (stage.type === "breathe") return mountBreathe(root, stage, ctx);
  if (stage.type === "bell") return mountBell(root, stage, ctx);
  if (stage.type === "lotus") return mountLotus(root, stage, ctx);
  return mountGate(root, stage, ctx);
}
