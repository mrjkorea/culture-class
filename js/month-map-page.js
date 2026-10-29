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
  setStepDone,
} from "./month-progress.js";
import { getMonthTheme, themedMapSteps } from "./month-themes.js";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import { withLinkVersion } from "./site-version.js";

function stepHref(month, step) {
  const root = repoRoot();
  let href;
  switch (step.id) {
    case "video":
      href = `${monthPageUrl(month.slug)}#video`;
      break;
    case "quiz":
      href = dailyQuizUrl(month.id);
      break;
    case "meet":
      href = wordsMeetUrl(month.id);
      break;
    case "learn":
      href = wordsLearnUrl(month.id);
      break;
    case "memory":
      href = wordsMemoryUrl(month.id);
      break;
    case "climb":
      href = climbUrl(month.unitId);
      break;
    case "cp":
      href = cpSpeakUrl(month.id);
      break;
    case "craft":
      if (!month.craftPath) href = monthPageUrl(month.slug);
      else href = `${root}/${String(month.craftPath).replace(/^\/+/, "")}`;
      break;
    case "bingo":
      href = `${bingoUrl("student")}?month=${month.id}`;
      break;
    default:
      href = monthPageUrl(month.slug);
  }
  return withLinkVersion(href);
}

function renderVideoBlock(month) {
  const v = month.introYoutube?.find((item) => item.id) || month.introYoutube?.[0];
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

/**
 * Adventure map month page (October parity).
 */
export function renderThemedMapMonth(month) {
  const theme = getMonthTheme(month);
  if (!theme) throw new Error("renderThemedMapMonth: missing theme");

  const root = repoRoot();
  const mapBg = withLinkVersion(`${root}/${theme.mapImage.replace(/^\/+/, "")}`);
  const steps = themedMapSteps(month, theme).filter(
    (step) => step.id !== "craft" || month.craftPath
  );
  const current = firstIncompleteStep(month.id, steps);
  const nextAfterCurrent = nextStepAfter(month.id, current.id, steps);

  document.body.classList.add(theme.bodyClass);

  const nodes = steps
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
    <div class="themed-map-page">
      <a class="back-link map-back" href="${root}/">← All months</a>
      <header class="map-title">
        <h1>${escapeHtml(month.name)}</h1>
        <p>${escapeHtml(month.theme)} adventure map</p>
      </header>
      <div class="map-canvas" style="background-image:url('${escapeHtml(mapBg)}')">
        <svg class="map-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="${escapeHtml(theme.pathD)}" fill="none" stroke="${escapeHtml(theme.pathStroke)}" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        ${nodes}
      </div>
      ${nextBtn}
      <section class="map-video-panel themed-panel">
        <h2>Step 1 · MRJ Daily</h2>
        ${renderVideoBlock(month)}
      </section>
      <footer class="site-footer map-footer">Culture Class · ${escapeHtml(month.name)} · All steps open for practice</footer>
    </div>`;

  document.title = `Culture Class — ${month.name}: ${month.theme}`;

  document.getElementById("btnVideoDone")?.addEventListener("click", () => {
    setStepDone(month.id, "video");
    window.location.href = dailyQuizUrl(month.id);
  });

  void initFeatureYoutubePlayers(document.getElementById("app"));
}

/** @deprecated use renderThemedMapMonth */
export function renderOctoberHalloweenMonth(month) {
  return renderThemedMapMonth(month);
}
