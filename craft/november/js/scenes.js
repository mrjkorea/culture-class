/**
 * November Thanksgiving craft — eleven feast stages (3D + photo backdrops).
 */
import { huntForestUrl, scene3dUrl, transitionUrl } from "./assets.js?v=20261127-click-place";
import {
  mountGravy3D,
  mountMash3D,
  mountOven3D,
  mountPie3D,
  mountPlates3D,
  mountPluck3D,
  mountStuff3D,
} from "./stage3d.js?v=20261127-click-place";
import {
  diningRoomSvg,
  gravyPotSvg,
  ovenSvg,
  pieBakeSvg,
  stuffingBowlSvg,
  tableSvg,
  turkeyPluckSvg,
} from "./thanksgiving-art.js";

function ui(ctx, key) {
  const lang = ctx?.uiLang || "en";
  const pack = ctx?.uiCopy?.[lang] || ctx?.uiCopy?.en || {};
  const en = ctx?.uiCopy?.en || {};
  return pack[key] || en[key] || "";
}

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
  const cols = 8;
  const rows = 5;
  const winner = Math.floor(Math.random() * cols * rows);
  const forest = huntForestUrl(ctx.assetBase, ctx.manifest);
  const turkey = transitionUrl(ctx.assetBase, ctx.manifest, "t01_hunt");
  const seen = new Set();
  let found = false;
  root.innerHTML = `<div class="forest-hunt" id="forest-hunt">
    <img class="forest-bg" alt="" src="${esc(forest)}" draggable="false">
  </div>`;
  const field = root.querySelector("#forest-hunt");

  function onPointer(e) {
    if (found || (e.button !== undefined && e.button !== 0)) return;
    const rect = field.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || y < 0 || x >= 1 || y >= 1) return;
    const col = Math.min(cols - 1, Math.floor(x * cols));
    const row = Math.min(rows - 1, Math.floor(y * rows));
    const i = row * cols + col;
    if (seen.has(i)) return;
    seen.add(i);
    ctx.sfx?.stage?.(stage.key);
    if (i === winner) {
      found = true;
      const pic = document.createElement("img");
      pic.className = "turkey-found";
      pic.alt = "";
      pic.src = turkey;
      pic.style.left = `${Math.min(78, Math.max(22, x * 100))}%`;
      pic.style.top = `${Math.min(72, Math.max(28, y * 100))}%`;
      field.append(pic);
      ctx.onProgress(1, 1);
      ctx.onComplete();
      return;
    }
    const dot = document.createElement("span");
    dot.className = "forest-mark";
    dot.style.left = `${x * 100}%`;
    dot.style.top = `${y * 100}%`;
    field.append(dot);
    ctx.onMiss?.();
  }

  field.addEventListener("pointerdown", onPointer);
  return {
    destroy() {
      field.removeEventListener("pointerdown", onPointer);
    },
  };
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
      <button type="button" class="feast-btn feast-btn-lg" id="pluck" data-ui="pluckBtn">${esc(ui(ctx, "pluckBtn"))}</button>
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
  const gl = mountStuff3D(root, stage, ctx);
  if (gl) return gl;
  const total = stage.clicks || 20;
  let n = 0;
  root.innerHTML = feastSceneWrap(
    ctx,
    stage,
    `<div class="stuff-stage stuff-stage-lg">
      <div class="stuff-art">${stuffingBowlSvg(0)}</div>
      <button type="button" class="feast-btn feast-btn-lg" id="stuff" data-ui="stuffBtn">${esc(ui(ctx, "stuffBtn"))}</button>
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
      <p class="oven-hint" id="oven-hint" data-ui="ovenHint">${esc(ui(ctx, "ovenHint"))}</p>
      <div class="oven-meter"><span id="oven-fill"></span></div>
      <button type="button" class="feast-btn feast-btn-lg oven-hold-btn" id="oven-hold" data-ui="ovenHold">${esc(ui(ctx, "ovenHold"))}</button>
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
    if (hint) hint.textContent = holding ? ui(ctx, "roasting") : ui(ctx, "holdRoast");
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
      <button type="button" class="feast-btn feast-btn-lg mash-btn" id="mash" data-ui="mashBtn">${esc(ui(ctx, "mashBtn"))}</button>
      <p class="hint feast-hint-overlay" data-ui="mashHint">${esc(ui(ctx, "mashHint"))}</p>
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
  const gl = mountGravy3D(root, stage, ctx);
  if (gl) return gl;
  const total = stage.clicks || 16;
  let n = 0;
  root.innerHTML = feastSceneWrap(
    ctx,
    stage,
    `<div class="gravy-stage gravy-stage-lg">
      <div class="gravy-art">${gravyPotSvg(0)}</div>
      <button type="button" class="feast-btn feast-btn-lg" id="pour" data-ui="pourBtn">${esc(ui(ctx, "pourBtn"))}</button>
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
      <button type="button" class="feast-btn feast-btn-lg" id="bake" data-ui="bakeBtn">${esc(ui(ctx, "bakeBtn"))}</button>
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
    btn.textContent = ui(ctx, "setPlate");
    btn.dataset.ui = "setPlate";
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
  const need = 10;
  const kinds = [
    { kind: "fork", label: "Fork", icon: "🍴" },
    { kind: "spoon", label: "Spoon", icon: "🥄" },
    { kind: "glass", label: "Glass", icon: "🥛" },
  ];
  root.innerHTML = `<div class="place-board"></div>`;
  const board = root.querySelector(".place-board");
  const counts = { fork: 0, spoon: 0, glass: 0 };
  let picked = "";
  let placed = 0;
  let finished = false;
  const pieces = {};
  const spots = {};

  kinds.forEach((item) => {
    const col = document.createElement("section");
    col.className = "place-col";
    const piece = document.createElement("button");
    piece.type = "button";
    piece.className = "place-piece";
    piece.dataset.kind = item.kind;
    piece.innerHTML = `<span class="place-icon">${item.icon}</span><span>${item.label}</span>`;
    const spot = document.createElement("button");
    spot.type = "button";
    spot.className = "place-spot";
    spot.dataset.kind = item.kind;
    spot.innerHTML = `<span class="place-count">${item.label} 0/${need}</span><span class="place-pile"></span>`;
    col.append(piece, spot);
    board.append(col);
    pieces[item.kind] = piece;
    spots[item.kind] = spot;
  });

  function paint() {
    kinds.forEach((item) => {
      const spot = spots[item.kind];
      spot.querySelector(".place-count").textContent = `${item.label} ${counts[item.kind]}/${need}`;
      spot.querySelector(".place-pile").textContent = item.icon.repeat(counts[item.kind]);
      pieces[item.kind].disabled = counts[item.kind] >= need;
      pieces[item.kind].classList.toggle("is-picked", picked === item.kind);
    });
  }

  function onPiece(e) {
    const btn = e.currentTarget;
    if (finished || btn.disabled) return;
    picked = picked === btn.dataset.kind ? "" : btn.dataset.kind;
    paint();
  }
  function onSpot(e) {
    const spot = e.currentTarget;
    if (finished || !picked) return;
    if (spot.dataset.kind !== picked) {
      spot.classList.add("is-wrong");
      window.setTimeout(() => spot.classList.remove("is-wrong"), 280);
      ctx.onMiss?.();
      return;
    }
    counts[picked] += 1;
    placed += 1;
    if (counts[picked] >= need) picked = "";
    paint();
    ctx.sfx?.stage?.(stage.key);
    ctx.onProgress(placed, need * 3);
    if (placed >= need * 3) {
      finished = true;
      ctx.onComplete();
    }
  }
  Object.values(pieces).forEach((btn) => btn.addEventListener("click", onPiece));
  Object.values(spots).forEach((btn) => btn.addEventListener("click", onSpot));
  return { destroy() {} };
}

