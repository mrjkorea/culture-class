import { transitionUrl, loadCraft } from "./assets.js";
import { prepareFaces } from "./faces.js";
import { cleanName, formatTime, loadBoard, saveRun } from "./leaderboard.js";
import { mountStage } from "./scenes.js";
import { pumpkinSvg } from "./art.js";
import { createSpeech } from "./speech.js";
import { createSfx } from "./sfx.js";

const LANG_KEY = "culture_craft_oct_pumpkin_v1_ui";

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

function listenKo() {
  return spec.languages?.listeningPrimary === "ko";
}

function spoken(block) {
  return listenKo() ? block.ko : block.en;
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
  const order = uiLang === "ko" ? ["ko", "en"] : ["en", "ko"];
  const a = document.getElementById("line-a");
  const b = document.getElementById("line-b");
  if (!a || !b) return;
  a.textContent = lineState.block[order[0]][lineState.index] || "";
  a.lang = order[0];
  b.textContent = lineState.block[order[1]][lineState.index] || "";
  b.lang = order[1];
  a.classList.toggle("is-alert", Boolean(lineState.alert));
  b.classList.toggle("is-alert", Boolean(lineState.alert));
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
  const other = uiLang === "ko" ? "en" : "ko";
  view.innerHTML = `<section class="card title-card">
    <div class="title-art">${pumpkinSvg("title")}</div>
    <h1>${esc(spec.title)}</h1>
    <p class="brand">${esc(spec.uiCopy.en.classTag)}</p>
    <p class="how">${esc(fill(t("how")))}</p>
    <p class="how mini" lang="${other}">${esc(fill(spec.uiCopy[other].how))}</p>
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
    await showTransition(spec.stages[i], spec.transitions[i], i);
    await playStage(spec.stages[i], i);
  }
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
        <h2 id="stage-label">${esc(`${index + 1}/${spec.stages.length} ${stage.title}`)}</h2>
        <p id="stage-ko" class="mini" lang="ko">${esc(stage.titleKo || "")}</p>
        <div class="stats">
          <span id="timer">${esc(formatTime(timer.read()))}</span>
          <span id="misses"></span>
        </div>
      </div>
      <p id="line-a" class="line"></p>
      <p id="line-b" class="line mini"></p>
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
      setFace(id) {
        state.faceId = id;
        state.face = faces.find((face) => face.id === id) || null;
        ctx.face = state.face;
      },
      onPickFace() {
        state.phase = "play";
        view.dataset.phase = "play";
        showLines(stage.lines, 0);
        speech.speak(spoken(stage.lines)[0]);
      },
      onProgress(n, total) {
        paintProgress(stage, n, total);
        const midAt = Number(stage.midAt ?? 0.55);
        if (!mid && n < total && n / total >= midAt) {
          mid = true;
          showLines(stage.lines, 1);
          speech.speak(spoken(stage.lines)[1]);
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
        speech.speak(spoken(stage.lines)[1], { miss: true });
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
        speech.speak(spoken(stage.lines)[2]).then(() => {
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
      speech.speak(spoken(pickBlock())[0]);
    } else {
      state.phase = "play";
      showLines(stage.lines, 0);
      speech.speak(spoken(stage.lines)[0]);
    }
    timer.resume();
    handle = mountStage(play, stage, ctx);
  });
}

function showTransition(stage, transition) {
  const seconds = Number(transition?.durationSec);
  const duration = Number.isFinite(seconds) ? seconds * 1000 : 10000;
  const src = transitionUrl(assetBase, manifest, transition?.id);
  view.dataset.screen = "transition";
  view.dataset.stageKey = stage.key;
  view.dataset.phase = "transition";
  state.phase = "transition";
  timer.pause();
  view.innerHTML = `<section class="still-screen">
    <p class="still-time"><span id="timer">${esc(formatTime(timer.read()))}</span> · <span id="misses"></span></p>
    <div class="still-frame">
      <div class="still-fallback" aria-hidden="true"></div>
      ${src ? `<img id="still" alt="" draggable="false">` : ""}
      <div class="still-bar" aria-hidden="true"><span id="still-fill"></span></div>
      <div class="still-caption">
        <p class="kicker">${esc(stage.title)} · ${esc(stage.titleKo || "")}</p>
        <p id="line-a" class="line"></p>
        <p id="line-b" class="line mini"></p>
        <p class="watch" id="watch"></p>
        <div class="frank-host still-frank" id="frank-host" aria-hidden="true">
          <img id="frank-img" alt="" width="64" height="64" decoding="async" />
        </div>
      </div>
    </div>
  </section>`;
  paintMisses();
  wireFrank();
  const caption = transition?.caption || { en: stage.title, ko: stage.titleKo || "" };
  showLines({ en: [caption.en], ko: [caption.ko] }, 0);
  const watch = document.getElementById("watch");
  if (watch) watch.textContent = t("watch");
  const img = document.getElementById("still");
  if (img) {
    img.addEventListener("error", () => img.remove());
    img.src = src;
  }
  speech.speak(spoken({ en: [caption.en], ko: [caption.ko] })[0]);
  return waitStill(duration);
}

function waitStill(duration) {
  const fill = document.getElementById("still-fill");
  let elapsed = 0;
  let last = performance.now();
  const onVis = () => {
    last = performance.now();
  };
  document.addEventListener("visibilitychange", onVis);
  return new Promise((resolve) => {
    const frame = (now) => {
      if (view.dataset.phase !== "transition") {
        document.removeEventListener("visibilitychange", onVis);
        resolve();
        return;
      }
      if (!document.hidden) elapsed += Math.min(80, now - last);
      last = now;
      const pct = Math.max(0, Math.min(1, elapsed / duration));
      if (fill) fill.style.width = `${pct * 100}%`;
      const watch = document.getElementById("watch");
      if (watch) watch.textContent = `${t("watch")} · ${Math.max(0, Math.ceil((duration - elapsed) / 1000))}`;
      if (elapsed >= duration) {
        document.removeEventListener("visibilitychange", onVis);
        resolve();
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
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
  const faceLabel = face ? `${face.label.en} · ${face.label.ko}` : "";
  view.innerHTML = `<section class="card results-card" id="results">
    <div class="confetti" aria-hidden="true"></div>
    <p class="kicker">${esc(t("doneTitle"))}</p>
    <h1 id="line-a"></h1>
    <p id="line-b" class="mini"></p>
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
    if (listenKo()) tts.lang = "ko-KR";
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
