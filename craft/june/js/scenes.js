/**
 * June Remembrance craft — ten respectful stages.
 */
import { coatSvg, gardenSvg, memorialSvg, poppySvg } from "./remembrance-art.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mountDig(root, stage, ctx) {
  const total = stage.clicks || 18;
  let n = 0;
  root.innerHTML = `<div class="dig-stage">${gardenSvg(0)}<button type="button" class="calm-btn" id="dig">Dig soil</button></div>`;
  const wrap = root.querySelector(".dig-stage");
  root.querySelector("#dig").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const g = wrap.querySelector(".garden-svg");
    if (g) g.outerHTML = gardenSvg(n / total);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountPlant(root, stage, ctx) {
  const total = stage.clicks || 6;
  let n = 0;
  root.innerHTML = `<div class="plant-stage"><div class="seed-holes">${Array.from(
    { length: total },
    (_, i) => `<button type="button" class="seed-hole" data-i="${i}">·</button>`
  ).join("")}</div></div>`;
  root.querySelectorAll(".seed-hole").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = "🌱";
      btn.classList.add("planted");
      n += 1;
      ctx.onProgress(n, total);
      ctx.sfx?.stage?.(stage.key);
      if (n >= total) ctx.onComplete();
    });
  });
  return { destroy() {} };
}

function mountWater(root, stage, ctx) {
  const total = stage.clicks || 22;
  let n = 0;
  root.innerHTML = `<div class="water-stage"><div class="water-meter"><span id="wet"></span></div><button type="button" class="calm-btn" id="water">Water 💧</button></div>`;
  const wet = root.querySelector("#wet");
  root.querySelector("#water").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.splash?.();
    ctx.sfx?.stage?.(stage.key);
    if (wet) wet.style.width = `${(n / total) * 100}%`;
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountGrow(root, stage, ctx) {
  const total = stage.clicks || 10;
  let n = 0;
  root.innerHTML = `<div class="grow-stage"><div class="grow-row" id="grow-row"></div><button type="button" class="calm-btn" id="grow">Help them grow</button></div>`;
  const row = root.querySelector("#grow-row");
  const render = () => {
    row.innerHTML = Array.from({ length: 3 }, () => poppySvg(n / total)).join("");
  };
  render();
  root.querySelector("#grow").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    render();
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountPick(root, stage, ctx) {
  const total = stage.clicks || 3;
  let n = 0;
  root.innerHTML = `<div class="pick-stage">${Array.from(
    { length: 5 },
    (_, i) => `<button type="button" class="poppy-btn" data-i="${i}">🌺</button>`
  ).join("")}</div>`;
  root.querySelectorAll(".poppy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled || n >= total) return;
      btn.disabled = true;
      btn.textContent = "✓";
      n += 1;
      ctx.onProgress(n, total);
      ctx.sfx?.stage?.(stage.key);
      if (n >= total) ctx.onComplete();
    });
  });
  return { destroy() {} };
}

function mountPin(root, stage, ctx) {
  const total = stage.clicks || 4;
  let n = 0;
  root.innerHTML = `<div class="pin-stage">${coatSvg(false)}<button type="button" class="calm-btn" id="pin">Pin poppy</button></div>`;
  const wrap = root.querySelector(".pin-stage");
  root.querySelector("#pin").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const coat = wrap.querySelector(".coat-svg");
    if (coat) coat.outerHTML = coatSvg(n >= total);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountMarch(root, stage, ctx) {
  const total = stage.clicks || 40;
  let n = 0;
  root.innerHTML = `<div class="march-path"><div class="march-figure" id="march-fig">🚶</div><div class="memorial-far">${memorialSvg()}</div><button type="button" class="calm-btn mash-btn" id="march">Walk quietly</button><p class="hint">Tap or hold</p></div>`;
  const fig = root.querySelector("#march-fig");
  const btn = root.querySelector("#march");
  let tick = null;

  const step = () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    if (fig) fig.style.left = `${Math.min(78, (n / total) * 75)}%`;
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
    tick = window.setInterval(step, 95);
  };
  btn.addEventListener("click", step);
  btn.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startHold();
  });
  btn.addEventListener("pointerup", stopHold);
  btn.addEventListener("pointerleave", stopHold);
  btn.addEventListener("pointercancel", stopHold);
  return { destroy() { stopHold(); } };
}

function mountPlace(root, stage, ctx) {
  root.innerHTML = `<div class="place-stage">${memorialSvg(false)}<button type="button" class="calm-btn" id="place">Place poppy</button></div>`;
  const wrap = root.querySelector(".place-stage");
  root.querySelector("#place").addEventListener("click", () => {
    ctx.onProgress(1, 1);
    ctx.sfx?.stage?.(stage.key);
    const m = wrap.querySelector(".memorial-svg");
    if (m) m.outerHTML = memorialSvg(true);
    ctx.onComplete();
  });
  return { destroy() {} };
}

