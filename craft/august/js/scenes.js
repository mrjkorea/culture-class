/**
 * August History Day craft — ten civilization timeline stages.
 */
import { globeSvg, pyramidSvg, wallSvg } from "./history-art.js";

function mountClickMash(root, stage, ctx, { label, className = "click-stage", emoji = "" }) {
  const total = stage.clicks || 10;
  let n = 0;
  root.innerHTML = `<div class="${className}">
    <button type="button" class="hist-btn mash-btn" id="mash">${label} ${emoji}</button>
  </div>`;
  const btn = root.querySelector("#mash");
  let tick = null;
  const step = () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
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
    tick = window.setInterval(step, 100);
  };
  btn?.addEventListener("click", step);
  btn?.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startHold();
  });
  btn?.addEventListener("pointerup", stopHold);
  btn?.addEventListener("pointerleave", stopHold);
  btn?.addEventListener("pointercancel", stopHold);
  return { destroy() { stopHold(); } };
}

function mountPyramidStack(root, stage, ctx) {
  const total = stage.clicks || 12;
  let n = 0;
  root.innerHTML = `<div class="pyramid-stage">${pyramidSvg(0)}<button type="button" class="hist-btn" id="block">Place block 🧱</button></div>`;
  const wrap = root.querySelector(".pyramid-stage");
  root.querySelector("#block").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const svg = wrap.querySelector(".pyramid-svg");
    if (svg) svg.outerHTML = pyramidSvg(Math.ceil((n / total) * 4));
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountTabletStamp(root, stage, ctx) {
  return mountClickMash(root, stage, ctx, { label: "Stamp seal", emoji: "📜" });
}

function mountSettlement(root, stage, ctx) {
  const total = stage.clicks || 8;
  let n = 0;
  root.innerHTML = `<div class="settle-stage"><div class="river-band">🌊 Indus River</div><div class="house-row" id="houses"></div><button type="button" class="hist-btn" id="house">Place house 🏠</button></div>`;
  const row = root.querySelector("#houses");
  root.querySelector("#house").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const bit = document.createElement("span");
    bit.className = "house-bit";
    bit.textContent = "🏠";
    row?.append(bit);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountWallStones(root, stage, ctx) {
  const total = stage.clicks || 14;
  let n = 0;
  root.innerHTML = `<div class="wall-stage">${wallSvg(0)}<button type="button" class="hist-btn" id="stone">Lay stone 🧱</button></div>`;
  const wrap = root.querySelector(".wall-stage");
  root.querySelector("#stone").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const svg = wrap.querySelector(".wall-svg");
    if (svg) svg.outerHTML = wallSvg(n / total);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountColumnRebuild(root, stage, ctx) {
  const total = stage.clicks || 6;
  const parts = ["Base", "Drum", "Capital", "Frieze", "Roof", "Done"];
  let n = 0;
  root.innerHTML = `<div class="column-stage"><div class="column-stack" id="col"></div><button type="button" class="hist-btn" id="col-btn">${parts[0]} 🏛</button></div>`;
  const stack = root.querySelector("#col");
  const btn = root.querySelector("#col-btn");
  btn?.addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const seg = document.createElement("i");
    seg.className = "col-seg";
    seg.style.height = `${12 + n * 4}px`;
    stack?.append(seg);
    if (n < total) btn.textContent = `${parts[n] || "Piece"} 🏛`;
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountRoadPave(root, stage, ctx) {
  const total = stage.clicks || 16;
  let n = 0;
  root.innerHTML = `<div class="road-stage"><div class="road-line" id="road"></div><button type="button" class="hist-btn mash-btn" id="pave">Pave cobble 🛤</button></div>`;
  const road = root.querySelector("#road");
  const btn = root.querySelector("#pave");
  let tick = null;
  const step = () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const tile = document.createElement("span");
    tile.className = "road-tile";
    road?.append(tile);
    if (n >= total) {
      stopHold();
      const arch = document.createElement("span");
      arch.className = "aqueduct";
      arch.textContent = "⌒⌒⌒";
      road?.append(arch);
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
  btn?.addEventListener("click", step);
  btn?.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startHold();
  });
  btn?.addEventListener("pointerup", stopHold);
  btn?.addEventListener("pointerleave", stopHold);
  return { destroy() { stopHold(); } };
}

function mountMayaSteps(root, stage, ctx) {
  const total = stage.clicks || 10;
  let n = 0;
  root.innerHTML = `<div class="maya-stage"><div class="maya-pyramid" id="steps"></div><button type="button" class="hist-btn" id="step">Add step 🗿</button><button type="button" class="hist-btn spin-btn" id="spin">Spin calendar ☀</button></div>`;
  const steps = root.querySelector("#steps");
  root.querySelector("#step").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const s = document.createElement("i");
    s.className = "maya-step";
    steps?.append(s);
    if (n >= total) ctx.onComplete();
  });
  root.querySelector("#spin").addEventListener("click", () => {
    root.querySelector(".maya-stage")?.classList.toggle("is-spin");
    ctx.sfx?.stage?.(stage.key);
  });
  return { destroy() {} };
}

function mountGoldWeigh(root, stage, ctx) {
  const total = stage.weighCount || 6;
  let done = 0;
  root.innerHTML = `<div class="gold-stage">
    <p class="scale-display" id="scale">⚖️</p>
    <div class="gold-actions">
      <button type="button" class="hist-btn" data-side="left">Add gold 🪙</button>
      <button type="button" class="hist-btn" data-side="right">Add weight ⚖</button>
    </div>
  </div>`;
  root.querySelectorAll("[data-side]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const side = btn.dataset.side;
      ctx.sfx?.stage?.(stage.key);
      if (side !== "left") {
        ctx.onMiss?.();
        return;
      }
      done += 1;
      ctx.onProgress(done, total);
      const scale = root.querySelector("#scale");
      if (scale) scale.textContent = `⚖️ ${done}/${total}`;
      if (done >= total) {
        scale.textContent = "🐫 Caravan ready!";
        ctx.onComplete();
      }
    });
  });
  return { destroy() {} };
}

