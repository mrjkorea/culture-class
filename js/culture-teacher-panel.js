/**
 * Teacher "Start from here" panel — opened from the mrj-auth Teacher chip (top right).
 */
import { MAP_LESSON_STEPS } from "./month-themes.js";
import { dataUrl } from "./paths.js";
import {
  currentStudentKey,
  listOpenSections,
  persistTeacherPath,
  relockMonth,
  relockStep,
  relockWordGroup,
  startFromStep,
  startFromWordGroup,
  unlockMonth,
  unlockStep,
  unlockWordGroupOnly,
  isTeacherMonthUnlocked,
  isTeacherStepUnlocked,
  isTeacherWordGroupUnlocked,
  notifyTeacherPathChanged,
  groupStartsForWordCount,
  alignedWordGroup,
} from "./culture-teacher-unlock.js";

let panelOpen = false;
let skipChipCapture = false;
let monthsCache = null;

function authApi() {
  return window.MRJ_AUTH || window.MRJSignin || null;
}

function teacherActive() {
  try {
    const auth = authApi();
    return !!(auth && typeof auth.isTeacher === "function" && auth.isTeacher());
  } catch {
    return false;
  }
}

function ensureShell() {
  let host = document.getElementById("teacher-start-panel-root");
  if (host) return host;
  host = document.createElement("div");
  host.id = "teacher-start-panel-root";
  host.hidden = true;
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);
  return host;
}

function closePanel() {
  panelOpen = false;
  const host = ensureShell();
  host.hidden = true;
  host.setAttribute("aria-hidden", "true");
  host.innerHTML = "";
  document.body.classList.remove("teacher-start-panel-open");
}

async function loadMonths() {
  if (monthsCache) return monthsCache;
  const res = await fetch(dataUrl("months.json"));
  if (!res.ok) throw new Error("months.json");
  monthsCache = (await res.json()).months || [];
  return monthsCache;
}

function stepLabel(stepId) {
  return MAP_LESSON_STEPS.find((s) => s.id === stepId)?.label || stepId;
}