function mountCard(root, stage, ctx) {
  const total = stage.clicks || 5;
  const words = ["We", "remember", "those", "who", "served"];
  let n = 0;
  root.innerHTML = `<div class="card-stage"><div class="card-paper" id="card-paper"></div><div class="card-words">${words
    .map((w, i) => `<button type="button" class="card-word" data-i="${i}">${esc(w)}</button>`)
    .join("")}</div></div>`;
  const paper = root.querySelector("#card-paper");
  root.querySelectorAll(".card-word").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      const span = document.createElement("span");
      span.textContent = `${btn.textContent} `;
      paper?.append(span);
      n += 1;
      ctx.onProgress(n, total);
      ctx.sfx?.stage?.(stage.key);
      if (n >= total) {
        const wrap = root.querySelector(".card-stage");
        const mem = wrap?.querySelector(".memorial-svg");
        if (!mem) {
          const slot = document.createElement("div");
          slot.className = "card-memorial";
          slot.innerHTML = memorialSvg(true, true);
          wrap?.append(slot);
        }
        window.setTimeout(() => ctx.onComplete(), 400);
      }
    });
  });
  return { destroy() {} };
}

function mountSilence(root, stage, ctx) {
  const need = stage.holdRequiredMs || 60000;
  let accumulated = 0;
  let holding = false;
  let raf = 0;
  let last = 0;
  let lastSec = -1;

  root.innerHTML = `<div class="silence-stage">
    <p class="silence-crowd" id="crowd-label">Crowd chatting…</p>
    <div class="silence-ring"><span id="silence-fill"></span></div>
    <button type="button" class="calm-btn silence-btn" id="silence-hold">Hold for quiet</button>
    <p class="hint">Press and hold about one minute total</p>
  </div>`;
  const btn = root.querySelector("#silence-hold");
  const fill = root.querySelector("#silence-fill");
  const crowdLabel = root.querySelector("#crowd-label");

  const paint = () => {
    const sec = Math.min(60, Math.floor(accumulated / 1000));
    if (sec !== lastSec) {
      lastSec = sec;
      ctx.onProgress(sec, 60);
    }
    if (fill) fill.style.width = `${(accumulated / need) * 100}%`;
    if (crowdLabel) {
      crowdLabel.textContent = holding ? "Quiet…" : "Crowd chatting…";
      crowdLabel.classList.toggle("is-quiet", holding);
    }
  };

  const tick = (now) => {
    if (holding) {
      const dt = last ? now - last : 0;
      accumulated += dt;
      paint();
      if (accumulated >= need) {
        stopHold();
        ctx.sfx?.stopCrowd?.();
        ctx.onComplete();
        return;
      }
    }
    last = now;
    raf = requestAnimationFrame(tick);
  };

  const startHold = (e) => {
    if (e?.pointerType === "mouse" && e.button !== 0) return;
    if (accumulated >= need) return;
    holding = true;
    btn?.classList.add("is-holding");
    ctx.sfx?.stopCrowd?.();
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const stopHold = () => {
    holding = false;
    btn?.classList.remove("is-holding");
    if (accumulated < need) ctx.sfx?.startCrowd?.();
    paint();
  };

  ctx.sfx?.startCrowd?.();
  paint();

  btn.addEventListener("pointerdown", startHold);
  btn.addEventListener("pointerup", stopHold);
  btn.addEventListener("pointerleave", stopHold);
  btn.addEventListener("pointercancel", stopHold);

  return {
    destroy() {
      holding = false;
      cancelAnimationFrame(raf);
      ctx.sfx?.stopCrowd?.();
    },
  };
}

export function mountStage(root, stage, ctx) {
  if (stage.type === "dig") return mountDig(root, stage, ctx);
  if (stage.type === "plant") return mountPlant(root, stage, ctx);
  if (stage.type === "water") return mountWater(root, stage, ctx);
  if (stage.type === "grow") return mountGrow(root, stage, ctx);
  if (stage.type === "pick") return mountPick(root, stage, ctx);
  if (stage.type === "pin") return mountPin(root, stage, ctx);
  if (stage.type === "march") return mountMarch(root, stage, ctx);
  if (stage.type === "place") return mountPlace(root, stage, ctx);
  if (stage.type === "card") return mountCard(root, stage, ctx);
  if (stage.type === "silence") return mountSilence(root, stage, ctx);
  root.innerHTML = `<p class="hint">Unknown stage</p>`;
  return { destroy() {} };
}
