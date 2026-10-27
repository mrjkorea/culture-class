import {
  escapeHtml,
  getMonthIdFromQuery,
  loadWordsPackForMonth,
  monthPageUrl,
  setLearnDone,
  wordsMemoryUrl,
} from "./words-data.js";
import { playWordAudio } from "./words-audio.js";
import { setStepDone } from "./month-progress.js";
import { repoRoot } from "./paths.js";

const app = document.getElementById("app");
let index = 0;
let terms = [];
let month = null;

function renderShell(title, bodyHtml) {
  const back = month
    ? `<a class="back-link halloween-back" href="${escapeHtml(monthPageUrl(month.slug))}">← Map</a>`
    : "";
  app.innerHTML = `
    <div class="wrap words-flow halloween-flow">
      ${back}
      <header class="halloween-hero">
        <h2>${escapeHtml(title)}</h2>
        <p>Flashcards — tap 🔊 to hear English.</p>
      </header>
      ${bodyHtml}
      <footer class="site-footer">Culture Class · Learn</footer>
    </div>`;
}

function renderCard() {
  const total = terms.length;
  const t = terms[index];
  const isLast = index >= total - 1;
  const pic = t.image
    ? `<img class="meet-pic" src="${escapeHtml(`${repoRoot()}/${t.image.replace(/^\/+/, "")}`)}" alt="">`
    : "";

  renderShell(
    month ? `${month.name} — Learn` : "Learn",
    `
    <p class="meet-progress">${index + 1} / ${total}</p>
    <div class="flashcard halloween-panel">
      ${pic}
      <div class="flashcard-face">
        <p class="flashcard-en">${escapeHtml(t.term)}</p>
        <p class="flashcard-ko">${escapeHtml(t.definition)}</p>
      </div>
      <div class="flashcard-actions">
        <button type="button" class="btn btn-glow-secondary" id="btn-hear">🔊 Hear</button>
        <button type="button" class="btn btn-glow-secondary" id="btn-prev" ${index === 0 ? "disabled" : ""}>Previous</button>
        <button type="button" class="btn btn-glow" id="btn-next">${isLast ? "Finish Learn" : "Next"}</button>
      </div>
    </div>`
  );

  document.getElementById("btn-hear")?.addEventListener("click", () => {
    void playWordAudio(t.term, t.audio);
  });
  document.getElementById("btn-prev")?.addEventListener("click", () => {
    if (index > 0) {
      index -= 1;
      renderCard();
    }
  });
  document.getElementById("btn-next")?.addEventListener("click", () => {
    if (isLast) finishLearn();
    else {
      index += 1;
      renderCard();
    }
  });
  void playWordAudio(t.term, t.audio);
}

function finishLearn() {
  if (month) {
    setLearnDone(month.id);
    setStepDone(month.id, "learn");
  }
  const memoryHref = month ? wordsMemoryUrl(month.id) : "#";
  renderShell(
    month ? `${month.name} — Learn complete` : "Learn complete",
    `
    <div class="words-complete halloween-panel">
      <p class="words-complete-lead">You studied all <strong>${terms.length}</strong> words.</p>
      <div class="step-actions">
        <a class="btn btn-glow" href="${escapeHtml(memoryHref)}">Next: Memory →</a>
        <a class="btn btn-glow-secondary" href="${escapeHtml(monthPageUrl(month.slug))}">Back to map</a>
      </div>
    </div>`
  );
}

async function init() {
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderShell("Learn", `<p class="placeholder-box">Open from the October map.</p>`);
    return;
  }
  const loaded = await loadWordsPackForMonth(monthId);
  month = loaded.month;
  terms = loaded.terms;
  if (!month?.wordsPreviewFile || !terms.length) {
    renderShell("Learn", `<p class="placeholder-box">Words not ready.</p>`);
    return;
  }
  document.title = `Culture Class — ${month.name} Learn`;
  document.body.classList.add("halloween-theme");
  index = 0;
  renderCard();
}

init().catch(console.error);
