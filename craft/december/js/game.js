import { loadCraft, transitionUrl, transitionVideoUrl } from "./assets.js";
import { cleanName, formatTime, loadBoard, saveRun } from "./leaderboard.js";
import { mountStage } from "./scenes.js";
import { titleArtSvg } from "./christmas-art.js";
import { createSpeech } from "./speech.js";
import { createSfx } from "./sfx.js";

const LANG_KEY = "culture_craft_december_christmas_v1_ui";
const MISS_STAGE_TYPES = new Set(["tree_hunt"]);

const view = document.getElementById("view");
const backLink = document.getElementById("back-link");
const langEn = document.getElementById("lang-en");
const langKo = document.getElementById("lang-ko");
const soundBtn = document.getElementById("sound-btn");

let spec;
let manifest;
let assetBase;
let speech;
let sfx;
let uiLang = "en";
let lineState = null;
let lineToken = 0;
let state = null;
let reducedMotion = false;

const timer = createTimer();

function createTimer() {
  let acc = 0;
  let t0 = 0;
  let on = false;
  let frame = 0;
  function read() {
    return acc + (on ? performance.now() - t0 : 0);
  }
  function paint() {
    const el = document.getElementById("timer");
    if (el) el.textContent = formatTime(read());
    if (on) frame = requestAnimationFrame(paint);
  }
  return {
    read,
    reset() {
      this.pause();
      acc = 0;
      paint();
    },
    resume() {
      if (on) return;
      on = true;
      t0 = performance.now();
      frame = requestAnimationFrame(paint);
    },
    pause() {
      if (!on) return;
      acc += performance.now() - t0;
      on = false;
      cancelAnimationFrame(frame);
      paint();
    },
  };
}

function t(key) {
  const pack = spec.uiCopy?.[uiLang] || {};
  const en = spec.uiCopy?.en || {};
  return pack[key] || en[key] || "";
}

function stageTotal(stage) {
  if (stage.type === "tree_hunt") return stage.goodCount || 1;
  if (stage.type === "cookies_milk") return 2;
  return stage.clicks || 1;
}

function stageClipKey(stage, lineIndex) {
  const n = String(stage.id).padStart(2, "0");
  if (lineIndex === 1 && MISS_STAGE_TYPES.has(stage.type)) return "miss";
  const suffix = lineIndex === 0 ? "start" : lineIndex === 1 ? "mid" : "win";
  return `stage${n}_${suffix}`;
}

function speakLine(stage, block, lineIndex, opts = {}) {
  const clipKey = opts.clipKey || (stage ? stageClipKey(stage, lineIndex) : "intro");
  return speech.speak("", { clipKey });
}

function natureUrls() {
  if (!manifest?.nature) return null;
  return {
    open: new URL(manifest.nature.open, assetBase).href,
    closed: new URL(manifest.nature.closed, assetBase).href,
  };
}

function wireNature() {
  const img = document.getElementById("nature-img");
  const urls = natureUrls();
  if (img && urls) speech.setNature(img, urls);
}

function paintLang() {
  langEn?.setAttribute("aria-pressed", uiLang === "en" ? "true" : "false");
  langKo?.setAttribute("aria-pressed", uiLang === "ko" ? "true" : "false");
  langEn?.classList.toggle("on", uiLang === "en");
  langKo?.classList.toggle("on", uiLang === "ko");
  if (backLink) backLink.textContent = t("back");
  soundBtn?.setAttribute("aria-label", speech.enabled ? t("soundOn") : t("soundOff"));
  soundBtn?.classList.toggle("is-muted", !speech.enabled);
}

function showLines(block, index, alert = false) {
  lineState = { block, index, alert };
  paintLines();
}

function paintLines() {
  if (!lineState) return;
  const lang = uiLang === "ko" ? "ko" : "en";
  const a = document.getElementById("line-a");
  if (!a) return;
  a.textContent = lineState.block[lang][lineState.index] || "";
  a.lang = lang;
  a.classList.toggle("is-alert", Boolean(lineState.alert));
  const live = document.getElementById("live");
  if (live) live.textContent = a.textContent;
}

