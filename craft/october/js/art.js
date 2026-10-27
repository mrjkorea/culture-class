/** Built-in SVG scenes. Swap a whole picture by pointing assets/manifest.json at a new file. */

export const PUMPKIN = {
  w: 160,
  h: 180,
  face: { left: 20, top: 36, width: 60, height: 46 },
};

export function faceBoxStyle() {
  const f = PUMPKIN.face;
  return `left:${f.left}%;top:${f.top}%;width:${f.width}%;height:${f.height}%`;
}

export const HOUSE_SPOTS = [
  [16, 74], [28, 76], [40, 78], [52, 76], [64, 78], [78, 75],
  [12, 82], [24, 84], [36, 86], [48, 84], [60, 86], [74, 84], [86, 82],
  [18, 90], [32, 88], [46, 90], [58, 88], [72, 90], [84, 87], [8, 86],
];

function uid(raw) {
  return String(raw || "p").replace(/[^a-zA-Z0-9]/g, "") || "p";
}

function seedDots() {
  const spots = [
    [62, 100], [74, 108], [86, 102], [96, 112], [70, 118], [84, 122],
    [98, 124], [60, 112], [108, 108], [78, 96], [92, 118], [66, 124],
    [104, 118], [74, 128], [88, 96], [56, 106], [100, 100], [82, 112],
    [68, 96], [94, 128], [76, 116], [108, 96], [64, 120], [90, 108],
  ];
  return spots
    .map(
      ([x, y], i) =>
        `<ellipse data-seed cx="${x}" cy="${y}" rx="${i % 3 === 0 ? 5 : 4}" ry="${i % 2 ? 3 : 4}" transform="rotate(${(i * 27) % 80} ${x} ${y})" fill="${i % 2 ? "#fff4c4" : "#f3d48a"}"/>`
    )
    .join("");
}

export function pumpkinSvg(name) {
  const id = uid(name);
  return `<svg class="pumpkin" viewBox="0 0 160 180" aria-hidden="true">
    <defs>
      <radialGradient id="${id}g" cx="38%" cy="32%" r="75%">
        <stop offset="0%" stop-color="#ffe7a3"/>
        <stop offset="46%" stop-color="#ff8c1a"/>
        <stop offset="100%" stop-color="#e45300"/>
      </radialGradient>
      <radialGradient id="${id}glow" cx="50%" cy="55%" r="55%">
        <stop offset="0%" stop-color="#fff4b8"/>
        <stop offset="100%" stop-color="#ff8c1a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="80" cy="170" rx="50" ry="7" fill="rgba(70,20,60,.2)"/>
    <g data-lid>
      <path d="M78 48c2-18 18-28 30-18" fill="none" stroke="#2f9e3a" stroke-width="7" stroke-linecap="round"/>
      <path d="M88 32c12-8 22-1 18 9-8-1-14-1-20 3z" fill="#46c24d"/>
      <ellipse cx="80" cy="52" rx="24" ry="11" fill="#ff9f38" stroke="#e25a00" stroke-width="2"/>
    </g>
    <path d="M80 46c-32 2-50 36-48 74 2 30 22 48 48 48s46-18 48-48c2-38-16-72-48-74z" fill="url(#${id}g)"/>
    <path d="M56 58c-8 26-6 60 8 96" fill="none" stroke="#d24e00" stroke-width="3.5" opacity=".5" stroke-linecap="round"/>
    <path d="M80 50c-1 30-1 64 0 104" fill="none" stroke="#d24e00" stroke-width="4" opacity=".38" stroke-linecap="round"/>
    <path d="M104 58c8 26 6 60-8 96" fill="none" stroke="#d24e00" stroke-width="3.5" opacity=".5" stroke-linecap="round"/>
    <ellipse cx="60" cy="88" rx="16" ry="28" fill="#fff" opacity=".2"/>
    <circle data-cutguide cx="80" cy="54" r="22" fill="none" stroke="#6a2408" stroke-width="3" opacity=".35"/>
    <circle data-cutring cx="80" cy="54" r="22" fill="none" stroke="#6a2408" stroke-width="5" stroke-linecap="round" stroke-dasharray="138" stroke-dashoffset="138"/>
    <g data-cavity>
      <ellipse cx="80" cy="108" rx="38" ry="30" fill="#ffd27a"/>
      <ellipse cx="80" cy="110" rx="30" ry="23" fill="#f0b04a"/>
      ${seedDots()}
    </g>
    <g data-dirt>
      <circle cx="46" cy="102" r="5" fill="#6b3a22"/>
      <circle cx="114" cy="94" r="4" fill="#5c331c"/>
      <circle cx="70" cy="132" r="4.5" fill="#6b3a22"/>
      <circle cx="100" cy="126" r="3.2" fill="#4e2a16"/>
      <circle cx="52" cy="78" r="3" fill="#5c331c"/>
      <circle cx="122" cy="120" r="4" fill="#6b3a22"/>
      <path d="M40 122c8 2 12 8 4 10" stroke="#5c331c" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>
    <ellipse data-glow cx="80" cy="112" rx="36" ry="30" fill="url(#${id}glow)" opacity="0"/>
  </svg>`;
}

