/**
 * November Thanksgiving craft — eleven feast stages (3D + photo backdrops).
 */
import { scene3dUrl } from "./assets.js";
import {
  mountHunt3D,
  mountMash3D,
  mountOven3D,
  mountPie3D,
  mountPlates3D,
  mountPluck3D,
} from "./stage3d.js";
import {
  diningRoomSvg,
  gravyPotSvg,
  ovenSvg,
  pieBakeSvg,
  stuffingBowlSvg,
  tableSvg,
  turkeyPluckSvg,
} from "./thanksgiving-art.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sceneKeyForStage(stage) {
  return stage.key || "hunt";
}

function backdropAttr(ctx, sceneKey) {
  const bg = scene3dUrl(ctx?.assetBase, ctx?.manifest, sceneKey);
  if (!bg) return "";
  const safe = String(bg).replace(/'/g, "%27").replace(/"/g, "%22");
  return ` style="background-image:url('${safe}')"`;
}

function feastSceneWrap(ctx, stage, inner, extraClass = "") {
  const key = sceneKeyForStage(stage);
  return `<div class="feast-scene scene-3d gl-scene ${extraClass}"${backdropAttr(ctx, key)}>${inner}</div>`;
}

function mountTurkeyHunt(root, stage, ctx) {
  const gl = mountHunt3D(root, stage, ctx);
  if (gl) return gl;
  const pool = stage.poolSize || 16;
  const turkeys = new Set([Math.floor(Math.random() * pool)]);
  let found = false;
  root.innerHTML = feastSceneWrap(
    ctx,
    stage,
    `<div class="hunt-field hunt-field-lg">${Array.from(
      { length: pool },
      (_, i) => `<button type="button" class="bush-cell" data-i="${i}">🌾</button>`
    ).join("")}</div>`,
    "feast-fallback"
  );
  root.querySelectorAll(".bush-cell").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled || found) return;
      const i = Number(btn.dataset.i);
      ctx.sfx?.stage?.(stage.key);
      if (turkeys.has(i)) {
        found = true;
        btn.textContent = "🦃";
        btn.disabled = true;
        ctx.onProgress(1, 1);
        ctx.onComplete();
      } else {
        btn.classList.add("miss-bush");
        ctx.onMiss?.();
      }
    });
  });
  return { destroy() {} };
}

