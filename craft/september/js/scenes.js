/**
 * September Earth Day craft — eleven help-the-planet stages.
 */
import { earthHighFiveSvg, riverSvg, treeSvg } from "./earth-art.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mountRiverGrab(root, stage, ctx) {
  const total = stage.clicks || 10;
  let got = 0;
  const trash = ["🥤", "🧴", "🛍️", "🥡", "🧃", "📦", "🪣", "🎣", "👟", "🧻"];
  root.innerHTML = `<div class="river-stage">
    <p class="grab-hint">🦾 Grabber ready</p>
    ${riverSvg(0)}
    <div class="river-trash" id="trash-row"></div>
  </div>`;
  const row = root.querySelector("#trash-row");
  const wrap = root.querySelector(".river-stage");

  function spawn() {
    if (got >= total || !row) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "trash-float";
    btn.textContent = trash[got % trash.length];
    btn.style.left = `${10 + Math.random() * 70}%`;
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = "✓";
      got += 1;
      ctx.onProgress(got, total);
      ctx.sfx?.stage?.(stage.key);
      const r = wrap.querySelector(".river-svg");
      if (r) r.outerHTML = riverSvg(got / total);
      if (got < total) spawn();
      else ctx.onComplete();
    });
    row.append(btn);
  }
  spawn();
  return { destroy() {} };
}

function mountBagFill(root, stage, ctx) {
  const total = stage.clicks || 14;
  let n = 0;
  root.innerHTML = `<div class="park-stage"><div class="bag">🗑️ <span id="bag-fill">0%</span></div><div class="litter-grid" id="litter"></div></div>`;
  const litter = root.querySelector("#litter");
  const label = root.querySelector("#bag-fill");
  for (let i = 0; i < total + 4; i += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "litter-bit";
    btn.textContent = ["🍂", "🥡", "📰", "🧴", "🥤"][i % 5];
    btn.addEventListener("click", () => {
      if (btn.disabled || n >= total) return;
      btn.disabled = true;
      btn.style.opacity = "0.2";
      n += 1;
      ctx.onProgress(n, total);
      ctx.sfx?.stage?.(stage.key);
      if (label) label.textContent = `${Math.round((n / total) * 100)}%`;
      if (n >= total) ctx.onComplete();
    });
    litter?.append(btn);
  }
  return { destroy() {} };
}

function mountSort(root, stage, ctx, kind) {
  const total = stage.sortCount || 6;
  const items = {
    plastic: ["🧴", "🥤", "🛍️", "🥡"],
    paper: ["📰", "📦", "📃", "📚"],
    cans: ["🥫", "🔩", "🧃", "🥤"],
  };
  const pool = items[kind] || items.plastic;
  let done = 0;

  root.innerHTML = `<div class="sort-stage">
    <p class="sort-item" id="sort-item">${pool[0]}</p>
    <div class="sort-bins">
      <button type="button" class="bin bin-blue" data-b="plastic">Plastic</button>
      <button type="button" class="bin bin-green" data-b="paper">Paper</button>
      <button type="button" class="bin bin-gray" data-b="cans">Cans</button>
    </div>
  </div>`;

  const itemEl = root.querySelector("#sort-item");
  const showItem = () => {
    if (itemEl) itemEl.textContent = pool[done % pool.length];
  };

  root.querySelectorAll(".bin").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.b;
      ctx.sfx?.stage?.(stage.key);
      if (pick !== kind) {
        ctx.onMiss?.();
        return;
      }
      done += 1;
      ctx.onProgress(done, total);
      if (done >= total) ctx.onComplete();
      else showItem();
    });
  });
  return { destroy() {} };
}

