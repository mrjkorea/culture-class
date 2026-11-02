/**
 * Culture Class — month hub + sequential activity path locks.
 * Jay: temporary UNLOCK_ALL until teacher unlock UI is proven in class — set UNLOCK_ALL false to enforce gates.
 */
import { MAP_LESSON_STEPS } from "./month-themes.js";
import { isStepDone } from "./month-progress.js";
import { homeUrl, monthPageUrl } from "./paths.js";
import { escapeHtml } from "./words-data.js";
import {
  isTeacherMonthUnlocked,
  isTeacherStepUnlocked,
} from "./culture-teacher-unlock.js";

/** Set false when teacher unlock UI is ready for production gating. */
export const UNLOCK_ALL = true;

const RELEASED_MONTH_KEY = "culture-class-path-released-month";

if (typeof window !== "undefined") {
  window.__ccPathUnlockAll = UNLOCK_ALL;
}

/** @deprecated Teacher mode no longer bypasses all locks; use per-section teacher unlocks. */
export function isTeacherPathUnlocked() {
  try {
    return !!(window.MRJTeacherUnlock && window.MRJTeacherUnlock.isUnlocked());
  } catch {
    return false;
  }
}

export function pathLocksActive() {
  return !UNLOCK_ALL;
}

export function getReleasedMonthId() {
  try {
    const stored = localStorage.getItem(RELEASED_MONTH_KEY);
    if (stored && /^\d{2}$/.test(stored)) return stored;
  } catch {
    /* ignore */
  }
  return String(new Date().getMonth() + 1).padStart(2, "0");
}

export function isMonthPathOpen(monthId) {
  if (!pathLocksActive()) return true;
  if (isTeacherMonthUnlocked(monthId)) return true;
  const released = parseInt(getReleasedMonthId(), 10);
  const target = parseInt(String(monthId || "").padStart(2, "0"), 10);
  if (!Number.isFinite(target)) return false;
  return target <= released;
}

function stepOrder(stepId) {
  const steps = MAP_LESSON_STEPS;
  const idx = steps.findIndex((s) => s.id === stepId);
  return idx >= 0 ? idx : steps.length;
}

export function isActivityPathOpen(monthId, stepId) {
  if (!pathLocksActive()) return true;
  if (!isMonthPathOpen(monthId)) return false;
  if (isTeacherStepUnlocked(monthId, stepId)) return true;
  const steps = MAP_LESSON_STEPS;
  const idx = steps.findIndex((s) => s.id === stepId);
  if (idx <= 0) return true;
  const priorId = steps[idx - 1].id;
  return isStepDone(monthId, priorId);
}

export function priorStepId(stepId) {
  const steps = MAP_LESSON_STEPS;
  const idx = steps.findIndex((s) => s.id === stepId);
  if (idx <= 0) return null;
  return steps[idx - 1].id;
}

export function stepLabel(stepId) {
  return MAP_LESSON_STEPS.find((s) => s.id === stepId)?.label || stepId;
}

/**
 * @returns {boolean} true when the page should stop loading (locked).
 */
export function blockIfActivityLocked(appEl, month, stepId) {
  if (!pathLocksActive() || !month || !stepId) return false;
  if (isActivityPathOpen(month.id, stepId)) return false;

  const back = monthPageUrl(month.slug);
  const need = priorStepId(stepId);
  const needLabel = need ? stepLabel(need) : "the previous step";

  if (appEl) {
    appEl.innerHTML = `
      <div class="wrap path-lock-screen">
        <a class="back-link" href="${escapeHtml(back)}">← Map</a>
        <div class="placeholder-box path-lock-box">
          <h2>🔒 Step locked</h2>
          <p>Finish <strong>${escapeHtml(needLabel)}</strong> on the map first, or ask your teacher to unlock.</p>
          <p><a class="btn btn-primary" href="${escapeHtml(back)}">Back to ${escapeHtml(month.name)} map</a></p>
        </div>
      </div>`;
  }
  document.title = `Culture Class — locked`;
  return true;
}

/**
 * @returns {boolean} true when the month hub should not load (locked).
 */
export function blockIfMonthLocked(appEl, month) {
  if (!pathLocksActive() || !month) return false;
  if (isMonthPathOpen(month.id)) return false;

  if (appEl) {
    appEl.innerHTML = `
      <div class="wrap path-lock-screen">
        <a class="back-link" href="${escapeHtml(homeUrl())}">← All months</a>
        <div class="placeholder-box path-lock-box">
          <h2>🔒 Month locked</h2>
          <p><strong>${escapeHtml(month.name)}</strong> is not open yet. Ask your teacher to unlock this month.</p>
        </div>
      </div>`;
  }
  document.title = `Culture Class — locked`;
  return true;
}
