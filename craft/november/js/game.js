import { loadCraft, transitionUrl, transitionVideoUrl } from "./assets.js?v=20261127-click-place";
import { cleanName, formatTime, loadBoard, saveRun } from "./leaderboard.js";
import { mountStage } from "./scenes.js?v=20261127-click-place";
import { titleArtSvg } from "./thanksgiving-art.js";
import { createSpeech } from "./speech.js?v=20261127-click-place";
import { createSfx } from "./sfx.js";
import { createTransitionStillPlayer } from "../../shared/transition-still.js?v=20261127-click-place";
import { getLang, mountLangSelect, pickLines, pickLocalized, studentDisplayName, t as i18nT } from "../../../js/i18n.js";
import { syncDisplayNameFromAuth } from "../../../js/student-signin.js";

const MISS_STAGE_TYPES = new Set(["turkey_hunt"]);

const view = document.getElementById("view");
const backLink = document.getElementById("back-link");
const langSelect = document.getElementById("lang-select");
const soundBtn = document.getElementById("sound-btn");
const teacherBtn = document.getElementById("teacher-btn");
const teacherForm = document.getElementById("teacher-form");
const teacherPin = document.getElementById("teacher-pin");
const teacherError = document.getElementById("teacher-error");
const skipBtn = document.getElementById("skip-btn");
const TEACHER_KEY = "culture-feast-teacher";

let spec;
let manifest;
let assetBase;
let speech;
let sfx;
let uiLang = getLang();
let stageCtx = null;
let lineState = null;
let lineToken = 0;
let lastClip = "";
let state = null;
let teacherOn = false;
let skipAction = null;
let reducedMotion = false;
let stillPlayer;

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
  if (stage.type === "oven_hold" || stage.type === "thankful_card") {
    const ms = stage.holdRequiredMs || 60000;
    return Math.ceil(ms / 1000);
  }
  if (stage.type === "turkey_hunt") return stage.goodCount || 1;
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
  lastClip = clipKey;
  return speech.speak("", { clipKey });
}

function grandmaUrls() {
  if (!manifest?.grandma) return null;
  return {
    open: new URL(manifest.grandma.open, assetBase).href,
    closed: new URL(manifest.grandma.closed, assetBase).href,
  };
}

function teacherUnlocked() {
  try {
    if (window.sessionStorage.getItem(TEACHER_KEY) === "1") return true;
  } catch {
    /* ignore */
  }
  try {
    if (window.MRJ_AUTH?.isTeacher?.()) return true;
  } catch {
    /* ignore */
  }
  return document.body.classList.contains("mrj-teacher");
}

function paintTeacher() {
  teacherOn = teacherUnlocked();
  if (teacherBtn) teacherBtn.hidden = teacherOn;
  if (teacherForm && teacherOn) teacherForm.hidden = true;
  if (skipBtn) skipBtn.hidden = !(teacherOn && skipAction);
}

function armSkip(fn) {
  skipAction = fn;
  paintTeacher();
}

function clearSkip() {
  skipAction = null;
  paintTeacher();
}

async function unlockTeacher(pin) {
  const auth = window.MRJ_AUTH;
  if (!auth?.ENDPOINT || !auth.student?.()) {
    return { ok: false, message: "Sign in on the class page first." };
  }
  let data = null;
  try {
    const res = await fetch(auth.ENDPOINT, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "study_teacher_check",
        pin,
        id: auth.student(),
        token: auth.token?.() || "",
      }),
    });
    data = await res.json();
  } catch {
    data = null;
  }
  if (!data?.ok) return { ok: false, message: "That password did not work." };
  try {
    window.sessionStorage.setItem(TEACHER_KEY, "1");
  } catch {
    /* ignore */
  }
  teacherOn = true;
  paintTeacher();
  return { ok: true };
}

function wireGrandma() {
  const img = document.getElementById("grandma-img");
  const urls = grandmaUrls();
  if (img && urls) speech.setGrandma(img, urls);
  const btn = document.getElementById("grandma-btn");
  btn?.addEventListener("click", () => {
    if (lastClip) speech.playClip(lastClip);
  });
}

