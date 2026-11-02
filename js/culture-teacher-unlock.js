/**
 * Teacher-granted unlocks for Culture Class (per signed-in student).
 * Persisted in localStorage and synced to AppProgress (program culture-class) when MRJ auth is available.
 *
 * Gate (js/path-lock.js): open if UNLOCK_ALL OR progress OR teacher-unlocked.
 */
import { MAP_LESSON_STEPS } from "./month-themes.js";

const PROGRAM = "culture-class";
const LOCAL_PREFIX = "culture-class-teacher-path-";
const CLOUD_V = 1;

/** @typedef {{ months: Record<string, boolean>, steps: Record<string, boolean>, wordGroups: Record<string, boolean>, startAt: { monthId: string, stepId: string, wordGroup: number|null }|null }} TeacherPathState */

function globalWin() {
  return typeof window !== "undefined" ? window : null;
}

function authApi() {
  const w = globalWin();
  if (!w) return null;
  return w.MRJ_AUTH || w.MRJSignin || null;
}

export function currentStudentKey() {
  try {
    const a = authApi();
    const id = a && typeof a.student === "function" ? String(a.student() || "").trim() : "";
    if (id) return id.slice(0, 64);
  } catch {
    /* ignore */
  }
  try {
    const guest = localStorage.getItem("culture-class-display-name");
    if (guest) return `guest:${guest.slice(0, 32)}`;
  } catch {
    /* ignore */
  }
  return "_device";
}

function emptyState() {
  return { months: {}, steps: {}, wordGroups: {}, startAt: null };
}

function normState(raw) {
  const out = emptyState();
  if (!raw || typeof raw !== "object") return out;
  if (raw.months && typeof raw.months === "object") {
    Object.keys(raw.months).forEach((k) => {
      if (raw.months[k]) out.months[String(k).padStart(2, "0")] = true;
    });
  }
  if (raw.steps && typeof raw.steps === "object") {
    Object.keys(raw.steps).forEach((k) => {
      if (raw.steps[k]) out.steps[String(k)] = true;
    });
  }
  if (raw.wordGroups && typeof raw.wordGroups === "object") {
    Object.keys(raw.wordGroups).forEach((k) => {
      if (raw.wordGroups[k]) out.wordGroups[String(k)] = true;
    });
  }
  if (raw.startAt && typeof raw.startAt === "object") {
    const mid = String(raw.startAt.monthId || "").padStart(2, "0");
    const sid = String(raw.startAt.stepId || "").trim();
    const wg = Number(raw.startAt.wordGroup);
    if (mid && sid) {
      out.startAt = {
        monthId: mid,
        stepId: sid,
        wordGroup: Number.isFinite(wg) && wg >= 1 ? alignedWordGroup(wg) : null,
      };
    }
  }
  return out;
}

export function stepKey(monthId, stepId) {
  return `${String(monthId || "").padStart(2, "0")}:${String(stepId || "").trim()}`;
}

export function wordGroupKey(monthId, startN) {
  return `${String(monthId || "").padStart(2, "0")}:${alignedWordGroup(startN)}`;
}

/** Word Master rule: groups start at 1, 6, 11, … (every 5 words). */
export function alignedWordGroup(startNumber) {
  const start = Math.floor(Number(startNumber));
  if (!(start >= 1)) return 1;
  return Math.floor((start - 1) / 5) * 5 + 1;
}

export function groupStartsForWordCount(total) {
  const n = Math.max(0, Math.floor(Number(total) || 0));
  const out = [];
  for (let i = 1; i <= n; i += 5) out.push(i);
  return out;
}

let cacheKey = "";
/** @type {TeacherPathState} */
let cache = emptyState();
let cloudLoaded = false;
let saveTimer = 0;

function localKey(studentKey) {
  return LOCAL_PREFIX + (studentKey || "_device");
}

export function getTeacherPathState() {
  return normState(cache);
}

export function loadTeacherPathForStudent(studentKey) {
  const key = studentKey || currentStudentKey();
  if (key === cacheKey && cache) return getTeacherPathState();
  cacheKey = key;
  try {
    const raw = localStorage.getItem(localKey(key));
    cache = raw ? normState(JSON.parse(raw)) : emptyState();
  } catch {
    cache = emptyState();
  }
  return getTeacherPathState();
}

