import {
  bingoUrl,
  climbUrl,
  cpSpeakUrl,
  dailyQuizUrl,
  dataUrl,
  monthPageUrl,
  repoRoot,
  wordsLearnUrl,
  wordsMatchUrl,
  wordsMeetUrl,
  wordsMemoryUrl,
} from "./paths.js";
import { monthHasBuiltinWords } from "./words-data.js";
import { normalizeWordTerms } from "./word-list.js";
import { initFeatureYoutubePlayers } from "./youtube-feature-player.js";
import { renderFeatureVideoHtml, renderIntroVideosHtml } from "./youtube-embed.js";
import { renderOctoberHalloweenMonth } from "./month-page-halloween.js";

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

function stepBlock(num, title, desc, bodyHtml, extraClass = "") {
  return `
    <article class="step ${extraClass}" id="step-${num}">
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

function climbHref(month, unitId) {
  const base = climbUrl(unitId);
  const back = encodeURIComponent(monthPageUrl(month.slug));
  return `${base}${base.includes("?") ? "&" : "?"}back=${back}`;
}

function renderDefaultMonth(month, wordsPreview) {
  const root = repoRoot();
  const climbWords = climbHref(month, month.unitId);
  const climbShow = climbHref(month, month.showUnitId);
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

  const memoryHref = builtinWords
    ? wordsMemoryUrl(month.id)
    : month.wordMasterMatchUrl;
  const matchHint = builtinWords
    ? "Matching game — all words in fixed rounds. Open anytime."
    : month.wordMasterMatchUrl === "#"
      ? "Memory match — wired when the month word list is published."
      : "Memory match / pairing game (same pack as Learn).";
  const matchStepBody = `
    <div class="step-actions">
      <a class="btn btn-primary" href="${escapeHtml(memoryHref)}">Memory</a>
    </div>
    <p class="hint">${matchHint}</p>`;

  const craftHref = month.craftPath
    ? `${root}/${String(month.craftPath).replace(/^\/+/, "")}`
    : "";
  const featureTitle = month.craftPath
    ? month.craftTitle || month.featureTitle || "Craft"
    : month.featureTitle || "Feature show";
  const featureDesc = month.craftPath
    ? month.featureLabel || "Play the class craft"
    : month.featureLabel;
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
      builtinWords ? "Matching game" : "Matching game",
      matchStepBody
    ),
    stepBlock(
      4,
      "Words quiz — Mountain Climb",
      "Solo / class quiz on month vocabulary",
      `<div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(climbWords)}" target="_blank" rel="noopener">Open Mountain Climb</a>
      </div>
      <p class="hint">Unit: <code>${escapeHtml(month.unitId)}</code></p>`
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
      featureDesc,
      month.craftPath
        ? `<div class="step-actions">
            <a class="btn btn-primary" href="${escapeHtml(craftHref)}">${escapeHtml(month.craftButton || "Play craft")}</a>
          </div>
          <p class="hint">${escapeHtml(month.featureDetail || "")}</p>`
        : renderFeatureVideoHtml(month)
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
      "Teacher calls words; students mark cards",
      `<div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(bingoTeacher)}">Teacher — call list</a>
        <a class="btn btn-secondary" href="${escapeHtml(bingoStudent)}">Student — bingo card</a>
      </div>
      <p class="hint">FREE center square · tap words on student cards to hear audio when available.</p>`
    ),
  ];

  if (!month.hideNotes && month.notes) {
    steps.push(
      stepBlock(
        steps.length + 1,
        "Notes",
        "Month overview",
        `<div class="notes-block">${escapeHtml(month.notes)}</div>`
      )
    );
  }

  return { steps, pilotBadge, craftHref, heroCover: "" };
}

function renderHalloweenMonth(month) {
  const root = repoRoot();
  const climbWords = climbHref(month, month.unitId);
  const bingoTeacher = `${bingoUrl("teacher")}?month=${month.id}`;
  const bingoStudent = `${bingoUrl("student")}?month=${month.id}`;
  const craftHref = `${root}/${String(month.craftPath).replace(/^\/+/, "")}`;
  const cover = month.coverImage
    ? `${root}/${month.coverImage.replace(/^\/+/, "")}`
    : "";

  const wordsBody = `
    <div class="step-actions word-master-row">
      <a class="btn btn-primary" href="${escapeHtml(wordsMeetUrl(month.id))}">Meet the words</a>
      <a class="btn btn-primary" href="${escapeHtml(wordsMatchUrl(month.id))}">Match</a>
      <a class="btn btn-primary" href="${escapeHtml(wordsLearnUrl(month.id))}">Learn</a>
    </div>
    <p class="hint">31 Halloween words · Fish Jay TTS · emoji art cards. Do Meet → Match → Learn in any order — all open.</p>`;

  const steps = [
    stepBlock(
      1,
      "MRJ Daily",
      "Halloween culture intro — watch, then take the quiz",
      renderIntroVideosHtml(month),
      "step-daily"
    ),
    stepBlock(
      2,
      "Daily quiz",
      "5 questions after the video",
      `<div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(dailyQuizUrl(month.id))}">Start quiz</a>
      </div>
      <p class="hint">Retake anytime · scores saved on this device · EN/KO explanations after mistakes.</p>`,
      "step-quiz"
    ),
    stepBlock(
      3,
      "Words",
      "Meet → Match → Learn (Word Master order)",
      wordsBody,
      "step-words"
    ),
    stepBlock(
      4,
      "Memory",
      "Timer + mini leaderboard",
      `<div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(wordsMemoryUrl(month.id))}">Play Memory</a>
      </div>
      <p class="hint">Match English &amp; Korean under the clock. Best times saved locally.</p>`,
      "step-memory"
    ),
    stepBlock(
      5,
      "Mountain Climb",
      "Full animation quiz on Halloween vocabulary",
      `<div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(climbWords)}">Open Mountain Climb</a>
      </div>
      <p class="hint">Same climb experience as conversation class — videos, trail, and 🧗 climber.</p>`,
      "step-climb"
    ),
    stepBlock(
      6,
      "CP Speak",
      "Hear → Speak · pass at 60%",
      `<div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(cpSpeakUrl(month.id))}">CP Speak practice</a>
      </div>
      <p class="hint">Day 4 style — Korean cue, English speech, Citrinet scoring.</p>`,
      "step-cp"
    ),
    stepBlock(
      7,
      "Jack-o'-lantern Craft",
      "10-stage pumpkin mini-game",
      `<div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(craftHref)}">${escapeHtml(month.craftButton || "Play craft")}</a>
      </div>
      <p class="hint">${escapeHtml(month.craftBlurb || month.featureDetail || "")}</p>`,
      "step-craft"
    ),
    stepBlock(
      8,
      "Bingo",
      "FREE center · tap to hear words",
      `<div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(bingoTeacher)}">Teacher — call list</a>
        <a class="btn btn-secondary" href="${escapeHtml(bingoStudent)}">Student — bingo card</a>
      </div>
      <p class="hint">Loud, repeatable word audio on every cell. 4×4 card with FREE in the middle.</p>`,
      "step-bingo"
    ),
  ];

  const heroCover = cover
    ? `<div class="month-cover" style="background-image:url('${escapeHtml(cover)}')"></div>`
    : "";

  return {
    steps,
    pilotBadge: "",
    craftHref,
    heroCover,
    halloween: true,
  };
}

function renderMonth(month, wordsPreview) {
  const root = repoRoot();
  const isHalloween = month.monthLayout === "halloween" || month.id === "10";
  const layout = isHalloween
    ? renderHalloweenMonth(month)
    : renderDefaultMonth(month, wordsPreview);

  const { steps, pilotBadge, craftHref, heroCover } = layout;

  if (isHalloween) {
    document.body.classList.add("theme-halloween");
  }

  document.getElementById("app").innerHTML = `
    <div class="wrap ${isHalloween ? "wrap-halloween" : ""}">
      <a class="back-link" href="${root}/">← All months</a>
      ${heroCover || ""}
      <header class="site-header month-hero ${isHalloween ? "month-hero-halloween" : ""}">
        <h2>${escapeHtml(month.name)}</h2>
        <div class="theme-tag">${escapeHtml(month.theme)}</div>
        ${pilotBadge}
      </header>
      ${
        month.craftPath && !isHalloween
          ? `<a class="craft-callout" href="${escapeHtml(craftHref)}">
              <span class="craft-kicker">Play in class</span>
              <strong>${escapeHtml(month.craftTitle || "Craft")}</strong>
              <span>${escapeHtml(month.craftBlurb || "")}</span>
            </a>`
          : ""
      }
      <section class="steps steps-halloween" aria-label="Lesson steps">
        ${steps.join("")}
      </section>
      <footer class="site-footer">Culture Class · MRJ ENGLISH · No sign-in required</footer>
    </div>`;

  document.title = `Culture Class — ${month.name}: ${month.theme}`;
  void initFeatureYoutubePlayers(document.getElementById("app"));
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
  if (month.id === "10") {
    renderOctoberHalloweenMonth(month);
    return;
  }
  renderMonth(month, wordsPreview);
}

init().catch((err) => {
  console.error(err);
  document.getElementById("app").innerHTML =
    '<div class="wrap"><p class="placeholder-box">Failed to load this month. Try again after deployment.</p></div>';
});
