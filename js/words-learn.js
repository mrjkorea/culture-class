import {
  escapeHtml,
  getMonthIdFromQuery,
  loadWordsPackForMonth,
  monthPageUrl,
  setLearnDone,
  shuffle,
  wordsMemoryUrl,
} from "./words-data.js";
import { playWordAudio } from "./words-audio.js";
import { setStepDone } from "./month-progress.js";
import { repoRoot } from "./paths.js";
import * as Algo from "./word-factory-algo.js";
import { applyMonthUiTheme } from "./month-ui-theme.js";
import { ensureThemeStylesheet } from "./month-styles.js";

const WINS_KEY_PREFIX = "culture-class-factory-wins-";
const app = document.getElementById("app");

let terms = [];
let month = null;
let winsState = Algo.emptyWins();
/** @type {{ mode: string, queue: object[], cur: object|null, typed: string, locking: boolean, mustCopy: boolean, pendingNxt: object|null, startedAt: number }} */
let learn = null;

function winsKey(monthId) {
  return `${WINS_KEY_PREFIX}${monthId}`;
}

function loadWins(monthId) {
  try {
    const raw = localStorage.getItem(winsKey(monthId));
    if (raw) return { ...Algo.emptyWins(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return Algo.emptyWins();
}

function saveWins(monthId) {
  try {
    localStorage.setItem(winsKey(monthId), JSON.stringify(winsState));
  } catch {
    /* ignore */
  }
}

function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/['']/g, "'");
}

function renderShell(body) {
  const back = month
    ? `<a class="back-link halloween-back" href="${escapeHtml(monthPageUrl(month.slug))}">← Map</a>`
    : "";
  app.innerHTML = `
    <div class="wrap words-flow themed-words-flow learn-factory">
      ${back}
      <header class="themed-words-hero">
        <h2>${month ? escapeHtml(month.name) + " — Learn" : "Learn"}</h2>
        <p>Word Master factory — listen, meaning, spelling, then write.</p>
      </header>
      ${body}
      <footer class="site-footer">Culture Class · Learn</footer>
    </div>`;
}

function distractors(cur, n) {
  const others = terms.filter((t) => t.id !== cur.id);
  return shuffle(others).slice(0, n);
}

function picHtml(t) {
  if (!t.image) return "";
  const src = `${repoRoot()}/${String(t.image).replace(/^\/+/, "")}`;
  return `<img class="learn-pic" src="${escapeHtml(src)}" alt="">`;
}

function renderLearn(doSpeak) {
  if (!learn?.cur) return;
  const meta = Algo.MODE_META[learn.mode];
  const wins = Algo.bucket(winsState, learn.mode);
  const rem = Algo.remaining(terms, wins).length;
  const streak = wins[learn.cur.id] || 0;
  const pct = Algo.factoryProgress(terms, winsState);
  const t = learn.cur;

  let body = `
    <div class="learn-hud themed-panel">
      <span class="learn-mode-badge">Part ${learn.mode}</span>
      <strong>${escapeHtml(meta.ko)}</strong>
      <span class="hint">${escapeHtml(meta.hint)}</span>
      <p class="learn-prog">${pct}% factory · ${rem} words left in part · streak ${streak}/${Algo.NEED}</p>
    </div>
    <div class="learn-card themed-panel" id="learn-card">
      ${picHtml(t)}
      <div id="learn-prompt"></div>
      <div id="learn-input"></div>
      <div id="learn-choices" class="learn-choices"></div>
    </div>`;

  renderShell(body);

  const prompt = document.getElementById("learn-prompt");
  const inputWrap = document.getElementById("learn-input");
  const choices = document.getElementById("learn-choices");

  if (learn.mode === "A") {
    prompt.innerHTML = `<p class="learn-en">${escapeHtml(t.term)}</p>`;
    inputWrap.innerHTML = `<button type="button" class="btn btn-glow-secondary" id="btn-hear">🔊 Hear again</button>`;
    const opts = distractors(t, 3);
    opts.push(t);
    shuffle(opts).forEach((w) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-glow-secondary learn-choice";
      btn.textContent = w.definition;
      btn.addEventListener("click", () => onChoice(w, btn));
      choices.appendChild(btn);
    });
    document.getElementById("btn-hear")?.addEventListener("click", () => {
      void playWordAudio(t.term, t.audio);
    });
    if (doSpeak) void playWordAudio(t.term, t.audio);
  } else if (learn.mode === "B") {
    prompt.innerHTML = `<p class="hint">Listen and type the English word.</p>`;
    inputWrap.innerHTML = `
      <input type="text" class="learn-type" id="learn-type" autocomplete="off" autocapitalize="off" spellcheck="false" />
      <button type="button" class="btn btn-glow" id="btn-check">Check</button>
      <button type="button" class="btn btn-glow-secondary" id="btn-hear">🔊 Hear</button>`;
    choices.innerHTML = "";
    bindTypeHandlers();
    if (doSpeak) void playWordAudio(t.term, t.audio);
  } else {
    prompt.innerHTML = `<p class="learn-ko-prompt">${escapeHtml(t.definition)}</p>`;
    inputWrap.innerHTML = `
      <input type="text" class="learn-type" id="learn-type" autocomplete="off" autocapitalize="off" spellcheck="false" />
      <button type="button" class="btn btn-glow" id="btn-check">Check</button>`;
    choices.innerHTML = "";
    bindTypeHandlers();
  }
  learn.startedAt = Date.now();
}

function bindTypeHandlers() {
  document.getElementById("btn-hear")?.addEventListener("click", () => {
    void playWordAudio(learn.cur.term, learn.cur.audio);
  });
  document.getElementById("btn-check")?.addEventListener("click", () => onCheck());
  document.getElementById("learn-type")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onCheck();
  });
  document.getElementById("learn-type")?.focus();
}

