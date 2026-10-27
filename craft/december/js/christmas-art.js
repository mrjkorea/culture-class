/** SVG helpers for Christmas craft title and tree scenes */

export function titleArtSvg() {
  return `<svg class="title-tree" viewBox="0 0 120 120" aria-hidden="true">
    <polygon points="60,8 95,45 75,45 100,75 80,75 105,108 15,108 40,75 20,75 45,45 25,45" fill="#1b5e20"/>
    <polygon points="60,20 88,50 72,50 92,72 68,72 88,98 32,98 52,72 28,72 48,50 32,50" fill="#2e7d32"/>
    <rect x="52" y="98" width="16" height="14" fill="#5d4037"/>
    <circle cx="45" cy="58" r="4" fill="#ffd54f"/>
    <circle cx="72" cy="64" r="4" fill="#e53935"/>
    <circle cx="58" cy="78" r="4" fill="#42a5f5"/>
    <polygon points="60,2 62,10 70,10 63,14 66,22 60,17 54,22 57,14 50,10 58,10" fill="#ffd54f"/>
  </svg>`;
}

export function forestTreeSvg(found = false) {
  const star = found ? '<polygon points="50,6 52,12 58,12 53,16 55,22 50,18 45,22 47,16 42,12 48,12" fill="#ffd54f"/>' : "";
  return `<svg class="scene-tree" viewBox="0 0 100 110" aria-hidden="true">
    ${star}
    <polygon points="50,18 78,52 62,52 82,78 58,78 78,102 22,102 42,78 18,78 38,52 22,52" fill="${found ? "#2e7d32" : "#388e3c"}"/>
    <rect x="44" y="102" width="12" height="8" fill="#6d4c41"/>
  </svg>`;
}

export function homeTreeSvg(lit = 0) {
  const glow = Math.min(1, lit);
  const bulbs = glow > 0.2 ? '<circle cx="35" cy="55" r="3" fill="#ffeb3b"/><circle cx="65" cy="60" r="3" fill="#f44336"/>' : "";
  const ornaments = glow > 0.45 ? '<circle cx="48" cy="70" r="4" fill="#2196f3"/><circle cx="58" cy="48" r="4" fill="#e91e63"/>' : "";
  const gifts = glow > 0.7 ? '<rect x="28" y="92" width="14" height="12" fill="#c62828"/><rect x="48" y="94" width="12" height="10" fill="#1565c0"/><rect x="64" y="93" width="14" height="11" fill="#2e7d32"/>' : "";
  return `<svg class="home-tree" viewBox="0 0 100 120" aria-hidden="true">
    <rect x="0" y="100" width="100" height="20" fill="#4e342e" opacity="0.35"/>
    <polygon points="50,12 82,48 66,48 86,72 62,72 82,98 18,98 38,72 14,72 34,48 18,48" fill="#1b5e20"/>
    ${bulbs}${ornaments}
    <rect x="44" y="98" width="12" height="10" fill="#5d4037"/>
    ${gifts}
  </svg>`;
}

export function carryPathSvg(progress = 0) {
  const x = 8 + progress * 72;
  return `<svg class="carry-path" viewBox="0 0 100 48" aria-hidden="true">
    <rect x="4" y="32" width="92" height="8" rx="4" fill="#795548"/>
    <text x="88" y="28" font-size="16">🚗</text>
    <text x="${x}" y="28" font-size="18">🌲</text>
  </svg>`;
}
