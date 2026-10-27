import { getMonthTheme } from "./month-themes.js";

/** Apply body class + optional extra stylesheet for words/quiz flows. */
export function applyMonthUiTheme(month) {
  const theme = getMonthTheme(month);
  if (!theme) return null;
  document.body.classList.add(theme.bodyClass);
  const root = document.documentElement;
  root.dataset.monthTheme = theme.key;
  root.dataset.memoryBack = theme.memoryCardBack || theme.key;
  return theme;
}

export function memoryLbKey(monthId) {
  return `culture-class-memory-lb-${monthId}`;
}