function writeLocal() {
  try {
    localStorage.setItem(localKey(cacheKey || currentStudentKey()), JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

function cloudEnvelope() {
  return JSON.stringify({ v: CLOUD_V, teacherPath: cache });
}

export function persistTeacherPath() {
  writeLocal();
  const a = authApi();
  if (!a || typeof a.savePack !== "function" || !a.student || !a.student()) return Promise.resolve();
  if (saveTimer) clearTimeout(saveTimer);
  return new Promise((resolve) => {
    saveTimer = setTimeout(() => {
      saveTimer = 0;
      Promise.resolve(a.savePack(PROGRAM, cloudEnvelope())).then(resolve).catch(resolve);
    }, 400);
  });
}

export function mergeTeacherPathFromCloud(progressJson) {
  if (!progressJson) return getTeacherPathState();
  let parsed = progressJson;
  if (typeof progressJson === "string") {
    try {
      parsed = JSON.parse(progressJson);
    } catch {
      return getTeacherPathState();
    }
  }
  const remote = normState(parsed.teacherPath || parsed);
  cache = normState({
    months: { ...cache.months, ...remote.months },
    steps: { ...cache.steps, ...remote.steps },
    wordGroups: { ...cache.wordGroups, ...remote.wordGroups },
    startAt: remote.startAt || cache.startAt,
  });
  writeLocal();
  return getTeacherPathState();
}

export async function syncTeacherPathFromCloud() {
  const a = authApi();
  const student = a && typeof a.student === "function" ? a.student() : "";
  if (!student || !a.loadPack) return getTeacherPathState();
  loadTeacherPathForStudent(student);
  if (cloudLoaded) return getTeacherPathState();
  try {
    const raw = await a.loadPack(PROGRAM);
    if (raw) mergeTeacherPathFromCloud(raw);
  } catch {
    /* ignore */
  }
  cloudLoaded = true;
  return getTeacherPathState();
}

export function tempUnlockAll() {
  const w = globalWin();
  return !!(w && w.__ccPathUnlockAll);
}

export function isTeacherMonthUnlocked(monthId) {
  if (tempUnlockAll()) return true;
  loadTeacherPathForStudent(currentStudentKey());
  return !!cache.months[String(monthId || "").padStart(2, "0")];
}

export function isTeacherStepUnlocked(monthId, stepId) {
  if (tempUnlockAll()) return true;
  loadTeacherPathForStudent(currentStudentKey());
  return !!cache.steps[stepKey(monthId, stepId)];
}

export function isTeacherWordGroupUnlocked(monthId, startN) {
  if (tempUnlockAll()) return true;
  loadTeacherPathForStudent(currentStudentKey());
  return !!cache.wordGroups[wordGroupKey(monthId, startN)];
}

export function unlockMonth(monthId) {
  loadTeacherPathForStudent(currentStudentKey());
  cache.months[String(monthId || "").padStart(2, "0")] = true;
}

export function relockMonth(monthId) {
  loadTeacherPathForStudent(currentStudentKey());
  delete cache.months[String(monthId || "").padStart(2, "0")];
}

export function unlockStep(monthId, stepId) {
  loadTeacherPathForStudent(currentStudentKey());
  cache.steps[stepKey(monthId, stepId)] = true;
}

export function relockStep(monthId, stepId) {
  loadTeacherPathForStudent(currentStudentKey());
  delete cache.steps[stepKey(monthId, stepId)];
}

export function unlockWordGroupOnly(monthId, startN) {
  loadTeacherPathForStudent(currentStudentKey());
  cache.wordGroups[wordGroupKey(monthId, startN)] = true;
}

export function relockWordGroup(monthId, startN) {
  loadTeacherPathForStudent(currentStudentKey());
  delete cache.wordGroups[wordGroupKey(monthId, startN)];
}

export function startFromStep(monthId, stepId) {
  loadTeacherPathForStudent(currentStudentKey());
  const mid = String(monthId || "").padStart(2, "0");
  const sid = String(stepId || "").trim();
  unlockMonth(mid);
  const steps = MAP_LESSON_STEPS;
  const idx = steps.findIndex((s) => s.id === sid);
  for (let i = 0; i <= idx; i++) {
    if (steps[i]) cache.steps[stepKey(mid, steps[i].id)] = true;
  }
  cache.startAt = { monthId: mid, stepId: sid, wordGroup: cache.startAt?.wordGroup ?? null };
}

export function startFromWordGroup(monthId, startN) {
  loadTeacherPathForStudent(currentStudentKey());
  const mid = String(monthId || "").padStart(2, "0");
  const aligned = alignedWordGroup(startN);
  unlockWordGroupOnly(mid, aligned);
  cache.startAt = {
    monthId: mid,
    stepId: cache.startAt?.stepId || "meet",
    wordGroup: aligned,
  };
}

export function listOpenSections() {
  loadTeacherPathForStudent(currentStudentKey());
  return {
    months: Object.keys(cache.months).sort(),
    steps: Object.keys(cache.steps).sort(),
    wordGroups: Object.keys(cache.wordGroups).sort(),
    startAt: cache.startAt,
  };
}

export function onTeacherPathChanged(cb) {
  const w = globalWin();
  if (!w || typeof cb !== "function") return;
  w.addEventListener("culture-teacher-path-changed", () => {
    try {
      cb();
    } catch {
      /* ignore */
    }
  });
}

export function notifyTeacherPathChanged() {
  const w = globalWin();
  if (!w) return;
  w.dispatchEvent(new CustomEvent("culture-teacher-path-changed"));
}

export function installTeacherPathAuthSync() {
  const w = globalWin();
  if (!w || w.__ccTeacherPathAuthSync) return;
  w.__ccTeacherPathAuthSync = true;
  const reload = () => {
    cloudLoaded = false;
    loadTeacherPathForStudent(currentStudentKey());
    void syncTeacherPathFromCloud().then(() => notifyTeacherPathChanged());
  };
  if (typeof w.addEventListener === "function") {
    w.addEventListener("mrj-auth-ready", reload);
  }
  w.document?.addEventListener?.("mrj-auth-ready", reload);
}

if (typeof window !== "undefined") {
  window.CCTeacherStart = {
    alignedWordGroup,
    groupStartsForWordCount,
    getTeacherPathState,
    loadTeacherPathForStudent,
    persistTeacherPath,
    isTeacherMonthUnlocked,
    isTeacherStepUnlocked,
    isTeacherWordGroupUnlocked,
    unlockMonth,
    relockMonth,
    unlockStep,
    relockStep,
    unlockWordGroupOnly,
    relockWordGroup,
    startFromStep,
    startFromWordGroup,
    listOpenSections,
    stepKey,
    wordGroupKey,
    currentStudentKey,
  };
  installTeacherPathAuthSync();
}
