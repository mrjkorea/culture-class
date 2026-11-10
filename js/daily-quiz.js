import { dataUrl, monthPageUrl, repoRoot, wordsMeetUrl } from "./paths.js";
import { escapeHtml, getMonthIdFromQuery, loadMonthById } from "./words-data.js";
import { setStepDone } from "./month-progress.js";
import { blockIfActivityLocked } from "./path-lock.js";
import { getLang, mountLangSelect, pickLocalized, t } from "./i18n.js";
import { resolveSrc } from "./words-audio.js";
import { applyMonthUiTheme } from "./month-ui-theme.js";
import { ensureThemeStylesheet } from "./month-styles.js";

const SCORE_KEY_PREFIX = "culture-class-daily-quiz-";
let quizManifest = null;

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

/** e.g. nov-daily-quiz.json → nov-quiz/MANIFEST.json (no fallback to other months). */
function quizManifestRel(month) {
  const file = month?.dailyQuizFile;
  if (!file || !/-daily-quiz\.json$/i.test(file)) return null;
  return file.replace(/-daily-quiz\.json$/i, "-quiz/MANIFEST.json");
}

async function loadQuizManifest(month) {
  quizManifest = null;
  const rel = quizManifestRel(month);
  if (!rel) return;
  try {
    const res = await fetch(dataUrl(rel));
    if (res.ok) quizManifest = await res.json();
  } catch {
    quizManifest = null;
  }
}

const app = document.getElementById("app");
let quiz = null;
let month = null;
let qIndex = 0;
let answers = [];
let sfx = {};
let quizAudio = null;

function loadSfx() {
  const root = repoRoot();
  sfx = {
    ok: new Audio(`${root}/assets/sfx/match.mp3`),
    bad: new Audio(`${root}/assets/sfx/miss.mp3`),
  };
}

function playSfx(name) {
  const a = sfx[name];
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(() => {});
}

function quizClipKey(q, index, part = "stem") {
  const qid = q.qid || (typeof q.id === "string" && /^q\d+$/i.test(q.id) ? q.id : null) || `q${index + 1}`;
  return `${qid}_${part}`;
}

function playQuizClip(key) {
  const rel = quizManifest?.clips?.[key];
  if (!rel) return;
  const src = resolveSrc(rel);
  if (!src) return;
  if (quizAudio) {
    quizAudio.pause();
    quizAudio = null;
  }
  quizAudio = new Audio(src);
  quizAudio.play().catch(() => {});
}

function renderShell(body) {
  const back = month
    ? `<a class="back-link" href="${escapeHtml(monthPageUrl(month.slug))}">← ${escapeHtml(month.name)}</a>`
    : `<a class="back-link" href="${repoRoot()}/">← All months</a>`;
  app.innerHTML = `
    <div class="wrap words-flow themed-words-flow quiz-flow">
      ${back}
      <header class="site-header month-hero words-hero themed-words-hero">
        <div class="words-hero-row">
          <h2>${month ? escapeHtml(month.name) + " — Daily Quiz" : "Daily Quiz"}</h2>
          <label class="lang-wrap cc-lang-wrap">
            <span class="sr-only">${t("lang_label")}</span>
            <select id="lang-select" aria-label="${escapeHtml(t("lang_label"))}"></select>
          </label>
        </div>
        <p class="theme-tag words-subtitle">${t("cc_quiz_sub")}</p>
      </header>
      ${body}
      <footer class="site-footer">${t("cc_footer")}</footer>
    </div>`;
  mountLangSelect(document.getElementById("lang-select"), () => {
    if (qIndex < quiz.questions.length && answers.length <= qIndex) renderQuestion();
    else if (answers.length === quiz.questions.length) renderResults();
  });
}

function choiceLabel(c) {
  return pickLocalized(c);
}

function questionText(q) {
  return pickLocalized(q);
}

function renderQuestion() {
  const q = quiz.questions[qIndex];
  const total = quiz.questions.length;
  const lang = getLang();
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
    <div class="quiz-card themed-panel">
      <p class="flashcard-progress">${t("cc_quiz_question", { n: qIndex + 1, total })}</p>
      <p class="quiz-prompt">${escapeHtml(questionText(q))}</p>
      <div class="quiz-choices">${choices}</div>
      ${histHtml}
    </div>`);

  playQuizClip(quizClipKey(q, qIndex, "stem"));

  app.querySelectorAll(".quiz-choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.i);
      const pick = q.choices[i];
      const ok = !!pick?.correct;
      playSfx(ok ? "ok" : "bad");
      app.querySelectorAll(".quiz-choice").forEach((b) => {
        b.disabled = true;
        b.classList.toggle("quiz-choice-ok", b === btn && ok);
        b.classList.toggle("quiz-choice-bad", b === btn && !ok);
      });
      answers[qIndex] = i;
      window.setTimeout(() => {
        qIndex += 1;
        if (qIndex < total) renderQuestion();
        else renderResults();
      }, ok ? 450 : 700);
    });
  });
}

function renderResults() {
  const total = quiz.questions.length;
  let score = 0;
  const mistakes = [];
  const lang = getLang();
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
  if (window.CC_SCORES) {
    window.CC_SCORES.record("quiz", {
      scoreValue: score,
      scoreMax: total,
      metadata: { perfect: perfect, questions: total },
    });
  }

  const mistakeHtml = mistakes.length
    ? `<div class="quiz-mistakes">
        <h3>${t("cc_quiz_review")}</h3>
        ${mistakes
          .map((m) => {
            const correct = m.q.choices.find((c) => c.correct);
            const ex = m.q.explain;
            const exText = pickLocalized(ex || {}, lang);
            return `<article class="quiz-mistake">
              <p><strong>${escapeHtml(questionText(m.q))}</strong></p>
              <p class="hint">${t("cc_quiz_your")} ${escapeHtml(choiceLabel(m.pick || { en: "—" }))}</p>
              <p class="quiz-correct">${t("cc_quiz_correct")} ${escapeHtml(choiceLabel(correct))}</p>
              ${exText ? `<p class="quiz-explain">${escapeHtml(exText)}</p>` : ""}
            </article>`;
          })
          .join("")}
      </div>`
    : `<p class="words-complete-lead">${t("cc_quiz_perfect")}</p>`;

  renderShell(`
    <div class="quiz-results themed-panel">
      <p class="quiz-score">${score} / ${total}</p>
      ${mistakeHtml}
      <div class="step-actions" style="margin-top:1rem">
        <a class="btn btn-primary" href="${escapeHtml(wordsMeetUrl(month.id))}">${t("cc_next_meet")}</a>
        <button type="button" class="btn btn-secondary" id="btn-retake">${t("cc_quiz_retake")}</button>
        <a class="btn btn-secondary" href="${escapeHtml(monthPageUrl(month.slug))}">${t("cc_back_map")}</a>
      </div>
    </div>`);

  document.getElementById("btn-retake")?.addEventListener("click", () => {
    qIndex = 0;
    answers = [];
    renderQuestion();
  });
}

async function init() {
  loadSfx();
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderShell(`<p class="placeholder-box">Missing month. Open from a month map.</p>`);
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
  if (blockIfActivityLocked(app, month, "quiz")) return;
  await loadQuizManifest(month);
  applyMonthUiTheme(month);
  ensureThemeStylesheet(month);
  document.title = `Culture Class — ${month.name} Daily Quiz`;
  qIndex = 0;
  answers = [];
  renderQuestion();
}

init().catch((err) => {
  console.error(err);
  renderShell(`<p class="placeholder-box">Failed to load quiz.</p>`);
});
