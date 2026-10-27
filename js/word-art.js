/** Bright emoji/SVG-style art for words without photos (October Halloween set). */
const EMOJI = {
  pumpkin: "🎃",
  broom: "🧹",
  "jack-o-lantern": "🎃",
  "haunted house": "🏚️",
  witch: "🧙‍♀️",
  "black cat": "🐈‍⬛",
  "fortune teller": "🔮",
  "trick or treat!": "🍬",
  candle: "🕯️",
  autumn: "🍂",
  costume: "🦸",
  mask: "🎭",
  skeleton: "💀",
  carve: "🔪",
  ghost: "👻",
  bones: "🦴",
  pirate: "🏴‍☠️",
  mummy: "🧟",
  vampire: "🧛",
  werewolf: "🐺",
  "full moon": "🌕",
  decorations: "🎀",
  monster: "👹",
  graveyard: "⚰️",
  wizard: "🧙",
  zombie: "🧟‍♂️",
  goblin: "👺",
  devil: "😈",
  bat: "🦇",
  trick: "🃏",
  potion: "🧪",
  october: "📅",
  halloween: "🎃",
  candy: "🍭",
  spider: "🕷️",
  cauldron: "⚗️",
  scare: "😱",
  haunt: "👻",
  "candy corn": "🌽",
};

function normKey(term) {
  return String(term || "").trim().toLowerCase();
}

export function wordArtEmoji(term) {
  return EMOJI[normKey(term)] || "✨";
}

export function wordArtHtml(term, className = "word-art") {
  const emoji = wordArtEmoji(term);
  return `<div class="${className}" aria-hidden="true"><span class="word-art-emoji">${emoji}</span></div>`;
}
