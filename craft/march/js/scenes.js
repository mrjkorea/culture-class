/**
 * March St. Patrick's + Wheaten craft — 11 stages.
 */
import { mountRainbow3D } from "./stage3d.js";
import {
  breadSliceHtml,
  fieldCellSvg,
  hatSvg,
  leprechaunSvg,
  rainbowPotHtml,
} from "./march-art.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function assetUrl(ctx, rel) {
  if (!rel || !ctx.assetBase) return "";
  return new URL(rel, ctx.assetBase).href;
}

function mountShamrockField(root, stage, ctx) {
  const pool = stage.poolSize;
  const good = new Set();
  while (good.size < stage.goodCount) good.add(Math.floor(Math.random() * pool));
  let found = 0;
  let finished = false;
  root.innerHTML = `<div class="irish-field">${Array.from({ length: pool }, (_, i) => {
    const sham = good.has(i);
    return `<button type="button" class="field-cell" data-i="${i}">${fieldCellSvg(sham)}</button>`;
  }).join("")}</div>`;
  root.querySelectorAll(".field-cell").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (finished || btn.disabled) return;
      const i = Number(btn.dataset.i);
      ctx.sfx?.stage?.(stage.key);
      if (good.has(i)) {
        btn.classList.add("is-good");
        found += 1;
        ctx.onProgress(found, stage.goodCount);
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

function mountJig(root, stage, ctx) {
  const total = stage.clicks || 40;
  let n = 0;
  root.innerHTML = `<div class="jig-stage"><div class="jig-dancer">💃</div><button type="button" class="mash-btn march-mash jig-btn" id="jig">Jig!</button></div>`;
  const dancer = root.querySelector(".jig-dancer");
  const tap = () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    dancer?.style.setProperty("--spin", `${n * 18}deg`);
    if (n >= total) ctx.onComplete();
  };
  root.querySelector("#jig").addEventListener("click", tap);
  return { destroy() {} };
}

function mountGreen(root, stage, ctx) {
  const total = stage.clicks || 35;
  let n = 0;
  root.innerHTML = `<div class="green-stage">${hatSvg(0)}<button type="button" class="mash-btn march-mash" id="green">Paint green!</button></div>`;
  const hat = root.querySelector(".green-hat-svg")?.parentElement;
  const tap = () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    if (hat) hat.innerHTML = hatSvg((n / total) * 100);
    if (n >= total) ctx.onComplete();
  };
  root.querySelector("#green").addEventListener("click", tap);
  return { destroy() {} };
}

function mountRainbowHunt(root, stage, ctx) {
  const colors = ["#e03131", "#f59f00", "#ffd43b", "#2f9e44", "#339af0", "#7950f2", "#be4bdb"];
  const good = Math.floor(Math.random() * colors.length);
  root.innerHTML = `${rainbowPotHtml()}<div class="rainbow-pots">${colors
    .map(
      (c, i) =>
        `<button type="button" class="pot-cell" data-i="${i}" style="--pot:${c}"><span class="pot">🪙</span></button>`
    )
    .join("")}</div>`;
  root.querySelectorAll(".pot-cell").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.i);
      ctx.sfx?.stage?.(stage.key);
      if (i === good) {
        btn.classList.add("is-good");
        ctx.onComplete();
      } else {
        btn.classList.add("is-out");
        ctx.onMiss();
      }
    });
  });
  return { destroy() {} };
}

function mountChase(root, stage, ctx) {
  const total = stage.clicks || 12;
  let n = 0;
  root.innerHTML = `<div class="chase-arena" id="arena">${leprechaunSvg()}</div><p class="hint">Tap the leprechaun!</p>`;
  const arena = root.querySelector("#arena");
  const sprite = root.querySelector(".leprechaun-sprite");
  const move = () => {
    const x = 10 + Math.random() * 70;
    const y = 10 + Math.random() * 55;
    sprite.style.left = `${x}%`;
    sprite.style.top = `${y}%`;
  };
  move();
  sprite.addEventListener("click", (e) => {
    e.stopPropagation();
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    move();
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountPlate(root, stage, ctx) {
  const total = stage.clicks || 6;
  let onPlate = 0;
  root.innerHTML = `<div class="bread-board"><div class="bread-loaf">🥖</div><div class="bread-slices">${Array.from(
    { length: total },
    (_, i) => breadSliceHtml(i)
  ).join("")}</div><div class="bread-plate" id="plate">🍽️</div></div>`;
  root.querySelectorAll(".bread-slice").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.classList.add("on-plate");
      onPlate += 1;
      ctx.onProgress(onPlate, total);
      ctx.sfx?.stage?.(stage.key);
      if (onPlate >= total) ctx.onComplete();
    });
  });
  return { destroy() {} };
}

