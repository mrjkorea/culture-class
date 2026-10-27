import {
  bingoUrl,
  climbUrl,
  cpSpeakUrl,
  dailyQuizUrl,
  monthPageUrl,
  repoRoot,
  wordsLearnUrl,
  wordsMeetUrl,
  wordsMemoryUrl,
} from "./paths.js";
import { initFeatureYoutubePlayers } from "./youtube-feature-player.js";
import {
  firstIncompleteStep,
  isStepDone,
  nextStepAfter,
  OCTOBER_STEPS,
  setStepDone,
} from "./month-progress.js";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stepHref(month, step) {
  const root = repoRoot();
  switch (step.id) {
    case "video":
      return `${monthPageUrl(month.slug)}#video`;
    case "quiz":
      return dailyQuizUrl(month.id);
    case "meet":
      return wordsMeetUrl(month.id);
    case "learn":
      return wordsLearnUrl(month.id);
    case "memory":
      return wordsMemoryUrl(month.id);
    case "climb":
      return climbUrl(month.unitId);
    case "cp":
      return cpSpeakUrl(month.id);
    case "craft":
      return `${root}/${month.craftPath}`;
    case "bingo":
      return `${bingoUrl("student")}?month=${month.id}`;
    default:
      return monthPageUrl(month.slug);
  }
}

function renderVideoBlock(month) {
  const v = month.introYoutube?.[0];
  if (!v?.id) {
    return `<p class="hint">Watch the MRJ Daily in class, then tap Next.</p>`;
  }
  return `
    <div class="map-video" id="video">
      <div class="video-embed">
        <iframe src="https://www.youtube.com/embed/${escapeHtml(v.id)}?rel=0" title="${escapeHtml(v.title || "Daily video")}" allowfullscreen></iframe>
      </div>
      <p class="hint">${escapeHtml(v.title || "")}</p>
      <button type="button" class="btn btn-glow" id="btnVideoDone">I watched — Next</button>
    </div>`;
}

export function renderOctoberHalloweenMonth(month) {
  const root = repoRoot();
  const mapBg = `${root}/assets/covers/10-halloween-map.jpg`;
  const current = firstIncompleteStep(month.id);
  const nextAfterCurrent = nextStepAfter(month.id, current.id);

  const nodes = OCTOBER_STEPS
    .map((step) => {
      const done = isStepDone(month.id, step.id);
      const isCurrent = step.id === current.id;
      const classes = ["map-node", done ? "done" : "", isCurrent ? "current" : ""]
        .filter(Boolean)
        .join(" ");
      return `
        <a class="${classes}" style="left:${step.x}%;top:${step.y}%;" href="${escapeHtml(stepHref(month, step))}" data-step="${step.id}">
          <span class="map-node-emoji">${step.emoji}</span>
          <span class="map-node-label">${escapeHtml(step.short)}</span>
          ${done ? '<span class="map-node-check">✓</span>' : ""}
        </a>`;
    })
    .join("");

  const nextBtn =
    nextAfterCurrent && isStepDone(month.id, current.id)
      ? `<a class="map-next-banner btn btn-glow" href="${escapeHtml(stepHref(month, nextAfterCurrent))}">Next: ${escapeHtml(nextAfterCurrent.label)} →</a>`
      : !isStepDone(month.id, current.id)
        ? `<a class="map-next-banner btn btn-glow" href="${escapeHtml(stepHref(month, current))}">Start: ${escapeHtml(current.label)} →</a>`
        : "";

  document.getElementById("app").innerHTML = `
    <div class="halloween-map-page">
      <a class="back-link map-back" href="${root}/">← All months</a>
      <header class="map-title">
        <h1>${escapeHtml(month.name)}</h1>
        <p>${escapeHtml(month.theme)} adventure map</p>
      </header>
      <div class="map-canvas" style="background-image:url('${mapBg}')">
        <svg class="map-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M10,92 C18,84 24,80 22,78 C28,74 34,86 38,88 C46,80 52,74 58,68 C64,62 70,56 76,50 C82,44 86,38 88,34 C84,28 78,22 72,18 C62,14 52,11 48,10 C38,12 28,14 22,18" fill="none" stroke="rgba(255,220,120,0.55)" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        ${nodes}
      </div>
      ${nextBtn}
      <section class="map-video-panel halloween-panel">
        <h2>Step 1 · MRJ Daily</h2>
        ${renderVideoBlock(month)}
      </section>
      <footer class="site-footer map-footer">Culture Class · October · All steps open for practice</footer>
    </div>`;

  document.title = `Culture Class — ${month.name}: ${month.theme}`;
  document.body.classList.add("halloween-theme");

  document.getElementById("btnVideoDone")?.addEventListener("click", () => {
    setStepDone(month.id, "video");
    window.location.href = dailyQuizUrl(month.id);
  });

  void initFeatureYoutubePlayers(document.getElementById("app"));
}