function mountSeatFamily(root, stage, ctx) {
  const lang = ctx.uiLang === "ko" ? "ko" : "en";
  const people = [
    { name: "Uncle", ko: "삼촌", x: 22, y: 22 },
    { name: "Aunt", ko: "이모", x: 39, y: 26 },
    { name: "Brother", ko: "오빠", x: 58, y: 16 },
    { name: "Sister", ko: "언니", x: 80, y: 20 },
    { name: "Grandma", ko: "할머니", x: 11, y: 52 },
    { name: "Grandpa", ko: "할아버지", x: 30, y: 50 },
    { name: "Mom", ko: "엄마", x: 50, y: 48 },
    { name: "Dad", ko: "아빠", x: 67, y: 46 },
    { name: "Baby", ko: "아기", x: 78, y: 62 },
    { name: "Cousin", ko: "사촌", x: 91, y: 54 },
  ];
  const photo = new URL("../assets/family/thanksgiving-family.jpg", import.meta.url);
  photo.searchParams.set("v", "20261127-click-place");
  root.innerHTML = `<div class="family-board">
    <div class="family-photo-wrap">
      <img class="family-photo" alt="" src="${esc(photo.href)}" draggable="false">
    </div>
    <div class="name-tray family-names"></div>
  </div>`;
  const wrap = root.querySelector(".family-photo-wrap");
  const tray = root.querySelector(".family-names");
  const spots = people.map((person) => {
    const spot = document.createElement("div");
    spot.className = "family-spot";
    spot.style.left = `${person.x}%`;
    spot.style.top = `${person.y}%`;
    spot.dataset.name = person.name;
    spot.setAttribute("aria-label", lang === "ko" ? person.ko : person.name);
    wrap.append(spot);
    return spot;
  });
  const order = people.slice();
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  order.forEach((person) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "name-chip";
    chip.dataset.name = person.name;
    chip.textContent = lang === "ko" ? person.ko : person.name;
    tray.append(chip);
  });
  let picked = null;
  let seated = 0;
  let finished = false;

  function onName(e) {
    const chip = e.currentTarget;
    if (finished || chip.disabled) return;
    picked = picked === chip ? null : chip;
    tray.querySelectorAll(".name-chip").forEach((btn) => {
      btn.classList.toggle("is-picked", btn === picked);
    });
  }
  function onFace(e) {
    const spot = e.currentTarget;
    if (finished || !picked || spot.dataset.filled) return;
    if (spot.dataset.name !== picked.dataset.name) {
      spot.classList.add("is-wrong");
      picked.classList.add("is-wrong");
      window.setTimeout(() => {
        spot.classList.remove("is-wrong");
        picked?.classList.remove("is-wrong");
      }, 280);
      ctx.onMiss?.();
      return;
    }
    const chip = picked;
    picked = null;
    chip.classList.remove("is-picked");
    spot.dataset.filled = "1";
    spot.classList.add("is-filled");
    spot.append(chip);
    chip.disabled = true;
    seated += 1;
    ctx.sfx?.stage?.(stage.key);
    ctx.onProgress(seated, people.length);
    if (seated >= people.length) {
      finished = true;
      ctx.onComplete();
    }
  }
  tray.querySelectorAll(".name-chip").forEach((chip) => chip.addEventListener("click", onName));
  spots.forEach((spot) => spot.addEventListener("click", onFace));
  return { destroy() {} };
}

