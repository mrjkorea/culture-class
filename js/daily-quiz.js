import { dataUrl, monthPageUrl, repoRoot, wordsMeetUrl } from "./paths.js";
import { escapeHtml, getMonthIdFromQuery, loadMonthById } from "./words-data.js";
import { setStepDone } from "./month-progress.js";

const SCORE_KEY_PREFIX = "culture-class-daily-quiz-";

function scoreKey(monthId) {
  return `${SCORE_KEY_PREFIX}${monthId}`;
}

function loadHistory(monthId) {
  try {
    const raw = localStorage.getItem(scoreKey(monthId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAttempt(monthId, attempt) {
  const hist = loadHistory(monthId);
  hist.unshift(attempt);
  try {
    localStorage.setItem(scoreKey(monthId), JSON.stringify(hist.slice(0, 20)));
  } catch {
    /* ignore */
  }
}

async function loadQuiz(month) {
  const file = month.dailyQuizFile;
  if (!file) return null;
  const res = await fetch(dataUrl(file));
  if (!res.ok) return null;
  return res.json();
}

const app = document.getElementById("app");
let quiz = null;
let month = null;
let qIndex = 0;
let answers = [];
let lang = "en";

function renderShell(body) {
  const back = month
    ? `<a class="back-link" href="${escapeHtml(monthPageUrl(month.slug))}">← ${escapeHtml(month.name)}</a>`
    : `<a class="back-link" href="${repoRoot()}/">← All months</a>`;
  app.innerHTML = `
    <div class="wrap words-flow theme-halloween">
      ${back}
      <header class="site-header month-hero words-hero">
        <h2>${month ? escapeHtml(month.name) + " — Daily Quiz" : "Daily Quiz"}</h2>
        <p class="theme-tag words-subtitle">5 questions after the MRJ Daily video</p>
      </header>
      ${body}
      <footer class="site-footer">Culture Class · MRJ ENGLISH</footer>
    </div>`;
}

function choiceLabel(c) {
  return lang === "ko" && c.ko ? c.ko : c.en;
}

function questionText(q) {
  return lang === "ko" && q.ko ? q.ko : q.en;
}

function renderQuestion() {
  const q = quiz.questions[qIndex];
  const total = quiz.questions.length;
  const choices = q.choices
    .map((c, i) => {
      const label = escapeHtml(choiceLabel(c));
      return `<button type="button" class="quiz-choice" data-i="${i}">${label}</button>`;
    })
    .join("");

  const hist = loadHistory(month.id);
  const histHtml = hist.length
    ? `<details class="quiz-history"><summary>Score history (${hist.length})</summary><ul>${hist
        .map(
          (h) =>
            `<li>${escapeHtml(h.when)} — <strong>${h.score}/${h.total}</strong>${h.perfect ? " ★" : ""}</li>`
        )
        .join("")}</ul></details>`
    : "";

  renderShell(`
    <div class="quiz-card">
      <p class="flashcard-progress">Question ${qIndex + 1} / ${total}</p>
      <p class="quiz-prompt">${escapeHtml(questionText(q))}</p>
      <div class="quiz-choices">${choices}</div>
      ${histHtml}
    </div>`);

  app.querySelectorAll(".quiz-choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.i);
      answers[qIndex] = i;
      qIndex += 1;
      if (qIndex < total) renderQuestion();
      else renderResults();
    });
  });
}

function renderResults() {
  const total = quiz.questions.length;
  let score = 0;
  const mistakes = [];
  quiz.questions.forEach((q, i) => {
    const pick = q.choices[answers[i]];
    const ok = pick?.correct;
    if (ok) score += 1;
    else mistakes.push({ q, pick, i });
  });
  const perfect = score === total;
  const when = new Date().toLocaleString();
  saveAttempt(month.id, { score, total, perfect, when });
  setStepDone(month.id, "quiz");

  const toggle =
    !perfect && quiz.languageToggleIfNotPerfect
      ? `<div class="quiz-lang-toggle">
          <button type="button" class="btn btn-secondary ${lang === "en" ? "on" : ""}" data-lang="en">English</button>
          <button type="button" class="btn btn-secondary ${lang === "ko" ? "on" : ""}" data-lang="ko">한국어</button>
        </div>`
      : "";

  const mistakeHtml = mistakes.length
    ? `<div class="quiz-mistakes">
        <h3>Review mistakes</h3>
        ${mistakes
          .map((m) => {
            const correct = m.q.choices.find((c) => c.correct);
            const ex = m.q.explain;
            const exText =
              lang === "ko" && ex?.ko ? ex.ko : ex?.en || "";
            return `<article class="quiz-mistake">
              <p><strong>${escapeHtml(questionText(m.q))}</strong></p>
              <p class="hint">Your answer: ${escapeHtml(choiceLabel(m.pick || { en: "—" }))}</p>
              <p class="quiz-correct">Correct: ${escapeHtml(choiceLabel(correct))}</p>
              ${exText ? `<p class="quiz-explain">${escapeHtml(exText)}</p>` : ""}
            </article>`;
          })
          .join("")}
      </div>`
    : `<p class="words-complete-lead">Perfect score! 🎃</p>`;

  renderShell(`
    <div class="quiz-results">
      <p class="quiz-score">${score} / ${total}</p>
      ${toggle}
      ${mistakeHtml}
      <div class="step-actions" style="margin-top:1rem">
        <a class="btn btn-primary" href="${escapeHtml(wordsMeetUrl(month.id))}">Next: Meet the words →</a>
        <button type="button" class="btn btn-secondary" id="btn-retake">Retake quiz</button>
        <a class="btn btn-secondary" href="${escapeHtml(monthPageUrl(month.slug))}">Back to map</a>
      </div>
    </div>`);

  app.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      lang = btn.dataset.lang;
      renderResults();
    });
  });
  document.getElementById("btn-retake")?.addEventListener("click", () => {
    qIndex = 0;
    answers = [];
    lang = "en";
    renderQuestion();
  });
}

async function init() {
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderShell(`<p class="placeholder-box">Missing month. Open from the October page.</p>`);
    return;
  }
  month = await loadMonthById(monthId);
  if (!month?.dailyQuizFile) {
    renderShell(`<p class="placeholder-box">No daily quiz for this month yet.</p>`);
    return;
  }
  quiz = await loadQuiz(month);
  if (!quiz?.questions?.length) {
    renderShell(`<p class="placeholder-box">Quiz file missing on server.</p>`);
    return;
  }
  document.title = `Culture Class — ${month.name} Daily Quiz`;
  qIndex = 0;
  answers = [];
  renderQuestion();
}

init().catch((err) => {
  console.error(err);
  renderShell(`<p class="placeholder-box">Failed to load quiz.</p>`);
});
