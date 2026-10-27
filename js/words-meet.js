import {
  escapeHtml,
  getMonthIdFromQuery,
  loadWordsPackForMonth,
  monthPageUrl,
} from "./words-data.js";
import { playWordAudio } from "./words-audio.js";
import { setStepDone } from "./month-progress.js";
import { repoRoot, wordsMatchUrl } from "./paths.js";

const app = document.getElementById("app");
let terms = [];
let month = null;
let index = 0;
let seen = new Set();

function renderShell(body) {
  const back = month
    ? `<a class="back-link halloween-back" href="${escapeHtml(monthPageUrl(month.slug))}">← ${escapeHtml(month.name)} map</a>`
    : "";
  app.innerHTML = `
    <div class="wrap words-flow halloween-flow">
      ${back}
      <header class="halloween-hero">
        <h2>${month ? escapeHtml(month.name) + " — Meet the Words" : "Meet"}</h2>
        <p>Tap the picture to hear English. Check each word when you know it.</p>
      </header>
      ${body}
      <footer class="site-footer">Culture Class · Halloween · No sign-in</footer>
    </div>`;
}

function renderCard() {
  const t = terms[index];
  const total = terms.length;
  const checked = seen.has(t.term);
  const imgSrc = t.image ? `${repoRoot()}/${t.image.replace(/^\/+/, "")}` : "";
  const img = t.image
    ? `<img class="meet-pic" src="${escapeHtml(imgSrc)}" alt="">`
    : `<div class="meet-pic meet-pic-fallback">${escapeHtml(t.term)}</div>`;

  renderShell(`
    <p class="meet-progress">${index + 1} / ${total}</p>
    <button type="button" class="meet-card" id="meetCard" aria-label="Hear ${escapeHtml(t.term)}">
      ${img}
      <span class="meet-en">${escapeHtml(t.term)}</span>
      <span class="meet-ko">${escapeHtml(t.definition)}</span>
      <span class="meet-hear-hint">🔊 Tap to hear English</span>
    </button>
    <label class="meet-check">
      <input type="checkbox" id="meetCheck" ${checked ? "checked" : ""}>
      I heard this word
    </label>
    <div class="step-actions meet-nav">
      <button type="button" class="btn btn-glow-secondary" id="btnPrev" ${index === 0 ? "disabled" : ""}>Previous</button>
      <button type="button" class="btn btn-glow" id="btnNext">${index >= total - 1 ? "Finish Meet" : "Next word"}</button>
    </div>`);

  document.getElementById("meetCard").addEventListener("click", () => {
    void playWordAudio(t.term, t.audio);
  });
  document.getElementById("meetCheck").addEventListener("change", (e) => {
    if (e.target.checked) seen.add(t.term);
    else seen.delete(t.term);
  });
  document.getElementById("btnPrev").addEventListener("click", () => {
    if (index > 0) {
      index -= 1;
      renderCard();
    }
  });
  document.getElementById("btnNext").addEventListener("click", onNext);
  void playWordAudio(t.term, t.audio);
}

function onNext() {
  const t = terms[index];
  seen.add(t.term);
  if (index < terms.length - 1) {
    index += 1;
    renderCard();
    return;
  }
  finish();
}

function finish() {
  if (month) setStepDone(month.id, "meet");
  const next = month ? wordsMatchUrl(month.id) : "#";
  renderShell(`
    <div class="words-complete halloween-panel">
      <p class="words-complete-lead">You met all <strong>${terms.length}</strong> Halloween words!</p>
      <div class="step-actions">
        <a class="btn btn-glow" href="${escapeHtml(next)}">Next: Match →</a>
        <a class="btn btn-glow-secondary" href="${escapeHtml(monthPageUrl(month.slug))}">Back to map</a>
      </div>
    </div>`);
}

async function init() {
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderShell(`<p class="placeholder-box">Open from the October map (?month=10).</p>`);
    return;
  }
  const loaded = await loadWordsPackForMonth(monthId);
  month = loaded.month;
  terms = loaded.terms;
  if (!month?.wordsPreviewFile || !terms.length) {
    renderShell(`<p class="placeholder-box">October words are not ready yet.</p>`);
    return;
  }
  document.title = `Culture Class — ${month.name} Meet`;
  document.body.classList.add("halloween-theme");
  index = 0;
  renderCard();
}

init().catch((err) => {
  console.error(err);
  renderShell(`<p class="placeholder-box">Failed to load Meet.</p>`);
});