function paintMisses() {
  const el = document.getElementById("misses");
  if (el && state) el.textContent = `${t("misses")} ${state.misses}`;
}

function paintProgress(stage, n = 0, total = stageTotal(stage)) {
  const bar = document.getElementById("bar");
  const fill = document.getElementById("progress-fill");
  const label = document.getElementById("progress-label");
  if (!bar || !fill || !label) return;
  bar.hidden = false;
  fill.style.width = `${Math.max(0, Math.min(100, (n / total) * 100))}%`;
  label.textContent = `${n} / ${total}`;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function boardList(highlightAt, source) {
  const ol = document.createElement("ol");
  ol.className = "board";
  const rows = (source || loadBoard(spec.leaderboard.key)).slice(0, 8);
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = t("empty");
    return empty;
  }
  rows.forEach((row, index) => {
    const li = document.createElement("li");
    if (row.at === highlightAt) li.className = "mine";
    li.innerHTML = `<span class="b-rank">${index + 1}</span><span class="b-name">${esc(row.name)}</span><span class="b-meta">${esc(formatTime(row.timeMs))} · ${esc(t("misses"))} ${row.misses}</span>`;
    ol.append(li);
  });
  return ol;
}

function renderTitle(keepName) {
  speech.stop();
  const previous = keepName ? document.getElementById("nick")?.value || "" : "";
  view.dataset.screen = "title";
  view.innerHTML = `<section class="card title-card xmas-title">
    <div class="title-art">${titleArtSvg()}</div>
    <h1>${esc(spec.title)}</h1>
    <p class="brand">${esc(t("classTag"))}</p>
    <p class="how">${esc(t("how"))}</p>
    <p class="hint">${esc(t("beatNote"))}</p>
    <form id="nick-form">
      <label for="nick">${esc(t("nickname"))}</label>
      <input id="nick" name="nick" maxlength="16" autocomplete="off" required placeholder="${esc(t("namePlaceholder"))}">
      <p id="form-error" class="form-error" role="alert"></p>
      <button id="play-btn" class="go" type="submit">${esc(t("play"))}</button>
    </form>
    <h2 class="board-title">${esc(t("board"))}</h2>
    <div id="board-slot"></div>
  </section>`;
  view.querySelector("#board-slot").append(boardList());
  const input = document.getElementById("nick");
  if (previous) input.value = previous;
  document.getElementById("nick-form").addEventListener("submit", onStart);
}

let starting = false;

async function onStart(event) {
  event.preventDefault();
  if (starting) return;
  const name = cleanName(document.getElementById("nick").value);
  const error = document.getElementById("form-error");
  if (!name) {
    error.textContent = t("needName");
    return;
  }
  error.textContent = "";
  starting = true;
  speech.unlock();
  sfx?.unlock?.();
  try {
    await speech.playClip("intro");
    await runGame(name);
  } catch (err) {
    console.error(err);
    view.innerHTML = `<p class="boot-error">${esc(t("loadError"))}</p>`;
  } finally {
    starting = false;
  }
}

async function runGame(name) {
  state = {
    name,
    misses: 0,
    saved: false,
    entry: null,
    craft: {},
  };
  timer.reset();
  for (let i = 0; i < spec.stages.length; i += 1) {
    await playTransitionStill(spec.transitions[i], i);
    await playStage(spec.stages[i], i);
    await playStageMovie(spec.transitions[i], i);
  }
  await playFinale();
  showResults();
}

function playTransitionStill(transition, index) {
  const id = transition?.id;
  const src = transitionUrl(assetBase, manifest, id);
  if (!src) return Promise.resolve();
  const caption = transition?.caption || { en: "", ko: "" };
  const title = uiLang === "ko" ? caption.ko : caption.en;
  return new Promise((resolve) => {
    timer.pause();
    view.dataset.screen = "still";
    view.innerHTML = `<section class="reel-screen still-screen" aria-live="polite">
      <p class="still-time"><span id="timer">${esc(formatTime(timer.read()))}</span></p>
      <img class="reel-still" src="${esc(src)}" alt="">
      <p class="reel-label">${esc(`${index + 1}/${spec.stages.length}`)} · ${esc(title)}</p>
    </section>`;
    window.setTimeout(resolve, (transition.durationSec || 3) * 1000);
  });
}

