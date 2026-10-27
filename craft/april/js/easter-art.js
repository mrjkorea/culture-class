export function titleArtSvg() {
  return `<svg class="title-easter-art" viewBox="0 0 200 120" aria-hidden="true">
    <rect width="200" height="120" rx="14" fill="#4c1d95"/>
    <ellipse cx="100" cy="68" rx="42" ry="52" fill="#fcc2d7"/>
    <ellipse cx="100" cy="62" rx="28" ry="36" fill="#fff0f6"/>
    <path d="M70 45 Q100 20 130 45" fill="none" stroke="#ae3ec9" stroke-width="4"/>
  </svg>`;
}

export const DYE_COLORS = [
  { id: "pink", fill: "#ff6b9d", label: "Pink" },
  { id: "blue", fill: "#4dabf7", label: "Blue" },
  { id: "yellow", fill: "#ffd43b", label: "Yellow" },
  { id: "green", fill: "#51cf66", label: "Green" },
  { id: "purple", fill: "#cc5de8", label: "Purple" },
];

const DECOYS = ["🌷", "🌼", "🐰", "🧺", "🌿", "🪺", "🦋", "🌸", "🍃", "🐣"];

export function randomDecoy() {
  return DECOYS[Math.floor(Math.random() * DECOYS.length)];
}

export function eggSvg(opts = {}) {
  const {
    fill = "#fff5f7",
    clean = 1,
    stickers = 0,
    face = false,
  } = opts;
  const grime = 1 - Math.min(1, clean);
  const g = grime * 0.35;
  return `<svg class="egg-craft-svg" viewBox="0 0 120 160" aria-hidden="true">
    <ellipse cx="60" cy="88" rx="44" ry="58" fill="${fill}" stroke="#862e9a" stroke-width="2"/>
    <ellipse cx="60" cy="88" rx="44" ry="58" fill="rgba(80,60,40,${g})" pointer-events="none"/>
    ${face ? `<circle cx="48" cy="78" r="4" fill="#212529"/><circle cx="72" cy="78" r="4" fill="#212529"/><path d="M48 95 Q60 108 72 95" fill="none" stroke="#212529" stroke-width="2"/>` : ""}
    ${stickers > 0 ? `<text x="60" y="55" text-anchor="middle" font-size="${10 + stickers}">⭐</text>` : ""}
  </svg>`;
}

export function huntLevelStyle(level) {
  const sizes = [46, 34, 26, 20, 15];
  const opacities = [1, 0.82, 0.62, 0.42, 0.28];
  const i = Math.max(0, Math.min(4, (level || 1) - 1));
  return {
    size: sizes[i],
    opacity: opacities[i],
  };
}
