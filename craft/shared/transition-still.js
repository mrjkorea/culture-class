/** Between-stage photoreal still: decode before swap, hide caption until JPG paints. */

const STILL_CSS_V = "20261030-still-preload";
let stylesAttached = false;

function ensureTransitionStillStyles() {
  if (stylesAttached) return;
  stylesAttached = true;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL(`./transition-still.css?v=${STILL_CSS_V}`, import.meta.url).href;
  document.head.appendChild(link);
}

function loadStillImage(src) {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    const done = () => resolve(img.naturalWidth > 0 ? img : null);
    img.onload = done;
    img.onerror = () => resolve(null);
    img.src = src;
    if (img.complete) done();
  }).then(async (img) => {
    if (!img?.decode) return img;
    try {
      await img.decode();
    } catch {
      /* decode failed; onload path still ran */
    }
    return img.naturalWidth > 0 ? img : null;
  });
}

/**
 * @param {{ assetBase: string, manifest: object, transitionUrl: Function }} deps
 */
export function createTransitionStillPlayer(deps) {
  ensureTransitionStillStyles();
  const { assetBase, manifest, transitionUrl } = deps;
  /** @type {Map<string, Promise<HTMLImageElement|null>>} */
  const cache = new Map();

  function srcForId(id) {
    return transitionUrl(assetBase, manifest, id) || "";
  }

  function ensureLoaded(src) {
    if (!src) return Promise.resolve(null);
    let pending = cache.get(src);
    if (!pending) {
      pending = loadStillImage(src);
      cache.set(src, pending);
    }
    return pending;
  }

  function preloadAll() {
    Object.values(manifest.transitions || {}).forEach((rel) => {
      ensureLoaded(new URL(rel, assetBase).href);
    });
  }

  function prefetchById(id) {
    const src = srcForId(id);
    if (src) ensureLoaded(src);
  }

  /**
   * @param {object} ctx
   * @param {HTMLElement} ctx.view
   * @param {{ pause: Function, read: Function }} ctx.timer
   * @param {Function} ctx.esc
   * @param {Function} ctx.formatTime
   * @param {object} ctx.spec
   * @param {string} ctx.uiLang
   * @param {object} transition
   * @param {number} index
   */
  async function play(ctx, transition, index) {
    const id = transition?.id;
    const src = srcForId(id);
    if (!src) return;

    const nextId = ctx.spec.transitions[index + 1]?.id;
    if (nextId) prefetchById(nextId);

    await ensureLoaded(src);

    const caption = transition?.caption || { en: "", ko: "" };
    const title = ctx.uiLang === "ko" ? caption.ko : caption.en;
    const stageCount = ctx.spec.stages.length;
    const durationMs = (transition.durationSec || 3) * 1000;

    return new Promise((resolve) => {
      ctx.timer.pause();
      ctx.view.dataset.screen = "still";
      ctx.view.innerHTML = `<section class="reel-screen still-screen" aria-live="polite">
      <p class="still-time"><span id="timer">${ctx.esc(ctx.formatTime(ctx.timer.read()))}</span></p>
      <img class="reel-still" src="${ctx.esc(src)}" alt="" decoding="async">
      <p class="reel-label reel-label-pending">${ctx.esc(`${index + 1}/${stageCount}`)} · ${ctx.esc(title)}</p>
    </section>`;

      const imgEl = ctx.view.querySelector(".reel-still");
      const labelEl = ctx.view.querySelector(".reel-label");

      function reveal() {
        imgEl?.classList.add("reel-still-ready");
        labelEl?.classList.remove("reel-label-pending");
      }

      if (imgEl?.complete && imgEl.naturalWidth > 0) {
        reveal();
      } else if (imgEl) {
        imgEl.addEventListener("load", reveal, { once: true });
        imgEl.addEventListener(
          "error",
          () => {
            labelEl?.classList.remove("reel-label-pending");
          },
          { once: true },
        );
      }

      window.setTimeout(resolve, durationMs);
    });
  }

  return { preloadAll, prefetchById, play };
}
