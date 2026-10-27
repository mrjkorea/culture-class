import { ghostAssetUrl, loadCraft, transitionUrl, transitionVideoUrl } from "./assets.js";
import { prepareFaces } from "./faces.js";
import { cleanName, formatTime, loadBoard, saveRun } from "./leaderboard.js";
import { mountStage } from "./scenes.js";
import { pumpkinSvg } from "./art.js";
import { createSpeech } from "./speech.js";
import { createSfx } from "./sfx.js";

const LANG_KEY = "culture_craft_jan_newyear_v1_ui";

const view = document.getElementById("view");
const backLink = document.getElementById("back-link");
const langEn = document.getElementById("lang-en");
const langKo = document.getElementById("lang-ko");
const soundBtn = document.getElementById("sound-btn");

let spec;
let manifest;
let assetBase;
let faces = [];
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
      const el = document.getElementById("timer");
      if (el) el.textContent = formatTime(0);
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
      const el = document.getElementById("timer");
      if (el) el.textContent = formatTime(acc);
    },
  };
}

function t(key) {
  const pack = spec.uiCopy?.[uiLang] || {};
  const en = spec.uiCopy?.en || {};
  return pack[key] || en[key] || "";
}

function candyCount() {
  const candy = spec.stages.find((stage) => stage.key === "candy");
  return candy?.clicks ?? 50;
}

function fill(template) {
  return String(template || "").split("{candies}").join(String(candyCount()));
}

function spoken(block) {
  return uiLang === "ko" ? block.ko : block.en;
}

function clipKeyFor(stage, lineIndex) {
  if (!stage) return "";
  const key = stage.key;
  if (lineIndex === 1 && stage.type === "luck_hunt") return `${key}_miss`;
  const suffix = lineIndex === 0 ? "start" : lineIndex === 1 ? "mid" : "win";
  return `${key}_${suffix}`;
}

function speakLine(stage, block, lineIndex, opts = {}) {
  const text = spoken(block)[lineIndex] || "";
  const clipKey = opts.clipKey || (stage ? clipKeyFor(stage, lineIndex) : "pin_start");
  return speech.speak(text, { ...opts, clipKey });
}

function pickBlock() {
  return {
    en: [spec.uiCopy.en.pickFace],
    ko: [spec.uiCopy.ko.pickFace],
  };
}

function frankUrls() {
  if (!manifest?.frank) return null;
  return {
    open: new URL(manifest.frank.open, assetBase).href,
    closed: new URL(manifest.frank.closed, assetBase).href,
  };
}

function wireFrank() {
  const img = document.getElementById("frank-img");
  const urls = frankUrls();
  if (img && urls) speech.setFrank(img, urls);
}

function paintLang() {
  langEn.setAttribute("aria-pressed", uiLang === "en" ? "true" : "false");
  langKo.setAttribute("aria-pressed", uiLang === "ko" ? "true" : "false");
  langEn.classList.toggle("on", uiLang === "en");
  langKo.classList.toggle("on", uiLang === "ko");
  backLink.textContent = t("back");
  soundBtn.setAttribute("aria-label", speech.enabled ? t("soundOn") : t("soundOff"));
  soundBtn.classList.toggle("is-muted", !speech.enabled);
}

function showLines(block, index, alert = false) {
  lineState = { block, index, alert };
  paintLines();
}

function paintLines() {
  if (!lineState) return;
  const lang = uiLang === "ko" ? "ko" : "en";
  const a = document.getElementById("line-a");
  const b = document.getElementById("line-b");
  if (!a || !b) return;
  a.textContent = lineState.block[lang][lineState.index] || "";
  a.lang = lang;
  b.textContent = "";
  b.hidden = true;
  a.classList.toggle("is-alert", Boolean(lineState.alert));
  const live = document.getElementById("live");
  if (live) live.textContent = a.textContent;
}

function paintMisses() {
  const el = document.getElementById("misses");
  if (el && state) el.textContent = `${t("misses")} ${state.misses}`;
}