function paintLang() {
  uiLang = getLang();
  if (stageCtx) stageCtx.uiLang = uiLang;
  if (backLink) backLink.textContent = t("back");
  const topTitle = document.getElementById("top-game-title");
  if (topTitle && spec) topTitle.textContent = t("gameTitle") || spec.title;
  soundBtn?.setAttribute("aria-label", speech?.enabled ? t("soundOn") : t("soundOff"));
  soundBtn?.classList.toggle("is-muted", speech && !speech.enabled);
  document.querySelectorAll("[data-ui]").forEach((el) => {
    if (el.disabled) return;
    const key = el.getAttribute("data-ui");
    if (key) el.textContent = t(key);
  });
}

function showLines(block, index, alert = false) {
  lineState = { block, index, alert };
  paintLines();
}

function paintLines() {
  if (!lineState) return;
  const a = document.getElementById("line-a");
  if (!a) return;
  a.textContent = pickLines(lineState.block, lineState.index, uiLang);
  a.lang = uiLang === "zh-Hans" ? "zh" : uiLang.split("-")[0];
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
  if (stage.type === "oven_hold") {
    label.textContent = uiLang === "ko" ? `오븐 ${n} / ${total}초` : `Oven ${n} / ${total}s`;
    return;
  }
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

function renderTitle() {
  speech.stop();
  const signed = syncDisplayNameFromAuth();
  view.dataset.screen = "title";
  view.innerHTML = `<section class="card title-card feast-title">
    <div class="title-art">${titleArtSvg()}</div>
    <h1>${esc(t("gameTitle") || spec.title)}</h1>
    <p class="brand">${esc(t("classTag"))}</p>
    <p class="how">${esc(t("how"))}</p>
    <p class="hint">${esc(t("beatNote"))}</p>
    <form id="nick-form">
      ${signed ? `<p class="hint signed-as">${esc((t("playingAs") || "Playing as {name}").replace("{name}", signed))}</p>` : ""}
      <button id="play-btn" class="go" type="submit">${esc(t("play"))}</button>
      <p id="form-error" class="form-error" role="alert"></p>
    </form>
    <h2 class="board-title">${esc(t("board"))}</h2>
    <div id="board-slot"></div>
  </section>`;
  view.querySelector("#board-slot").append(boardList());
  document.getElementById("nick-form").addEventListener("submit", onStart);
}

let starting = false;

async function onStart(event) {
  event.preventDefault();
  if (starting) return;
  const signed = syncDisplayNameFromAuth();
  const name = cleanName(signed || "Student");
  const error = document.getElementById("form-error");
  if (error) error.textContent = "";
  starting = true;
  speech.unlock();
  sfx?.unlock?.();
  try {
    await new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        clearSkip();
        resolve();
      };
      armSkip(() => {
        speech.stop();
        done();
      });
      speech.playClip("intro").then(() => window.setTimeout(done, 800));
    });
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
  const flags = { cancelled: false };
  let cancelStill = null;
  const playing = stillPlayer.play(
    {
      view,
      timer,
      esc,
      formatTime,
      spec,
      uiLang,
      isCancelled: () => flags.cancelled,
      bindCancel(fn) {
        cancelStill = fn;
      },
    },
    transition,
    index,
  );
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearSkip();
      resolve();
    };
    armSkip(() => {
      flags.cancelled = true;
      cancelStill?.();
      done();
    });
    Promise.resolve(playing).then(done, done);
  });
}