function stageShell(stage, index) {
  const pips = spec.stages
    .map((_, i) => `<i class="${i < index ? "done" : i === index ? "now" : ""}"></i>`)
    .join("");
  const label = uiLang === "ko" ? stage.titleKo || stage.title : stage.title;
  return `<section class="screen-stage xmas-stage">
    <div class="hud">
      <div class="hud-row">
        <div class="pips" aria-hidden="true">${pips}</div>
        <h2 id="stage-label">${esc(`${index + 1}/${spec.stages.length} ${label}`)}</h2>
        <div class="stats">
          <span id="timer">${esc(formatTime(timer.read()))}</span>
          <span id="misses"></span>
        </div>
      </div>
      <p id="line-a" class="line line-single"></p>
      <div class="bar" id="bar"><span id="progress-fill"></span></div>
      <p id="progress-label" class="progress-label"></p>
      <div class="nature-row">
        <div class="nature-host" aria-hidden="true">
          <img id="nature-img" alt="" width="72" height="72" decoding="async" />
        </div>
      </div>
    </div>
    <div id="play" class="play"></div>
  </section>`;
}

function playStage(stage, index) {
  return new Promise((resolve) => {
    view.dataset.screen = "stage";
    view.dataset.stageKey = stage.key;
    view.innerHTML = stageShell(stage, index);
    paintMisses();
    paintProgress(stage, 0, stageTotal(stage));
    const play = document.getElementById("play");
    let handle = null;
    let mid = false;
    wireNature();
    const craft = state.craft;
    const ctx = {
      uiLang,
      speech,
      sfx,
      reducedMotion,
      craft,
      onProgress(n, total) {
        paintProgress(stage, n, total);
        const midAt = Number(stage.midAt ?? 0.55);
        if (!mid && n < total && n / total >= midAt) {
          mid = true;
          showLines(stage.lines, 1);
          speakLine(stage, stage.lines, 1);
        }
      },
      onMiss() {
        state.misses += 1;
        paintMisses();
        sfx?.miss?.();
        if (!MISS_STAGE_TYPES.has(stage.type)) return;
        const token = ++lineToken;
        showLines(stage.lines, 1, true);
        speakLine(stage, stage.lines, 1, { clipKey: "miss" });
        window.setTimeout(() => {
          if (token !== lineToken) return;
          showLines(stage.lines, 0);
          speakLine(stage, stage.lines, 0);
        }, 2200);
      },
      onComplete() {
        lineToken += 1;
        timer.pause();
        sfx?.win?.();
        showLines(stage.lines, 2);
        speakLine(stage, stage.lines, 2).then(() => {
          window.setTimeout(() => {
            handle?.destroy?.();
            resolve();
          }, 600);
        });
      },
    };
    showLines(stage.lines, 0);
    speakLine(stage, stage.lines, 0);
    timer.resume();
    handle = mountStage(play, stage, ctx);
  });
}

function playStageMovie(transition, index) {
  const id = transition?.id;
  const src = transitionVideoUrl(assetBase, manifest, id);
  if (!src) return Promise.resolve();
  const poster = transitionUrl(assetBase, manifest, id);
  const caption = transition?.caption || { en: "", ko: "" };
  const title = uiLang === "ko" ? caption.ko : caption.en;
  return new Promise((resolve) => {
    timer.pause();
    speech.stop();
    view.innerHTML = `<section class="reel-screen stage-movie-screen">
      <p class="still-time"><span id="timer">${esc(formatTime(timer.read()))}</span> · <span id="misses"></span></p>
      <video id="stage-movie" class="reel-video" playsinline preload="auto"${poster ? ` poster="${esc(poster)}"` : ""}></video>
      <p class="reel-label">${esc(`${index + 1}/${spec.stages.length}`)} · ${esc(title)}</p>
    </section>`;
    paintMisses();
    const video = document.getElementById("stage-movie");
    const finish = () => {
      video?.removeEventListener("ended", finish);
      video?.removeEventListener("error", finish);
      resolve();
    };
    if (!video) {
      finish();
      return;
    }
    video.addEventListener("ended", finish);
    video.addEventListener("error", finish);
    video.src = src;
    if (!speech.enabled) video.muted = true;
    video.load();
    video.play().catch(finish);
  });
}

