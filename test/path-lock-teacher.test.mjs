/**
 * Gate logic tests for Culture Class teacher unlock storage (simulates UNLOCK_ALL off via __ccPathUnlockAll).
 */
import assert from "node:assert/strict";

const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
};
globalThis.window = globalThis;
globalThis.document = { addEventListener() {} };
globalThis.__ccPathUnlockAll = false;

const teacher = await import("../js/culture-teacher-unlock.js");

teacher.loadTeacherPathForStudent("test-student");
teacher.unlockMonth("11");
teacher.unlockStep("11", "quiz");

assert.equal(teacher.isTeacherMonthUnlocked("11"), true);
assert.equal(teacher.isTeacherMonthUnlocked("12"), false);
assert.equal(teacher.isTeacherStepUnlocked("11", "quiz"), true);
assert.equal(teacher.isTeacherStepUnlocked("11", "meet"), false);

teacher.startFromStep("11", "meet");
assert.equal(teacher.isTeacherStepUnlocked("11", "meet"), true);
assert.equal(teacher.isTeacherStepUnlocked("11", "video"), true);

teacher.startFromWordGroup("11", 6);
assert.equal(teacher.isTeacherWordGroupUnlocked("11", 6), true);
assert.equal(teacher.alignedWordGroup(7), 6);

console.log("path-lock-teacher: ok");
