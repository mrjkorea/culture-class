import {
  escapeHtml,
  getMonthIdFromQuery,
  loadWordsPackForMonth,
  monthPageUrl,
  shuffle,
  splitIntoRounds,
  wordsLearnUrl,
} from "./words-data.js";
import { normalizeWordEntries } from "./word-list.js";

const PAIRS_PER_ROUND = 6;
const LB_KEY_PREFIX = "culture-class-memory-lb-";
const app = document.getElementById("app");

let entries = [];
let month = null;
let roundIndex = 0;
let rounds = [];
let flipped = [];
let matchedIds = new Set();
let lockBoard = false;
let timerStart = 0;
let timerId = null;
let elapsedMs = 0;

function lbKey() {
  return `${LB_KEY_PREFIX}${month?.id || "00"}`;
}

function loadLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(lbKey()) || "[]");
  } catch {
    return [];
  }
}

function saveScore(ms) {
  const list = loadLeaderboard();
  const entry = { ms, when: new Date().toLocaleString() };
  list.push(entry);
  list.sort((a, b) => a.ms - b.ms);
  try {
    localStorage.setItem(lbKey(), JSON.stringify(list.slice(0, 10)));
  } catch {
    /* ignore */
  }
}

function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}

function renderShell(title, bodyHtml) {
  const back =
    month
      ? `<a class="back-link" href="${escapeHtml(monthPageUrl(month.slug))}">← ${escapeHtml(month.name)}</a>`
      : `<a class="back-link" href="../">← All months</a>`;
  if (month?.id === "10") document.body.classList.add("theme-halloween");
  app.innerHTML = `
    <div class="wrap words-flow ${month?.id === "10" ? "theme-halloween" : ""}">
      ${back}
      <header class="site-header month-hero words-hero">
        <h2>${escapeHtml(title)}</h2>
        <p class="theme-tag words-subtitle">Match English with Korean — timer on</p>
      </header>
      ${bodyHtml}
      <footer class="site-footer">Culture Class · MRJ ENGLISH</footer>
    </div>`;
}

function renderEmpty(message) {
  renderShell("Words — Memory", `<p class="placeholder-box">${escapeHtml(message)}</p>`);
}

function startTimer() {
  timerStart = Date.now();
  timerId = setInterval(() => {
    const el = document.getElementById("mem-timer");
    if (el) el.textContent = formatMs(Date.now() - timerStart);
  }, 250);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
  elapsedMs = Date.now() - timerStart;
}

function buildCardsForRound(roundTerms) {
  const cards = [];
  for (const t of roundTerms) {
    cards.push({
      id: t.term,
      pairKey: t.term,
      label: t.term,
      lang: "en",
    });
    cards.push({
      id: `${t.term}::ko`,
      pairKey: t.term,
      label: t.definition,
      lang: "ko",
    });
  }
  return shuffle(cards);
}