function mountRhythm(root, stage, ctx) {
  const total = stage.clicks || 16;
  let n = 0;
  let expectLeft = true;
  root.innerHTML = `<div class="bodhran-stage"><div class="bodhran-drum">🥁</div><div class="bodhran-pads"><button type="button" class="bodhran-pad" data-side="L">L</button><button type="button" class="bodhran-pad" data-side="R">R</button></div></div>`;
  root.querySelectorAll(".bodhran-pad").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (n >= total) return;
      const side = btn.dataset.side;
      const ok = (expectLeft && side === "L") || (!expectLeft && side === "R");
      expectLeft = !expectLeft;
      if (!ok) {
        ctx.onMiss();
        return;
      }
      n += 1;
      ctx.onProgress(n, total);
      ctx.sfx?.stage?.(stage.key);
      btn.classList.add("hit");
      window.setTimeout(() => btn.classList.remove("hit"), 120);
      if (n >= total) ctx.onComplete();
    });
  });
  return { destroy() {} };
}

function mountPhotoMash(root, stage, ctx) {
  const total = stage.clicks || 45;
  let n = 0;
  const src = assetUrl(ctx, stage.photo);
  root.innerHTML = `<div class="photo-stage wheaten-stage">
    <img class="wheaten-photo" src="${esc(src)}" alt="Soft-coated Wheaten terrier" width="280" height="200">
    <div class="brush-overlay" id="brush"></div>
    <button type="button" class="mash-btn march-mash" id="pet">Pet &amp; brush</button>
  </div>`;
  const brush = root.querySelector("#brush");
  const tap = () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    brush.style.opacity = String(Math.min(0.65, n / total));
    if (n >= total) ctx.onComplete();
  };
  root.querySelector("#pet").addEventListener("click", tap);
  return { destroy() {} };
}

function mountWalk(root, stage, ctx) {
  const steps = stage.steps || 4;
  const photos = [
    "wheaten/walk_01.jpg",
    "wheaten/walk_02.jpg",
    "wheaten/walk_03.jpg",
    "wheaten/walk_04.jpg",
  ];
  let step = 0;
  const src0 = assetUrl(ctx, photos[0]);
  root.innerHTML = `<div class="walk-stage"><img class="wheaten-photo walk-photo" id="walk-img" src="${esc(src0)}" alt="Walking Wheaten"><button type="button" class="mash-btn march-mash" id="walk-btn">Walk on</button></div>`;
  const img = root.querySelector("#walk-img");
  root.querySelector("#walk-btn").addEventListener("click", () => {
    step += 1;
    ctx.onProgress(step, steps);
    ctx.sfx?.stage?.(stage.key);
    if (step < steps) {
      const next = assetUrl(ctx, photos[step] || photos[photos.length - 1]);
      if (next) img.src = next;
    }
    if (step >= steps) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountPhotoLuck(root, stage, ctx) {
  const pool = stage.poolSize;
  const good = new Set();
  while (good.size < stage.goodCount) good.add(Math.floor(Math.random() * pool));
  const bg = assetUrl(ctx, stage.photo);
  root.innerHTML = `<div class="photo-luck" style="background-image:url('${esc(bg)}')"><div class="clover-grid">${Array.from(
    { length: pool },
    (_, i) => `<button type="button" class="clover-cell" data-i="${i}">?</button>`
  ).join("")}</div></div>`;
  root.querySelectorAll(".clover-cell").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const i = Number(btn.dataset.i);
      ctx.sfx?.stage?.(stage.key);
      if (good.has(i)) {
        btn.textContent = "☘️";
        btn.classList.add("is-good");
        ctx.onComplete();
      } else {
        btn.disabled = true;
        btn.classList.add("is-out");
        ctx.onMiss();
      }
    });
  });
  return { destroy() {} };
}

function mountParade(root, stage, ctx) {
  const total = stage.clicks || 30;
  let n = 0;
  const src = assetUrl(ctx, "wheaten/parade.jpg");
  root.innerHTML = `<div class="parade-stage">
    <div class="parade-float"><span>🧝</span><img class="wheaten-photo parade-dog" src="${esc(src)}" alt="Wheaten in parade"><span>🎉</span></div>
    <button type="button" class="mash-btn march-mash" id="parade">Celebrate!</button>
  </div>`;
  const tap = () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    if (n >= total) ctx.onComplete();
  };
  root.querySelector("#parade").addEventListener("click", tap);
  return { destroy() {} };
}

export function mountStage(root, stage, ctx) {
  if (stage.key === "shamrocks") return mountShamrockField(root, stage, ctx);
  if (stage.type === "jig") return mountJig(root, stage, ctx);
  if (stage.type === "green") return mountGreen(root, stage, ctx);
  if (stage.type === "rainbow_hunt") {
    const gl = mountRainbow3D(root, stage, ctx);
    if (gl) return gl;
    return mountRainbowHunt(root, stage, ctx);
  }
  if (stage.type === "chase") return mountChase(root, stage, ctx);
  if (stage.type === "plate") return mountPlate(root, stage, ctx);
  if (stage.type === "rhythm") return mountRhythm(root, stage, ctx);
  if (stage.type === "photo_mash") return mountPhotoMash(root, stage, ctx);
  if (stage.type === "walk") return mountWalk(root, stage, ctx);
  if (stage.type === "photo_luck") return mountPhotoLuck(root, stage, ctx);
  if (stage.type === "parade") return mountParade(root, stage, ctx);
  if (stage.type === "luck_hunt") return mountShamrockField(root, stage, ctx);
  return mountJig(root, stage, ctx);
}