function mountThankfulCard(root, stage, ctx) {
  const need = stage.holdRequiredMs || 60000;
  const note = ctx.uiLang === "ko"
    ? "눈을 감고 1분 동안 누르세요."
    : "Close your eyes. Hold for one minute.";
  root.innerHTML = `<div class="pray-board">
    <button type="button" class="pray-hold" id="pray-hold">
      <span class="pray-face" aria-hidden="true">😌</span>
      <span class="pray-seconds" id="pray-seconds">0:00</span>
    </button>
    <p class="pray-note">${esc(note)}</p>
  </div>`;
  const btn = root.querySelector("#pray-hold");
  const label = root.querySelector("#pray-seconds");
  let holding = false;
  let finished = false;
  let t0 = 0;
  let frame = 0;
  let shown = -1;

  function paint(ms) {
    const clamped = Math.max(0, Math.min(need, ms));
    const sec = Math.floor(clamped / 1000);
    btn.style.setProperty("--p", String((clamped / need) * 100));
    if (sec !== shown) {
      shown = sec;
      const m = Math.floor(sec / 60);
      const s = String(sec % 60).padStart(2, "0");
      label.textContent = `${m}:${s}`;
      ctx.onProgress(sec, Math.ceil(need / 1000));
    }
  }
  function tick(now) {
    if (!holding) return;
    const elapsed = now - t0;
    paint(elapsed);
    if (elapsed >= need) {
      holding = false;
      finished = true;
      ctx.sfx?.stage?.(stage.key);
      ctx.onComplete();
      return;
    }
    frame = requestAnimationFrame(tick);
  }
  function down(e) {
    if (finished || holding || (e.button !== undefined && e.button !== 0)) return;
    holding = true;
    t0 = performance.now();
    btn.classList.add("is-holding");
    try { btn.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    frame = requestAnimationFrame(tick);
  }
  function up() {
    if (!holding) return;
    holding = false;
    cancelAnimationFrame(frame);
    btn.classList.remove("is-holding");
    paint(0);
  }
  btn.addEventListener("pointerdown", down);
  btn.addEventListener("pointerup", up);
  btn.addEventListener("pointercancel", up);
  return {
    destroy() {
      holding = false;
      cancelAnimationFrame(frame);
      btn.removeEventListener("pointerdown", down);
      btn.removeEventListener("pointerup", up);
      btn.removeEventListener("pointercancel", up);
    },
  };
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