function onChoice(word, btn) {
  if (learn.locking || learn.mode !== "A") return;
  const ok = word.id === learn.cur.id;
  app.querySelectorAll(".learn-choice").forEach((b) => {
    b.disabled = true;
    b.classList.toggle("ok", b === btn && ok);
    b.classList.toggle("bad", b === btn && !ok);
  });
  if (!ok) {
    app.querySelectorAll(".learn-choice").forEach((b) => {
      if (b.textContent === learn.cur.definition) b.classList.add("ok");
    });
  }
  void gradeLearn(ok);
}

function onCheck() {
  if (learn.locking || learn.mode === "A") return;
  const typed = document.getElementById("learn-type")?.value || "";
  if (!typed && !learn.mustCopy) return;
  if (learn.mustCopy) {
    if (norm(typed) !== norm(learn.cur.term)) {
      document.getElementById("learn-card")?.classList.add("shake");
      setTimeout(() => document.getElementById("learn-card")?.classList.remove("shake"), 400);
      return;
    }
    learn.mustCopy = false;
    const nxt = learn.pendingNxt;
    learn.pendingNxt = null;
    learn.typed = "";
    advanceLearn(nxt, false);
    return;
  }
  const ok = norm(typed) === norm(learn.cur.term);
  void gradeLearn(ok, typed);
}

async function gradeLearn(ok, response = "") {
  if (learn.locking) return;
  learn.locking = true;
  const wins = Algo.bucket(winsState, learn.mode);
  const before = wins[learn.cur.id] || 0;
  const cur = learn.cur;

  if (learn.mode === "B" && !ok) {
    wins[cur.id] = 0;
    saveWins(month.id);
    document.getElementById("learn-card")?.classList.add("shake");
    const teach = document.getElementById("learn-prompt");
    if (teach) teach.innerHTML = `<p class="learn-en">${escapeHtml(cur.term)}</p><p class="hint">Spell it like this, then try again.</p>`;
    learn.typed = "";
    learn.locking = false;
    learn.startedAt = Date.now();
    setTimeout(() => document.getElementById("learn-card")?.classList.remove("shake"), 400);
    return;
  }

  if (learn.mode === "C" && !ok) {
    const nxt = Algo.applyGrade(learn.queue, terms, wins, cur, false);
    saveWins(month.id);
    document.getElementById("learn-card")?.classList.add("shake");
    void playWordAudio(cur.term, cur.audio);
    learn.mustCopy = true;
    learn.pendingNxt = nxt;
    learn.typed = "";
    const prompt = document.getElementById("learn-prompt");
    if (prompt) prompt.innerHTML = `<p class="learn-en">${escapeHtml(cur.term)}</p><p class="hint">Type the word exactly to continue.</p>`;
    learn.locking = false;
    return;
  }

  const hitTwo = ok && before + 1 >= Algo.NEED;
  const nxt = Algo.applyGrade(learn.queue, terms, wins, cur, ok);
  saveWins(month.id);
  await advanceLearn(nxt, hitTwo);
}

async function advanceLearn(nxt, hitTwo) {
  if (!nxt || typeof nxt !== "object") {
    const wins = Algo.bucket(winsState, learn.mode);
    nxt = Algo.nextWord([], terms, wins);
    hitTwo = false;
  }
  if (nxt.partDone) {
    const nextMode = Algo.nextMode(learn.mode);
    if (nextMode) {
      beginPart(nextMode);
      return;
    }
    finishLearn();
    return;
  }
  await new Promise((r) => setTimeout(r, hitTwo ? 280 : 200));
  learn.queue = nxt.queue;
  learn.cur = nxt.cur;
  learn.typed = "";
  learn.locking = false;
  learn.mustCopy = false;
  learn.pendingNxt = null;
  renderLearn(true);
}

function beginPart(mode) {
  const wins = Algo.bucket(winsState, mode);
  learn = {
    mode,
    queue: Algo.makeQueue(terms, wins),
    cur: null,
    typed: "",
    locking: false,
    mustCopy: false,
    pendingNxt: null,
    startedAt: Date.now(),
  };
  const nxt = Algo.nextWord(learn.queue, terms, wins);
  learn.queue = nxt.queue;
  learn.cur = nxt.cur || terms[0];
  renderLearn(true);
}

function finishLearn() {
  if (month) {
    setLearnDone(month.id);
    setStepDone(month.id, "learn");
  }
  const memoryHref = month ? wordsMemoryUrl(month.id) : "#";
  renderShell(`
    <div class="words-complete themed-panel">
      <p class="words-complete-lead">Factory complete — all <strong>${terms.length}</strong> words practiced.</p>
      <div class="step-actions">
        <a class="btn btn-glow" href="${escapeHtml(memoryHref)}">Next: Memory →</a>
        <a class="btn btn-glow-secondary" href="${escapeHtml(monthPageUrl(month.slug))}">Back to map</a>
      </div>
    </div>`);
}

async function init() {
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderShell(`<p class="placeholder-box">Open from the October map.</p>`);
    return;
  }
  const loaded = await loadWordsPackForMonth(monthId);
  month = loaded.month;
  terms = loaded.terms;
  if (!month?.wordsPreviewFile || !terms.length) {
    renderShell(`<p class="placeholder-box">Words not ready.</p>`);
    return;
  }
  document.title = `Culture Class — ${month.name} Learn`;
  applyMonthUiTheme(month);
  ensureThemeStylesheet(month);
  winsState = loadWins(month.id);
  const mode = Algo.startMode(terms, winsState);
  if (!mode) {
    finishLearn();
    return;
  }
  beginPart(mode);
}

init().catch(console.error);