function setLang(lang) {
  uiLang = lang === "ko" ? "ko" : "en";
  try {
    localStorage.setItem(LANG_KEY, uiLang);
  } catch {
    /* ignore */
  }
  paintLang();
  const screen = view.dataset.screen;
  if (screen === "title") renderTitle(true);
  else if (screen === "results") renderResults();
  else {
    paintLines();
    paintMisses();
    const watch = document.getElementById("watch");
    if (watch) watch.textContent = t("watch");
  }
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
    const rank = document.createElement("span");
    rank.className = "b-rank";
    rank.textContent = String(index + 1);
    const name = document.createElement("span");
    name.className = "b-name";
    name.textContent = row.name;
    const meta = document.createElement("span");
    meta.className = "b-meta";
    meta.textContent = `${formatTime(row.timeMs)} · ${t("misses")} ${row.misses}`;
    li.append(rank, name, meta);
    ol.append(li);
  });
  return ol;
}

function renderTitle(keepName) {
  speech.stop();
  const previous = keepName ? document.getElementById("nick")?.value || "" : "";
  view.dataset.screen = "title";
  view.dataset.stageKey = "";
  view.dataset.phase = "title";
  view.innerHTML = `<section class="card title-card">
    <div class="title-art">${pumpkinSvg("title")}</div>
    <h1>${esc(spec.title)}</h1>
    <p class="brand">${esc(t("classTag"))}</p>
    <p class="how">${esc(fill(t("how")))}</p>
    <p class="hint">${esc(t("beatNote"))}</p>
    <form id="nick-form">
      <label for="nick">${esc(t("nickname"))}</label>
      <input id="nick" name="nick" maxlength="16" autocomplete="off" autocapitalize="words" required placeholder="${esc(t("namePlaceholder"))}">
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

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let starting = false;

async function onStart(event) {
  event.preventDefault();
  if (starting) return;
  const input = document.getElementById("nick");
  const name = cleanName(input.value);
  const error = document.getElementById("form-error");
  if (!name) {
    error.textContent = t("needName");
    input.focus();
    return;
  }
  error.textContent = "";
  starting = true;
  speech.unlock();
  sfx?.unlock?.();
  try {
    await runGame(name);
  } catch (err) {
    console.error(err);
    view.dataset.screen = "title";
    view.innerHTML = `<p class="boot-error"></p>`;
    view.querySelector(".boot-error").textContent = t("loadError");
  } finally {
    starting = false;
  }
}

async function runGame(name) {
  state = { name, misses: 0, faceId: null, face: null, phase: "transition", saved: false, entry: null };
  timer.reset();
  for (let i = 0; i < spec.stages.length; i += 1) {
    await playStage(spec.stages[i], i);
    await playStageMovie(spec.transitions[i], i);
  }
  await playNewYearFinale();
  showResults();
}

function stageShell(stage, index) {
  const pips = spec.stages
    .map((_, i) => `<i class="${i < index ? "done" : i === index ? "now" : ""}"></i>`)
    .join("");
  return `<section class="screen-stage">
    <div class="hud">
      <div class="hud-row">
        <div class="pips" aria-hidden="true">${pips}</div>
        <h2 id="stage-label">${esc(`${index + 1}/${spec.stages.length} ${uiLang === "ko" ? stage.titleKo || stage.title : stage.title}`)}</h2>
        <div class="stats">
          <span id="timer">${esc(formatTime(timer.read()))}</span>
          <span id="misses"></span>
        </div>
      </div>
      <p id="line-a" class="line line-single"></p>
      <p id="line-b" class="line mini" hidden></p>
      <div class="bar" id="bar"><span id="progress-fill"></span></div>
      <p id="progress-label" class="progress-label"></p>
      <div class="frank-row">
        <div class="frank-host" id="frank-host" aria-hidden="true">
          <img id="frank-img" alt="" width="72" height="72" decoding="async" />
        </div>
      </div>
    </div>
    <div id="play" class="play"></div>
  </section>`;
}

function paintProgress(stage, n = 0, total = stage.clicks || 1) {
  const bar = document.getElementById("bar");
  const fill = document.getElementById("progress-fill");
  const label = document.getElementById("progress-label");
  if (!bar || !fill || !label) return;
  if (stage.type === "luck_hunt") {
    bar.hidden = true;
    label.textContent = "";
    return;
  }
  bar.hidden = false;
  fill.style.width = `${Math.max(0, Math.min(100, (n / total) * 100))}%`;
  label.textContent = `${n} / ${total}`;
}

function playStage(stage, index) {
  return new Promise((resolve) => {
    view.dataset.screen = "stage";
    view.dataset.stageKey = stage.key;
    view.dataset.phase = stage.key === "pin" ? "pick" : "play";
    view.innerHTML = stageShell(stage, index);
    paintMisses();
    paintProgress(stage, 0, stage.clicks || 1);
    const play = document.getElementById("play");
    let handle = null;
    let mid = false;
    wireFrank();
    const ctx = {
      faces,
      face: state.face,
      reducedMotion,
      sfx,
      speech,
      assetBase,
      manifest,
      uiLang,
      setFace(id) {
        state.faceId = id;
        state.face = faces.find((face) => face.id === id) || null;
        ctx.face = state.face;
      },
      onPickFace() {
        state.phase = "play";
        view.dataset.phase = "play";
        showLines(stage.lines, 0);
        speakLine(stage, stage.lines, 0);
      },
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
        if (state.phase === "success") return;
        state.misses += 1;
        paintMisses();
        sfx?.miss?.();
        if (stage.type !== "luck_hunt") return;
        const token = ++lineToken;
        showLines(stage.lines, 1, true);
        speakLine(stage, stage.lines, 1, { miss: true });
        window.setTimeout(() => {
          if (token !== lineToken || state.phase !== "play") return;
          showLines(stage.lines, 0);
        }, 2400);
      },
      onComplete() {
        if (state.phase === "success") return;
        state.phase = "success";
        lineToken += 1;
        timer.pause();
        sfx?.win?.();
        showLines(stage.lines, 2);
        const started = performance.now();
        speakLine(stage, stage.lines, 2).then(() => {
          const wait = Math.max(0, 700 - (performance.now() - started));
          window.setTimeout(() => {
            handle?.destroy();
            resolve();
          }, wait);
        });
      },
    };
    if (stage.key === "pin") {
      state.phase = "pick";
      showLines(pickBlock(), 0);
      speakLine(stage, pickBlock(), 0);
    } else {
      state.phase = "play";
      showLines(stage.lines, 0);
      speakLine(stage, stage.lines, 0);
    }
    timer.resume();
    handle = mountStage(play, stage, ctx);
  });
}

function applyTransitionVideoMute(video) {
  if (!video) return;
  if (!speech.enabled) {
    video.muted = true;
  } else {
    video.muted = false;
    video.volume = Number(spec.tts?.volume ?? 1);
  }
}

function playStageMovie(transition, index) {
  const id = transition?.id;
  const src = transitionVideoUrl(assetBase, manifest, id);
  if (!src) return Promise.resolve();
  const poster = transitionUrl(assetBase, manifest, id);
  const caption = transition?.caption || { en: "", ko: "" };
  const title = uiLang === "ko" ? caption.ko : caption.en;
  return new Promise((resolve) => {
    view.dataset.screen = "stage-movie";
    view.dataset.phase = "stage-movie";
    timer.pause();
    speech.stop();
    view.innerHTML = `<section class="reel-screen stage-movie-screen" aria-live="polite">
      <p class="still-time stage-movie-hud"><span id="timer">${esc(formatTime(timer.read()))}</span> · <span id="misses"></span></p>
      <video id="stage-movie" class="reel-video stage-movie-video" playsinline preload="auto"${poster ? ` poster="${esc(poster)}"` : ""}></video>
      <p class="reel-label" id="stage-movie-label">${esc(`${index + 1}/${spec.stages.length}`)} · ${esc(title)}</p>
    </section>`;
    paintMisses();
    const video = document.getElementById("stage-movie");
    if (!video) {
      resolve();
      return;
    }
    const finish = () => {
      video.removeEventListener("ended", finish);
      video.removeEventListener("error", finish);
      resolve();
    };
    video.addEventListener("ended", finish);
    video.addEventListener("error", finish);
    video.src = src;
    applyTransitionVideoMute(video);
    video.load();
    video.play().catch(finish);
  });
}

function playNewYearFinale() {
  return new Promise((resolve) => {
    view.dataset.screen = "finale";
    view.dataset.phase = "finale";
    timer.pause();
    speech.stop();
    view.innerHTML = `<section class="card results-card ny-finale" aria-live="assertive">
      <div class="confetti" aria-hidden="true"></div>
      <p class="kicker">${esc(t("doneTitle"))}</p>
      <h1 class="line-single">${esc(t("doneBody"))}</h1>
      <p class="hint">${esc(uiLang === "ko" ? "불꽃과 색종이!" : "Fireworks and confetti!")}</p>
    </section>`;
    if (!reducedMotion) {
      const box = view.querySelector(".confetti");
      const colors = ["#ffd43b", "#ff6b6b", "#74c0fc", "#fff", "#51cf66", "#ff922b"];
      for (let i = 0; i < 24; i += 1) {
        const bit = document.createElement("i");
        bit.style.left = `${Math.random() * 100}%`;
        bit.style.background = colors[i % colors.length];
        bit.style.animationDelay = `${Math.random() * 0.5}s`;
        box?.append(bit);
      }
    }
    void speech.playClip("candy_win").finally(() => {
      window.setTimeout(resolve, 1800);
    });
  });
}

function showResults() {
  if (!state.saved) {
    state.saved = true;
    const entry = {
      name: state.name,
      timeMs: Math.round(timer.read()),
      misses: state.misses,
      faceId: state.faceId || "",
      at: Date.now(),
    };
    state.entry = entry;
    state.board = saveRun(spec.leaderboard.key, entry);
  }
  renderResults();
}

function renderResults() {
  speech.stop();
  const entry = state.entry;
  const board = state.board || loadBoard(spec.leaderboard.key);
  const rank = board.findIndex((row) => row.at === entry.at);
  const face = faces.find((item) => item.id === entry.faceId);
  view.dataset.screen = "results";
  view.dataset.stageKey = "";
  view.dataset.phase = "results";
  const faceLabel = face ? (uiLang === "ko" ? face.label.ko : face.label.en) : "";
  view.innerHTML = `<section class="card results-card" id="results">
    <div class="confetti" aria-hidden="true"></div>
    <p class="kicker">${esc(t("doneTitle"))}</p>
    <h1 id="line-a" class="line-single"></h1>
    <p id="line-b" class="mini" hidden></p>
    <p class="result-name"></p>
    <div class="result-grid">
      <div><span>${esc(t("yourTime"))}</span><strong>${esc(formatTime(entry.timeMs))}</strong></div>
      <div><span>${esc(t("misses"))}</span><strong>${esc(String(entry.misses))}</strong></div>
      <div><span>${esc(t("rank"))}</span><strong>${rank >= 0 ? rank + 1 : "—"}</strong></div>
    </div>
    <p class="face-used"></p>
    <p class="hint">${esc(t("timeNote"))}</p>
    <button id="again-btn" class="go" type="button">${esc(t("playAgain"))}</button>
    <h2 class="board-title">${esc(t("board"))}</h2>
    <div id="board-slot"></div>
  </section>`;
  view.querySelector(".result-name").textContent = entry.name;
  const faceEl = view.querySelector(".face-used");
  faceEl.textContent = faceLabel;
  view.querySelector("#board-slot").append(boardList(entry.at, board));
  if (!reducedMotion) {
    const box = view.querySelector(".confetti");
    const colors = ["#ffe56a", "#ff4d8d", "#7dff6b", "#8ec5ff", "#ff8a1e", "#fff"];
    for (let i = 0; i < 18; i += 1) {
      const bit = document.createElement("i");
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = `${Math.random() * 0.4}s`;
      bit.style.transform = `rotate(${Math.random() * 80}deg)`;
      box.append(bit);
    }
  }
  showLines(
    { en: [spec.uiCopy.en.doneBody], ko: [spec.uiCopy.ko.doneBody] },
    0
  );
  document.getElementById("again-btn").addEventListener("click", () => {
    state = null;
    renderTitle(false);
  });
}

function validate(next, faceList) {
  if (!Array.isArray(next.stages) || next.stages.length !== 10) {
    throw new Error("stages.json needs exactly 10 stages");
  }
  if (!Array.isArray(next.transitions) || next.transitions.length !== next.stages.length) {
    throw new Error("Each stage needs a transition still");
  }
  next.stages.forEach((stage, index) => {
    if (!stage.lines?.en || stage.lines.en.length < 3 || !stage.lines?.ko || stage.lines.ko.length < 3) {
      throw new Error(`Stage ${stage.id} needs 3 English and 3 Korean lines`);
    }
    if (stage.type === "luck_hunt") {
      if (!(stage.poolSize > 0) || !(stage.goodCount >= 1) || stage.goodCount > stage.poolSize) {
        throw new Error(`Stage ${stage.id} luck pool is invalid`);
      }
    } else if (stage.type === "countdown") {
      if (!(stage.clicks > 0)) throw new Error(`Stage ${stage.id} countdown needs clicks`);
    } else if (!(stage.clicks > 0)) {
      throw new Error(`Stage ${stage.id} needs a click total`);
    }
    if (!next.transitions[index]?.id) throw new Error(`Missing transition for stage ${stage.id}`);
  });
  const pin = next.stages.find((stage) => stage.key === "pin");
  const carve = next.stages.find((stage) => stage.key === "carve");
  if (!pin || !carve) throw new Error("Pin and carve stages are required");
  if (pin.facePresets && faceList.length !== pin.facePresets) {
    throw new Error("Face preset count does not match stages.json");
  }
  if (pin.sameClicksAllFaces) {
    const pinN = faceList[0]?.pin.length;
    const carveN = faceList[0]?.carve.length;
    if (pinN !== pin.clicks || carveN !== carve.clicks || faceList.some((face) => face.pin.length !== pinN || face.carve.length !== carveN)) {
      throw new Error("Face presets must share the pin and carve click totals");
    }
  }
}

function preload() {
  Object.values(manifest.transitions || {}).forEach((rel) => {
    const img = new Image();
    img.src = new URL(rel, assetBase).href;
  });
}

function bindChrome() {
  langEn.addEventListener("click", () => setLang("en"));
  langKo.addEventListener("click", () => setLang("ko"));
  soundBtn.addEventListener("click", () => {
    speech.unlock();
    sfx?.unlock?.();
    const on = !speech.enabled;
    speech.setEnabled(on);
    sfx?.setEnabled?.(on);
    paintLang();
  });
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
    const pin = spec.stages.find((stage) => stage.key === "pin");
    const carve = spec.stages.find((stage) => stage.key === "carve");
    const prepared = prepareFaces(loaded.faces, pin.clicks, carve.clicks);
    validate(spec, prepared);
    faces = prepared;
    const tts = { ...(spec.tts || {}) };
    sfx = createSfx();
    speech = createSpeech(tts, manifest, assetBase);
    preload();
    if (manifest.frank) {
      const urls = frankUrls();
      [urls?.open, urls?.closed].forEach((href) => {
        if (!href) return;
        const img = new Image();
        img.src = href;
      });
    }
    bindChrome();
    paintLang();
    renderTitle(false);
  } catch (err) {
    console.error(err);
    view.innerHTML = `<p class="boot-error"></p>`;
    view.querySelector(".boot-error").textContent = "Could not load the craft. Reload the page.";
  }
}

init();
