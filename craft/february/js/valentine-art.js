export function titleArtSvg() {
  return `<svg class="title-val-art" viewBox="0 0 200 120" aria-hidden="true">
    <rect width="200" height="120" rx="14" fill="#4a0e2e"/>
    <path d="M100 78 C70 48 40 58 40 38 C40 22 58 18 72 30 C86 18 104 22 104 38 C104 58 74 48 100 78Z" fill="#ff6b9d"/>
    <rect x="55" y="88" width="90" height="22" rx="4" fill="#fff0f5" stroke="#ff6b9d" stroke-width="2"/>
  </svg>`;
}

export const CARD_COLORS = [
  { id: "pink", fill: "#ffb3c6", label: "Pink" },
  { id: "red", fill: "#e03131", label: "Red" },
  { id: "white", fill: "#fff5f7", label: "White" },
  { id: "purple", fill: "#cc5de8", label: "Purple" },
];

export function cardSvg(color, fold = 0, hearts = 0, sealed = false) {
  const f = Math.min(1, fold / 3);
  return `<svg class="val-card-svg" viewBox="0 0 200 140" aria-hidden="true">
    <g transform="rotate(${f * -8} 100 70)">
      <rect x="40" y="20" width="120" height="100" rx="6" fill="${color}" stroke="#862e4a" stroke-width="2"/>
      ${hearts > 0 ? `<text x="100" y="75" text-anchor="middle" font-size="${12 + hearts}" fill="#c2255c">♥</text>` : ""}
      ${sealed ? `<rect x="35" y="15" width="130" height="110" rx="8" fill="none" stroke="#f06595" stroke-width="3" stroke-dasharray="6 4"/>` : ""}
    </g>
  </svg>`;
}
