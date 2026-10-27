import { MAP_LESSON_STEPS } from "./month-themes.js";

const PREFIX = "culture-class-step-done-";

/** @deprecated use MAP_LESSON_STEPS */
export const OCTOBER_STEPS = MAP_LESSON_STEPS.map((s) =>
  s.id === "craft" ? { ...s, emoji: "🎃" } : { ...s }
);

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
