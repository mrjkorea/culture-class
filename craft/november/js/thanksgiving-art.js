/** SVG art for November Thanksgiving craft */

export function titleArtSvg() {
  return `<svg class="title-turkey" viewBox="0 0 100 80" aria-hidden="true">
    <ellipse cx="50" cy="48" rx="28" ry="22" fill="#8b5a2b"/>
    <circle cx="50" cy="32" r="14" fill="#a0522d"/>
    <path d="M38 28 Q30 18 42 22" fill="#c41e3a"/>
    <path d="M62 28 Q70 18 58 22" fill="#c41e3a"/>
    <circle cx="46" cy="30" r="2" fill="#1a1a1a"/>
    <circle cx="54" cy="30" r="2" fill="#1a1a1a"/>
    <polygon points="50,38 46,44 54,44" fill="#ff8c00"/>
  </svg>`;
}

export function ovenSvg(heat = 0) {
  const p = Math.max(0, Math.min(1, heat));
  return `<svg class="oven-svg" viewBox="0 0 100 70" aria-hidden="true">
    <rect x="15" y="10" width="70" height="50" rx="6" fill="#555"/>
    <rect x="22" y="22" width="56" height="32" fill="#${p > 0.3 ? "c45c26" : "333"}"/>
    <circle cx="78" cy="20" r="4" fill="${p > 0.5 ? "#ff6b35" : "#888"}"/>
    <text x="50" y="42" text-anchor="middle" font-size="20">${p > 0.8 ? "🦃" : "🔥"}</text>
  </svg>`;
}

export function tableSvg(set = 0) {
  const s = Math.max(0, Math.min(1, set));
  return `<svg class="table-svg" viewBox="0 0 120 64" aria-hidden="true">
    <rect x="10" y="36" width="100" height="8" fill="#5c4033"/>
    ${s > 0.2 ? `<circle cx="30" cy="30" r="8" fill="#eee"/>` : ""}
    ${s > 0.4 ? `<circle cx="60" cy="30" r="8" fill="#eee"/>` : ""}
    ${s > 0.6 ? `<circle cx="90" cy="30" r="8" fill="#eee"/>` : ""}
    ${s > 0.8 ? `<text x="30" y="52" font-size="10">🍴</text><text x="60" y="52" font-size="10">🥛</text>` : ""}
  </svg>`;
}
