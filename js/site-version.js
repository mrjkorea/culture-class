/** Bump or tie to deploy SHA for GitHub Pages cache bust on step links. */
export const SITE_LINK_V = "20261029-month-wins";

export function withLinkVersion(href) {
  if (!href || /^https?:\/\//i.test(href) || href.startsWith("#")) return href;
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}v=${SITE_LINK_V}`;
}