function mountTerraceBuild(root, stage, ctx) {
  const total = stage.clicks || 12;
  let n = 0;
  root.innerHTML = `<div class="inca-stage"><div class="terrace" id="terr"></div><button type="button" class="hist-btn mash-btn" id="terr-btn">Build terrace / hold bridge 🌉</button></div>`;
  const terr = root.querySelector("#terr");
  const btn = root.querySelector("#terr-btn");
  let tick = null;
  const step = () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const row = document.createElement("i");
    row.className = "terr-row";
    terr?.append(row);
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
    tick = window.setInterval(step, 105);
  };
  btn?.addEventListener("click", step);
  btn?.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startHold();
  });
  btn?.addEventListener("pointerup", stopHold);
  btn?.addEventListener("pointerleave", stopHold);
  return { destroy() { stopHold(); } };
}

function mountModernFinale(root, stage, ctx) {
  const total = stage.clicks || 10;
  let n = 0;
  const landmarks = ["🗼", "🗽", "🏙", "🌉", "🏟"];
  root.innerHTML = `<div class="modern-stage">${globeSvg(0)}<div class="landmarks" id="marks"></div><button type="button" class="hist-btn" id="light">Light globe / place landmark 🌍</button></div>`;
  const wrap = root.querySelector(".modern-stage");
  const marks = root.querySelector("#marks");
  root.querySelector("#light").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const g = wrap.querySelector(".globe-svg");
    if (g) g.outerHTML = globeSvg(n / total);
    const lm = document.createElement("span");
    lm.textContent = landmarks[n % landmarks.length];
    marks?.append(lm);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

export function mountStage(root, stage, ctx) {
  if (stage.type === "pyramid_stack") return mountPyramidStack(root, stage, ctx);
  if (stage.type === "tablet_stamp") return mountTabletStamp(root, stage, ctx);
  if (stage.type === "settlement_place") return mountSettlement(root, stage, ctx);
  if (stage.type === "wall_stones") return mountWallStones(root, stage, ctx);
  if (stage.type === "column_rebuild") return mountColumnRebuild(root, stage, ctx);
  if (stage.type === "road_pave") return mountRoadPave(root, stage, ctx);
  if (stage.type === "maya_steps") return mountMayaSteps(root, stage, ctx);
  if (stage.type === "gold_weigh") return mountGoldWeigh(root, stage, ctx);
  if (stage.type === "terrace_build") return mountTerraceBuild(root, stage, ctx);
  if (stage.type === "modern_finale") return mountModernFinale(root, stage, ctx);
  root.innerHTML = `<p class="hint">Unknown stage</p>`;
  return { destroy() {} };
}
