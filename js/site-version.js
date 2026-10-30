/** Bump or tie to deploy SHA for GitHub Pages cache bust on step links. */
export const SITE_LINK_V = "20261030-meet-word";

export function withLinkVersion(href) {
  if (!href || /^https?:\/\//i.test(href) || href.startsWith("#")) return href;
  const hashIdx = href.indexOf("#");
  const base = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : "";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}v=${SITE_LINK_V}${hash}`;
}
