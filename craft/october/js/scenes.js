/**
 * Stage views. Click totals, pools, and lines come from stages.json.
 * Luck stages never mark the correct choice in the DOM.
 */

import { scene3dUrl } from "./assets.js";
import { mountCut3D, mountPatch3D, mountWash3D } from "./stage3d.js";
import {
  HOUSE_SPOTS,
  bowlSvg,
  kidsSvg,
  spoonSvg,
  candleSvg,
  faceBoxStyle,
  knifeSvg,
  mixHex,
  panSvg,
  pinSvg,
  pumpkinIcon,
  pumpkinSvg,
} from "./art.js";
import { faceSvgMarkup } from "./faces.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function vary(i) {
  const n = Math.sin((i + 1) * 12.9898) * 43758.5453;
  return n - Math.floor(n);
}

export function mountStage(root, stage, ctx) {
  if (stage.key === "patch" && stage.type === "luck_hunt") {
    const gl = mountPatch3D(root, stage, ctx);
    if (gl) return gl;
  }
  if (stage.key === "cut") {
    const gl = mountCut3D(root, stage, ctx);
    if (gl) return gl;
  }
  if (stage.key === "wash") {
    const gl = mountWash3D(root, stage, ctx);
    if (gl) return gl;
  }
  if (stage.type === "luck_hunt") return mountLuck(root, stage, ctx);
  if (stage.key === "candy") return mountCandy(root, stage, ctx);
  if (stage.type === "guided_mash" && (stage.key === "pin" || !ctx.face)) return mountPin(root, stage, ctx);
  if (stage.type === "guided_mash") return mountGuided(root, stage, ctx);
  return mountMash(root, stage, ctx);
}

function mountLuck(root, stage, ctx) {
  const good = new Set();
  const pool = stage.poolSize;
  while (good.size < stage.goodCount) {
    good.add(Math.floor(Math.random() * pool));
  }
  let found = 0;
  let finished = false;
  root.innerHTML = stage.key === "house" ? houseMarkup(pool, ctx) : patchMarkup(pool, ctx);
  const buttons = [...root.querySelectorAll("[data-choice]")];

  function settle(btn, ok) {
    if (finished || btn.disabled) return;
    if (ok) {
      btn.classList.add("is-good");
      found += 1;
      if (found >= stage.goodCount) {
        finished = true;
        buttons.forEach((b) => {
          b.disabled = true;
        });
        ctx.onComplete();
      }
      return;
    }
    btn.disabled = true;
    btn.classList.add("is-out");
    ctx.onMiss();
  }

  function onPointer(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const btn = e.target.closest("[data-choice]");
    if (!btn || btn.disabled) return;
    ctx.sfx?.stage?.(stage.key);
    settle(btn, good.has(Number(btn.dataset.choice)));
  }

  function onKey(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const btn = e.target.closest("[data-choice]");
    if (!btn || btn.disabled) return;
    e.preventDefault();
    ctx.sfx?.stage?.(stage.key);
    settle(btn, good.has(Number(btn.dataset.choice)));
  }

  root.addEventListener("pointerdown", onPointer);
  root.addEventListener("keydown", onKey);
  return {
    destroy() {
      root.removeEventListener("pointerdown", onPointer);
      root.removeEventListener("keydown", onKey);
    },
  };
}

function patchMarkup(count, ctx) {
  const bg = scene3dUrl(ctx.assetBase, ctx.manifest, "patch");
  const cols = Math.ceil(Math.sqrt(count));
  const buttons = Array.from({ length: count }, (_, i) => {
    const scale = (0.9 + vary(i) * 0.18).toFixed(3);
    const rot = (-6 + vary(i + 3) * 12).toFixed(2);
    return `<button type="button" class="pumpkin-btn" data-choice="${i}" aria-label="Pumpkin">
      <span class="pumpkin-tilt" style="--s:${scale};--r:${rot}deg">${pumpkinSvg(`patch${i}`)}</span>
    </button>`;
  }).join("");
  const bgStyle = bg ? ` style="--scene3d:url('${bg}')"` : "";
  return `<div class="patch scene-3d" data-play${bgStyle}>
    <div class="patch-grid" style="grid-template-columns:repeat(${cols}, minmax(0, 1fr))">${buttons}</div>
  </div>`;
}

