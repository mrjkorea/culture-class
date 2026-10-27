import {
  escapeHtml,
  getMonthIdFromQuery,
  loadWordsPackForMonth,
  monthPageUrl,
  setLearnDone,
  wordsMemoryUrl,
} from "./words-data.js";

const app = document.getElementById("app");
let index = 0;
let terms = [];
let month = null;

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
        <p class="theme-tag words-subtitle">Learn every word in order — no settings</p>
      </header>
      ${bodyHtml}
      <footer class="site-footer">Culture Class · MRJ ENGLISH · No sign-in required (v1)</footer>
    </div>`;
}

function renderEmpty(message) {
  renderShell("Words — Learn", `<p class="placeholder-box">${escapeHtml(message)}</p>`);
}

function renderCard() {
  const total = terms.length;
  const t = terms[index];
  const isLast = index >= total - 1;
  const progress = `${index + 1} / ${total}`;

  renderShell(
    month ? `${month.name} — Learn` : "Words — Learn",
    `
    <div class="flashcard" role="region" aria-label="Flashcard">
      <p class="flashcard-progress">${progress}</p>
      <div class="flashcard-face">
        <p class="flashcard-en">${escapeHtml(t.term)}</p>
        <p class="flashcard-ko">${escapeHtml(t.definition)}</p>
      </div>
      <div class="flashcard-actions">
        <button type="button" class="btn btn-secondary" id="btn-prev" ${index === 0 ? "disabled" : ""}>Previous</button>
        <button type="button" class="btn btn-primary" id="btn-next">${isLast ? "Finish Learn" : "Next"}</button>
      </div>
    </div>`
  );

  document.getElementById("btn-prev")?.addEventListener("click", () => {
    if (index > 0) {
      index -= 1;
      renderCard();
    }
  });
  document.getElementById("btn-next")?.addEventListener("click", () => {
    if (isLast) {
      finishLearn();
    } else {
      index += 1;
      renderCard();
    }
  });
}

function finishLearn() {
  if (month) setLearnDone(month.id);
  const memoryHref = month ? wordsMemoryUrl(month.id) : "#";
  renderShell(
    month ? `${month.name} — Learn complete` : "Learn complete",
    `
    <div class="words-complete">
      <p class="words-complete-lead">You studied all <strong>${terms.length}</strong> words. Memory is unlocked.</p>
      <div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(memoryHref)}">Play Memory</a>
        <a class="btn btn-secondary" href="${escapeHtml(monthPageUrl(month.slug))}">Back to month</a>
      </div>
    </div>`
  );
}

async function init() {
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderEmpty("Missing month. Open Learn from a month page (e.g. ?month=08).");
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
    renderEmpty(
      `Word list for ${month.name} is not ready yet. Check back later or ask your teacher.`
    );
    return;
  }
  if (!terms.length) {
    renderEmpty(
      `Could not load words for ${month.name}. The word file may be missing on the server.`
    );
    return;
  }

  document.title = `Culture Class — ${month.name} Learn`;
  index = 0;
  renderCard();
}

init().catch((err) => {
  console.error(err);
  renderEmpty("Failed to load Learn. Try again after deployment.");
});
