import { repoRoot } from "./paths.js";
import { getMonthTheme } from "./month-themes.js";
import { SITE_LINK_V } from "./site-version.js";

/** Inject themed CSS link on month index pages when not already in HTML. */
export function ensureThemeStylesheet(month) {
  const theme = getMonthTheme(month);
  if (!theme?.cssHref) return;
  const href = `${repoRoot()}/${theme.cssHref.replace(/^\/+/, "")}?v=${SITE_LINK_V}`;
  const existing = document.querySelector(`link[data-month-theme="${theme.key}"]`);
  if (existing) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.monthTheme = theme.key;
  document.head.appendChild(link);
}