function houseMarkup(count, ctx) {
  const bg = scene3dUrl(ctx.assetBase, ctx.manifest, "house");
  const spots = count === HOUSE_SPOTS.length ? HOUSE_SPOTS : fallbackSpots(count);
  const buttons = spots
    .map(
      ([x, y], i) =>
        `<button type="button" class="spot" data-choice="${i}" style="left:${x}%;top:${y}%" aria-label="Spot">${pumpkinIcon()}</button>`
    )
    .join("");
  const bgStyle = bg ? ` style="--scene3d:url('${bg}')"` : "";
  return `<div class="house-scene scene-3d" data-play${bgStyle}>
    <div class="spots">${buttons}</div>
  </div>`;
}

function fallbackSpots(count) {
  const spots = [];
  const cols = 5;
  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    spots.push([12 + col * 18, 68 + row * 8]);
  }
  return spots;
}

function mountMash(root, stage, ctx) {
  let done = 0;
  let finished = false;
  const total = stage.clicks;
  root.innerHTML = mashMarkup(stage, ctx);
  primeScene(root, stage, ctx);
  paintMash(root, stage, 0, ctx);
  const hit = root.querySelector("[data-hit]");

  function step(clientX, clientY) {
    if (finished) return;
    done += 1;
    if (stage.key === "scoop") {
      scoopClick(root, ctx);
    } else if (stage.key === "roast") {
      roastClick(root, ctx);
    } else if (stage.key === "wash") {
      moveSponge(root, clientX, clientY);
      ctx.sfx?.splash?.();
    } else {
      ctx.sfx?.stage?.(stage.key);
    }
    spawnBit(root, stage.key, clientX, clientY, ctx.reducedMotion);
    paintMash(root, stage, done / total, ctx);
    ctx.onProgress(done, total);
    if (done >= total) {
      finished = true;
      if (hit) hit.disabled = true;
      if (stage.key === "light") root.querySelector(".scene")?.classList.add("is-glowing");
      ctx.onComplete();
    }
  }

  function roastOuch() {
    const toast = root.querySelector("[data-ouch-toast]");
    if (toast) {
      toast.hidden = false;
      toast.classList.remove("pop");
      void toast.offsetWidth;
      toast.classList.add("pop");
      window.setTimeout(() => {
        toast.hidden = true;
      }, 900);
    }
    ctx.speech?.speak("Ouch!", { clipKey: "roast_ouch", miss: true });
    ctx.sfx?.miss?.();
  }

  function onPointer(e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (stage.key === "roast") {
      if (e.target.closest("[data-hit-handle]")) {
        if (e.cancelable) e.preventDefault();
        step(e.clientX, e.clientY);
        return;
      }
      if (e.target.closest("[data-hit-ouch]")) {
        if (e.cancelable) e.preventDefault();
        roastOuch();
      }
      return;
    }
    if (!e.target.closest("[data-hit]")) return;
    if (e.cancelable) e.preventDefault();
    step(e.clientX, e.clientY);
  }

  function onKey(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (stage.key === "roast") {
      if (e.target.closest("[data-hit-handle]")) {
        e.preventDefault();
        const btn = root.querySelector("[data-hit-handle]");
        const rect = btn.getBoundingClientRect();
        step(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
      return;
    }
    if (!e.target.closest("[data-hit]")) return;
    e.preventDefault();
    const rect = hit.getBoundingClientRect();
    step(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  root.addEventListener("pointerdown", onPointer);
  root.addEventListener("keydown", onKey);
  return {
    destroy() {
      root.removeEventListener("pointerdown", onPointer);
      root.removeEventListener("keydown", onKey);
    },
  };
}

function mashMarkup(stage, ctx) {
  if (stage.key === "scoop") {
    return `<div class="scene scene-scoop scoop-layout" data-play>
      <div class="pumpkin-stack scoop-pumpkin">
        ${pumpkinSvg(stage.key)}
        <button type="button" class="mash-hit" data-hit aria-label="${esc(stage.title)}"></button>
      </div>
      <div class="scoop-bowl" aria-hidden="true">
        ${bowlSvg()}
        <div class="bowl-guts" data-bowl-guts></div>
      </div>
      <div class="scoop-spoon" data-spoon>${spoonSvg()}</div>
    </div>`;
  }
  if (stage.key === "wash") {
    return `<div class="scene scene-wash scene-wash-big" data-play>
      <div class="wash-splash" data-splash aria-hidden="true"></div>
      <div class="pumpkin-stack">
        ${pumpkinSvg(stage.key)}
        <div class="wash-sponge" data-sponge aria-hidden="true"></div>
        <button type="button" class="mash-hit" data-hit aria-label="${esc(stage.title)}"></button>
      </div>
    </div>`;
  }
  if (stage.key === "roast") {
    return `<div class="scene scene-roast roast-stage roast-stage-3d" data-play>
      <div class="pan-wrap" data-pan>
        ${panSvg()}
        <button type="button" class="roast-hit roast-hit-ouch" data-hit-ouch aria-label="Hot"></button>
        <button type="button" class="roast-hit roast-hit-pan" data-hit-ouch aria-label="Pan"></button>
        <button type="button" class="roast-hit roast-hit-handle" data-hit-handle aria-label="${esc(stage.title)}"></button>
      </div>
      <p class="ouch-toast" data-ouch-toast hidden>Ouch!</p>
    </div>`;
  }
  if (stage.key === "candy") {
    return `<div class="scene scene-candy candy-stage" data-play>${kidsSvg()}${bowlSvg()}</div>`;
  }
  const face =
    stage.key === "light" && ctx.face
      ? `<div class="face-layer" data-face style="${faceBoxStyle()}">${faceSvgMarkup(ctx.face)}</div>`
      : "";
  return `<div class="scene scene-${esc(stage.key)}${stage.key === "carve" ? " scene-carve-big" : ""}" data-play>
    <div class="pumpkin-stack">
      ${pumpkinSvg(stage.key)}
      <div class="cut-orbit" data-orbit><div class="knife ${stage.fx === "knife_bob" ? "knife-bob" : ""}">${knifeSvg()}</div></div>
      ${face}
      <div class="candle">${candleSvg()}</div>
      <button type="button" class="mash-hit" data-hit aria-label="${esc(stage.title)}"></button>
    </div>
  </div>`;
}

const LID_ASIDE = "translate(42 -2) rotate(22 80 52)";

function primeScene(root, stage) {
  const lid = root.querySelector("[data-lid]");
  if (lid && ["scoop", "light"].includes(stage.key)) {
    lid.setAttribute("transform", LID_ASIDE);
  }
  if (stage.key === "scoop") {
    root.querySelector("[data-cavity]")?.setAttribute("visibility", "visible");
  }
}

function paintMash(root, stage, t, ctx) {
  const clamped = Math.max(0, Math.min(1, t));
  if (stage.key === "wash") {
    const dirt = root.querySelector("[data-dirt]");
    if (dirt) dirt.style.opacity = String(1 - clamped);
  }
  if (stage.key === "cut") {
    const ring = root.querySelector("[data-cutring]");
    if (ring) ring.setAttribute("stroke-dashoffset", String(138 * (1 - clamped)));
    const orbit = root.querySelector("[data-orbit]");
    if (orbit) orbit.style.transform = `rotate(${clamped * 340}deg)`;
    const lid = root.querySelector("[data-lid]");
    if (lid) {
      const lift = clamped * 22;
      lid.setAttribute(
        "transform",
        `translate(${(lift * 1.15).toFixed(1)} ${(-lift * 0.25).toFixed(1)}) rotate(${(-clamped * 20).toFixed(1)} 80 52)`
      );
    }
  }
  if (stage.key === "scoop") {
    const seeds = [...root.querySelectorAll("[data-seed]")];
    const hide = Math.floor(clamped * seeds.length);
    seeds.forEach((seed, i) => {
      seed.style.opacity = i < hide ? "0" : "1";
    });
  }
  if (stage.key === "roast") {
    const group = root.querySelector("[data-roast]");
    if (group) group.style.color = mixHex("#f8e7a8", "#c46212", clamped);
    const steam = root.querySelector("[data-steam]");
    if (steam) steam.setAttribute("opacity", String(0.15 + clamped * 0.75));
    const sizzle = root.querySelector("[data-sizzle]");
    if (sizzle) sizzle.setAttribute("opacity", String(0.2 + clamped * 0.8));
  }
  if (stage.key === "wash") {
    const splash = root.querySelector("[data-splash]");
    if (splash) splash.style.opacity = String(0.15 + clamped * 0.55);
  }
  if (stage.key === "light") {
    const flame = root.querySelector("[data-flame]");
    if (flame) {
      const scale = 0.42 + clamped * 0.7;
      flame.setAttribute("transform", `translate(40 36) scale(${scale.toFixed(3)}) translate(-40 -36)`);
      flame.setAttribute("opacity", String(Math.min(1, 0.2 + clamped)));
    }
    const glow = root.querySelector("[data-glow]");
    if (glow) glow.setAttribute("opacity", String(clamped));
    root.querySelectorAll(".face-shape, .face-line").forEach((el) => {
      el.style.fill = clamped > 0.4 ? "#ffe56a" : "#3a1458";
      el.style.stroke = clamped > 0.4 ? "#ffb703" : "#3a1458";
      el.style.opacity = String(0.4 + clamped * 0.6);
    });
  }
  if (stage.key === "candy") {
    const n = Math.round(clamped * stage.clicks);
    const label = root.querySelector("[data-count]");
    if (label) label.textContent = `${n} / ${stage.clicks}`;
    const bob = root.querySelector(`[data-kid="${(n - 1 + 4) % 4}"] .kid-bob`);
    if (bob && n > 0) {
      bob.classList.remove("hop");
      void bob.getBoundingClientRect();
      bob.classList.add("hop");
    }
  }
}

function scoopClick(root, ctx) {
  ctx.sfx?.scrape?.();
  const spoon = root.querySelector("[data-spoon]");
  if (spoon) {
    spoon.classList.remove("scoop-swing");
    void spoon.offsetWidth;
    spoon.classList.add("scoop-swing");
  }
  const seeds = [...root.querySelectorAll("[data-seed]")].filter((el) => el.style.opacity !== "0");
  const seed = seeds[seeds.length - 1];
  if (!seed || ctx.reducedMotion) return;
  const bowl = root.querySelector(".scoop-bowl");
  const host = root.querySelector(".scoop-layout");
  if (!bowl || !host) return;
  const from = seed.getBoundingClientRect();
  const to = bowl.getBoundingClientRect();
  const rect = host.getBoundingClientRect();
  const fly = document.createElement("i");
  fly.className = "scoop-fly";
  fly.style.left = `${from.left - rect.left + from.width / 2}px`;
  fly.style.top = `${from.top - rect.top + from.height / 2}px`;
  fly.style.setProperty("--tx", `${to.left - from.left + to.width * 0.35}px`);
  fly.style.setProperty("--ty", `${to.top - from.top + to.height * 0.2}px`);
  host.append(fly);
  seed.style.opacity = "0";
  const guts = root.querySelector("[data-bowl-guts]");
  if (guts) guts.style.setProperty("--fill", `${Math.min(100, guts.children.length * 4 + 6)}%`);
  window.setTimeout(() => {
    if (guts && guts.children.length < 40) {
      const bit = document.createElement("span");
      bit.className = "bowl-bit";
      guts.append(bit);
    }
    fly.remove();
  }, 520);
}

function roastClick(root, ctx) {
  ctx.sfx?.flip?.();
  const pan = root.querySelector("[data-pan]");
  if (pan) {
    pan.classList.remove("pan-flip");
    void pan.offsetWidth;
    pan.classList.add("pan-flip");
  }
  const seeds = root.querySelectorAll(".roast-seed");
  if (seeds.length) {
    const pick = seeds[Math.floor(Math.random() * seeds.length)];
    pick.classList.remove("seed-jump");
    void pick.getBoundingClientRect();
    pick.classList.add("seed-jump");
  }
}

function moveSponge(root, clientX, clientY) {
  const sponge = root.querySelector("[data-sponge]");
  const scene = root.querySelector(".scene-wash");
  if (!sponge || !scene) return;
  const rect = scene.getBoundingClientRect();
  sponge.style.left = `${clientX - rect.left}px`;
  sponge.style.top = `${clientY - rect.top}px`;
  sponge.classList.remove("scrub");
  void sponge.offsetWidth;
  sponge.classList.add("scrub");
}

let bits = 0;

function spawnBit(root, key, clientX, clientY, reduced) {
  if (reduced || bits > 18) return;
  const host = root.querySelector(".scene") || root;
  const rect = host.getBoundingClientRect();
  if (!rect.width) return;
  const el = document.createElement("i");
  el.className = `bit bit-${key === "wash" ? "bubble" : key === "candy" ? "candy" : "seed"}`;
  const x = clientX ? clientX - rect.left : rect.width / 2;
  const y = clientY ? clientY - rect.top : rect.height / 2;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.setProperty("--dx", `${-30 + Math.random() * 60}px`);
  el.style.setProperty("--dy", `${-50 - Math.random() * 40}px`);
  bits += 1;
  host.append(el);
  let gone = false;
  const remove = () => {
    if (gone) return;
    gone = true;
    el.remove();
    bits -= 1;
  };
  el.addEventListener("animationend", remove);
  window.setTimeout(remove, 800);
}

function mountPin(root, stage, ctx) {
  let sub = { destroy() {} };
  let finished = false;

  function openGuided() {
    sub.destroy();
    sub = mountGuided(root, stage, ctx);
  }

  if (ctx.face) {
    openGuided();
    return {
      destroy() {
        finished = true;
        sub.destroy();
      },
    };
  }

  root.innerHTML = `<div class="picker">
    <div class="picker-grid">
      ${ctx.faces
        .map(
          (face) => `<button type="button" class="face-choice" data-face="${esc(face.id)}">
            <span class="mini-stack">${pumpkinSvg(`pick${face.id}`)}<span class="face-layer" style="${faceBoxStyle()}">${faceSvgMarkup(face)}</span></span>
            <span class="face-name">${esc(ctx.uiLang === "ko" ? face.label.ko : face.label.en)}</span>
          </button>`
        )
        .join("")}
    </div>
  </div>`;

  function onPointer(e) {
    if (finished) return;
    const btn = e.target.closest("[data-face]");
    if (!btn) return;
    finished = true;
    root.removeEventListener("pointerdown", onPointer);
    ctx.setFace(btn.dataset.face);
    ctx.onPickFace();
    openGuided();
    finished = false;
  }

  root.addEventListener("pointerdown", onPointer);
  return {
    destroy() {
      finished = true;
      root.removeEventListener("pointerdown", onPointer);
      sub.destroy();
    },
  };
}

function mountGuided(root, stage, ctx) {
  const face = ctx.face;
  const points = stage.key === "carve" ? face.carve : face.pin;
  const slop = Number(stage.hitSlop ?? 20);
  let index = 0;
  let finished = false;
  const carveBg = stage.key === "carve" ? scene3dUrl(ctx.assetBase, ctx.manifest, "carve") : "";
  const bgStyle = carveBg ? ` style="--scene3d:url('${carveBg}')"` : "";
  const tool =
    stage.key === "carve"
      ? `<div class="carve-knife" data-carve-knife aria-hidden="true">${knifeSvg()}</div>`
      : `<button type="button" class="dot tool-pin" data-active-dot aria-label="Pin">${pinSvg()}</button>`;
  root.innerHTML = `<div class="scene scene-${esc(stage.key)} scene-guided ${stage.key === "carve" ? "scene-3d scene-carve-board" : ""}" data-play${bgStyle}>
    <div class="pumpkin-stack ${stage.key === "carve" ? "carve-stack" : "pin-stack"}">
      ${pumpkinSvg(stage.key)}
      <div class="face-layer" data-face-layer style="${faceBoxStyle()}">
        ${faceSvgMarkup(face)}
        ${tool}
      </div>
    </div>
  </div>`;
  const lid = root.querySelector("[data-lid]");
  if (lid) lid.setAttribute("transform", LID_ASIDE);
  const layer = root.querySelector("[data-face-layer]");
  const ghosts = root.querySelector("[data-ghosts]");
  const done = root.querySelector("[data-done]");
  const dot = root.querySelector("[data-active-dot]");
  const knife = root.querySelector("[data-carve-knife]");
  const mark = stage.key === "carve" ? "mark-carve" : "mark-pin";

  function renderMarks() {
    const upcoming = points.slice(index + 1, index + 9);
    ghosts.innerHTML = upcoming
      .map((p) => `<circle class="ghost-dot" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="2.4"/>`)
      .join("");
    done.innerHTML = points
      .slice(0, index)
      .map((p) => {
        if (stage.key === "carve") {
          return `<circle class="${mark}" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="3.2"/><circle class="carve-hole" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="5.5"/>`;
        }
        return `<circle class="${mark}" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="1.8"/>`;
      })
      .join("");
    if (index >= points.length) {
      if (dot) dot.hidden = true;
      if (knife) knife.hidden = true;
      if (stage.key === "carve") layer.classList.add("is-lit");
      return;
    }
    const px = points[index].x;
    const py = points[index].y;
    if (dot) {
      dot.hidden = false;
      dot.style.left = `${px}%`;
      dot.style.top = `${py}%`;
    }
    if (knife) {
      knife.hidden = false;
      knife.style.left = `${px}%`;
      knife.style.top = `${py}%`;
      knife.classList.remove("chop");
      void knife.offsetWidth;
      knife.classList.add("chop");
    }
  }

  function advance() {
    if (finished) return;
    index += 1;
    ctx.sfx?.stage?.(stage.key);
    ctx.onProgress(index, points.length);
    if (index >= points.length) {
      finished = true;
      renderMarks();
      if (stage.key === "carve") {
        layer.classList.add("is-lit");
        const glow = root.querySelector("[data-glow]");
        if (glow) glow.setAttribute("opacity", "0.95");
      }
      ctx.onComplete();
      return;
    }
    renderMarks();
  }

  function onPointer(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    if (!e.target.closest("[data-play]")) return;
    if (e.target.closest("[data-active-dot]") || (stage.key === "carve" && e.target.closest("[data-carve-knife]"))) {
      if (e.cancelable) e.preventDefault();
      advance();
      return;
    }
    const rect = layer.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const p = points[index];
    const dist = Math.hypot(x - p.x, y - p.y);
    if (dist <= slop) {
      if (e.cancelable) e.preventDefault();
      advance();
      return;
    }
    ctx.sfx?.miss?.();
    ctx.onMiss();
    const stack = root.querySelector(".pumpkin-stack");
    stack?.classList.add("nudge");
    window.setTimeout(() => stack?.classList.remove("nudge"), 180);
  }

  function onKey(e) {
    if (finished) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    if (!e.target.closest("[data-active-dot]") && !e.target.closest("[data-carve-knife]")) return;
    e.preventDefault();
    advance();
  }

  renderMarks();
  root.addEventListener("pointerdown", onPointer);
  root.addEventListener("keydown", onKey);
  return {
    destroy() {
      finished = true;
      root.removeEventListener("pointerdown", onPointer);
      root.removeEventListener("keydown", onKey);
    },
  };
}

/** Give candy: pick a kid (trick or treat) → then one candy click → repeat. */
function mountCandy(root, stage, ctx) {
  let done = 0;
  let finished = false;
  let phase = "kid";
  let activeKid = null;
  const total = stage.clicks;
  const kidClips = [0, 1, 2, 3, 4];
  let kidRotate = 0;

  root.innerHTML = `<div class="candy-play" data-play>
    ${kidsSvg()}
    <button type="button" class="candy-bowl" data-candy aria-disabled="true" aria-label="${esc(stage.title)}">
      ${bowlSvg()}
      <span class="bowl-count" data-count>0 / ${total}</span>
    </button>
    <p class="candy-hint" data-hint></p>
  </div>`;

  const hint = root.querySelector("[data-hint]");
  const bowl = root.querySelector("[data-candy]");
  const countEl = root.querySelector("[data-count]");

  function paintHint() {
    if (!hint) return;
    hint.textContent =
      phase === "kid"
        ? "Tap a kid — wait for trick or treat!"
        : "Now tap the candy bowl once.";
  }

  function setKidActive(index) {
    root.querySelectorAll("[data-kid]").forEach((g, i) => {
      g.classList.toggle("is-active", i === index);
    });
  }

  paintHint();

  function giveCandy() {
    if (finished || phase !== "candy") return;
    done += 1;
    ctx.sfx?.candy?.();
    if (countEl) countEl.textContent = `${done} / ${total}`;
    ctx.onProgress(done, total);
    phase = "kid";
    activeKid = null;
    if (bowl) bowl.setAttribute("aria-disabled", "true");
    setKidActive(-1);
    paintHint();
    if (done >= total) {
      finished = true;
      ctx.onComplete();
    }
  }

  function onKid(kidIndex) {
    if (finished || phase !== "kid") return;
    activeKid = kidIndex;
    setKidActive(kidIndex);
    const bob = root.querySelector(`[data-kid="${kidIndex}"] .kid-bob`);
    if (bob) {
      bob.classList.remove("hop");
      void bob.offsetWidth;
      bob.classList.add("hop");
    }
    ctx.speech?.playKidTot?.(kidClips[kidRotate % kidClips.length]);
    kidRotate += 1;
    phase = "candy";
    if (bowl) bowl.removeAttribute("aria-disabled");
    paintHint();
  }

  function onPointer(e) {
    if (finished || (e.button !== undefined && e.button !== 0)) return;
    const kidBtn = e.target.closest("[data-kid]");
    if (kidBtn && phase === "kid") {
      e.preventDefault();
      onKid(Number(kidBtn.dataset.kid));
      return;
    }
    if (e.target.closest("[data-candy]") && phase === "candy") {
      e.preventDefault();
      giveCandy();
    }
  }

  root.addEventListener("pointerdown", onPointer);
  return {
    destroy() {
      root.removeEventListener("pointerdown", onPointer);
    },
  };
}
