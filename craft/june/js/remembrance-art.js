/** SVG helpers for June Remembrance craft */

export function titleArtSvg() {
  return `<svg class="title-poppy" viewBox="0 0 120 80" aria-hidden="true">
    <ellipse cx="60" cy="68" rx="48" ry="8" fill="rgba(0,0,0,0.25)"/>
    <path d="M60 68 Q58 40 60 22 Q62 40 60 68" stroke="#2d5a27" stroke-width="3" fill="none"/>
    <circle cx="60" cy="22" r="6" fill="#1a1a1a"/>
    <ellipse cx="48" cy="28" rx="14" ry="18" fill="#c41e3a" opacity="0.95"/>
    <ellipse cx="72" cy="28" rx="14" ry="18" fill="#c41e3a" opacity="0.95"/>
    <ellipse cx="60" cy="18" rx="12" ry="16" fill="#d62839"/>
    <ellipse cx="52" cy="36" rx="12" ry="14" fill="#a4161a"/>
    <ellipse cx="68" cy="36" rx="12" ry="14" fill="#a4161a"/>
  </svg>`;
}

export function gardenSvg(progress = 0) {
  const p = Math.max(0, Math.min(1, progress));
  const dug = Math.round(p * 6);
  const holes = Array.from({ length: 6 }, (_, i) => {
    const x = 18 + i * 16;
    const deep = i < dug ? 6 : 0;
    return `<ellipse cx="${x}" cy="${52 - deep}" rx="10" ry="${4 + deep}" fill="#3d2817" opacity="0.85"/>`;
  }).join("");
  return `<svg class="garden-svg" viewBox="0 0 120 64" aria-hidden="true">
    <rect x="4" y="44" width="112" height="16" rx="4" fill="#5c4033"/>
    ${holes}
    <rect x="0" y="52" width="120" height="12" fill="#4a3228"/>
  </svg>`;
}

export function poppySvg(scale = 0) {
  const s = Math.max(0, Math.min(1, scale));
  const h = 8 + s * 44;
  const petal = s < 0.15 ? 0 : (s - 0.15) / 0.85;
  const r = 4 + petal * 14;
  return `<svg class="poppy-svg" viewBox="0 0 48 64" aria-hidden="true">
    <line x1="24" y1="60" x2="24" y2="${60 - h}" stroke="#2d5a27" stroke-width="2"/>
    <circle cx="24" cy="${60 - h}" r="${Math.max(2, r * 0.35)}" fill="#1a1a1a"/>
    ${petal > 0.1 ? `<ellipse cx="24" cy="${60 - h - r * 0.3}" rx="${r}" ry="${r * 1.1}" fill="#c41e3a"/>` : ""}
  </svg>`;
}

export function memorialSvg(hasPoppy = false, hasCard = false) {
  const pop = hasPoppy
    ? `<circle cx="60" cy="38" r="5" fill="#1a1a1a"/><ellipse cx="60" cy="34" rx="9" ry="11" fill="#c41e3a"/>`
    : "";
  const card = hasCard
    ? `<rect x="72" y="42" width="22" height="14" rx="2" fill="#f8f4e8" stroke="#8b7355"/><text x="76" y="52" font-size="5" fill="#5c4033">Remember</text>`
    : "";
  return `<svg class="memorial-svg" viewBox="0 0 120 80" aria-hidden="true">
    <rect x="20" y="48" width="80" height="24" fill="#6b6b6b"/>
    <polygon points="60,12 95,48 25,48" fill="#8a8a8a"/>
    <rect x="54" y="20" width="12" height="28" fill="#4a4a4a"/>
    ${pop}
    ${card}
  </svg>`;
}

export function coatSvg(pinned = false) {
  const pin = pinned
    ? `<circle cx="58" cy="36" r="3" fill="#1a1a1a"/><ellipse cx="58" cy="33" rx="6" ry="7" fill="#c41e3a"/>`
    : "";
  return `<svg class="coat-svg" viewBox="0 0 100 90" aria-hidden="true">
    <path d="M30 28 L50 18 L70 28 L78 80 L22 80 Z" fill="#2c3e50"/>
    <path d="M42 28 L50 38 L58 28" fill="none" stroke="#1a252f" stroke-width="2"/>
    ${pin}
  </svg>`;
}
