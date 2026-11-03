import { getMonthTheme } from "./month-themes.js";
import { repoRoot } from "./paths.js";

const injectedThemeCss = new Set();

function ensureThemeStylesheet(cssHref) {
  if (!cssHref || injectedThemeCss.has(cssHref)) return;
  const root = repoRoot();
  const href = `${root}/${cssHref.replace(/^\/+/, "")}`;
  const id = `month-theme-css-${cssHref.replace(/[^\w-]+/g, "-")}`;
  if (document.getElementById(id)) {
    injectedThemeCss.add(cssHref);
    return;
  }
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
  injectedThemeCss.add(cssHref);
}

/** Apply body class + month theme stylesheet for words/quiz/CP flows. */
export function applyMonthUiTheme(month) {
  const theme = getMonthTheme(month);
  if (!theme) return null;
  document.body.classList.add(theme.bodyClass);
  const root = document.documentElement;
  root.dataset.monthTheme = theme.key;
  root.dataset.memoryBack = theme.memoryCardBack || theme.key;
  ensureThemeStylesheet(theme.cssHref);
  return theme;
}

export function memoryLbKey(monthId) {
  return `culture-class-memory-lb-${monthId}`;
}
