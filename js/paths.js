/** Resolve paths for GitHub Pages project site (/culture-class/). */
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
    path.endsWith("/words/meet.html") ||
    path.endsWith("/words/match.html")
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

export function monthUrl(slug) {
  return `${repoRoot()}/months/${slug}/`;
}

export function bingoUrl(which) {
  return `${repoRoot()}/bingo/${which}.html`;
}

export function wordsMeetUrl(monthId) {
  return `${repoRoot()}/words/meet.html?month=${encodeURIComponent(monthId)}`;
}

export function wordsMatchUrl(monthId) {
  return `${repoRoot()}/words/match.html?month=${encodeURIComponent(monthId)}`;
}

export function wordsLearnUrl(monthId) {
  return `${repoRoot()}/words/learn.html?month=${encodeURIComponent(monthId)}`;
}

export function wordsMemoryUrl(monthId) {
  return `${repoRoot()}/words/memory.html?month=${encodeURIComponent(monthId)}`;
}

export function cpSpeakUrl(monthId) {
  return `${repoRoot()}/cp/speak.html?month=${encodeURIComponent(monthId)}`;
}

export function monthPageUrl(slug) {
  return monthUrl(slug);
}

export const CLIMB_BASE = "https://mrjkorea.github.io/day2-words/day3/climb.html";
const LOCAL_CLIMB_UNITS = new Set(["culture_m10", "culture_m10_show"]);

export function climbUrl(unitId) {
  if (LOCAL_CLIMB_UNITS.has(unitId)) {
    return `${repoRoot()}/climb/climb.html?unit=${encodeURIComponent(unitId)}&test=1`;
  }
  return `${CLIMB_BASE}?unit=${encodeURIComponent(unitId)}`;
}

export function dailyQuizUrl(monthId) {
  return `${repoRoot()}/quiz/daily.html?month=${encodeURIComponent(monthId)}`;
}
