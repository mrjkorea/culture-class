/** SVG art for July Canada craft */

export function titleArtSvg() {
  return `<svg class="title-maple" viewBox="0 0 100 80" aria-hidden="true">
    <rect x="10" y="10" width="80" height="50" rx="4" fill="#fff" stroke="#c41e3a" stroke-width="3"/>
    <path d="M50 18 L54 32 L68 32 L57 40 L61 54 L50 46 L39 54 L43 40 L32 32 L46 32 Z" fill="#c41e3a"/>
  </svg>`;
}

export function treeSvg(sap = 0) {
  const p = Math.max(0, Math.min(1, sap));
  return `<svg class="maple-tree-svg" viewBox="0 0 100 110" aria-hidden="true">
    <rect x="44" y="70" width="12" height="35" fill="#5c4033"/>
    <circle cx="50" cy="45" r="32" fill="#c41e3a" opacity="0.9"/>
    <circle cx="38" cy="52" r="18" fill="#d62839"/>
    <circle cx="62" cy="52" r="18" fill="#d62839"/>
    <rect x="72" y="88" width="18" height="14" rx="2" fill="#8b6914"/>
    <rect x="74" y="${90 - p * 10}" width="14" height="${4 + p * 8}" fill="#c9a227" opacity="${0.4 + p * 0.6}"/>
  </svg>`;
}

export function boilSvg(heat = 0) {
  const p = Math.max(0, Math.min(1, heat));
  return `<svg class="boil-svg" viewBox="0 0 100 80" aria-hidden="true">
    <ellipse cx="50" cy="58" rx="36" ry="14" fill="#555"/>
    <rect x="22" y="30" width="56" height="30" rx="6" fill="#444"/>
    <rect x="26" y="${50 - p * 18}" width="48" height="${8 + p * 18}" fill="#c9a227"/>
    ${p > 0.2 ? `<path d="M40 28 Q42 ${22 - p * 8} 44 28" stroke="#ccc" fill="none" stroke-width="2"/>` : ""}
    ${p > 0.5 ? `<path d="M50 26 Q52 ${18 - p * 10} 54 26" stroke="#ddd" fill="none" stroke-width="2"/>` : ""}
    ${p > 0.7 ? `<path d="M60 28 Q62 ${20 - p * 8} 64 28" stroke="#ccc" fill="none" stroke-width="2"/>` : ""}
  </svg>`;
}

export function lakeSvg(marked = false) {
  return `<svg class="lake-svg" viewBox="0 0 120 70" aria-hidden="true">
    <rect x="0" y="0" width="120" height="70" fill="#a8d4e8"/>
    <ellipse cx="60" cy="55" rx="55" ry="18" fill="#fff" opacity="0.85"/>
    ${marked ? `<circle cx="72" cy="48" r="8" fill="#2c5282" stroke="#fff" stroke-width="2"/>` : ""}
  </svg>`;
}

export function netSvg() {
  return `<svg class="net-svg" viewBox="0 0 100 70" aria-hidden="true">
    <rect x="10" y="50" width="80" height="4" fill="#ccc"/>
    <path d="M20 50 L25 20 L75 20 L80 50" fill="none" stroke="#ccc" stroke-width="3"/>
    <rect x="42" y="22" width="16" height="28" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="4 3"/>
  </svg>`;
}

export function flagSvg(raised = 0) {
  const h = raised * 45;
  return `<svg class="flag-svg" viewBox="0 0 100 90" aria-hidden="true">
    <line x1="20" y1="85" x2="20" y2="10" stroke="#666" stroke-width="3"/>
    <rect x="22" y="${40 - h}" width="60" height="36" fill="#fff" stroke="#c41e3a"/>
    <path d="M52 ${48 - h} L56 ${58 - h} L66 ${58 - h} L58 ${64 - h} L60 ${74 - h} L52 ${68 - h} L44 ${74 - h} L46 ${64 - h} L38 ${58 - h} L48 ${58 - h} Z" fill="#c41e3a"/>
  </svg>`;
}
