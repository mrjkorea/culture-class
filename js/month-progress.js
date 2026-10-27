const PREFIX = "culture-class-step-done-";

export const OCTOBER_STEPS = [
  { id: "video", label: "Daily video", short: "Video", emoji: "📺", x: 14, y: 86 },
  { id: "quiz", label: "Daily quiz", short: "Quiz", emoji: "❓", x: 26, y: 74 },
  { id: "meet", label: "Meet the words", short: "Meet", emoji: "👋", x: 38, y: 82 },
  { id: "match", label: "Match", short: "Match", emoji: "🧩", x: 50, y: 68 },
  { id: "learn", label: "Learn", short: "Learn", emoji: "📚", x: 54, y: 54 },
  { id: "memory", label: "Memory", short: "Memory", emoji: "🎴", x: 62, y: 42 },
  { id: "climb", label: "Mountain Climb", short: "Climb", emoji: "🧗", x: 56, y: 28 },
  { id: "cp", label: "CP Speak", short: "CP", emoji: "🎤", x: 44, y: 18 },
  { id: "craft", label: "Craft", short: "Craft", emoji: "🎃", x: 32, y: 12 },
  { id: "bingo", label: "Bingo", short: "Bingo", emoji: "🎱", x: 72, y: 16 },
];

function key(monthId, stepId) {
  return `${PREFIX}${monthId}-${stepId}`;
}

export function isStepDone(monthId, stepId) {
  try {
    return localStorage.getItem(key(monthId, stepId)) === "1";
  } catch {
    return false;
  }
}

export function setStepDone(monthId, stepId) {
  try {
    localStorage.setItem(key(monthId, stepId), "1");
  } catch {
    /* ignore */
  }
}

export function firstIncompleteStep(monthId, steps = OCTOBER_STEPS) {
  return steps.find((s) => !isStepDone(monthId, s.id)) || steps[steps.length - 1];
}

export function nextStepAfter(monthId, stepId, steps = OCTOBER_STEPS) {
  const i = steps.findIndex((s) => s.id === stepId);
  if (i < 0 || i >= steps.length - 1) return null;
  return steps[i + 1];
}