function stageShell(stage, index) {
  const pips = spec.stages
    .map((_, i) => `<i class="${i < index ? "done" : i === index ? "now" : ""}"></i>`)
    .join("");
  const label = pickLocalized(stage.titles || { en: stage.title, ko: stage.titleKo }, uiLang);
  return `<section class="screen-stage feast-stage">
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
      <div class="grandma-row">
        <button type="button" class="grandma-host" id="grandma-btn" aria-label="Hear that again">
          <img id="grandma-img" alt="" width="72" height="72" decoding="async" />
        </button>
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
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearSkip();
      handle?.destroy?.();
      resolve();
    };
    armSkip(finish);
    wireGrandma();
    const craft = state.craft;
    const ctx = {
      uiLang,
      uiCopy: spec.uiCopy,
      assetBase,
      manifest,
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
          window.setTimeout(finish, 600);
        });
      },
    };
    stageCtx = ctx;
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
  const title = pickLocalized(caption, uiLang);
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
    let settled = false;
    let cap = 0;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearSkip();
      window.clearTimeout(cap);
      video?.removeEventListener("ended", finish);
      video?.removeEventListener("error", finish);
      try { video?.pause(); } catch { /* ignore */ }
      resolve();
    };
    armSkip(finish);
    if (!video) {
      finish();
      return;
    }
    video.addEventListener("ended", finish);
    video.addEventListener("error", finish);
    video.src = src;
    if (!speech.enabled) video.muted = true;
    video.load();
    cap = window.setTimeout(finish, 12000);
    video.play().catch(finish);
  });
}

function playFinale() {
  return new Promise((resolve) => {
    timer.pause();
    speech.stop();
    view.dataset.screen = "finale";
    view.innerHTML = `<section class="card results-card feast-finale">
      <div class="confetti" aria-hidden="true"></div>
      <h1 class="line-single">${esc(t("doneBody"))}</h1>
    </section>`;
    if (!reducedMotion) {
      const box = view.querySelector(".confetti");
      const colors = ["#e07a2f", "#c45c26", "#ffd43b", "#fff6e4", "#6b2d0a"];
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
  if (window.CC_SCORES && state.entry) {
    window.CC_SCORES.record("craft", {
      durationSeconds: Math.round(state.entry.timeMs / 1000),
      metadata: { misses: state.entry.misses, time_ms: state.entry.timeMs },
    });
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
    <a id="map-btn" class="go map-back" href="${esc(backLink.href)}">Back to map</a>
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


function onLangChange() {
  uiLang = getLang();
  paintLang();
  paintLines();
  const screen = view.dataset.screen;
  if (screen === "title") renderTitle(true);
  if (screen === "stage" && spec) {
    const idx = spec.stages.findIndex((s) => s.key === view.dataset.stageKey);
    const stage = spec.stages[idx];
    const label = document.getElementById("stage-label");
    if (label && stage && idx >= 0) {
      const name = pickLocalized(stage.titles || { en: stage.title, ko: stage.titleKo }, uiLang);
      label.textContent = `${idx + 1}/${spec.stages.length} ${name}`;
    }
  }
}

function bindChrome() {
  paintTeacher();
  teacherBtn?.addEventListener("click", () => {
    if (teacherForm) teacherForm.hidden = false;
    teacherPin?.focus();
  });
  teacherForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = await unlockTeacher(teacherPin?.value || "");
    if (teacherPin) teacherPin.value = "";
    if (!result.ok) {
      if (teacherError) teacherError.textContent = result.message;
      return;
    }
    if (teacherError) teacherError.textContent = "";
  });
  skipBtn?.addEventListener("click", () => {
    const fn = skipAction;
    skipAction = null;
    fn?.();
  });
  document.addEventListener("mrj-teacher", paintTeacher);
  document.addEventListener("mrj-auth-ready", paintTeacher);
  mountLangSelect(langSelect, onLangChange);
  const langLabel = document.getElementById("lang-label");
  if (langLabel) langLabel.textContent = i18nT("lang_label");
  soundBtn?.addEventListener("click", () => {
    const on = !speech.enabled;
    speech.setEnabled(on);
    sfx?.setEnabled?.(on);
    paintLang();
  });
}

async function init() {
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  syncDisplayNameFromAuth();
  uiLang = getLang();
  try {
    const loaded = await loadCraft();
    spec = loaded.spec;
    manifest = loaded.manifest;
    assetBase = loaded.assetBase;
    validate(spec);
    sfx = createSfx();
    speech = createSpeech(manifest, assetBase);
    stillPlayer = createTransitionStillPlayer({ assetBase, manifest, transitionUrl });
    stillPlayer.preloadAll();
    bindChrome();
    paintLang();
    renderTitle();
    document.addEventListener("mrj-auth-ready", () => {
      syncDisplayNameFromAuth();
      if (view.dataset.screen === "title") renderTitle();
    });
  } catch (err) {
    console.error(err);
    view.innerHTML = `<p class="boot-error">Could not load craft.</p>`;
  }
}

init();