function mountPluck(root, stage, ctx) {
  const gl = mountPluck3D(root, stage, ctx);
  if (gl) return gl;
  const total = stage.clicks || 28;
  let n = 0;
  root.innerHTML = feastSceneWrap(
    ctx,
    stage,
    `<div class="pluck-stage pluck-stage-lg">
      <div class="pluck-art-wrap">${turkeyPluckSvg(1)}</div>
      <button type="button" class="feast-btn feast-btn-lg" id="pluck">Pluck feathers</button>
      <p class="feather-count" id="fc">0</p>
    </div>`
  );
  const art = root.querySelector(".pluck-turkey-art");
  const fc = root.querySelector("#fc");
  root.querySelector("#pluck").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    if (art) art.outerHTML = turkeyPluckSvg(1 - n / total);
    if (fc) fc.textContent = `${n}`;
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountStuff(root, stage, ctx) {
  const total = stage.clicks || 20;
  let n = 0;
  root.innerHTML = feastSceneWrap(
    ctx,
    stage,
    `<div class="stuff-stage stuff-stage-lg">
      <div class="stuff-art">${stuffingBowlSvg(0)}</div>
      <button type="button" class="feast-btn feast-btn-lg" id="stuff">Stuff dressing</button>
      <div class="stuff-meter"><span id="sm"></span></div>
    </div>`
  );
  const sm = root.querySelector("#sm");
  const art = root.querySelector(".stuff-bowl-art");
  root.querySelector("#stuff").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    if (sm) sm.style.width = `${(n / total) * 100}%`;
    if (art) art.outerHTML = stuffingBowlSvg(n / total);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountOvenHold(root, stage, ctx) {
  const gl = mountOven3D(root, stage, ctx);
  if (gl) return gl;
  const need = stage.holdRequiredMs || 60000;
  let accumulated = 0;
  let holding = false;
  let raf = 0;
  let last = 0;
  let lastSec = -1;

  root.innerHTML = feastSceneWrap(
    ctx,
    stage,
    `<div class="oven-stage oven-stage-lg">
      ${ovenSvg(0)}
      <p class="oven-hint" id="oven-hint">Hold to roast — about one minute</p>
      <div class="oven-meter"><span id="oven-fill"></span></div>
      <button type="button" class="feast-btn feast-btn-lg oven-hold-btn" id="oven-hold">Hold oven door</button>
    </div>`
  );
  const fill = root.querySelector("#oven-fill");
  const hint = root.querySelector("#oven-hint");
  const btn = root.querySelector("#oven-hold");
  const wrap = root.querySelector(".oven-stage");

  const paint = () => {
    const sec = Math.min(60, Math.floor(accumulated / 1000));
    if (sec !== lastSec) {
      lastSec = sec;
      ctx.onProgress(sec, 60);
    }
    if (fill) fill.style.width = `${(accumulated / need) * 100}%`;
    const oven = wrap?.querySelector(".oven-svg");
    if (oven) oven.outerHTML = ovenSvg(accumulated / need);
    if (hint) hint.textContent = holding ? "Roasting…" : "Hold to keep roasting";
  };

  const tick = (now) => {
    if (holding) {
      const dt = last ? now - last : 0;
      accumulated += dt;
      paint();
      if (accumulated >= need) {
        stopHold();
        ctx.sfx?.win?.();
        ctx.onComplete();
        return;
      }
    }
    last = now;
    raf = requestAnimationFrame(tick);
  };

  const stopHold = () => {
    holding = false;
    btn?.classList.remove("is-holding");
    paint();
  };

  const startHold = (e) => {
    if (accumulated >= need) return;
    if (e?.pointerType === "mouse" && e.button !== 0) return;
    holding = true;
    btn?.classList.add("is-holding");
    ctx.sfx?.stage?.(stage.key);
    if (!raf) raf = requestAnimationFrame(tick);
  };

  btn.addEventListener("pointerdown", startHold);
  btn.addEventListener("pointerup", stopHold);
  btn.addEventListener("pointerleave", stopHold);
  btn.addEventListener("pointercancel", stopHold);
  raf = requestAnimationFrame(tick);

  return {
    destroy() {
      holding = false;
      cancelAnimationFrame(raf);
    },
  };
}

function mountMash(root, stage, ctx) {
  const gl = mountMash3D(root, stage, ctx);
  if (gl) return gl;
  const total = stage.clicks || 32;
  let n = 0;
  root.innerHTML = feastSceneWrap(
    ctx,
    stage,
    `<div class="mash-stage mash-stage-lg">
      <button type="button" class="feast-btn feast-btn-lg mash-btn" id="mash">Mash 🥔</button>
      <p class="hint feast-hint-overlay">Tap the pot — keep mashing!</p>
    </div>`
  );
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
    tick = window.setInterval(step, 90);
  };
  btn.addEventListener("click", step);
  btn.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startHold();
  });
  btn.addEventListener("pointerup", stopHold);
  btn.addEventListener("pointerleave", stopHold);
  return { destroy() { stopHold(); } };
}

function mountGravy(root, stage, ctx) {
  const total = stage.clicks || 16;
  let n = 0;
  root.innerHTML = feastSceneWrap(
    ctx,
    stage,
    `<div class="gravy-stage gravy-stage-lg">
      <div class="gravy-art">${gravyPotSvg(0)}</div>
      <button type="button" class="feast-btn feast-btn-lg" id="pour">Pour gravy</button>
    </div>`
  );
  const art = root.querySelector(".gravy-pot-art");
  root.querySelector("#pour").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.splash?.();
    ctx.sfx?.stage?.(stage.key);
    if (art) art.outerHTML = gravyPotSvg(n / total);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountPie(root, stage, ctx) {
  const gl = mountPie3D(root, stage, ctx);
  if (gl) return gl;
  const total = stage.clicks || 12;
  let n = 0;
  root.innerHTML = feastSceneWrap(
    ctx,
    stage,
    `<div class="pie-stage pie-stage-lg">
      <div class="pie-art">${pieBakeSvg(0)}</div>
      <button type="button" class="feast-btn feast-btn-lg" id="bake">Bake pie</button>
    </div>`
  );
  const art = root.querySelector(".pie-bake-art");
  root.querySelector("#bake").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    if (art) art.outerHTML = pieBakeSvg(n / total);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountSetPlates(root, stage, ctx) {
  const gl = mountPlates3D(root, stage, ctx);
  if (gl) return gl;
  const total = stage.clicks || 6;
  let n = 0;
  root.innerHTML = feastSceneWrap(
    ctx,
    stage,
    `<div class="table-stage table-stage-lg">${tableSvg(0)}<div class="plate-row plate-row-lg" id="plates"></div></div>`
  );
  const row = root.querySelector("#plates");
  for (let i = 0; i < total; i += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "plate-btn plate-btn-lg";
    btn.textContent = "Set plate";
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = "🍽️";
      n += 1;
      ctx.onProgress(n, total);
      ctx.sfx?.stage?.(stage.key);
      const t = root.querySelector(".table-svg");
      if (t) t.outerHTML = tableSvg(n / total);
      if (n >= total) ctx.onComplete();
    });
    row?.append(btn);
  }
  return { destroy() {} };
}

