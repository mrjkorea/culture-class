/** SVG art for September Earth Day craft */

export function titleArtSvg() {
  return `<svg class="title-earth" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="42" fill="#4a9fd4"/>
    <path d="M20 55 Q35 35 55 40 T85 50 Q70 70 45 68 T20 55" fill="#5cb85c"/>
    <ellipse cx="72" cy="38" rx="14" ry="10" fill="#5cb85c"/>
  </svg>`;
}

export function riverSvg(clean = 0) {
  const p = Math.max(0, Math.min(1, clean));
  return `<svg class="river-svg" viewBox="0 0 120 64" aria-hidden="true">
    <rect x="0" y="28" width="120" height="28" fill="#4a90a4"/>
    <rect x="0" y="0" width="120" height="28" fill="#87ce98" opacity="${0.5 + p * 0.5}"/>
    ${p < 1 ? `<text x="88" y="48" font-size="14">🥤</text><text x="40" y="44" font-size="12">🧴</text>` : ""}
  </svg>`;
}

export function treeSvg(stage = 0) {
  const s = Math.max(0, Math.min(3, stage));
  const h = s === 0 ? 8 : s === 1 ? 20 : s === 2 ? 32 : 42;
  return `<svg class="tree-svg" viewBox="0 0 80 90" aria-hidden="true">
    <rect x="36" y="${70 - h}" width="8" height="${10 + h}" fill="#5c4033"/>
    ${s >= 2 ? `<circle cx="40" cy="${55 - h * 0.3}" r="${12 + s * 4}" fill="#2d6a4f"/>` : ""}
    ${s >= 1 ? `<ellipse cx="40" cy="${75}" rx="22" ry="6" fill="#3d2817"/>` : ""}
  </svg>`;
}

export function earthHighFiveSvg() {
  return `<svg class="earth-hi" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="48" r="36" fill="#4a9fd4"/>
    <path d="M18 52 Q32 34 52 38 T88 48 Q74 68 48 66 T18 52" fill="#5cb85c"/>
    <text x="62" y="88" font-size="28">✋</text>
  </svg>`;
}
