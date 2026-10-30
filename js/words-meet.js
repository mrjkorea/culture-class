import {
  escapeHtml,
  getMonthIdFromQuery,
  loadWordsPackForMonth,
  monthPageUrl,
} from "./words-data.js";
import { playWordAudio } from "./words-audio.js";
import { setStepDone } from "./month-progress.js";
import { repoRoot, wordsLearnUrl } from "./paths.js";
import { applyMonthUiTheme } from "./month-ui-theme.js";
import { ensureThemeStylesheet } from "./month-styles.js";
import { getLang, mountLangSelect, t } from "./i18n.js";
import { termGloss } from "./word-gloss.js";

const app = document.getElementById("app");
let terms = [];
let month = null;
let index = 0;
let cardAdvanceLock = false;

function renderShell(body) {
  const back = month
    ? `<a class="back-link halloween-back" href="${escapeHtml(monthPageUrl(month.slug))}">← ${t("cc_map")}</a>`
    : "";
  app.innerHTML = `
    <div class="wrap words-flow themed-words-flow">
      ${back}
      <header class="themed-words-hero">
        <div class="words-hero-row">
          <h2>${month ? escapeHtml(month.name) + " — " + t("cc_meet_title") : t("cc_meet_title")}</h2>
          <label class="lang-wrap cc-lang-wrap">
            <span class="sr-only">${t("lang_label")}</span>
            <select id="lang-select" aria-label="${escapeHtml(t("lang_label"))}"></select>
          </label>
        </div>
        <p>${t("cc_meet_sub")}</p>
      </header>
      ${body}
      <footer class="site-footer">${t("cc_footer")}</footer>
    </div>`;
  mountLangSelect(document.getElementById("lang-select"), () => renderCard());
}

function renderCard() {
  const term = terms[index];
  const total = terms.length;
  const lang = getLang();
  const gloss = termGloss(term, lang);
  const imgSrc = term.image ? `${repoRoot()}/${term.image.replace(/^\/+/, "")}` : "";
  const img = term.image
    ? `<img class="meet-pic" src="${escapeHtml(imgSrc)}" alt="">`
    : `<div class="meet-pic meet-pic-fallback">${escapeHtml(term.term)}</div>`;
  const glossHtml = gloss
    ? `<span class="meet-gloss">${escapeHtml(gloss)}</span>`
    : `<span class="meet-gloss meet-gloss-empty" aria-hidden="true"></span>`;

  renderShell(`
    <p class="meet-progress">${index + 1} / ${total}</p>
    <button type="button" class="meet-card" id="meetCard" aria-label="${escapeHtml(t("cc_meet_hear"))}: ${escapeHtml(term.term)}">
      ${img}
      <span class="meet-en">${escapeHtml(term.term)}</span>
      ${glossHtml}
      <span class="meet-hear-hint">🔊 ${t("cc_meet_hear")}</span>
    </button>
    <div class="step-actions meet-nav">
      <button type="button" class="btn btn-glow-secondary" id="btnPrev" ${index === 0 ? "disabled" : ""}>${t("cc_meet_prev")}</button>
      <button type="button" class="btn btn-glow" id="btnNext">${index >= total - 1 ? t("cc_meet_finish") : t("cc_meet_next")}</button>
    </div>`);

  document.getElementById("meetCard").addEventListener("click", () => {
    if (cardAdvanceLock) return;
    cardAdvanceLock = true;
    void playWordAudio(term.term, term.audio);
    window.setTimeout(() => {
      cardAdvanceLock = false;
      onNext();
    }, 700);
  });
  document.getElementById("btnPrev").addEventListener("click", () => {
    if (index > 0) {
      index -= 1;
      renderCard();
    }
  });
  document.getElementById("btnNext").addEventListener("click", onNext);
  void playWordAudio(term.term, term.audio);
}

function onNext() {
  if (index < terms.length - 1) {
    index += 1;
    renderCard();
    return;
  }
  finish();
}

function finish() {
  if (month) setStepDone(month.id, "meet");
  const next = month ? wordsLearnUrl(month.id) : "#";
  renderShell(`
    <div class="words-complete themed-panel">
      <p class="words-complete-lead">${t("cc_meet_done", { n: terms.length })}</p>
      <div class="step-actions">
        <a class="btn btn-glow" href="${escapeHtml(next)}">${t("cc_next_learn")}</a>
        <a class="btn btn-glow-secondary" href="${escapeHtml(monthPageUrl(month.slug))}">${t("cc_back_map")}</a>
      </div>
    </div>`);
}

async function init() {
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderShell(`<p class="placeholder-box">Open from your month map (?month=01).</p>`);
    return;
  }
  const loaded = await loadWordsPackForMonth(monthId);
  month = loaded.month;
  terms = loaded.terms;
  if (!month?.wordsPreviewFile || !terms.length) {
    renderShell(`<p class="placeholder-box">Words are not ready for this month yet.</p>`);
    return;
  }
  document.title = `Culture Class — ${month.name} Meet`;
  applyMonthUiTheme(month);
  ensureThemeStylesheet(month);
  index = 0;
  renderCard();
}

init().catch((err) => {
  console.error(err);
  renderShell(`<p class="placeholder-box">Failed to load Meet.</p>`);
});