export function pumpkinIcon() {
  return `<svg viewBox="0 0 64 72" aria-hidden="true">
    <path d="M32 16c1-8 8-12 12-8" fill="none" stroke="#2f9e3a" stroke-width="3" stroke-linecap="round"/>
    <path d="M32 20c-14 1-20 14-18 28 1 10 8 16 18 16s17-6 18-16c2-14-4-27-18-28z" fill="#ff8c1a"/>
    <path d="M32 22 v36" stroke="#e25a00" stroke-width="2" opacity=".6"/>
  </svg>`;
}

export function knifeSvg() {
  return `<svg viewBox="0 0 48 84" aria-hidden="true">
    <path d="M20 8 h8 l4 40 h-16z" fill="#eef6ff" stroke="#8aa4b8" stroke-width="2"/>
    <path d="M18 48 h12 v8 h-12z" fill="#ffd15c"/>
    <rect x="16" y="56" width="16" height="20" rx="4" fill="#ff7a18"/>
    <circle cx="24" cy="66" r="2" fill="#fff6e4"/>
  </svg>`;
}

export function candleSvg() {
  return `<svg class="candle-svg" viewBox="0 0 80 120" aria-hidden="true">
    <ellipse cx="40" cy="108" rx="26" ry="6" fill="rgba(70,20,60,.2)"/>
    <rect x="30" y="48" width="20" height="58" rx="6" fill="#fff6e4" stroke="#f0d7a2" stroke-width="2"/>
    <rect x="30" y="48" width="20" height="10" fill="#ff8a1e"/>
    <rect x="37" y="40" width="6" height="10" fill="#6b3a22"/>
    <g data-flame>
      <ellipse cx="40" cy="30" rx="10" ry="16" fill="#ff8a1e"/>
      <ellipse cx="40" cy="32" rx="5" ry="9" fill="#ffe56a"/>
    </g>
  </svg>`;
}

export function panSvg() {
  return `<svg class="pan" viewBox="0 0 280 160" aria-hidden="true">
    <ellipse cx="118" cy="128" rx="90" ry="12" fill="rgba(70,20,60,.18)"/>
    <rect x="176" y="78" width="86" height="16" rx="8" fill="#8d97a8"/>
    <ellipse cx="118" cy="86" rx="92" ry="36" fill="#5c6778"/>
    <ellipse cx="118" cy="80" rx="78" ry="28" fill="#3e4654"/>
    <g data-roast fill="#f8e7a8">
      ${Array.from({ length: 18 }, (_, i) => {
        const x = 62 + (i % 6) * 20;
        const y = 70 + Math.floor(i / 6) * 14;
        return `<ellipse class="roast-seed" cx="${x}" cy="${y}" rx="7" ry="4" transform="rotate(${i * 20} ${x} ${y})" fill="currentColor"/>`;
      }).join("")}
    </g>
    <g data-steam fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0">
      <path d="M78 48c8-12 8-12 0-24"/>
      <path d="M118 44c10-14 10-14 0-28"/>
      <path d="M156 50c8-12 8-12 0-22"/>
    </g>
  </svg>`;
}

export function bowlSvg() {
  return `<svg class="bowl" viewBox="0 0 200 120" aria-hidden="true">
    <ellipse cx="100" cy="108" rx="70" ry="8" fill="rgba(70,20,60,.18)"/>
    <path d="M30 48 h140 l-16 48 a54 20 0 0 1 -108 0z" fill="#7c4dff"/>
    <ellipse cx="100" cy="48" rx="70" ry="22" fill="#ff4d8d"/>
    <ellipse cx="100" cy="48" rx="58" ry="16" fill="#ffd1e4"/>
    <circle cx="78" cy="46" r="7" fill="#ff8a1e"/>
    <circle cx="100" cy="40" r="7" fill="#7dff6b"/>
    <circle cx="122" cy="46" r="7" fill="#ffe56a"/>
    <rect x="90" y="44" width="12" height="8" rx="2" fill="#8ec5ff"/>
  </svg>`;
}