function renderRound() {
  const roundTerms = rounds[roundIndex];
  const cards = buildCardsForRound(roundTerms);
  const totalRounds = rounds.length;
  const roundLabel = `Round ${roundIndex + 1} of ${totalRounds} · ${roundTerms.length} pairs`;

  const grid = cards
    .map((c) => {
      const matched = matchedIds.has(c.pairKey);
      const classes = ["memory-card", `memory-${c.lang}`];
      if (matched) classes.push("memory-matched");
      return `<button type="button" class="${classes.join(" ")}" data-pair="${escapeHtml(c.pairKey)}" data-card-id="${escapeHtml(c.id)}" ${matched ? "disabled" : ""} aria-label="Card">
        <span class="memory-card-inner">${escapeHtml(c.label)}</span>
      </button>`;
    })
    .join("");

  const lb = loadLeaderboard();
  const lbHtml = lb.length
    ? `<ol class="memory-lb">${lb
        .slice(0, 5)
        .map((e, i) => `<li>#${i + 1} ${formatMs(e.ms)} <span class="hint">${escapeHtml(e.when)}</span></li>`)
        .join("")}</ol>`
    : `<p class="hint">No times yet — finish all rounds to post a score.</p>`;

  renderShell(
    `${month.name} — Memory`,
    `
    <div class="memory-timer-row">
      <span>⏱ <strong id="mem-timer">0s</strong></span>
    </div>
    <p class="hint memory-round-label">${roundLabel}</p>
    <div class="memory-grid" role="grid" aria-label="Memory cards">${grid}</div>
    <p class="hint">Tap two cards to find matching pairs.</p>
    <aside class="memory-lb-wrap"><h3 class="memory-lb-title">Best times (this device)</h3>${lbHtml}</aside>`
  );

  matchedIds = new Set();
  flipped = [];
  lockBoard = false;
  if (roundIndex === 0 && !timerId) startTimer();

  app.querySelectorAll(".memory-card:not(.memory-matched)").forEach((btn) => {
    btn.addEventListener("click", () => onCardClick(btn));
  });
}

function onCardClick(btn) {
  if (lockBoard || btn.disabled || btn.classList.contains("memory-flipped")) return;

  btn.classList.add("memory-flipped");
  const pairKey = btn.dataset.pair;
  flipped.push({ btn, pairKey });

  if (flipped.length < 2) return;

  lockBoard = true;
  const [a, b] = flipped;
  if (a.pairKey === b.pairKey && a.btn !== b.btn) {
    a.btn.classList.add("memory-matched");
    b.btn.classList.add("memory-matched");
    a.btn.disabled = true;
    b.btn.disabled = true;
    matchedIds.add(a.pairKey);
    flipped = [];
    lockBoard = false;
    if (matchedIds.size === rounds[roundIndex].length) {
      setTimeout(() => onRoundComplete(), 400);
    }
  } else {
    setTimeout(() => {
      a.btn.classList.remove("memory-flipped");
      b.btn.classList.remove("memory-flipped");
      flipped = [];
      lockBoard = false;
    }, 700);
  }
}

function onRoundComplete() {
  if (roundIndex < rounds.length - 1) {
    roundIndex += 1;
    renderRound();
  } else {
    stopTimer();
    saveScore(elapsedMs);
    renderAllDone();
  }
}

function renderAllDone() {
  const lb = loadLeaderboard();
  renderShell(
    `${month.name} — Memory complete`,
    `
    <div class="words-complete">
      <p class="words-complete-lead">You matched all <strong>${entries.length}</strong> word pairs in <strong>${formatMs(elapsedMs)}</strong>!</p>
      ${
        lb.length
          ? `<p class="hint">Personal best: <strong>${formatMs(lb[0].ms)}</strong></p>`
          : ""
      }
      <div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(wordsLearnUrl(month.id))}">Review Learn</a>
        <a class="btn btn-secondary" href="${escapeHtml(monthPageUrl(month.slug))}">Back to month</a>
      </div>
    </div>`
  );
}

async function init() {
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderEmpty("Missing month. Open Memory from a month page (e.g. ?month=10).");
    return;
  }

  const loaded = await loadWordsPackForMonth(monthId);
  month = loaded.month;
  entries = normalizeWordEntries(loaded.pack);

  if (!month) {
    renderEmpty("Month not found.");
    return;
  }
  if (!month.wordsPreviewFile) {
    renderEmpty(`Word list for ${month.name} is not ready yet.`);
    return;
  }
  if (!entries.length) {
    renderEmpty(`Could not load words for ${month.name}.`);
    return;
  }

  document.title = `Culture Class — ${month.name} Memory`;

  rounds = splitIntoRounds(
    entries.map((e) => ({ term: e.term, definition: e.definition })),
    PAIRS_PER_ROUND
  );
  roundIndex = 0;
  renderRound();
}

init().catch((err) => {
  console.error(err);
  renderEmpty("Failed to load Memory. Try again after deployment.");
});
