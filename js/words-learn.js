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
import { getLang, mountLangSelect, t } from "./i18n.js";
import { termGloss } from "./word-gloss.js";

const WINS_KEY_PREFIX = "culture-class-factory-wins-";
const app = document.getElementById("app");

let terms = [];
let month = null;
/** @type {{ winsA: Record<string, number> }} */
let winsState = { winsA: {} };
let learn = null;

function winsKey(monthId) {
  return `${WINS_KEY_PREFIX}${monthId}`;
}

function loadWins(monthId) {
  try {
    const raw = localStorage.getItem(winsKey(monthId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return { winsA: parsed.winsA || {} };
    }
  } catch {
    /* ignore */
  }
  return { winsA: {} };
}

function saveWins(monthId) {
  try {
    localStorage.setItem(winsKey(monthId), JSON.stringify(winsState));
  } catch {
    /* ignore */
  }
}

function renderShell(body) {
  const back = month
    ? `<a class="back-link halloween-back" href="${escapeHtml(monthPageUrl(month.slug))}">← ${t("cc_map")}</a>`
    : "";
  app.innerHTML = `
    <div class="wrap words-flow themed-words-flow learn-factory">
      ${back}
      <header class="themed-words-hero">
        <div class="words-hero-row">
          <h2>${month ? escapeHtml(month.name) + " — " + t("part_a") : t("part_a")}</h2>
          <label class="lang-wrap cc-lang-wrap">
            <span class="sr-only">${t("lang_label")}</span>
            <select id="lang-select" aria-label="${escapeHtml(t("lang_label"))}"></select>
          </label>
        </div>
        <p>${t("cc_learn_sub")}</p>
      </header>
      ${body}
      <footer class="site-footer">${t("cc_footer")}</footer>
    </div>`;
  mountLangSelect(document.getElementById("lang-select"), () => {
    if (learn?.cur) renderLearn(false);
    else if (month) initFlow();
  });
}

function distractors(cur, n) {
  const lang = getLang();
  const others = terms.filter((t) => t.id !== cur.id);
  const labels = [];
  for (const w of shuffle(others)) {
    const g = termGloss(w, lang);
    if (g && !labels.includes(g)) labels.push(g);
    if (labels.length >= n) break;
  }
  return labels;
}

function picHtml(t) {
  if (!t.image) return "";
  const src = `${repoRoot()}/${String(t.image).replace(/^\/+/, "")}`;
  return `<img class="learn-pic" src="${escapeHtml(src)}" alt="">`;
}

function renderLearn(doSpeak) {
  if (!learn?.cur) return;
  const wins = winsState.winsA;
  const rem = Algo.remaining(terms, wins).length;
  const streak = wins[learn.cur.id] || 0;
  const pct = Algo.learnPartProgress(terms, wins);
  const cur = learn.cur;
  const lang = getLang();
  const gloss = termGloss(cur, lang);

  let body = `
    <div class="learn-hud themed-panel">
      <span class="learn-mode-badge">${t("part_a")}</span>
      <strong>${t("two_clean")}</strong>
      <span class="hint">${t("hint_a")}</span>
      <p class="learn-prog">${t("cc_learn_prog", { pct, left: rem, streak })}</p>
    </div>
    <div class="learn-card themed-panel" id="learn-card">
      ${picHtml(cur)}
      <div id="learn-prompt"></div>
      <div id="learn-input"></div>
      <div id="learn-choices" class="learn-choices"></div>
    </div>`;

  renderShell(body);

  const prompt = document.getElementById("learn-prompt");
  const inputWrap = document.getElementById("learn-input");
  const choices = document.getElementById("learn-choices");

  prompt.innerHTML = `<p class="learn-en">${escapeHtml(cur.term)}</p>`;
  inputWrap.innerHTML = `<button type="button" class="btn btn-glow-secondary" id="btn-hear">🔊 ${t("speak_word")}</button>`;

  const opts = distractors(cur, 3);
  if (gloss) opts.push(gloss);
  const choiceWords = [];
  shuffle([...new Set(opts)]).slice(0, 4).forEach((label) => {
    const match = terms.find((w) => termGloss(w, lang) === label);
    if (match) choiceWords.push(match);
  });
  if (!choiceWords.some((w) => w.id === cur.id) && gloss) {
    choiceWords.push(cur);
  }
  shuffle(choiceWords).forEach((w) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-glow-secondary learn-choice";
    btn.textContent = termGloss(w, lang) || w.term;
    btn.addEventListener("click", () => onChoice(w, btn));
    choices.appendChild(btn);
  });

  document.getElementById("btn-hear")?.addEventListener("click", () => {
    void playWordAudio(cur.term, cur.audio);
  });
  if (doSpeak) void playWordAudio(cur.term, cur.audio);
  learn.startedAt = Date.now();
}

function onChoice(word, btn) {
  if (learn.locking) return;
  const ok = word.id === learn.cur.id;
  app.querySelectorAll(".learn-choice").forEach((b) => {
    b.disabled = true;
    b.classList.toggle("ok", b === btn && ok);
    b.classList.toggle("bad", b === btn && !ok);
  });
  if (!ok) {
    const lang = getLang();
    const correctGloss = termGloss(learn.cur, lang);
    app.querySelectorAll(".learn-choice").forEach((b) => {
      if (b.textContent === correctGloss) b.classList.add("ok");
    });
  }
  void gradeLearn(ok);
}

async function gradeLearn(ok) {
  if (learn.locking) return;
  learn.locking = true;
  const wins = winsState.winsA;
  const before = wins[learn.cur.id] || 0;
  const cur = learn.cur;
  const hitTwo = ok && before + 1 >= Algo.NEED;
  const nxt = Algo.applyGrade(learn.queue, terms, wins, cur, ok);
  saveWins(month.id);
  await advanceLearn(nxt, hitTwo);
}

async function advanceLearn(nxt, hitTwo) {
  if (!nxt || typeof nxt !== "object") {
    nxt = Algo.nextWord([], terms, winsState.winsA);
    hitTwo = false;
  }
  if (nxt.partDone) {
    finishLearn();
    return;
  }
  await new Promise((r) => setTimeout(r, hitTwo ? 280 : 200));
  learn.queue = nxt.queue;
  learn.cur = nxt.cur;
  learn.locking = false;
  renderLearn(true);
}

function beginLearn() {
  const wins = winsState.winsA;
  learn = {
    queue: Algo.makeQueue(terms, wins),
    cur: null,
    locking: false,
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
      <p class="words-complete-lead">${t("cc_learn_done")} <strong>${terms.length}</strong></p>
      <div class="step-actions">
        <a class="btn btn-glow" href="${escapeHtml(memoryHref)}">${t("cc_next_memory")}</a>
        <a class="btn btn-glow-secondary" href="${escapeHtml(monthPageUrl(month.slug))}">${t("cc_back_map")}</a>
      </div>
    </div>`);
}

function initFlow() {
  if (Algo.learnPartDone(terms, winsState.winsA)) {
    finishLearn();
    return;
  }
  beginLearn();
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
  document.title = `Culture Class — ${month.name} ${t("part_a")}`;
  applyMonthUiTheme(month);
  ensureThemeStylesheet(month);
  winsState = loadWins(monthId);
  initFlow();
}

init().catch(console.error);
