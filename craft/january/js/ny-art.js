export function titleArtSvg() {
  return `<svg class="title-ny-art" viewBox="0 0 200 120" aria-hidden="true">
    <rect width="200" height="120" rx="12" fill="#0a1a3a"/>
    <circle cx="40" cy="35" r="14" fill="#ff6b6b"/>
    <circle cx="70" cy="28" r="11" fill="#ffd43b"/>
    <circle cx="95" cy="40" r="13" fill="#74c0fc"/>
    <path d="M100 55 L100 95" stroke="#888" stroke-width="2"/>
    <text x="100" y="110" text-anchor="middle" fill="#ffe066" font-size="14" font-weight="bold">2026</text>
    <polygon points="155,70 165,95 145,95" fill="#ffd43b"/>
    <rect x="150" y="95" width="10" height="18" fill="#c92a2a"/>
  </svg>`;
}

export function hatSvg(color) {
  return `<svg viewBox="0 0 64 64" class="hat-icon" aria-hidden="true">
    <polygon points="8,40 56,40 32,8" fill="${color}"/>
    <ellipse cx="32" cy="40" rx="26" ry="8" fill="${color}" opacity="0.85"/>
    <circle cx="32" cy="8" r="5" fill="#fff3bf"/>
  </svg>`;
}

export const HAT_COLORS = ["#ff6b6b", "#339af0", "#51cf66", "#ffd43b"];
