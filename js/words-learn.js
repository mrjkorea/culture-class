import { wordArtHtml } from "./word-art.js";
import { playWordAudio } from "./word-audio.js";
import {
  escapeHtml,
  getMonthIdFromQuery,
  loadWordsPackForMonth,
  monthPageUrl,
  setLearnDone,
  wordsMemoryUrl,
} from "./words-data.js";
import { normalizeWordEntries } from "./word-list.js";

const app = document.getElementById("app");
let index = 0;
let entries = [];
let month = null;

function renderShell(title, bodyHtml) {
  const back =
    month
      ? `<a class="back-link" href="${escapeHtml(monthPageUrl(month.slug))}">← ${escapeHtml(month.name)}</a>`
      : `<a class="back-link" href="../">← All months</a>`;
  const theme = month?.id === "10" ? "theme-halloween" : "";
  if (month?.id === "10") document.body.classList.add("theme-halloween");
  app.innerHTML = `
    <div class="wrap words-flow ${theme}">
      ${back}
      <header class="site-header month-hero words-hero">
        <h2>${escapeHtml(title)}</h2>
        <p class="theme-tag words-subtitle">Learn every word in order — tap 🔊 anytime</p>
      </header>
      ${bodyHtml}
      <footer class="site-footer">Culture Class · MRJ ENGLISH</footer>
    </div>`;
}

function renderEmpty(message) {
  renderShell("Words — Learn", `<p class="placeholder-box">${escapeHtml(message)}</p>`);
}

function renderCard() {
  const total = entries.length;
  const t = entries[index];
  const isLast = index >= total - 1;
  const progress = `${index + 1} / ${total}`;

  renderShell(
    month ? `${month.name} — Learn` : "Words — Learn",
    `
    <div class="flashcard" role="region" aria-label="Flashcard">
      <p class="flashcard-progress">${progress}</p>
      ${wordArtHtml(t.term, "word-art flash-art")}
      <div class="flashcard-face">
        <p class="flashcard-en">${escapeHtml(t.term)}</p>
        <p class="flashcard-ko">${escapeHtml(t.definition)}</p>
      </div>
      <div class="flashcard-actions">
        <button type="button" class="btn btn-secondary" id="btn-sound">🔊 Hear</button>
        <button type="button" class="btn btn-secondary" id="btn-prev" ${index === 0 ? "disabled" : ""}>Previous</button>
        <button type="button" class="btn btn-primary" id="btn-next">${isLast ? "Finish Learn" : "Next"}</button>
      </div>
    </div>`
  );

  document.getElementById("btn-sound")?.addEventListener("click", () => playWordAudio(t, { volume: 1 }));
  void playWordAudio(t, { volume: 1 });

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
      <p class="words-complete-lead">You studied all <strong>${entries.length}</strong> words. Try Memory next!</p>
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
    renderEmpty("Missing month. Open Learn from a month page (e.g. ?month=10).");
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
    renderEmpty(
      `Word list for ${month.name} is not ready yet. Check back later or ask your teacher.`
    );
    return;
  }
  if (!entries.length) {
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