async function renderPanel(contextMonthId) {
  if (!teacherActive()) {
    closePanel();
    return;
  }
  const studentId = currentStudentKey();
  const host = ensureShell();
  host.hidden = false;
  host.setAttribute("aria-hidden", "false");
  document.body.classList.add("teacher-start-panel-open");
  host.innerHTML = "";

  const backdrop = document.createElement("button");
  backdrop.type = "button";
  backdrop.className = "teacher-start-backdrop";
  backdrop.setAttribute("aria-label", "Close");
  backdrop.addEventListener("click", closePanel);

  const dialog = document.createElement("div");
  dialog.className = "teacher-start-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", "Teacher unlock");

  const header = document.createElement("div");
  header.className = "teacher-start-header";
  const title = document.createElement("h2");
  title.textContent = "Start from here";
  const sub = document.createElement("p");
  sub.className = "teacher-start-sub";
  sub.textContent = "Student: " + studentId;
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "teacher-start-close";
  closeBtn.textContent = "×";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.addEventListener("click", closePanel);
  header.appendChild(title);
  header.appendChild(sub);
  header.appendChild(closeBtn);

  const body = document.createElement("div");
  body.className = "teacher-start-body";

  const open = listOpenSections();
  if (open.startAt) {
    const startLine = document.createElement("p");
    startLine.className = "teacher-start-note";
    const wg =
      open.startAt.wordGroup != null
        ? ` · words from ${open.startAt.wordGroup}`
        : "";
    startLine.textContent = `Start: Month ${open.startAt.monthId} · ${stepLabel(open.startAt.stepId)}${wg}`;
    body.appendChild(startLine);
  }

  function addSection(titleText, listEl) {
    const sec = document.createElement("section");
    sec.className = "teacher-start-section";
    const h = document.createElement("h3");
    h.textContent = titleText;
    sec.appendChild(h);
    sec.appendChild(listEl);
    body.appendChild(sec);
  }

  async function persistRefresh() {
    await persistTeacherPath();
    notifyTeacherPathChanged();
    void renderPanel(contextMonthId);
  }

  let months = [];
  try {
    months = await loadMonths();
  } catch {
    months = [];
  }

  const monthList = document.createElement("ul");
  monthList.className = "teacher-start-list";
  months.forEach((m) => {
    const on = isTeacherMonthUnlocked(m.id);
    const li = document.createElement("li");
    const row = document.createElement("div");
    row.className = "teacher-start-row";
    const label = document.createElement("span");
    label.textContent = `Month ${m.id} · ${m.name}` + (on ? " · open" : "");
    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "teacher-start-action";
    openBtn.textContent = on ? "Re-lock" : "Open month";
    openBtn.addEventListener("click", () => {
      if (on) relockMonth(m.id);
      else unlockMonth(m.id);
      void persistRefresh();
    });
    row.appendChild(label);
    row.appendChild(openBtn);
    li.appendChild(row);
    monthList.appendChild(li);
  });
  addSection("Months", monthList);

  const focusMonth = String(contextMonthId || open.startAt?.monthId || "10").padStart(2, "0");
  const pathList = document.createElement("ul");
  pathList.className = "teacher-start-list";
  MAP_LESSON_STEPS.forEach((step) => {
    const on = isTeacherStepUnlocked(focusMonth, step.id);
    const li = document.createElement("li");
    const row = document.createElement("div");
    row.className = "teacher-start-row";
    const label = document.createElement("span");
    label.textContent = stepLabel(step.id) + (on ? " · open" : "");
    const startBtn = document.createElement("button");
    startBtn.type = "button";
    startBtn.className = "teacher-start-action primary";
    startBtn.textContent = "Start here";
    startBtn.addEventListener("click", () => {
      startFromStep(focusMonth, step.id);
      void persistRefresh();
    });
    const lockBtn = document.createElement("button");
    lockBtn.type = "button";
    lockBtn.className = "teacher-start-action";
    lockBtn.textContent = on ? "Re-lock" : "Open only";
    lockBtn.addEventListener("click", () => {
      if (on) relockStep(focusMonth, step.id);
      else unlockStep(focusMonth, step.id);
      void persistRefresh();
    });
    row.appendChild(label);
    row.appendChild(startBtn);
    row.appendChild(lockBtn);
    li.appendChild(row);
    pathList.appendChild(li);
  });
  addSection(`Map steps (month ${focusMonth})`, pathList);

  const wordCount = 16;
  const groupList = document.createElement("ul");
  groupList.className = "teacher-start-list";
  groupStartsForWordCount(wordCount).forEach((startN) => {
    const endN = Math.min(startN + 4, wordCount);
    const onG = isTeacherWordGroupUnlocked(focusMonth, startN);
    const liG = document.createElement("li");
    const rowG = document.createElement("div");
    rowG.className = "teacher-start-row";
    const labelG = document.createElement("span");
    labelG.textContent = `Words ${startN}–${endN}` + (onG ? " · open" : "");
    const startBtnG = document.createElement("button");
    startBtnG.type = "button";
    startBtnG.className = "teacher-start-action primary";
    startBtnG.textContent = "Start here";
    startBtnG.addEventListener("click", () => {
      startFromWordGroup(focusMonth, startN);
      void persistRefresh();
    });
    const lockBtnG = document.createElement("button");
    lockBtnG.type = "button";
    lockBtnG.className = "teacher-start-action";
    lockBtnG.textContent = onG ? "Re-lock" : "Open only";
    lockBtnG.addEventListener("click", () => {
      if (onG) relockWordGroup(focusMonth, startN);
      else unlockWordGroupOnly(focusMonth, alignedWordGroup(startN));
      void persistRefresh();
    });
    rowG.appendChild(labelG);
    rowG.appendChild(startBtnG);
    rowG.appendChild(lockBtnG);
    liG.appendChild(rowG);
    groupList.appendChild(liG);
  });
  addSection(`Word groups · month ${focusMonth} (every 5 words)`, groupList);

  const footer = document.createElement("div");
  footer.className = "teacher-start-footer";
  const exitBtn = document.createElement("button");
  exitBtn.type = "button";
  exitBtn.className = "teacher-start-action";
  exitBtn.textContent = "Exit teacher mode";
  exitBtn.addEventListener("click", () => {
    closePanel();
    skipChipCapture = true;
    const chip = document.querySelector(".mrj-auth-teacher-btn");
    if (chip) chip.click();
    skipChipCapture = false;
  });
  footer.appendChild(exitBtn);

  dialog.appendChild(header);
  dialog.appendChild(body);
  dialog.appendChild(footer);
  host.appendChild(backdrop);
  host.appendChild(dialog);
}

function openPanel(contextMonthId) {
  if (!teacherActive()) return;
  panelOpen = true;
  void renderPanel(contextMonthId);
}

function togglePanel(contextMonthId) {
  if (panelOpen) closePanel();
  else openPanel(contextMonthId);
}

function onChipClickCapture(ev) {
  if (skipChipCapture || !teacherActive()) return;
  const t = ev.target;
  if (!t || !t.closest) return;
  if (!t.closest(".mrj-auth-teacher-btn")) return;
  ev.preventDefault();
  ev.stopPropagation();
  ev.stopImmediatePropagation();
  const monthId = window.CULTURE_MONTH_ID || null;
  togglePanel(monthId);
}

export function installTeacherStartPanel(contextMonthId) {
  if (window.__ccTeacherPanelInstalled) return;
  window.__ccTeacherPanelInstalled = true;
  document.addEventListener("click", onChipClickCapture, true);
  document.addEventListener("mrj-teacher", () => {
    if (teacherActive()) openPanel(contextMonthId || window.CULTURE_MONTH_ID);
  });
  document.addEventListener("keydown", (ev) => {
    if (!panelOpen) return;
    if (ev && (ev.key === "Escape" || ev.key === "Esc")) closePanel();
  });
}

export function mountTeacherStartHereButton(container, { monthId, stepId, label = "Start here" }) {
  if (!container || !teacherActive()) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "teacher-start-here-btn";
  btn.textContent = label;
  btn.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    startFromStep(monthId, stepId);
    void persistTeacherPath().then(() => notifyTeacherPathChanged());
  });
  container.appendChild(btn);
}

export function isTeacherUiActive() {
  return teacherActive();
}
