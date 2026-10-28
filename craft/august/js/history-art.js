/** SVG art for August History Day timeline craft */

export function titleArtSvg() {
  return `<svg class="title-timeline" viewBox="0 0 120 80" aria-hidden="true">
    <rect x="4" y="36" width="112" height="6" rx="3" fill="#8b6914"/>
    <circle cx="18" cy="32" r="10" fill="#c9a227"/>
    <circle cx="42" cy="28" r="9" fill="#5c4033"/>
    <circle cx="66" cy="30" r="9" fill="#2d6a4f"/>
    <circle cx="90" cy="26" r="10" fill="#4a90a4"/>
    <text x="14" y="35" font-size="10">🏛</text>
    <text x="38" y="31" font-size="9">📜</text>
    <text x="62" y="33" font-size="9">🧱</text>
    <text x="86" y="29" font-size="10">🌍</text>
  </svg>`;
}

export function pyramidSvg(level = 0) {
  const rows = Math.min(4, Math.max(0, level));
  let blocks = "";
  for (let r = 0; r < rows; r += 1) {
    const w = 8 + r * 6;
    const x = 40 - w / 2;
    const y = 58 - r * 10;
    blocks += `<rect x="${x}" y="${y}" width="${w}" height="8" fill="#c9a227" stroke="#8b6914" stroke-width="0.5"/>`;
  }
  return `<svg class="pyramid-svg" viewBox="0 0 80 70" aria-hidden="true">
    <rect x="0" y="58" width="80" height="12" fill="#e8c872"/>
    ${blocks}
  </svg>`;
}

export function wallSvg(progress = 0) {
  const p = Math.max(0, Math.min(1, progress));
  const len = Math.floor(p * 10);
  let stones = "";
  for (let i = 0; i < len; i += 1) {
    stones += `<rect x="${8 + i * 7}" y="${38 - (i % 2) * 3}" width="6" height="5" fill="#888" stroke="#555"/>`;
  }
  return `<svg class="wall-svg" viewBox="0 0 90 50" aria-hidden="true">
    <path d="M0 42 Q45 20 90 38" fill="none" stroke="#5c4033" stroke-width="2"/>
    ${stones}
  </svg>`;
}

export function globeSvg(lit = 0) {
  const glow = Math.max(0, Math.min(1, lit));
  return `<svg class="globe-svg" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="48" r="34" fill="#4a90a4" opacity="${0.6 + glow * 0.4}"/>
    <path d="M18 52 Q32 34 52 38 T88 48 Q74 68 48 66 T18 52" fill="#5cb85c"/>
    ${glow > 0.5 ? `<circle cx="50" cy="48" r="38" fill="none" stroke="#ffe56a" stroke-width="3" opacity="${glow}"/>` : ""}
  </svg>`;
}
