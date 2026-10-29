import {
  escapeHtml,
  getMonthIdFromQuery,
  loadWordsPackForMonth,
  monthPageUrl,
  shuffle,
  splitIntoRounds,
} from "./words-data.js";
import { playWordAudio, resolveSrc } from "./words-audio.js";
import { setStepDone } from "./month-progress.js";
import { climbUrl, repoRoot } from "./paths.js";
import { applyMonthUiTheme, memoryLbKey } from "./month-ui-theme.js";
import { getLang, mountLangSelect, studentDisplayName, t } from "./i18n.js";
import { termGloss } from "./word-gloss.js";

const PAIRS_PER_ROUND = 6;
let LB_KEY = "culture-class-memory-lb-10";
const app = document.getElementById("app");

let terms = [];
let month = null;
let roundIndex = 0;
let rounds = [];
let flipped = [];
let matchedIds = new Set();
let lockBoard = false;
let timerStart = 0;
let timerId = null;
let sfx = {};

function loadSfx() {
  const root = repoRoot();
  sfx = {
    flip: new Audio(`${root}/assets/sfx/flip.mp3`),
    match: new Audio(`${root}/assets/sfx/match.mp3`),
    miss: new Audio(`${root}/assets/sfx/miss.mp3`),
  };
}

function playSfx(name) {
  const a = sfx[name];
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(() => {});
}

function renderShell(title, bodyHtml) {
  const back = month
    ? `<a class="back-link halloween-back" href="${escapeHtml(monthPageUrl(month.slug))}">← Map</a>`
    : "";
  app.innerHTML = `
    <div class="wrap words-flow themed-words-flow memory-themed">
      ${back}
      <header class="themed-words-hero">
        <div class="words-hero-row">
          <h2>${escapeHtml(title)}</h2>
          <label class="lang-wrap cc-lang-wrap">
            <span class="sr-only">${t("lang_label")}</span>
            <select id="lang-select" aria-label="${escapeHtml(t("lang_label"))}"></select>
          </label>
        </div>
        <p>${t("cc_memory_sub")}</p>
      </header>
      <p class="memory-timer" id="timer">0:00</p>
      ${bodyHtml}
      <footer class="site-footer">${t("cc_footer")}</footer>
    </div>`;
}

function tickTimer() {
  const el = document.getElementById("timer");
  if (!el || !timerStart) return;
  const sec = Math.floor((Date.now() - timerStart) / 1000);
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, "0");
  el.textContent = `${m}:${s}`;
}

function startTimer() {
  if (timerStart) return;
  timerStart = Date.now();
  timerId = setInterval(tickTimer, 500);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  return timerStart ? Math.floor((Date.now() - timerStart) / 1000) : 0;
}

