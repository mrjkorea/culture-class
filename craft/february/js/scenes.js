/**
 * Valentine Card Craft — card fold, hearts, mailbox, candy (10 stages).
 */
import { mountMailbox3D } from "./stage3d.js";
import { CARD_COLORS, cardSvg } from "./valentine-art.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCardColor(ctx) {
  return ctx.cardColor || CARD_COLORS[0].fill;
}

function renderCardPreview(root, ctx, extra = {}) {
  const el = root.querySelector(".card-preview") || document.createElement("div");
  el.className = "card-preview";
  el.innerHTML = cardSvg(
    getCardColor(ctx),
    extra.fold ?? ctx.foldCount ?? 0,
    extra.hearts ?? ctx.heartCount ?? 0,
    extra.sealed ?? ctx.sealed
  );
  if (!root.querySelector(".card-preview")) root.prepend(el);
}

function mountMash(root, stage, ctx) {
  const total = stage.clicks || 40;
  let n = 0;
  if (stage.key === "seal") ctx.sealed = true;
  root.innerHTML = `<div class="card-preview"></div><button type="button" class="mash-btn val-mash" id="mash">${esc(stage.title)}</button>`;
  renderCardPreview(root, ctx, { sealed: stage.key === "seal" });
  const btn = root.querySelector("#mash");
  const tap = () => {
    if (n >= total) return;
    n += 1;
    ctx.onProgress(n, total);
    ctx.sfx?.stage?.(stage.key);
    if (stage.key === "write") ctx.wishLen = n;
    if (n >= total) ctx.onComplete();
  };
  btn.addEventListener("click", tap);
  btn.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    tap();
  });
  return { destroy() {} };
}

function mountPickColors(root, stage, ctx) {
  const buttons = CARD_COLORS
    .map(
      (c) =>
        `<button type="button" class="color-pick" data-id="${c.id}" style="--c:${c.fill}" aria-label="${esc(c.label)}"></button>`
    )
    .join("");
  root.innerHTML = `<div class="color-pick-grid">${buttons}</div><div class="card-preview"></div>`;
  root.querySelectorAll(".color-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const c = CARD_COLORS.find((x) => x.id === id);
      ctx.cardColor = c?.fill || CARD_COLORS[0].fill;
      ctx.cardColorId = id;
      renderCardPreview(root, ctx);
      ctx.onComplete();
    });
  });
  return { destroy() {} };
}

function mountPickCandy(root, stage, ctx) {
  const candies = ["💗", "💜", "💛", "🧡", "💙"];
  root.innerHTML = `<div class="candy-pick-grid">${candies
    .map((e, i) => `<button type="button" class="candy-pick" data-i="${i}">${e}</button>`)
    .join("")}</div>`;
  root.querySelectorAll(".candy-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      ctx.candyId = btn.dataset.i;
      ctx.onComplete();
    });
  });
  return { destroy() {} };
}

function mountFold(root, stage, ctx) {
  let folds = 0;
  const total = stage.clicks || 3;
  root.innerHTML = `<div class="card-preview"></div><button type="button" class="mash-btn val-mash" id="fold-btn">Fold</button>`;
  renderCardPreview(root, ctx);
  root.querySelector("#fold-btn").addEventListener("click", () => {
    folds += 1;
    ctx.foldCount = folds;
    ctx.onProgress(folds, total);
    ctx.sfx?.stage?.(stage.key);
    renderCardPreview(root, ctx);
    if (folds >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountStamp(root, stage, ctx) {
  let hearts = 0;
  const total = stage.clicks || 8;
  root.innerHTML = `<div class="card-preview stamp-target" id="stamp-card"></div><p class="hint">Tap the card to stamp ♥</p>`;
  renderCardPreview(root, ctx);
  const target = root.querySelector("#stamp-card");
  target.addEventListener("click", () => {
    hearts += 1;
    ctx.heartCount = hearts;
    ctx.onProgress(hearts, total);
    ctx.sfx?.stage?.(stage.key);
    renderCardPreview(root, ctx, { hearts });
    if (hearts >= total) ctx.onComplete();
  });
  return { destroy() {} };
}

function mountLuckMailboxes(root, stage, ctx) {
  const pool = stage.poolSize;
  const good = new Set();
  while (good.size < stage.goodCount) good.add(Math.floor(Math.random() * pool));
  const names = ["Mia", "Leo", "Jay", "Kim", "Sam", "Ava", "Ben", "Zoe", "Max", "Lily", "Noah", "Emma"];
  root.innerHTML = `<div class="mailbox-grid">${Array.from({ length: pool }, (_, i) => {
    const label = names[i % names.length];
    return `<button type="button" class="mailbox-cell" data-i="${i}"><span class="mb-icon">📬</span><span>${esc(label)}</span></button>`;
  }).join("")}</div>`;
  let finished = false;
  root.querySelectorAll(".mailbox-cell").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (finished || btn.disabled) return;
      const i = Number(btn.dataset.i);
      ctx.sfx?.stage?.(stage.key);
      if (good.has(i)) {
        btn.classList.add("is-good");
        ctx.mailboxId = names[i % names.length];
        finished = true;
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

function mountDrop(root, stage, ctx) {
  const gl = mountMailbox3D(root, stage, ctx);
  if (gl) return gl;
  root.innerHTML = `<div class="drop-zone">
    <div class="card-preview"></div>
    <button type="button" class="mailbox-drop-target" id="drop-slot">📬 Drop here</button>
  </div>`;
  renderCardPreview(root, ctx, { sealed: true });
  root.querySelector("#drop-slot").addEventListener("click", () => {
    ctx.sfx?.stage?.(stage.key);
    ctx.onComplete();
  });
  return { destroy() {} };
}

export function mountStage(root, stage, ctx) {
  if (stage.key === "color" && stage.type === "pick") return mountPickColors(root, stage, ctx);
  if (stage.key === "candy" && stage.type === "pick") return mountPickCandy(root, stage, ctx);
  if (stage.type === "fold") return mountFold(root, stage, ctx);
  if (stage.type === "stamp") return mountStamp(root, stage, ctx);
  if (stage.key === "address") return mountLuckMailboxes(root, stage, ctx);
  if (stage.type === "drop") return mountDrop(root, stage, ctx);
  if (stage.type === "luck_hunt") return mountLuckMailboxes(root, stage, ctx);
  if (stage.type === "mash") {
    if (stage.key === "seal") ctx.sealed = true;
    return mountMash(root, stage, ctx);
  }
  return mountMash(root, stage, ctx);
}
