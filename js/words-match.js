import {
  escapeHtml,
  getMonthIdFromQuery,
  loadWordsPackForMonth,
  monthPageUrl,
  shuffle,
} from "./words-data.js";
import { playWordAudio } from "./words-audio.js";
import { setStepDone } from "./month-progress.js";
import { repoRoot, wordsLearnUrl } from "./paths.js";

const app = document.getElementById("app");
let terms = [];
let month = null;
let index = 0;
let right = 0;

function renderShell(body) {
  const back = month
    ? `<a class="back-link halloween-back" href="${escapeHtml(monthPageUrl(month.slug))}">← Map</a>`
    : "";
  app.innerHTML = `
    <div class="wrap words-flow halloween-flow">
      ${back}
      <header class="halloween-hero">
        <h2>${month ? escapeHtml(month.name) + " — Match" : "Match"}</h2>
        <p>Pick the English word that matches the picture.</p>
      </header>
      ${body}
      <footer class="site-footer">Culture Class · Halloween</footer>
    </div>`;
}

function choicesFor(term) {
  const others = terms.filter((t) => t.term !== term.term).map((t) => t.term);
  const opts = shuffle(others).slice(0, 3);
  opts.push(term.term);
  return shuffle(opts);
}

function renderQuestion() {
  const term = terms[index];
  const choices = choicesFor(term);
  const imgSrc = term.image ? `${repoRoot()}/${term.image.replace(/^\/+/, "")}` : "";
  const pic = term.image
    ? `<img class="match-pic" src="${escapeHtml(imgSrc)}" alt="">`
    : `<div class="match-pic match-pic-fallback">${escapeHtml(term.term)}</div>`;

  renderShell(`
    <p class="meet-progress">Question ${index + 1} / ${terms.length} · ⭐ ${right}</p>
    <div class="match-stage">${pic}</div>
    <p class="hint match-ko">${escapeHtml(term.definition)}</p>
    <div class="match-choices" id="choices">
      ${choices
        .map(
          (c) =>
            `<button type="button" class="btn btn-glow-secondary match-choice" data-a="${escapeHtml(c)}">${escapeHtml(c)}</button>`
        )
        .join("")}
    </div>
    <p class="match-feedback" id="feedback" hidden></p>
    <button type="button" class="btn btn-glow" id="btnNext" hidden>Next</button>`);

  document.querySelector(".match-pic")?.addEventListener("click", () => {
    void playWordAudio(term.term, term.audio);
  });
  void playWordAudio(term.term, term.audio);

  document.getElementById("choices").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-a]");
    if (!btn || btn.disabled) return;
    const ok = btn.dataset.a === term.term;
    document.querySelectorAll(".match-choice").forEach((b) => {
      b.disabled = true;
      if (b.dataset.a === term.term) b.classList.add("ok");
      if (b === btn && !ok) b.classList.add("bad");
    });
    const fb = document.getElementById("feedback");
    fb.hidden = false;
    fb.textContent = ok ? "🎉 Correct!" : `Try to remember: ${term.term}`;
    if (ok) right += 1;
    document.getElementById("btnNext").hidden = false;
  });
  document.getElementById("btnNext").addEventListener("click", () => {
    index += 1;
    if (index >= terms.length) finish();
    else renderQuestion();
  });
}

function finish() {
  if (month) setStepDone(month.id, "match");
  const next = month ? wordsLearnUrl(month.id) : "#";
  renderShell(`
    <div class="words-complete halloween-panel">
      <p class="words-complete-lead">Match complete — <strong>${right}</strong> / ${terms.length} correct.</p>
      <div class="step-actions">
        <a class="btn btn-glow" href="${escapeHtml(next)}">Next: Learn →</a>
        <a class="btn btn-glow-secondary" href="${escapeHtml(monthPageUrl(month.slug))}">Back to map</a>
      </div>
    </div>`);
}

async function init() {
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderShell(`<p class="placeholder-box">Open from the October map.</p>`);
    return;
  }
  const loaded = await loadWordsPackForMonth(monthId);
  month = loaded.month;
  terms = shuffle(loaded.terms);
  if (!month?.wordsPreviewFile || !terms.length) {
    renderShell(`<p class="placeholder-box">Words not ready.</p>`);
    return;
  }
  document.title = `Culture Class — ${month.name} Match`;
  document.body.classList.add("halloween-theme");
  index = 0;
  right = 0;
  renderQuestion();
}

init().catch(console.error);
