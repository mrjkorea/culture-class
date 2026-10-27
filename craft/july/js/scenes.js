/**
 * July Canada Day craft — eleven unique stages.
 */
import { boilSvg, flagSvg, lakeSvg, netSvg, treeSvg } from "./canada-art.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mountTapTree(root, stage, ctx) {
  const total = stage.clicks || 24;
  let n = 0;
  root.innerHTML = `<div class="tap-tree-stage">${treeSvg(0)}<button type="button" class="canada-btn" id="tap">Tap for sap 🍁</button></div>`;
  const wrap = root.querySelector(".tap-tree-stage");
  root.querySelector("#tap").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const t = wrap.querySelector(".maple-tree-svg");
    if (t) t.outerHTML = treeSvg(n / total);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountBoil(root, stage, ctx) {
  const total = stage.clicks || 35;
  let n = 0;
  root.innerHTML = `<div class="boil-stage">${boilSvg(0)}<button type="button" class="canada-btn mash-btn" id="boil">Stir & boil</button></div>`;
  const wrap = root.querySelector(".boil-stage");
  const btn = root.querySelector("#boil");
  btn.addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const b = wrap.querySelector(".boil-svg");
    if (b) b.outerHTML = boilSvg(n / total);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountBottle(root, stage, ctx) {
  const total = stage.clicks || 6;
  let n = 0;
  root.innerHTML = `<div class="bottle-stage"><div class="jars">${Array.from(
    { length: total },
    (_, i) => `<button type="button" class="jar-btn" data-i="${i}">🫙</button>`
  ).join("")}</div></div>`;
  root.querySelectorAll(".jar-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = "🍯";
      n += 1;
      ctx.onProgress(n, total);
      ctx.sfx?.stage?.(stage.key);
      if (n >= total) ctx.onComplete();
    });
  });
  return { destroy() {} };
}

function mountLakeSpot(root, stage, ctx) {
  const pool = stage.poolSize || 12;
  const need = stage.goodCount || 3;
  const good = new Set();
  while (good.size < need) good.add(Math.floor(Math.random() * pool));
  let found = 0;
  root.innerHTML = `<div class="lake-stage">${lakeSvg(false)}<div class="ice-grid">${Array.from(
    { length: pool },
    (_, i) => `<button type="button" class="ice-cell" data-i="${i}">❄️</button>`
  ).join("")}</div></div>`;
  root.querySelectorAll(".ice-cell").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const i = Number(btn.dataset.i);
      ctx.sfx?.stage?.(stage.key);
      if (good.has(i)) {
        btn.disabled = true;
        btn.textContent = "🎣";
        found += 1;
        ctx.onProgress(found, need);
        if (found >= need) {
          const lake = root.querySelector(".lake-svg");
          if (lake) lake.outerHTML = lakeSvg(true);
          ctx.onComplete();
        }
      } else {
        btn.classList.add("bad");
        ctx.onMiss?.();
      }
    });
  });
  return { destroy() {} };
}

function mountIceCut(root, stage, ctx) {
  const total = stage.clicks || 28;
  let n = 0;
  root.innerHTML = `<div class="cut-stage"><div class="ice-hole" id="hole"></div><button type="button" class="canada-btn" id="cut">Cut ice 🪚</button></div>`;
  const hole = root.querySelector("#hole");
  root.querySelector("#cut").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    if (hole) hole.style.setProperty("--cut", `${(n / total) * 100}%`);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountFishHold(root, stage, ctx) {
  const need = stage.holdRequiredMs || 60000;
  let held = 0;
  let holding = false;
  let phase = "fish";
  let raf = 0;
  let last = 0;
  let lastSec = -1;

  root.innerHTML = `<div class="fish-stage">
    <p class="fish-status" id="fish-status">Hold the line — don't let go!</p>
    <div class="fish-meter"><span id="fish-fill"></span></div>
    <button type="button" class="canada-btn fish-hold-btn" id="hold-line">Hold line 🎣</button>
    <button type="button" class="canada-btn reel-btn" id="reel" hidden>Reel in!</button>
  </div>`;
  const status = root.querySelector("#fish-status");
  const fill = root.querySelector("#fish-fill");
  const holdBtn = root.querySelector("#hold-line");
  const reelBtn = root.querySelector("#reel");

  const paint = () => {
    const sec = Math.min(60, Math.floor(held / 1000));
    if (sec !== lastSec) {
      lastSec = sec;
      ctx.onProgress(sec, 60);
    }
    if (fill) fill.style.width = `${Math.min(100, (held / need) * 100)}%`;
  };

  const tick = (now) => {
    if (holding && phase === "fish") {
      const dt = last ? now - last : 0;
      held += dt;
      paint();
      if (held >= need) {
        phase = "reel";
        holding = false;
        holdBtn.hidden = true;
        reelBtn.hidden = false;
        if (status) status.textContent = "Fish on! Reel it in!";
        ctx.sfx?.win?.();
      }
    }
    last = now;
    raf = requestAnimationFrame(tick);
  };

  const loseFish = () => {
    if (phase !== "fish") return;
    held = 0;
    lastSec = -1;
    paint();
    if (status) status.textContent = "The fish got away — hold again!";
    ctx.onMiss?.();
    ctx.sfx?.miss?.();
  };

  const startHold = (e) => {
    if (phase !== "fish") return;
    if (e?.pointerType === "mouse" && e.button !== 0) return;
    holding = true;
    holdBtn?.classList.add("is-holding");
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const stopHold = () => {
    if (phase !== "fish") return;
    holding = false;
    holdBtn?.classList.remove("is-holding");
    if (held > 0 && held < need) loseFish();
  };

  holdBtn.addEventListener("pointerdown", startHold);
  holdBtn.addEventListener("pointerup", stopHold);
  holdBtn.addEventListener("pointerleave", stopHold);
  holdBtn.addEventListener("pointercancel", stopHold);

  reelBtn.addEventListener("click", () => {
    if (phase !== "reel") return;
    ctx.onProgress(60, 60);
    ctx.sfx?.stage?.(stage.key);
    ctx.onComplete();
  });

  raf = requestAnimationFrame(tick);

  return {
    destroy() {
      holding = false;
      cancelAnimationFrame(raf);
    },
  };
}

function mountGear(root, stage, ctx) {
  const total = stage.clicks || 8;
  let n = 0;
  const steps = ["Lace skates ⛸️", "Tighten ⛸️", "Grab stick 🏒", "Tape stick 🏒", "Helmet 🪖", "Gloves 🧤", "Ready!", "Let's go!"];
  root.innerHTML = `<button type="button" class="canada-btn" id="gear">${esc(steps[0])}</button>`;
  const btn = root.querySelector("#gear");
  btn.addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    if (n < total) btn.textContent = steps[n] || "Ready!";
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountHockey(root, stage, ctx) {
  const pool = stage.poolSize || 9;
  const need = stage.goodCount || 5;
  const goals = new Set();
  while (goals.size < need) goals.add(Math.floor(Math.random() * pool));
  let scored = 0;
  root.innerHTML = `<div class="hockey-stage">${netSvg()}<div class="shot-grid">${Array.from(
    { length: pool },
    (_, i) => `<button type="button" class="shot-cell" data-i="${i}">🏒</button>`
  ).join("")}</div></div>`;
  root.querySelectorAll(".shot-cell").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const i = Number(btn.dataset.i);
      ctx.sfx?.stage?.(stage.key);
      if (goals.has(i)) {
        btn.disabled = true;
        btn.textContent = "🥅";
        scored += 1;
        ctx.onProgress(scored, need);
        if (scored >= need) ctx.onComplete();
      } else {
        btn.classList.add("miss-shot");
        ctx.onMiss?.();
      }
    });
  });
  return { destroy() {} };
}

