/**
 * Themed adventure-map months (October parity).
 * Each theme supplies CSS class, map art, path stroke, and craft step emoji.
 */

export const MAP_LESSON_STEPS = [
  { id: "video", label: "Daily video", short: "Video", emoji: "📺", x: 10, y: 92 },
  { id: "quiz", label: "Daily quiz", short: "Quiz", emoji: "❓", x: 22, y: 78 },
  { id: "meet", label: "Meet the words", short: "Meet", emoji: "👋", x: 38, y: 88 },
  { id: "learn", label: "Learn", short: "Learn", emoji: "📚", x: 58, y: 68 },
  { id: "memory", label: "Memory", short: "Memory", emoji: "🎴", x: 76, y: 50 },
  { id: "climb", label: "Mountain Climb", short: "Climb", emoji: "🧗", x: 88, y: 34 },
  { id: "cp", label: "CP Speak", short: "CP", emoji: "🎤", x: 72, y: 18 },
  { id: "craft", label: "Craft", short: "Craft", emoji: "🎨", x: 48, y: 10 },
  { id: "bingo", label: "Bingo", short: "Bingo", emoji: "🎱", x: 22, y: 18 },
];

const THEMES = {
  halloween: {
    bodyClass: "halloween-theme",
    cssHref: "assets/css/halloween.css",
    mapImage: "assets/covers/10-halloween-map.jpg",
    pathD:
      "M10,92 C18,84 24,80 22,78 C28,74 34,86 38,88 C46,80 52,74 58,68 C64,62 70,56 76,50 C82,44 86,38 88,34 C84,28 78,22 72,18 C62,14 52,11 48,10 C38,12 28,14 22,18",
    pathStroke: "rgba(255,220,120,0.55)",
    craftEmoji: "🎃",
    memoryCardBack: "halloween",
  },
  newyear: {
    bodyClass: "theme-newyear",
    cssHref: "assets/css/january.css",
    mapImage: "assets/covers/01-newyear-map.jpg",
    pathD:
      "M8,90 C14,82 20,76 26,78 C32,72 40,84 46,86 C54,78 62,70 70,62 C78,54 84,46 90,38 C86,30 80,22 72,16 C60,12 48,10 40,12 C30,14 20,16 14,20",
    pathStroke: "rgba(255,215,100,0.6)",
    craftEmoji: "🎉",
    memoryCardBack: "newyear",
  },
  valentine: {
    bodyClass: "theme-valentine",
    cssHref: "assets/css/valentine.css",
    mapImage: "assets/covers/02-valentine-map.jpg",
    pathD: MAP_LESSON_STEPS.map((s) => `${s.x},${100 - s.y}`).join(" L "),
    pathStroke: "rgba(255,150,180,0.55)",
    craftEmoji: "💌",
    memoryCardBack: "valentine",
  },
  stpatricks: {
    bodyClass: "theme-stpatricks",
    cssHref: "assets/css/stpatricks.css",
    mapImage: "assets/covers/03-march-map.jpg",
    pathD: MAP_LESSON_STEPS.map((s) => `${s.x},${100 - s.y}`).join(" L "),
    pathStroke: "rgba(120,220,120,0.55)",
    craftEmoji: "☘️",
    memoryCardBack: "stpatricks",
  },
  easter: {
    bodyClass: "theme-easter",
    cssHref: "assets/css/easter.css",
    mapImage: "assets/covers/04-april-map.jpg",
    pathD: MAP_LESSON_STEPS.map((s) => `${s.x},${100 - s.y}`).join(" L "),
    pathStroke: "rgba(200,160,255,0.55)",
    craftEmoji: "🥚",
    memoryCardBack: "easter",
  },
  buddhism: {
    bodyClass: "theme-buddhism",
    cssHref: "assets/css/month-theme-shell.css",
    mapImage: "assets/covers/05-may-map.jpg",
    pathD: MAP_LESSON_STEPS.map((s) => `${s.x},${100 - s.y}`).join(" L "),
    pathStroke: "rgba(255,220,150,0.5)",
    craftEmoji: "🪷",
    memoryCardBack: "buddhism",
  },
  remembrance: {
    bodyClass: "theme-remembrance",
    cssHref: "assets/css/month-theme-shell.css",
    mapImage: "assets/covers/06-june-map.jpg",
    pathD: MAP_LESSON_STEPS.map((s) => `${s.x},${100 - s.y}`).join(" L "),
    pathStroke: "rgba(200,80,80,0.45)",
    craftEmoji: "🌺",
    memoryCardBack: "remembrance",
  },
  canada: {
    bodyClass: "theme-canada",
    cssHref: "assets/css/month-theme-shell.css",
    mapImage: "assets/covers/07-july-map.jpg",
    pathD: MAP_LESSON_STEPS.map((s) => `${s.x},${100 - s.y}`).join(" L "),
    pathStroke: "rgba(255,80,80,0.55)",
    craftEmoji: "🍁",
    memoryCardBack: "canada",
  },
  koreanhistory: {
    bodyClass: "theme-koreanhistory",
    cssHref: "assets/css/month-theme-shell.css",
    mapImage: "assets/covers/08-august-map.jpg",
    pathD: MAP_LESSON_STEPS.map((s) => `${s.x},${100 - s.y}`).join(" L "),
    pathStroke: "rgba(100,160,255,0.55)",
    craftEmoji: "🏯",
    memoryCardBack: "koreanhistory",
  },
  earthday: {
    bodyClass: "theme-earthday",
    cssHref: "assets/css/month-theme-shell.css",
    mapImage: "assets/covers/09-september-map.jpg",
    pathD: MAP_LESSON_STEPS.map((s) => `${s.x},${100 - s.y}`).join(" L "),
    pathStroke: "rgba(100,200,120,0.55)",
    craftEmoji: "🌍",
    memoryCardBack: "earthday",
  },
  thanksgiving: {
    bodyClass: "theme-thanksgiving",
    cssHref: "assets/css/month-theme-shell.css",
    mapImage: "assets/covers/11-november-map.jpg",
    pathD: MAP_LESSON_STEPS.map((s) => `${s.x},${100 - s.y}`).join(" L "),
    pathStroke: "rgba(255,160,80,0.55)",
    craftEmoji: "🦃",
    memoryCardBack: "thanksgiving",
  },
  christmas: {
    bodyClass: "theme-christmas",
    cssHref: "assets/css/month-theme-shell.css",
    mapImage: "assets/covers/12-december-map.jpg",
    pathD: MAP_LESSON_STEPS.map((s) => `${s.x},${100 - s.y}`).join(" L "),
    pathStroke: "rgba(180,220,255,0.55)",
    craftEmoji: "🎄",
    memoryCardBack: "christmas",
  },
};