export function kidsSvg() {
  const kids = [
    { hat: "witch", body: "#7c4dff", x: 70 },
    { hat: "ghost", body: "#f4f7ff", x: 210 },
    { hat: "cape", body: "#ff4d8d", x: 350 },
    { hat: "stem", body: "#ff8a1e", x: 490 },
  ];
  const figures = kids
    .map((kid, i) => {
      const hat =
        kid.hat === "witch"
          ? `<polygon points="0,-78 28,-28 -28,-28" fill="#2a1240"/><rect x="-30" y="-32" width="60" height="8" rx="3" fill="#2a1240"/>`
          : kid.hat === "ghost"
            ? `<path d="M-32 -8 q32 -70 64 0 v48 l-10 -8 -10 8 -12 -8 -12 8 -10 -8 -10 8z" fill="#f7fbff" stroke="#d5def0"/>`
            : kid.hat === "cape"
              ? `<path d="M-36 -10 q36 -20 72 0 l-8 70 h-56z" fill="#6a1238"/>`
              : `<rect x="-16" y="-70" width="32" height="16" rx="6" fill="#46c24d"/><path d="M0 -70c8-16 18-16 18-6" fill="none" stroke="#2f9e3a" stroke-width="4" stroke-linecap="round"/>`;
      const face =
        kid.hat === "ghost"
          ? `<circle cx="-8" cy="6" r="4" fill="#3a1458"/><circle cx="10" cy="6" r="4" fill="#3a1458"/>`
          : `<circle cx="-8" cy="-8" r="3" fill="#3a1458"/><circle cx="8" cy="-8" r="3" fill="#3a1458"/><path d="M-8 2 q8 8 16 0" fill="none" stroke="#3a1458" stroke-width="2"/>`;
      return `<g data-kid="${i}" transform="translate(${kid.x} 150)">
        <g class="kid-bob">
          ${kid.hat === "cape" ? hat : ""}
          <rect x="-26" y="-6" width="52" height="58" rx="16" fill="${kid.body}"/>
          <circle cx="0" cy="-24" r="22" fill="#ffd7b5"/>
          ${kid.hat === "ghost" ? "" : face}
          ${kid.hat === "ghost" || kid.hat === "cape" ? "" : hat}
          ${kid.hat === "ghost" ? `${hat}${face}` : ""}
        </g>
      </g>`;
    })
    .join("");
  return `<svg class="kids" viewBox="0 0 560 230" aria-hidden="true">
    <ellipse cx="280" cy="214" rx="250" ry="14" fill="rgba(70,20,60,.15)"/>
    ${figures}
  </svg>`;
}

export function houseSvg() {
  return `<svg class="house" viewBox="0 0 640 420" aria-hidden="true">
    <defs>
      <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8a6bff"/>
        <stop offset="55%" stop-color="#5b4bff"/>
        <stop offset="100%" stop-color="#c86bff"/>
      </linearGradient>
    </defs>
    <rect width="640" height="420" fill="url(#night)"/>
    <circle cx="520" cy="78" r="36" fill="#ffe98a"/>
    <circle cx="92" cy="54" r="2" fill="#fff"/><circle cx="140" cy="90" r="1.6" fill="#fff"/>
    <circle cx="250" cy="48" r="1.8" fill="#fff"/><circle cx="400" cy="70" r="1.5" fill="#fff"/>
    <ellipse cx="320" cy="390" rx="340" ry="70" fill="#63c94a"/>
    <ellipse cx="320" cy="360" rx="300" ry="36" fill="#7ed957"/>
    <path d="M250 300 h140 l-20 36 h-100z" fill="#e7b15a"/>
    <path d="M300 250 l20 86" fill="none" stroke="#f0c36e" stroke-width="28" stroke-linecap="round"/>
    <rect x="176" y="168" width="288" height="132" rx="8" fill="#fff1d6"/>
    <polygon points="160,176 320,78 480,176" fill="#ff4d8d"/>
    <rect x="292" y="214" width="56" height="86" rx="6" fill="#7c4dff"/>
    <circle cx="336" cy="258" r="3" fill="#ffe56a"/>
    <rect x="206" y="196" width="52" height="44" rx="6" fill="#8ec5ff" stroke="#fff6e4" stroke-width="4"/>
    <rect x="382" y="196" width="52" height="44" rx="6" fill="#8ec5ff" stroke="#fff6e4" stroke-width="4"/>
    <rect x="230" y="196" width="4" height="44" fill="#fff6e4"/><rect x="206" y="216" width="52" height="4" fill="#fff6e4"/>
    <rect x="406" y="196" width="4" height="44" fill="#fff6e4"/><rect x="382" y="216" width="52" height="4" fill="#fff6e4"/>
    <rect x="430" y="132" width="28" height="52" fill="#ffb703"/>
    <ellipse cx="120" cy="300" rx="46" ry="22" fill="#2f9e3a"/>
    <ellipse cx="530" cy="304" rx="50" ry="24" fill="#2f9e3a"/>
  </svg>`;
}

export function mixHex(from, to, t) {
  const parse = (hex) => {
    const n = hex.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  };
  const a = parse(from);
  const b = parse(to);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
