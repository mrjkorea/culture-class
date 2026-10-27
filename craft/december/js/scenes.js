/**
 * December Christmas craft — eleven tree and Santa stages.
 */
import { carryPathSvg, forestTreeSvg, homeTreeSvg } from "./christmas-art.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mountTreeHunt(root, stage, ctx) {
  const pool = stage.poolSize || 16;
  const winners = new Set([Math.floor(Math.random() * pool)]);
  let found = false;
  root.innerHTML = `<div class="forest-grid">${Array.from(
    { length: pool },
    (_, i) => `<button type="button" class="forest-cell" data-i="${i}">🌲</button>`
  ).join("")}</div>`;
  root.querySelectorAll(".forest-cell").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled || found) return;
      const i = Number(btn.dataset.i);
      ctx.sfx?.stage?.(stage.key);
      if (winners.has(i)) {
        found = true;
        btn.innerHTML = forestTreeSvg(true);
        btn.classList.add("is-winner");
        btn.disabled = true;
        ctx.onProgress(1, 1);
        ctx.onComplete();
      } else {
        btn.classList.add("is-miss");
        btn.textContent = "🌳";
        ctx.onMiss?.();
      }
    });
  });
  return { destroy() {} };
}

function mountChopTree(root, stage, ctx) {
  const total = stage.clicks || 24;
  let n = 0;
  root.innerHTML = `<div class="chop-stage">
    <div class="chop-tree" id="ctree">${forestTreeSvg(true)}</div>
    <button type="button" class="xmas-btn" id="chop">Chop 🪓</button>
    <p class="chop-dust" id="dust" aria-hidden="true"></p>
  </div>`;
  const dust = root.querySelector("#dust");
  root.querySelector("#chop").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.chop?.();
    ctx.sfx?.stage?.(stage.key);
    if (dust) dust.textContent = "🪵".repeat(Math.min(6, Math.floor(n / 4)));
    const tree = root.querySelector("#ctree");
    if (tree) tree.style.transform = `rotate(${Math.min(12, n * 0.6)}deg)`;
    if (n >= total) {
      if (tree) tree.innerHTML = "🪵";
      ctx.onComplete();
    }
  });
  return { destroy() {} };
}

function mountCarryTree(root, stage, ctx) {
  const total = stage.clicks || 18;
  let n = 0;
  root.innerHTML = `<div class="carry-stage">
    <div id="path">${carryPathSvg(0)}</div>
    <button type="button" class="xmas-btn" id="pull">Pull tree</button>
  </div>`;
  const path = root.querySelector("#path");
  root.querySelector("#pull").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    if (path) path.innerHTML = carryPathSvg(n / total);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountTreeStand(root, stage, ctx) {
  const total = stage.clicks || 14;
  let n = 0;
  root.innerHTML = `<div class="stand-stage">
    <div id="htree">${homeTreeSvg(0.15)}</div>
    <button type="button" class="xmas-btn" id="tighten">Tighten stand</button>
  </div>`;
  root.querySelector("#tighten").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const tree = root.querySelector("#htree");
    if (tree) tree.style.transform = `scale(${1 + n * 0.004})`;
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountHangLights(root, stage, ctx) {
  const total = stage.clicks || 22;
  let n = 0;
  root.innerHTML = `<div class="lights-stage">
    <div id="ltree">${homeTreeSvg(0.2)}</div>
    <button type="button" class="xmas-btn" id="lights">Wrap lights</button>
  </div>`;
  const tree = root.querySelector("#ltree");
  root.querySelector("#lights").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.sparkle?.();
    ctx.sfx?.stage?.(stage.key);
    if (tree) tree.innerHTML = homeTreeSvg(0.2 + (n / total) * 0.35);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountHangOrnaments(root, stage, ctx) {
  const total = stage.clicks || 16;
  const icons = ["🔴", "🔵", "⭐", "🟡", "🟣", "🎀", "🔔", "❄️"];
  let n = 0;
  root.innerHTML = `<div class="ornament-stage">
    <div id="otree">${homeTreeSvg(0.55)}</div>
    <div class="ornament-tray" id="tray">${icons.map((ic) => `<button type="button" class="orn-btn">${ic}</button>`).join("")}</div>
  </div>`;
  const tree = root.querySelector("#otree");
  root.querySelectorAll(".orn-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (n >= total || btn.disabled) return;
      btn.disabled = true;
      n += 1;
      ctx.onProgress(n, total);
      ctx.sfx?.stage?.(stage.key);
      if (tree) tree.innerHTML = homeTreeSvg(0.55 + (n / total) * 0.2);
      if (n >= total) ctx.onComplete();
    });
  });
  return { destroy() {} };
}

