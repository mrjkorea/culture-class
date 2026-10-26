/** Resolve paths for GitHub Pages project site (/culture-class/). */
export function repoRoot() {
  let path = window.location.pathname.replace(/\/+$/, "");
  if (path.endsWith("/index.html")) {
    path = path.slice(0, -"/index.html".length) || "/";
  }
  if (path.endsWith("/bingo/teacher.html") || path.endsWith("/bingo/student.html")) {
    return path.replace(/\/bingo\/[^/]+$/, "");
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

export const CLIMB_BASE = "https://mrjkorea.github.io/day2-words/day3/climb.html";

export function climbUrl(unitId) {
  return `${CLIMB_BASE}?unit=${encodeURIComponent(unitId)}`;
}
