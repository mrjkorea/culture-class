import { wordArtHtml } from "./word-art.js";
import { playWordAudio } from "./word-audio.js";
import {
  escapeHtml,
  getMonthIdFromQuery,
  loadWordsPackForMonth,
  monthPageUrl,
  wordsMatchUrl,
} from "./words-data.js";
import { normalizeWordEntries } from "./word-list.js";

const app = document.getElementById("app");
let month = null;
let entries = [];

function renderShell(body) {
  const back = month
    ? `<a class="back-link" href="${escapeHtml(monthPageUrl(month.slug))}">← ${escapeHtml(month.name)}</a>`
    : "";
  app.innerHTML = `
    <div class="wrap words-flow theme-halloween">
      ${back}
      <header class="site-header month-hero words-hero">
        <h2>${month ? escapeHtml(month.name) + " — Meet the words" : "Meet the words"}</h2>
        <p class="theme-tag words-subtitle">Tap a card to hear English · pictures + sound</p>
      </header>
      ${body}
      <footer class="site-footer">Culture Class · MRJ ENGLISH</footer>
    </div>`;
}

async function init() {
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderShell(`<p class="placeholder-box">Open from the month page.</p>`);
    return;
  }
  const loaded = await loadWordsPackForMonth(monthId);
  month = loaded.month;
  entries = normalizeWordEntries(loaded.pack);
  if (!entries.length) {
    renderShell(`<p class="placeholder-box">Words not ready for this month.</p>`);
    return;
  }
  document.title = `Culture Class — ${month.name} Meet`;
  const grid = entries
    .map(
      (e) => `
      <button type="button" class="meet-card" data-id="${escapeHtml(e.id)}">
        ${wordArtHtml(e.term)}
        <span class="meet-en">${escapeHtml(e.term)}</span>
        <span class="meet-ko">${escapeHtml(e.definition)}</span>
      </button>`
    )
    .join("");
  renderShell(`
    <div class="meet-grid">${grid}</div>
    <div class="step-actions" style="margin-top:1rem;justify-content:center">
      <a class="btn btn-primary" href="${escapeHtml(wordsMatchUrl(month.id))}">Next: Match →</a>
    </div>`);
  app.querySelectorAll(".meet-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const entry = entries.find((x) => x.id === id);
      if (entry) void playWordAudio(entry, { volume: 1 });
      btn.classList.add("meet-heard");
      setTimeout(() => btn.classList.remove("meet-heard"), 400);
    });
  });
}

init().catch(console.error);
