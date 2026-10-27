import {
  escapeHtml,
  getMonthIdFromQuery,
  isLearnDone,
  loadWordsPackForMonth,
  monthPageUrl,
  shuffle,
  splitIntoRounds,
  wordsLearnUrl,
} from "./words-data.js";

const PAIRS_PER_ROUND = 6;
const app = document.getElementById("app");

let terms = [];
let month = null;
let roundIndex = 0;
let rounds = [];
let flipped = [];
let matchedIds = new Set();
let lockBoard = false;

function renderShell(title, bodyHtml) {
  const back =
    month
      ? `<a class="back-link" href="${escapeHtml(monthPageUrl(month.slug))}">← ${escapeHtml(month.name)}</a>`
      : `<a class="back-link" href="../">← All months</a>`;
  app.innerHTML = `
    <div class="wrap words-flow">
      ${back}
      <header class="site-header month-hero words-hero">
        <h2>${escapeHtml(title)}</h2>
        <p class="theme-tag words-subtitle">Match English with Korean — all words, fixed rounds</p>
      </header>
      ${bodyHtml}
      <footer class="site-footer">Culture Class · MRJ ENGLISH · No sign-in required (v1)</footer>
    </div>`;
}

function renderEmpty(message) {
  renderShell("Words — Memory", `<p class="placeholder-box">${escapeHtml(message)}</p>`);
}

function renderLocked() {
  const learnHref = wordsLearnUrl(month.id);
  renderShell(
    `${month.name} — Memory locked`,
    `
    <p class="placeholder-box">Finish <strong>Learn</strong> first to unlock Memory. Study every flashcard once on this device.</p>
    <div class="step-actions" style="margin-top:0.75rem">
      <a class="btn btn-primary" href="${escapeHtml(learnHref)}">Go to Learn</a>
      <a class="btn btn-secondary" href="${escapeHtml(monthPageUrl(month.slug))}">Back to month</a>
    </div>`
  );
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

  renderShell(
    `${month.name} — Memory`,
    `
    <p class="hint memory-round-label">${roundLabel}</p>
    <div class="memory-grid" role="grid" aria-label="Memory cards">${grid}</div>
    <p class="hint">Tap two cards to find matching pairs.</p>`
  );

  matchedIds = new Set();
  flipped = [];
  lockBoard = false;

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
    renderAllDone();
  }
}

function renderAllDone() {
  renderShell(
    `${month.name} — Memory complete`,
    `
    <div class="words-complete">
      <p class="words-complete-lead">You matched all <strong>${terms.length}</strong> word pairs. Great work!</p>
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
    renderEmpty("Missing month. Open Memory from a month page (e.g. ?month=08).");
    return;
  }

  const loaded = await loadWordsPackForMonth(monthId);
  month = loaded.month;
  terms = loaded.terms;

  if (!month) {
    renderEmpty("Month not found.");
    return;
  }
  if (!month.wordsPreviewFile) {
    renderEmpty(`Word list for ${month.name} is not ready yet.`);
    return;
  }
  if (!terms.length) {
    renderEmpty(`Could not load words for ${month.name}.`);
    return;
  }

  document.title = `Culture Class — ${month.name} Memory`;

  if (!isLearnDone(monthId)) {
    renderLocked();
    return;
  }

  rounds = splitIntoRounds(terms, PAIRS_PER_ROUND);
  roundIndex = 0;
  renderRound();
}

init().catch((err) => {
  console.error(err);
  renderEmpty("Failed to load Memory. Try again after deployment.");
});
