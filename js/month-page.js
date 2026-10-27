import { bingoUrl, climbUrl, cpSpeakUrl, dataUrl, repoRoot, wordsLearnUrl, wordsMemoryUrl } from "./paths.js";
import { isLearnDone, monthHasBuiltinWords } from "./words-data.js";
import { normalizeWordTerms } from "./word-list.js";
import { renderFeatureVideoHtml, renderIntroVideosHtml } from "./youtube-embed.js";

const MONTH_ID = window.CULTURE_MONTH_ID;

async function loadMonths() {
  const res = await fetch(dataUrl("months.json"));
  if (!res.ok) throw new Error("Could not load months.json");
  return res.json();
}

async function loadWordsPreview(filename) {
  const res = await fetch(dataUrl(filename));
  if (!res.ok) return null;
  return res.json();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stepBlock(num, title, desc, bodyHtml) {
  return `
    <article class="step" id="step-${num}">
      <div class="step-header">
        <div class="step-num">${num}</div>
        <div>
          <h3 class="step-title">${title}</h3>
          <p class="step-desc">${desc}</p>
        </div>
      </div>
      <div class="step-body">${bodyHtml}</div>
    </article>`;
}

function renderMonth(month, wordsPreview) {
  const root = repoRoot();
  const climbWords = climbUrl(month.unitId);
  const climbShow = climbUrl(month.showUnitId);
  const bingoTeacher = `${bingoUrl("teacher")}?month=${month.id}`;
  const bingoStudent = `${bingoUrl("student")}?month=${month.id}`;

  const pilotBadge =
    month.id === "08"
      ? '<span class="pilot">Pilot month — words preview &amp; full CP link</span>'
      : "";

  const builtinWords = monthHasBuiltinWords(month);
  const learnHref = builtinWords
    ? wordsLearnUrl(month.id)
    : month.wordMasterLearnUrl;

  let learnStepBody = `
    <div class="step-actions">
      <a class="btn btn-primary" href="${escapeHtml(learnHref)}">Learn</a>
    </div>`;

  if (wordsPreview?.source) {
    const wordsStatus = builtinWords
      ? " · Built-in Learn &amp; Memory on this site."
      : month.wordMasterLearnUrl === "#"
        ? " · Word pack coming."
        : " · Open Learn / Memory below.";
    learnStepBody += `
      <p class="hint" style="margin-top:0.65rem">${escapeHtml(wordsPreview.source)}${wordsStatus}</p>`;
  }

  const previewTerms = normalizeWordTerms(wordsPreview);
  if (previewTerms.length) {
    const rows = previewTerms
      .map(
        (t) =>
          `<tr><td>${escapeHtml(t.term)}</td><td>${escapeHtml(t.definition)}</td></tr>`
      )
      .join("");
    learnStepBody += `
      <div class="words-preview">
        <p class="hint">${escapeHtml(wordsPreview.note || "")}</p>
        <table>
          <thead><tr><th>Term</th><th>Definition</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  } else if (!builtinWords && month.wordMasterLearnUrl === "#") {
    learnStepBody += `<p class="hint">Word pack coming soon — link placeholder until the month word list exists.</p>`;
  }

  const memoryUnlocked = builtinWords ? isLearnDone(month.id) : month.wordMasterMatchUrl !== "#";
  const memoryHref = builtinWords
    ? wordsMemoryUrl(month.id)
    : month.wordMasterMatchUrl;
  const memoryBtnClass = memoryUnlocked ? "btn btn-primary" : "btn btn-primary disabled";
  const memoryAria = memoryUnlocked ? "" : ' aria-disabled="true" tabindex="-1"';
  const matchHint = builtinWords
    ? memoryUnlocked
      ? "Matching game — all words in fixed rounds (finish Learn once on this device to unlock)."
      : "Finish Learn on this device first to unlock Memory."
    : month.wordMasterMatchUrl === "#"
      ? "Memory match — wired when the month word list is published."
      : "Memory match / pairing game (same pack as Learn).";
  const matchStepBody = `
    <div class="step-actions">
      <a class="${memoryBtnClass}" href="${escapeHtml(memoryHref)}"${memoryAria}>Memory</a>
      ${builtinWords && !memoryUnlocked ? `<a class="btn btn-secondary" href="${escapeHtml(wordsLearnUrl(month.id))}">Go to Learn</a>` : ""}
    </div>
    <p class="hint">${matchHint}</p>`;

  const featureTitle = month.featureTitle || "Feature show";
  const cpSpeak = Boolean(month.cpPackFile);
  const cpStepBody = cpSpeak
    ? `<div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(cpSpeakUrl(month.id))}">CP Speak practice</a>
      </div>
      <p class="hint">Korean cue → Hear English → Speak into the mic. All sentences in order; pass at 60%.</p>`
    : `<div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(month.cpDocUrl)}" target="_blank" rel="noopener">Open CP TEST Doc</a>
      </div>
      <p class="hint">Printable EN sentences with Korean gloss and grade bands — same shape as conversation-day CP practice.</p>`;

  const steps = [
    stepBlock(
      1,
      "MRJ Daily",
      "Class introduction video(s) from @mrjenglishnews",
      renderIntroVideosHtml(month)
    ),
    stepBlock(
      2,
      "Words — Learn",
      builtinWords ? "Flashcards — all words in order" : "Flashcards",
      learnStepBody
    ),
    stepBlock(
      3,
      "Words — Memory",
      builtinWords ? "Matching game — unlock after Learn" : "Matching game",
      matchStepBody
    ),
    stepBlock(
      4,
      "Words quiz — Mountain Climb",
      "Solo / class quiz on month vocabulary",
      `<div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(climbWords)}" target="_blank" rel="noopener">Open Mountain Climb</a>
      </div>
      <p class="hint">Unit: <code>${escapeHtml(month.unitId)}</code> (quiz data may be added on the climb server later).</p>`
    ),
    stepBlock(
      5,
      "PRO COMP — CP TEST",
      cpSpeak ? "Pronunciation speak practice (Day 4 style)" : "Pronunciation &amp; comprehension sentences (Google Doc)",
      cpStepBody
    ),
    stepBlock(
      6,
      featureTitle,
      month.featureLabel,
      renderFeatureVideoHtml(month)
    ),
    stepBlock(
      7,
      "Feature quiz — Mountain Climb",
      "Questions about the feature video",
      `<div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(climbShow)}" target="_blank" rel="noopener">Open feature quiz</a>
      </div>
      <p class="hint">Unit: <code>${escapeHtml(month.showUnitId)}</code></p>`
    ),
    stepBlock(
      8,
      "Bingo",
      "Teacher calls words; students mark cards (v0 offline)",
      `<div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(bingoTeacher)}">Teacher — call list</a>
        <a class="btn btn-secondary" href="${escapeHtml(bingoStudent)}">Student — bingo card</a>
      </div>
      <p class="hint">v0: no login or Firebase yet — teacher projects the call list; students use local cards on their devices.</p>`
    ),
    stepBlock(
      9,
      "Notes",
      "Month overview",
      `<div class="notes-block">${escapeHtml(month.notes)}</div>`
    ),
  ];

  document.getElementById("app").innerHTML = `
    <div class="wrap">
      <a class="back-link" href="${root}/">← All months</a>
      <header class="site-header month-hero">
        <h2>${escapeHtml(month.name)}</h2>
        <div class="theme-tag">${escapeHtml(month.theme)}</div>
        ${pilotBadge}
      </header>
      <section class="steps" aria-label="Lesson steps">
        ${steps.join("")}
      </section>
      <footer class="site-footer">Culture Class · MRJ ENGLISH · No sign-in required (v1)</footer>
    </div>`;

  document.title = `Culture Class — ${month.name}: ${month.theme}`;
}

async function init() {
  const data = await loadMonths();
  const month = data.months.find((m) => m.id === MONTH_ID);
  if (!month) {
    document.getElementById("app").innerHTML =
      '<div class="wrap"><p class="placeholder-box">Month not found.</p></div>';
    return;
  }
  let wordsPreview = null;
  if (month.wordsPreviewFile) {
    wordsPreview = await loadWordsPreview(month.wordsPreviewFile);
  }
  renderMonth(month, wordsPreview);
}

init().catch((err) => {
  console.error(err);
  document.getElementById("app").innerHTML =
    '<div class="wrap"><p class="placeholder-box">Failed to load this month. Try again after deployment.</p></div>';
});
