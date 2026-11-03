/** SVG art for November Thanksgiving craft */

export function titleArtSvg() {
  return `<svg class="title-turkey" viewBox="0 0 120 96" aria-hidden="true">
    <defs>
      <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#a0522d"/>
        <stop offset="100%" stop-color="#6b3a1f"/>
      </linearGradient>
    </defs>
    <ellipse cx="60" cy="58" rx="34" ry="26" fill="url(#tg)"/>
    <circle cx="60" cy="38" r="16" fill="#b5651d"/>
    <path d="M44 34 Q32 18 48 24" fill="#c41e3a"/>
    <path d="M76 34 Q88 18 72 24" fill="#c41e3a"/>
    <circle cx="54" cy="36" r="2.5" fill="#1a1a1a"/>
    <circle cx="66" cy="36" r="2.5" fill="#1a1a1a"/>
    <polygon points="60,44 55,52 65,52" fill="#ff8c00"/>
    <path d="M20 78 Q60 68 100 78 L100 92 L20 92 Z" fill="#8b6914" opacity="0.45"/>
  </svg>`;
}

export function ovenSvg(heat = 0) {
  const p = Math.max(0, Math.min(1, heat));
  const glow = p > 0.35 ? "#ff6b35" : "#444";
  return `<svg class="oven-svg feast-oven-art" viewBox="0 0 140 100" aria-hidden="true">
    <rect x="18" y="12" width="104" height="72" rx="10" fill="#4a4a4a"/>
    <rect x="28" y="28" width="84" height="46" rx="6" fill="${glow}"/>
    <rect x="22" y="68" width="96" height="14" rx="4" fill="#333"/>
    <circle cx="108" cy="22" r="6" fill="${p > 0.5 ? "#ff4500" : "#888"}"/>
    <text x="70" y="58" text-anchor="middle" font-size="28">${p > 0.75 ? "🦃" : "🔥"}</text>
  </svg>`;
}

export function tableSvg(set = 0) {
  const s = Math.max(0, Math.min(1, set));
  return `<svg class="table-svg feast-table-art" viewBox="0 0 200 90" aria-hidden="true">
    <rect x="8" y="48" width="184" height="12" rx="4" fill="#5c4033"/>
    <rect x="24" y="58" width="8" height="22" fill="#4a3325"/>
    <rect x="168" y="58" width="8" height="22" fill="#4a3325"/>
    ${s > 0.15 ? `<ellipse cx="50" cy="42" rx="14" ry="5" fill="#f5f5f5"/>` : ""}
    ${s > 0.35 ? `<ellipse cx="100" cy="42" rx="14" ry="5" fill="#f5f5f5"/>` : ""}
    ${s > 0.55 ? `<ellipse cx="150" cy="42" rx="14" ry="5" fill="#f5f5f5"/>` : ""}
    ${s > 0.75 ? `<text x="50" y="46" text-anchor="middle" font-size="14">🍽️</text>` : ""}
    ${s > 0.85 ? `<text x="100" y="46" text-anchor="middle" font-size="12">🍴</text><text x="150" y="46" font-size="12">🥛</text>` : ""}
  </svg>`;
}

export function turkeyPluckSvg(featherRatio = 1) {
  const r = Math.max(0, Math.min(1, featherRatio));
  const featherOpacity = 0.25 + r * 0.75;
  return `<svg class="pluck-turkey-art" viewBox="0 0 160 180" aria-hidden="true">
    <ellipse cx="80" cy="105" rx="48" ry="42" fill="#8b5a2b"/>
    <circle cx="80" cy="62" r="22" fill="#a0522d"/>
    <g opacity="${featherOpacity}">
      ${Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * 360;
        const x = 80 + Math.cos((a * Math.PI) / 180) * 38;
        const y = 95 + Math.sin((a * Math.PI) / 180) * 28;
        return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="8" ry="16" fill="#654321" transform="rotate(${a} ${x} ${y})"/>`;
      }).join("")}
    </g>
    <path d="M52 52 Q38 32 58 38" fill="#c41e3a"/>
    <path d="M108 52 Q122 32 102 38" fill="#c41e3a"/>
    <polygon points="80,72 74,82 86,82" fill="#ff8c00"/>
  </svg>`;
}

export function stuffingBowlSvg(fill = 0) {
  const p = Math.max(0, Math.min(1, fill));
  return `<svg class="stuff-bowl-art" viewBox="0 0 120 100" aria-hidden="true">
    <path d="M20 45 Q60 20 100 45 L95 75 Q60 92 25 75 Z" fill="#d4a574"/>
    <ellipse cx="60" cy="45" rx="38" ry="12" fill="#c9a227" opacity="${0.35 + p * 0.65}"/>
    <text x="60" y="58" text-anchor="middle" font-size="22" opacity="${p}">🍞</text>
  </svg>`;
}

export function gravyPotSvg(level = 0) {
  const p = Math.max(0, Math.min(1, level));
  return `<svg class="gravy-pot-art" viewBox="0 0 120 110" aria-hidden="true">
    <ellipse cx="60" cy="88" rx="42" ry="10" fill="#333"/>
    <path d="M28 42 L32 82 Q60 95 88 82 L92 42 Z" fill="#888"/>
    <ellipse cx="60" cy="42" rx="34" ry="10" fill="#aaa"/>
    <path d="M38 48 Q60 ${58 - p * 18} 82 48 L78 78 Q60 ${86 - p * 8} 42 78 Z" fill="#8b4513" opacity="${0.4 + p * 0.6}"/>
    <path d="M92 50 Q108 45 112 58" fill="none" stroke="#666" stroke-width="4"/>
  </svg>`;
}

export function pieBakeSvg(progress = 0) {
  const p = Math.max(0, Math.min(1, progress));
  return `<svg class="pie-bake-art" viewBox="0 0 140 100" aria-hidden="true">
    <ellipse cx="70" cy="72" rx="52" ry="14" fill="#333" opacity="0.25"/>
    <ellipse cx="70" cy="58" rx="48" ry="22" fill="#d4a574"/>
    <ellipse cx="70" cy="52" rx="40" ry="16" fill="${p > 0.5 ? "#c45c26" : "#e8a87c"}"/>
    <path d="M30 52 Q70 ${38 - p * 6} 110 52" fill="none" stroke="#a0522d" stroke-width="3"/>
    ${p > 0.85 ? `<text x="70" y="56" text-anchor="middle" font-size="20">✨</text>` : ""}
  </svg>`;
}

export function diningRoomSvg() {
  return `<svg class="dining-room-art" viewBox="0 0 320 120" aria-hidden="true">
    <rect width="320" height="120" fill="#f5ebe0" opacity="0.35"/>
    <rect x="40" y="58" width="240" height="10" rx="3" fill="#5c4033"/>
    <rect x="60" y="68" width="6" height="28" fill="#4a3325"/>
    <rect x="254" y="68" width="6" height="28" fill="#4a3325"/>
    <ellipse cx="110" cy="52" rx="18" ry="6" fill="#eee"/>
    <ellipse cx="210" cy="52" rx="18" ry="6" fill="#eee"/>
  </svg>`;
}
