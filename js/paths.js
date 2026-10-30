/** Resolve paths for GitHub Pages project site (/culture-class/). */
import { withLinkVersion } from "./site-version.js?v=20261030-speak-lazy";

export function repoRoot() {
  let path = window.location.pathname.replace(/\/+$/, "");
  if (path.endsWith("/index.html")) {
    path = path.slice(0, -"/index.html".length) || "/";
  }
  if (path.endsWith("/bingo/teacher.html") || path.endsWith("/bingo/student.html")) {
    return path.replace(/\/bingo\/[^/]+$/, "");
  }
  if (
    path.endsWith("/words/learn.html") ||
    path.endsWith("/words/memory.html") ||
    path.endsWith("/words/meet.html")
  ) {
    return path.replace(/\/words\/[^/]+$/, "");
  }
  if (path.endsWith("/quiz/daily.html")) {
    return path.replace(/\/quiz\/[^/]+$/, "");
  }
  if (path.endsWith("/climb/climb.html")) {
    return path.replace(/\/climb\/[^/]+$/, "");
  }
  if (path.endsWith("/cp/speak.html")) {
    return path.replace(/\/cp\/[^/]+$/, "");
  }
  const monthMatch = path.match(/^(.*)\/months\/\d{2}-[^/]+$/);
  if (monthMatch) {
    return monthMatch[1] || "";
  }
  return path || "";
}

export function dataUrl(filename) {
  return `${repoRoot()}/data/${filename}`;
}

export function homeUrl() {
  return withLinkVersion(`${repoRoot()}/`);
}

export function monthUrl(slug) {
  return withLinkVersion(`${repoRoot()}/months/${slug}/`);
}

export function bingoUrl(which) {
  return withLinkVersion(`${repoRoot()}/bingo/${which}.html`);
}

export function bingoStudentUrl(monthId) {
  return withLinkVersion(
    `${repoRoot()}/bingo/student.html?month=${encodeURIComponent(monthId)}`
  );
}

export function bingoTeacherUrl(monthId) {
  return withLinkVersion(
    `${repoRoot()}/bingo/teacher.html?month=${encodeURIComponent(monthId)}`
  );
}

export function wordsMeetUrl(monthId) {
  return withLinkVersion(
    `${repoRoot()}/words/meet.html?month=${encodeURIComponent(monthId)}`
  );
}

export function wordsLearnUrl(monthId) {
  return withLinkVersion(
    `${repoRoot()}/words/learn.html?month=${encodeURIComponent(monthId)}`
  );
}

export function wordsMemoryUrl(monthId) {
  return withLinkVersion(
    `${repoRoot()}/words/memory.html?month=${encodeURIComponent(monthId)}`
  );
}

export function cpSpeakUrl(monthId) {
  return withLinkVersion(
    `${repoRoot()}/cp/speak.html?month=${encodeURIComponent(monthId)}`
  );
}

export function monthPageUrl(slug) {
  return monthUrl(slug);
}

/** @param {string} relativePath path under repo root, e.g. craft/august/index.html */
export function craftUrl(relativePath) {
  if (!relativePath) return "";
  return withLinkVersion(`${repoRoot()}/${String(relativePath).replace(/^\/+/, "")}`);
}

export const CLIMB_BASE = "https://mrjkorea.github.io/day2-words/day3/climb.html";
const LOCAL_CLIMB_UNITS = new Set(
  Array.from({ length: 12 }, (_, i) => {
    const nn = String(i + 1).padStart(2, "0");
    return [`culture_m${nn}`, `culture_m${nn}_show`];
  }).flat()
);

export function climbUrl(unitId) {
  if (LOCAL_CLIMB_UNITS.has(unitId)) {
    const m = /^culture_m(\d{2})(?:_show)?$/.exec(unitId || "");
    const monthQ = m ? `&month=${parseInt(m[1], 10)}` : "";
    return withLinkVersion(
      `${repoRoot()}/climb/climb.html?unit=${encodeURIComponent(unitId)}${monthQ}`
    );
  }
  return `${CLIMB_BASE}?unit=${encodeURIComponent(unitId)}`;
}

export function dailyQuizUrl(monthId) {
  return withLinkVersion(
    `${repoRoot()}/quiz/daily.html?month=${encodeURIComponent(monthId)}`
  );
}