function mountDigHole(root, stage, ctx) {
  const total = stage.clicks || 22;
  let n = 0;
  root.innerHTML = `<div class="dig-tree-stage">${treeSvg(0)}<button type="button" class="earth-btn" id="dig">Dig 🪏</button></div>`;
  const wrap = root.querySelector(".dig-tree-stage");
  root.querySelector("#dig").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    if (n >= total) {
      const t = wrap.querySelector(".tree-svg");
      if (t) t.outerHTML = treeSvg(1);
    }
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountPlant(root, stage, ctx) {
  const total = stage.clicks || 4;
  let n = 0;
  const steps = ["Lower sapling", "Hold steady", "Pat soil", "Done"];
  root.innerHTML = `<div class="plant-stage">${treeSvg(1)}<button type="button" class="earth-btn" id="plant">${steps[0]}</button></div>`;
  const btn = root.querySelector("#plant");
  const wrap = root.querySelector(".plant-stage");
  btn.addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    const t = wrap.querySelector(".tree-svg");
    if (t) t.outerHTML = treeSvg(1 + n);
    if (n < total) btn.textContent = steps[n] || "Pat soil";
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountWater(root, stage, ctx) {
  const total = stage.clicks || 18;
  let n = 0;
  root.innerHTML = `<div class="water-tree-stage">${treeSvg(3)}<div class="water-meter"><span id="wet"></span></div><button type="button" class="earth-btn" id="water">Water 💧</button></div>`;
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

function mountLightsOff(root, stage, ctx) {
  const total = stage.rooms || 8;
  let on = total;
  root.innerHTML = `<div class="house-stage"><p class="house-hint">Tap rooms to turn lights OFF</p><div class="room-grid" id="rooms"></div></div>`;
  const grid = root.querySelector("#rooms");
  for (let i = 0; i < total; i += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "room on";
    btn.textContent = `Room ${i + 1} 💡`;
    btn.addEventListener("click", () => {
      if (!btn.classList.contains("on")) return;
      btn.classList.remove("on");
      btn.textContent = `Room ${i + 1} 🌙`;
      on -= 1;
      ctx.onProgress(total - on, total);
      ctx.sfx?.stage?.(stage.key);
      if (on <= 0) ctx.onComplete();
    });
    grid?.append(btn);
  }
  return { destroy() {} };
}

function mountBikePath(root, stage, ctx) {
  const total = stage.clicks || 35;
  let n = 0;
  root.innerHTML = `<div class="bike-path"><span class="bike-fig" id="bike">🚴</span><span class="car-far">🚗</span><button type="button" class="earth-btn mash-btn" id="pedal">Pedal / walk</button><p class="hint">Tap or hold</p></div>`;
  const fig = root.querySelector("#bike");
  const btn = root.querySelector("#pedal");
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

function mountHighfive(root, stage, ctx) {
  const total = stage.clicks || 12;
  let n = 0;
  root.innerHTML = `<div class="highfive-stage">${earthHighFiveSvg()}<button type="button" class="earth-btn hi-btn" id="hi">High-five Earth 🌍</button></div>`;
  root.querySelector("#hi").addEventListener("click", () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    root.querySelector(".earth-hi")?.classList.toggle("is-bump", n % 2 === 0);
    if (n >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

export function mountStage(root, stage, ctx) {
  if (stage.type === "river_grab") return mountRiverGrab(root, stage, ctx);
  if (stage.type === "bag_fill") return mountBagFill(root, stage, ctx);
  if (stage.type === "sort_plastic") return mountSort(root, stage, ctx, "plastic");
  if (stage.type === "sort_paper") return mountSort(root, stage, ctx, "paper");
  if (stage.type === "sort_cans") return mountSort(root, stage, ctx, "cans");
  if (stage.type === "dig_hole") return mountDigHole(root, stage, ctx);
  if (stage.type === "plant_tree") return mountPlant(root, stage, ctx);
  if (stage.type === "water_tree") return mountWater(root, stage, ctx);
  if (stage.type === "lights_off") return mountLightsOff(root, stage, ctx);
  if (stage.type === "bike_path") return mountBikePath(root, stage, ctx);
  if (stage.type === "earth_highfive") return mountHighfive(root, stage, ctx);
  root.innerHTML = `<p class="hint">Unknown stage</p>`;
  return { destroy() {} };
}