const MONTH_LAYOUT = {
  halloween: "halloween",
  newyear: "newyear",
  january: "newyear",
  valentine: "valentine",
  stpatricks: "stpatricks",
  easter: "easter",
  buddhism: "buddhism",
  remembrance: "remembrance",
  canada: "canada",
  koreanhistory: "koreanhistory",
  earthday: "earthday",
  thanksgiving: "thanksgiving",
  christmas: "christmas",
};

/** @param {{ monthLayout?: string, id?: string }} month */
export function resolveThemeKey(month) {
  const layout = month?.monthLayout || "";
  if (layout === "halloween" || month?.id === "10") return "halloween";
  if (MONTH_LAYOUT[layout]) return MONTH_LAYOUT[layout];
  return null;
}

export function getMonthTheme(month) {
  const key = resolveThemeKey(month);
  if (!key) return null;
  const theme = { ...THEMES[key], key };
  if (month?.id === "10" || key === "halloween") {
    theme.craftEmoji = month.craftEmoji || "🎃";
  } else if (month?.craftEmoji) {
    theme.craftEmoji = month.craftEmoji;
  }
  return theme;
}

export function themedMapSteps(month, theme) {
  const steps = MAP_LESSON_STEPS.map((s) => ({ ...s }));
  const craft = steps.find((s) => s.id === "craft");
  if (craft && theme?.craftEmoji) craft.emoji = theme.craftEmoji;
  return steps;
}

export function isThemedMapMonth(month) {
  return Boolean(getMonthTheme(month));
}
