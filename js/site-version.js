/** Bump or tie to deploy SHA for GitHub Pages cache bust on step links. */
<<<<<<< HEAD
export const SITE_LINK_V = "20261030-meet-word2";
=======
export const SITE_LINK_V = "20261030-cp-mic";
>>>>>>> 390c4dc (fix(cp-speak): resume AudioContext, cache-bust mic modules, clearer mic errors)

export function withLinkVersion(href) {
  if (!href || /^https?:\/\//i.test(href) || href.startsWith("#")) return href;
  const hashIdx = href.indexOf("#");
  const base = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : "";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}v=${SITE_LINK_V}${hash}`;
}