function loadLb() {
  try {
    return JSON.parse(localStorage.getItem(LB_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLb(seconds) {
  const list = loadLb();
  let name = studentDisplayName();
  if (!name) {
    name = prompt(t("cc_student_lb"), "Student") || "Student";
    try {
      localStorage.setItem("culture-class-display-name", name.slice(0, 24));
    } catch {
      /* ignore */
    }
  }
  list.push({ name: name.slice(0, 24), sec, at: Date.now() });
  list.sort((a, b) => a.sec - b.sec);
  localStorage.setItem(LB_KEY, JSON.stringify(list.slice(0, 8)));
}

function lbHtml() {
  const list = loadLb();
  if (!list.length) return "";
  const rows = list
    .map((r, i) => `<li>${i + 1}. ${escapeHtml(r.name)} — ${r.sec}s</li>`)
    .join("");
  return `<div class="memory-lb themed-panel"><strong>Fastest on this device</strong><ol>${rows}</ol></div>`;
}

function termForPair(key) {
  return terms.find((t) => t.term === key);
}

function buildCardsForRound(roundTerms) {
  const lang = getLang();
  const cards = [];
  for (const term of roundTerms) {
    const img = term.image ? resolveSrc(term.image) : "";
    const gloss = termGloss(term, lang);
    cards.push({
      id: `${term.term}::pic`,
      pairKey: term.term,
      kind: "pic",
      img,
      label: term.term,
    });
    cards.push({
      id: `${term.term}::mean`,
      pairKey: term.term,
      kind: "mean",
      label: gloss || term.term,
    });
  }
  return shuffle(cards);
}

function renderRound() {
  const roundTerms = rounds[roundIndex];
  const cards = buildCardsForRound(roundTerms);
  const totalRounds = rounds.length;
  const roundLabel = `Round ${roundIndex + 1} of ${totalRounds}`;

  const grid = cards
    .map((c) => {
      const matched = matchedIds.has(c.pairKey);
      const classes = ["memory-card", matched ? "memory-matched" : "", c.kind === "pic" ? "memory-pic-card" : "memory-mean-card"];
      const inner =
        c.kind === "pic" && c.img
          ? `<img class="memory-pic-inner" src="${escapeHtml(c.img)}" alt="">`
          : `<span class="memory-card-inner">${escapeHtml(c.label)}</span>`;
      return `<button type="button" class="${classes.join(" ")}" data-pair="${escapeHtml(c.pairKey)}" data-kind="${c.kind}" ${matched ? "disabled" : ""}>${inner}</button>`;
    })
    .join("");

  renderShell(
    `${month.name} — Memory`,
    `
    <p class="hint memory-round-label">${roundLabel}</p>
    <div class="memory-grid memory-all-down" role="grid">${grid}</div>
    ${lbHtml()}`
  );

  mountLangSelect(document.getElementById("lang-select"), () => renderRound());

  matchedIds = new Set();
  flipped = [];
  lockBoard = false;
  startTimer();

  app.querySelectorAll(".memory-card:not(.memory-matched)").forEach((btn) => {
    btn.addEventListener("click", () => onCardClick(btn));
  });
}

function onCardClick(btn) {
  if (lockBoard || btn.disabled || btn.classList.contains("memory-flipped")) return;
  playSfx("flip");
  btn.classList.add("memory-flipped");
  const pairKey = btn.dataset.pair;
  const term = termForPair(pairKey);
  if (term && btn.dataset.kind === "pic") void playWordAudio(term.term, term.audio);
  flipped.push({ btn, pairKey, kind: btn.dataset.kind });

  if (flipped.length < 2) return;

  lockBoard = true;
  const [a, b] = flipped;
  if (a.pairKey === b.pairKey && a.kind !== b.kind) {
    playSfx("match");
    const t = termForPair(a.pairKey);
    if (t) void playWordAudio(t.term, t.audio);
    a.btn.classList.add("memory-matched");
    b.btn.classList.add("memory-matched");
    a.btn.disabled = true;
    b.btn.disabled = true;
    matchedIds.add(a.pairKey);
    flipped = [];
    lockBoard = false;
    if (matchedIds.size === rounds[roundIndex].length) {
      setTimeout(() => onRoundComplete(), 500);
    }
  } else {
    playSfx("miss");
    setTimeout(() => {
      a.btn.classList.remove("memory-flipped");
      b.btn.classList.remove("memory-flipped");
      flipped = [];
      lockBoard = false;
    }, 800);
  }
}

function onRoundComplete() {
  if (roundIndex < rounds.length - 1) {
    roundIndex += 1;
    renderRound();
  } else {
    renderAllDone();
  }
}

function renderAllDone() {
  const sec = stopTimer();
  if (month) setStepDone(month.id, "memory");
  saveLb(sec);
  const climb = month ? climbUrl(month.unitId) : "#";
  renderShell(
    `${month.name} — Memory complete`,
    `
    <div class="words-complete themed-panel">
      <p class="words-complete-lead">You matched all <strong>${terms.length}</strong> words in <strong>${sec}s</strong>!</p>
      <div class="step-actions">
        <a class="btn btn-glow" href="${escapeHtml(climb)}">Next: Mountain Climb →</a>
        <a class="btn btn-glow-secondary" href="${escapeHtml(monthPageUrl(month.slug))}">Back to map</a>
      </div>
    </div>
    ${lbHtml()}`
  );
}

async function init() {
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderShell("Memory", `<p class="placeholder-box">Open Memory from your month map.</p>`);
    return;
  }
  const loaded = await loadWordsPackForMonth(monthId);
  month = loaded.month;
  terms = loaded.terms;
  if (!month?.wordsPreviewFile || !terms.length) {
    renderShell("Memory", `<p class="placeholder-box">Words not ready.</p>`);
    return;
  }
  document.title = `Culture Class — ${month.name} Memory`;
  applyMonthUiTheme(month);
  LB_KEY = memoryLbKey(month.id);
  loadSfx();
  rounds = splitIntoRounds(terms, PAIRS_PER_ROUND);
  roundIndex = 0;
  renderRound();
}

init().catch(console.error);