function mountPlacePresents(root, stage, ctx) {
  const total = stage.clicks || 8;
  let n = 0;
  root.innerHTML = `<div class="present-stage">
    <div id="ptree">${homeTreeSvg(0.75)}</div>
    <div class="present-pile" id="pile"></div>
    <button type="button" class="xmas-btn" id="gift">Place gift 🎁</button>
  </div>`;
  const pile = root.querySelector("#pile");
  root.querySelector("#gift").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const bit = document.createElement("span");
    bit.textContent = "🎁";
    pile?.append(bit);
    const tree = root.querySelector("#ptree");
    if (tree) tree.innerHTML = homeTreeSvg(0.75 + (n / total) * 0.12);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountWrapGift(root, stage, ctx) {
  const total = stage.clicks || 20;
  let n = 0;
  let paper = true;
  root.innerHTML = `<div class="wrap-stage">
    <p class="wrap-box" id="box">📦</p>
    <button type="button" class="xmas-btn" id="wrap-btn">Wrap paper</button>
  </div>`;
  const box = root.querySelector("#box");
  const btn = root.querySelector("#wrap-btn");
  btn.addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    paper = !paper;
    btn.textContent = paper ? "Wrap paper" : "Tie ribbon";
    if (box) {
      if (n < total / 2) box.textContent = "🎁";
      else if (n < total - 2) box.textContent = "🎀🎁";
      else box.textContent = "🎀✨";
    }
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountHangStockings(root, stage, ctx) {
  const total = stage.clicks || 5;
  const names = ["Alex", "Sam", "Jay", "Mom", "Dad"];
  let n = 0;
  root.innerHTML = `<div class="mantel-stage"><div class="mantel">🔥</div><div class="stock-row" id="socks"></div></div>`;
  const row = root.querySelector("#socks");
  names.slice(0, total).forEach((name) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sock-btn";
    btn.textContent = `Hang ${name}`;
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = `🧦 ${name}`;
      n += 1;
      ctx.onProgress(n, total);
      ctx.sfx?.stage?.(stage.key);
      if (n >= total) ctx.onComplete();
    });
    row?.append(btn);
  });
  return { destroy() {} };
}

function mountCookiesMilk(root, stage, ctx) {
  let cookie = false;
  let milk = false;
  root.innerHTML = `<div class="treat-stage">
    <p class="treat-table">🪑 Santa's table</p>
    <div class="treat-spots">
      <button type="button" class="treat-btn" id="cookie">Set cookie 🍪</button>
      <button type="button" class="treat-btn" id="milk">Set milk 🥛</button>
    </div>
    <p class="treat-status" id="status"></p>
  </div>`;
  const status = root.querySelector("#status");
  const done = () => {
    if (!cookie || !milk) return;
    ctx.onProgress(2, 2);
    ctx.onComplete();
  };
  root.querySelector("#cookie").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = "🍪 Ready";
    cookie = true;
    ctx.sfx?.stage?.(stage.key);
    if (status) status.textContent = milk ? "Cookies and milk!" : "Now the milk…";
    ctx.onProgress(cookie && milk ? 2 : 1, 2);
    done();
  });
  root.querySelector("#milk").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = "🥛 Ready";
    milk = true;
    ctx.sfx?.stage?.(stage.key);
    if (status) status.textContent = cookie ? "Cookies and milk!" : "Now the cookies…";
    ctx.onProgress(cookie && milk ? 2 : 1, 2);
    done();
  });
  return { destroy() {} };
}

function mountSantaVisit(root, stage, ctx) {
  root.innerHTML = `<div class="santa-stage">
    <p class="santa-night">🌙 Christmas Eve</p>
    <button type="button" class="xmas-btn santa-door" id="door">Open the door</button>
    <p class="santa-msg" id="smsg" hidden>🎅 Ho ho ho! Merry Christmas!</p>
  </div>`;
  root.querySelector("#door").addEventListener("click", () => {
    const door = root.querySelector("#door");
    const msg = root.querySelector("#smsg");
    if (door) door.disabled = true;
    if (msg) msg.hidden = false;
    ctx.sfx?.santa?.();
    ctx.onProgress(1, 1);
    ctx.onComplete();
  });
  return { destroy() {} };
}

export function mountStage(root, stage, ctx) {
  if (stage.type === "tree_hunt") return mountTreeHunt(root, stage, ctx);
  if (stage.type === "chop_tree") return mountChopTree(root, stage, ctx);
  if (stage.type === "carry_tree") return mountCarryTree(root, stage, ctx);
  if (stage.type === "tree_stand") return mountTreeStand(root, stage, ctx);
  if (stage.type === "hang_lights") return mountHangLights(root, stage, ctx);
  if (stage.type === "hang_ornaments") return mountHangOrnaments(root, stage, ctx);
  if (stage.type === "place_presents") return mountPlacePresents(root, stage, ctx);
  if (stage.type === "wrap_gift") return mountWrapGift(root, stage, ctx);
  if (stage.type === "hang_stockings") return mountHangStockings(root, stage, ctx);
  if (stage.type === "cookies_milk") return mountCookiesMilk(root, stage, ctx);
  if (stage.type === "santa_visit") return mountSantaVisit(root, stage, ctx);
  root.innerHTML = `<p class="hint">Unknown stage</p>`;
  return { destroy() {} };
}
