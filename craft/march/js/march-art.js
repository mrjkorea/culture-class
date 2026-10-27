export function titleArtSvg() {
  return `<svg class="title-march-art" viewBox="0 0 200 120" aria-hidden="true">
    <rect width="200" height="120" rx="14" fill="#0d3d1f"/>
    <path d="M40 85 Q55 55 70 85 Q85 45 100 85 Q115 55 130 85 Q145 60 160 85" fill="none" stroke="#2f9e44" stroke-width="8" stroke-linecap="round"/>
    <text x="100" y="42" text-anchor="middle" font-size="36">☘️</text>
    <circle cx="155" cy="38" r="14" fill="#ffd43b"/>
  </svg>`;
}

export function fieldCellSvg(isShamrock) {
  if (isShamrock) return "☘️";
  return "🌿";
}

export function rainbowPotHtml() {
  return `<div class="rainbow-arc" aria-hidden="true"></div>`;
}

export function leprechaunSvg() {
  return `<span class="leprechaun-sprite" aria-hidden="true">🧝</span>`;
}

export function breadSliceHtml(i) {
  return `<button type="button" class="bread-slice" data-i="${i}">🍞</button>`;
}

export function hatSvg(greenLevel = 0) {
  const g = Math.min(100, greenLevel);
  return `<svg class="green-hat-svg" viewBox="0 0 120 100" aria-hidden="true">
    <rect x="20" y="70" width="80" height="12" rx="4" fill="hsl(130 ${40 + g * 0.4}% ${35 + g * 0.25}%)"/>
    <path d="M35 70 L60 25 L85 70 Z" fill="hsl(125 ${45 + g * 0.35}% ${38 + g * 0.2}%)"/>
    <rect x="15" y="55" width="90" height="8" fill="hsl(130 50% ${30 + g * 0.3}%)" opacity="0.85"/>
  </svg>`;
}
