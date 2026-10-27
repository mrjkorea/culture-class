import { wordArtHtml } from "./word-art.js";
import { playWordAudio } from "./word-audio.js";
import {
  escapeHtml,
  getMonthIdFromQuery,
  loadWordsPackForMonth,
  monthPageUrl,
  shuffle,
  wordsLearnUrl,
} from "./words-data.js";
import { normalizeWordEntries } from "./word-list.js";

const app = document.getElementById("app");
let month = null;
let entries = [];
let index = 0;
let score = 0;

function renderShell(body) {
  const back = month
    ? `<a class="back-link" href="${escapeHtml(monthPageUrl(month.slug))}">← ${escapeHtml(month.name)}</a>`
    : "";
  app.innerHTML = `
    <div class="wrap words-flow theme-halloween">
      ${back}
      <header class="site-header month-hero words-hero">
        <h2>${month ? escapeHtml(month.name) + " — Match" : "Match"}</h2>
        <p class="theme-tag words-subtitle">Pick the Korean meaning</p>
      </header>
      ${body}
      <footer class="site-footer">Culture Class · MRJ ENGLISH</footer>
    </div>`;
}

function renderRound() {
  const e = entries[index];
  const others = shuffle(entries.filter((x) => x.id !== e.id)).slice(0, 3);
  const options = shuffle([e, ...others]);
  const opts = options
    .map(
      (o) =>
        `<button type="button" class="match-opt" data-id="${escapeHtml(o.id)}">${escapeHtml(o.definition)}</button>`
    )
    .join("");

  renderShell(`
    <div class="match-card">
      <p class="flashcard-progress">${index + 1} / ${entries.length} · score ${score}</p>
      ${wordArtHtml(e.term, "word-art match-art")}
      <p class="match-prompt">${escapeHtml(e.term)}</p>
      <button type="button" class="btn btn-secondary snd-btn" id="btn-hear">🔊 Hear again</button>
      <div class="match-options">${opts}</div>
    </div>`);

  document.getElementById("btn-hear")?.addEventListener("click", () => playWordAudio(e, { volume: 1 }));
  void playWordAudio(e, { volume: 1 });

  app.querySelectorAll(".match-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ok = btn.dataset.id === e.id;
      if (ok) {
        score += 1;
        btn.classList.add("ok");
      } else {
        btn.classList.add("no");
        app.querySelector(`.match-opt[data-id="${CSS.escape(e.id)}"]`)?.classList.add("ok");
      }
      setTimeout(() => {
        index += 1;
        if (index < entries.length) renderRound();
        else renderDone();
      }, ok ? 450 : 900);
    });
  });
}

function renderDone() {
  renderShell(`
    <div class="words-complete">
      <p class="words-complete-lead">Match round done — <strong>${score}</strong> / ${entries.length} correct.</p>
      <div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(wordsLearnUrl(month.id))}">Next: Learn →</a>
        <a class="btn btn-secondary" href="${escapeHtml(monthPageUrl(month.slug))}">Back to month</a>
      </div>
    </div>`);
}

async function init() {
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderShell(`<p class="placeholder-box">Open from the month page.</p>`);
    return;
  }
  const loaded = await loadWordsPackForMonth(monthId);
  month = loaded.month;
  entries = shuffle(normalizeWordEntries(loaded.pack));
  if (!entries.length) {
    renderShell(`<p class="placeholder-box">Words not ready.</p>`);
    return;
  }
  document.title = `Culture Class — ${month.name} Match`;
  index = 0;
  score = 0;
  renderRound();
}

init().catch(console.error);
