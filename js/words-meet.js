/** Keep in sync with SITE_LINK_V when busting Meet ES modules. */
const MEET_V = "20261030-meet-failopen";

import {
  escapeHtml,
  getMonthIdFromQuery,
  loadWordsPackForMonth,
  monthPageUrl,
} from "./words-data.js?v=20261030-meet-failopen";
import { playWordAudio } from "./words-audio.js?v=20261030-meet-failopen";
import { setStepDone } from "./month-progress.js?v=20261030-meet-failopen";
import { repoRoot, wordsLearnUrl } from "./paths.js?v=20261030-meet-failopen";
import { applyMonthUiTheme } from "./month-ui-theme.js?v=20261030-meet-failopen";
import { ensureThemeStylesheet } from "./month-styles.js?v=20261030-meet-failopen";
import { getLang, mountLangSelect, t } from "./i18n.js?v=20261030-meet-failopen";
import { termGloss } from "./word-gloss.js?v=20261030-meet-failopen";

/** Pause after audio ends so students hear the word before the next card. */
const MEET_ADVANCE_MS = 600;
const DEFAULT_MONTH_ID = "10";
const PACK_LOAD_MS = 8000;

const app = document.getElementById("app");
let terms = [];
let month = null;
let index = 0;
let advancing = false;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("pack-load-timeout")), ms)
    ),
  ]);
}

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
    ? `<img class="meet-pic meet-pic-view" src="${escapeHtml(imgSrc)}" alt="" draggable="false">`
    : `<div class="meet-pic meet-pic-fallback meet-pic-view" aria-hidden="true">${escapeHtml(term.term)}</div>`;
  const glossHtml = gloss
    ? `<span class="meet-gloss">${escapeHtml(gloss)}</span>`
    : `<span class="meet-gloss meet-gloss-empty" aria-hidden="true"></span>`;

  renderShell(`
    <p class="meet-progress">${index + 1} / ${total}</p>
    <div class="meet-card" id="meetCard">
      ${img}
      <button type="button" class="meet-en meet-en-btn" id="meetWordBtn" aria-label="${escapeHtml(t("cc_meet_hear"))}: ${escapeHtml(term.term)}">${escapeHtml(term.term)}</button>
      ${glossHtml}
    </div>`);

  document.getElementById("meetWordBtn").addEventListener("click", () => {
    void onWordClick(term);
  });
}

async function onWordClick(term) {
  if (advancing) return;
  advancing = true;
  const btn = document.getElementById("meetWordBtn");
  if (btn) btn.disabled = true;
  try {
    await playWordAudio(term, term.audio);
    await new Promise((r) => setTimeout(r, MEET_ADVANCE_MS));
    if (index < terms.length - 1) {
      index += 1;
      advancing = false;
      renderCard();
      return;
    }
    finish();
  } finally {
    advancing = false;
  }
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
  const monthId = getMonthIdFromQuery() || DEFAULT_MONTH_ID;
  renderShell(`<p class="placeholder-box">Loading words…</p>`);
  let loaded;
  try {
    loaded = await withTimeout(loadWordsPackForMonth(monthId), PACK_LOAD_MS);
  } catch {
    renderShell(
      `<p class="placeholder-box">Words are taking too long to load. <a href="${escapeHtml(monthPageUrl("10-october"))}">Back to map</a> and try again.</p>`
    );
    return;
  }
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
  advancing = false;
  renderCard();
}

init().catch((err) => {
  console.error(err);
  renderShell(`<p class="placeholder-box">Failed to load Meet.</p>`);
});