function mountSetSilver(root, stage, ctx) {
  const total = stage.clicks || 8;
  const items = ["🍴", "🍴", "🥛", "🥛", "🍴", "🥛", "🧻", "🍴"];
  let n = 0;
  root.innerHTML = feastSceneWrap(
    ctx,
    stage,
    `<div class="silver-stage silver-stage-lg">
      ${diningRoomSvg()}
      <div class="silver-grid silver-grid-lg" id="sg"></div>
    </div>`
  );
  const grid = root.querySelector("#sg");
  items.forEach((icon, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "silver-btn silver-btn-lg";
    btn.textContent = i < total ? "?" : "—";
    if (i >= total) {
      btn.disabled = true;
      return;
    }
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = icon;
      n += 1;
      ctx.onProgress(n, total);
      ctx.sfx?.stage?.(stage.key);
      if (n >= total) ctx.onComplete();
    });
    grid?.append(btn);
  });
  return { destroy() {} };
}

function mountSeatFamily(root, stage, ctx) {
  const total = stage.clicks || 5;
  const names = ["Mom", "Dad", "Grandma", "Grandpa", "You"];
  let n = 0;
  root.innerHTML = feastSceneWrap(
    ctx,
    stage,
    `<div class="seat-stage seat-stage-lg">
      ${diningRoomSvg()}
      <div class="chair-row chair-row-lg" id="chairs"></div>
    </div>`
  );
  const row = root.querySelector("#chairs");
  names.forEach((name, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chair-btn chair-btn-lg";
    btn.textContent = `Seat ${name}`;
    btn.addEventListener("click", () => {
      if (btn.disabled || i >= total) return;
      btn.disabled = true;
      btn.textContent = `${name} 🪑`;
      n += 1;
      ctx.onProgress(n, total);
      ctx.sfx?.stage?.(stage.key);
      if (n >= total) ctx.onComplete();
    });
    row?.append(btn);
  });
  return { destroy() {} };
}

function mountThankfulCard(root, stage, ctx) {
  const cards = [
    { en: "Family", ko: "가족" },
    { en: "Friends", ko: "친구" },
    { en: "Food", ko: "음식" },
    { en: "Home", ko: "집" },
    { en: "Health", ko: "건강" },
    { en: "School", ko: "학교" },
  ];
  const lang = ctx.uiLang === "ko" ? "ko" : "en";
  root.innerHTML = feastSceneWrap(
    ctx,
    stage,
    `<div class="thanks-stage thanks-stage-lg">
      <p class="thanks-prompt">I'm thankful for…</p>
      <div class="thanks-cards thanks-cards-lg">${cards
        .map(
          (c, i) =>
            `<button type="button" class="thanks-card thanks-card-lg" data-i="${i}">${esc(c[lang])}</button>`
        )
        .join("")}</div>
    </div>`
  );
  root.querySelectorAll(".thanks-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll(".thanks-card").forEach((b) => {
        b.disabled = true;
        b.classList.toggle("picked", b === btn);
      });
      ctx.onProgress(1, 1);
      ctx.sfx?.stage?.(stage.key);
      ctx.onComplete();
    });
  });
  return { destroy() {} };
}

export function mountStage(root, stage, ctx) {
  if (stage.type === "turkey_hunt") return mountTurkeyHunt(root, stage, ctx);
  if (stage.type === "pluck") return mountPluck(root, stage, ctx);
  if (stage.type === "stuff") return mountStuff(root, stage, ctx);
  if (stage.type === "oven_hold") return mountOvenHold(root, stage, ctx);
  if (stage.type === "mash") return mountMash(root, stage, ctx);
  if (stage.type === "gravy") return mountGravy(root, stage, ctx);
  if (stage.type === "pie") return mountPie(root, stage, ctx);
  if (stage.type === "set_plates") return mountSetPlates(root, stage, ctx);
  if (stage.type === "set_silver") return mountSetSilver(root, stage, ctx);
  if (stage.type === "seat_family") return mountSeatFamily(root, stage, ctx);
  if (stage.type === "thankful_card") return mountThankfulCard(root, stage, ctx);
  root.innerHTML = `<p class="hint">Unknown stage</p>`;
  return { destroy() {} };
}