function playFinale() {
  return new Promise((resolve) => {
    timer.pause();
    speech.stop();
    view.dataset.screen = "finale";
    view.innerHTML = `<section class="card results-card xmas-finale">
      <div class="confetti" aria-hidden="true"></div>
      <h1 class="line-single">${esc(t("doneBody"))}</h1>
    </section>`;
    if (!reducedMotion) {
      const box = view.querySelector(".confetti");
      const colors = ["#c62828", "#2e7d32", "#ffd54f", "#ffffff", "#1565c0"];
      for (let i = 0; i < 22; i += 1) {
        const bit = document.createElement("i");
        bit.style.left = `${Math.random() * 100}%`;
        bit.style.background = colors[i % colors.length];
        box?.append(bit);
      }
    }
    speech.playClip("finale").finally(() => window.setTimeout(resolve, 1200));
  });
}

function showResults() {
  if (!state.saved) {
    state.saved = true;
    state.entry = {
      name: state.name,
      timeMs: Math.round(timer.read()),
      misses: state.misses,
      at: Date.now(),
    };
    state.board = saveRun(spec.leaderboard.key, state.entry);
  }
  renderResults();
}

function renderResults() {
  const entry = state.entry;
  const board = state.board || loadBoard(spec.leaderboard.key);
  const rank = board.findIndex((row) => row.at === entry.at);
  view.dataset.screen = "results";
  view.innerHTML = `<section class="card results-card">
    <p class="kicker">${esc(t("doneTitle"))}</p>
    <div class="result-grid">
      <div><span>${esc(t("yourTime"))}</span><strong>${esc(formatTime(entry.timeMs))}</strong></div>
      <div><span>${esc(t("misses"))}</span><strong>${entry.misses}</strong></div>
      <div><span>${esc(t("rank"))}</span><strong>${rank >= 0 ? rank + 1 : "—"}</strong></div>
    </div>
    <p class="hint">${esc(t("timeNote"))}</p>
    <button id="again-btn" class="go" type="button">${esc(t("playAgain"))}</button>
    <h2 class="board-title">${esc(t("board"))}</h2>
    <div id="board-slot"></div>
  </section>`;
  view.querySelector("#board-slot").append(boardList(entry.at, board));
  document.getElementById("again-btn").addEventListener("click", () => {
    state = null;
    renderTitle(true);
  });
}

function validate(next) {
  if (!Array.isArray(next.stages) || next.stages.length !== 11) {
    throw new Error("Need exactly 11 stages");
  }
  if (!Array.isArray(next.transitions) || next.transitions.length !== 11) {
    throw new Error("Need 11 transitions");
  }
}

function preload() {
  Object.values(manifest.transitions || {}).forEach((rel) => {
    const img = new Image();
    img.src = new URL(rel, assetBase).href;
  });
}

function bindChrome() {
  langEn?.addEventListener("click", () => setLang("en"));
  langKo?.addEventListener("click", () => setLang("ko"));
  soundBtn?.addEventListener("click", () => {
    const on = !speech.enabled;
    speech.setEnabled(on);
    sfx?.setEnabled?.(on);
    paintLang();
  });
}

function setLang(lang) {
  uiLang = lang === "ko" ? "ko" : "en";
  try {
    localStorage.setItem(LANG_KEY, uiLang);
  } catch {
    /* ignore */
  }
  paintLang();
  if (view.dataset.screen === "title") renderTitle(true);
}

async function init() {
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    uiLang = localStorage.getItem(LANG_KEY) === "ko" ? "ko" : "en";
  } catch {
    uiLang = "en";
  }
  try {
    const loaded = await loadCraft();
    spec = loaded.spec;
    manifest = loaded.manifest;
    assetBase = loaded.assetBase;
    validate(spec);
    sfx = createSfx();
    speech = createSpeech(manifest, assetBase);
    preload();
    bindChrome();
    paintLang();
    renderTitle(false);
  } catch (err) {
    console.error(err);
    view.innerHTML = `<p class="boot-error">Could not load craft.</p>`;
  }
}

init();
