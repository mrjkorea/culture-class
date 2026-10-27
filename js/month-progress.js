const PREFIX = "culture-class-step-done-";

export const OCTOBER_STEPS = [
  { id: "video", label: "Daily video", short: "Video", emoji: "📺", x: 10, y: 92 },
  { id: "quiz", label: "Daily quiz", short: "Quiz", emoji: "❓", x: 22, y: 78 },
  { id: "meet", label: "Meet the words", short: "Meet", emoji: "👋", x: 38, y: 88 },
  { id: "learn", label: "Learn", short: "Learn", emoji: "📚", x: 58, y: 68 },
  { id: "memory", label: "Memory", short: "Memory", emoji: "🎴", x: 76, y: 50 },
  { id: "climb", label: "Mountain Climb", short: "Climb", emoji: "🧗", x: 88, y: 34 },
  { id: "cp", label: "CP Speak", short: "CP", emoji: "🎤", x: 72, y: 18 },
  { id: "craft", label: "Craft", short: "Craft", emoji: "🎃", x: 48, y: 10 },
  { id: "bingo", label: "Bingo", short: "Bingo", emoji: "🎱", x: 22, y: 18 },
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