function mountCheer(root, stage, ctx) {
  const total = stage.clicks || 12;
  let n = 0;
  root.innerHTML = `<div class="cheer-stage"><button type="button" class="canada-btn cheer-btn" id="cheer">🍁 Cheer!</button></div>`;
  root.querySelector("#cheer").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const leaf = document.createElement("span");
    leaf.className = "cheer-leaf";
    leaf.textContent = "🍁";
    leaf.style.left = `${10 + Math.random() * 80}%`;
    root.querySelector(".cheer-stage")?.append(leaf);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountFlag(root, stage, ctx) {
  const total = stage.clicks || 5;
  let n = 0;
  root.innerHTML = `<div class="flag-stage">${flagSvg(0)}<button type="button" class="canada-btn" id="flag">Raise flag 🇨🇦</button></div>`;
  const wrap = root.querySelector(".flag-stage");
  root.querySelector("#flag").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const f = wrap.querySelector(".flag-svg");
    if (f) f.outerHTML = flagSvg(n / total);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountFireworks(root, stage, ctx) {
  const total = stage.clicks || 15;
  let n = 0;
  root.innerHTML = `<div class="fireworks-stage" id="fw-box">
    <button type="button" class="canada-btn fw-btn" id="burst">Fireworks! 🎆</button>
    <button type="button" class="canada-btn ocanada-btn" id="ocanada">O Canada 🎵</button>
  </div>`;
  const box = root.querySelector("#fw-box");
  const burst = () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const bit = document.createElement("i");
    bit.className = "fw-bit";
    bit.style.left = `${20 + Math.random() * 60}%`;
    bit.style.top = `${20 + Math.random() * 40}%`;
    box?.append(bit);
    if (n >= total) ctx.onComplete();
  };
  root.querySelector("#burst").addEventListener("click", burst);
  root.querySelector("#ocanada").addEventListener("click", () => {
    ctx.sfx?.win?.();
    n = total;
    ctx.onProgress(total, total);
    for (let i = 0; i < 6; i += 1) {
      const bit = document.createElement("i");
      bit.className = "fw-bit";
      bit.style.left = `${10 + Math.random() * 80}%`;
      bit.style.top = `${10 + Math.random() * 50}%`;
      box?.append(bit);
    }
    ctx.onComplete();
  });
  return { destroy() {} };
}

export function mountStage(root, stage, ctx) {
  if (stage.type === "tap_tree") return mountTapTree(root, stage, ctx);
  if (stage.type === "boil") return mountBoil(root, stage, ctx);
  if (stage.type === "bottle") return mountBottle(root, stage, ctx);
  if (stage.type === "lake_spot") return mountLakeSpot(root, stage, ctx);
  if (stage.type === "ice_cut") return mountIceCut(root, stage, ctx);
  if (stage.type === "fish_hold") return mountFishHold(root, stage, ctx);
  if (stage.type === "gear") return mountGear(root, stage, ctx);
  if (stage.type === "hockey") return mountHockey(root, stage, ctx);
  if (stage.type === "cheer") return mountCheer(root, stage, ctx);
  if (stage.type === "flag") return mountFlag(root, stage, ctx);
  if (stage.type === "fireworks") return mountFireworks(root, stage, ctx);
  root.innerHTML = `<p class="hint">Unknown stage</p>`;
  return { destroy() {} };
}
