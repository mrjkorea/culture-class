export function titleArtSvg() {
  return `<svg class="title-path-art" viewBox="0 0 200 120" aria-hidden="true">
    <rect width="200" height="120" rx="14" fill="#3d2c1a"/>
    <path d="M40 85 L100 35 L160 85" fill="none" stroke="#d4a574" stroke-width="3"/>
    <ellipse cx="100" cy="72" rx="22" ry="14" fill="#ff8fab" opacity="0.9"/>
    <ellipse cx="100" cy="68" rx="10" ry="6" fill="#fff5f5"/>
  </svg>`;
}

export function gateSvg(open = 0) {
  const w = open * 40;
  return `<svg class="gate-svg" viewBox="0 0 200 120" aria-hidden="true">
    <rect x="20" y="40" width="160" height="70" fill="#5c4033" opacity="0.3"/>
    <rect x="30" y="50" width="${40 - w}" height="60" fill="#8b6914"/>
    <rect x="${170 - (40 - w)}" y="50" width="${40 - w}" height="60" fill="#8b6914"/>
    <path d="M30 50 Q100 20 170 50" fill="none" stroke="#c9a227" stroke-width="4"/>
  </svg>`;
}

export function lotusSvg(petals = 0) {
  const p = Math.min(1, petals / 20);
  const spread = 8 + p * 28;
  return `<svg class="lotus-svg" viewBox="0 0 120 100" aria-hidden="true">
    <ellipse cx="60" cy="75" rx="35" ry="8" fill="#2b8a3e" opacity="0.5"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7]
      .map((i) => {
        const a = (i / 8) * Math.PI - Math.PI / 2;
        const x = 60 + Math.cos(a) * spread * 0.3;
        const y = 55 - Math.sin(a) * spread * 0.15 - p * 20;
        return `<ellipse cx="${x}" cy="${y}" rx="10" ry="${18 + p * 10}" fill="#fcc2d7" transform="rotate(${i * 45} ${x} ${y})" opacity="${0.5 + p * 0.5}"/>`;
      })
      .join("")}
    <circle cx="60" cy="52" r="${6 + p * 8}" fill="#ffd43b" opacity="${0.4 + p * 0.6}"/>
  </svg>`;
}

export function lampSvg(glow = 0) {
  const g = Math.min(1, glow);
  return `<svg class="lamp-svg" viewBox="0 0 80 100" aria-hidden="true">
    <rect x="34" y="70" width="12" height="20" fill="#5c4033"/>
    <ellipse cx="40" cy="65" rx="18" ry="8" fill="#c9a227"/>
    <ellipse cx="40" cy="45" rx="14" ry="20" fill="#fff3bf" opacity="${0.3 + g * 0.7}"/>
    <circle cx="40" cy="38" r="${8 + g * 16}" fill="#ffe066" opacity="${g * 0.55}"/>
  </svg>`;
}
