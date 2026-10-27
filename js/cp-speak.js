/**
 * Culture Class CP speak — Decodables-style board (all sentences + word bands).
 */
import {
  bootShared,
  grade,
  DOOR_FAIL_TEXT,
} from "https://mrjkorea.github.io/pronounce/src/shared.js";
import { beginMicTake, cancelMicTake, isCapturing } from "./cp/mic-capture.js";
import {
  escapeHtml,
  getMonthIdFromQuery,
  loadCpPackForMonth,
  monthPageUrl,
} from "./cp-data.js";
import { resolveSrc } from "./words-audio.js";
import { setStepDone } from "./month-progress.js";

const app = document.getElementById("app");
let pack = null;
let month = null;
let index = 0;
let heard = false;
let passedCurrent = false;
let checkerReady = false;
let checkerError = "";
let grading = false;
let audio = new Audio();
let passPct = 60;
/** @type {Record<number, { scorePct: number, pass: boolean, words: object[], doorFail?: boolean }>} */
let rowResults = {};

const THRESHOLDS = { green: 75, yellow: 50 };

function el(id) {
  return document.getElementById(id);
}

function bandFor(pct) {
  return pct >= THRESHOLDS.green ? "green" : pct >= THRESHOLDS.yellow ? "yellow" : "red";
}

function setCheckerProgress(frac, text) {
  const label = el("modelLabel");
  const fill = el("modelFill");
  if (label) label.textContent = text;
  if (fill) fill.style.width = `${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%`;
}

function renderEmpty(message) {
  app.innerHTML = `<p class="placeholder-box">${escapeHtml(message)}</p>`;
}

function englishWordsColored(item, result) {
  const doorFail = result?.doorFail;
  const rawWords = doorFail ? [] : result?.words || [];
  if (!rawWords.length) {
    return escapeHtml(item.english);
  }
  const byWord = new Map();
  for (const w of rawWords) {
    const key = String(w.word || "").toLowerCase();
    const pct = Math.round(Number(w.scorePct ?? w.score * 100) || 0);
    byWord.set(key, w.band || bandFor(pct));
  }
  const tokens = item.english.split(/(\s+)/);
  return tokens
    .map((tok) => {
      if (!tok.trim()) return tok;
      const clean = tok.replace(/[^\w'-]/g, "").toLowerCase();
      const band = byWord.get(clean);
      if (!band) return escapeHtml(tok);
      return `<span class="cp-word cp-word-${band}">${escapeHtml(tok)}</span>`;
    })
    .join("");
}

function renderBoard() {
  const rows = pack.items
    .map((item, i) => {
      const res = rowResults[i];
      const status = res
        ? res.doorFail
          ? "fail"
          : res.pass
            ? "pass"
            : "fail"
        : i === index
          ? "active"
          : "";
      const scoreLine = res && !res.doorFail
        ? `<span class="cp-row-score">${res.pass ? "✓" : "·"} ${res.scorePct}%</span>`
        : "";
      const enHtml = res
        ? `<p class="cp-row-en">${englishWordsColored(item, res)}</p>`
        : `<p class="cp-row-en cp-row-en-muted">${escapeHtml(item.english)}</p>`;
      return `
        <article class="cp-row ${status}" data-i="${i}">
          <div class="cp-row-head">
            <span class="cp-row-num">${i + 1}</span>
            ${scoreLine}
          </div>
          <p class="cp-row-ko">${escapeHtml(item.korean)}</p>
          ${enHtml}
        </article>`;
    })
    .join("");

  return `<div class="cp-board" aria-label="All CP sentences">${rows}</div>`;
}

function renderDone() {
  if (month) setStepDone(month.id, "cp");
  const total = pack.items.length;
  const craft = month?.craftPath ? `../${month.craftPath}` : monthPageUrl(month.slug);
  app.innerHTML = `
    <div class="sheet-row cp-done">
      <h1>All done!</h1>
      <p>You finished all <strong>${total}</strong> CP sentences.</p>
      ${renderBoard()}
      <p class="cp-actions-row">
        <a class="hear" href="${escapeHtml(craft)}">Next: Craft →</a>
        <a class="hear" href="${escapeHtml(monthPageUrl(month.slug))}">Back to map</a>
      </p>
    </div>`;
}

function renderPractice() {
  const item = pack.items[index];
  const total = pack.items.length;
  const pic = item.image
    ? `<img class="row-pic" src="${escapeHtml(resolveSrc(item.image))}" alt="">`
    : "";

  app.innerHTML = `
    ${renderBoard()}
    <div class="sheet-row cp-active-panel">
      <p class="hint">Sentence ${index + 1} / ${total} · pass at ${passPct}% (word colors like Decodables)</p>
      <p class="ko-line">${escapeHtml(item.korean)}</p>
      ${pic}
      <p class="en-line" id="englishReveal" hidden>${escapeHtml(item.english)}</p>
      <div class="cp-actions" style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;margin:.75rem 0">
        <button type="button" class="hear" id="btnHear">Hear English</button>
        <button type="button" class="mic" id="btnSpeak">Speak</button>
      </div>
      <p class="cp-status" id="micStatus">Tap Hear English first.</p>
      <div class="result" id="resultBox" hidden>
        <p class="big-score" id="resultScore"></p>
        <p class="hint" id="resultDetail"></p>
        <p class="cp-graded-line" id="gradedLine"></p>
      </div>
      <div class="cp-nav-row">
        <button type="button" class="hear" id="btnSkip">Skip</button>
        <button type="button" class="hear" id="btnNext" hidden>Next</button>
      </div>
    </div>`;

  app.querySelectorAll(".cp-row").forEach((row) => {
    row.addEventListener("click", () => {
      const i = Number(row.dataset.i);
      if (Number.isFinite(i) && i !== index) {
        index = i;
        passedCurrent = false;
        heard = false;
        updateItemView();
      }
    });
  });

  el("btnHear").addEventListener("click", () => playAudio());
  el("btnSpeak").addEventListener("click", () => toggleMic());
  el("btnNext").addEventListener("click", () => nextItem());
  el("btnSkip").addEventListener("click", () => nextItem(true));
  syncMicButton();
}

function bindVoiceToggle() {
  document.querySelectorAll(".voice-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".voice-btn").forEach((b) => {
        b.classList.toggle("on", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
    });
  });
}

function updateItemView() {
  renderPractice();
}

function audioSrc(item) {
  return resolveSrc(item.audio || item.audio_harper || "");
}

function playAudio() {
  const item = pack.items[index];
  const src = audioSrc(item);
  if (!src) {
    heard = true;
    el("micStatus").textContent = "Audio missing for this sentence — contact your teacher.";
    syncMicButton();
    return;
  }
  audio.pause();
  audio.src = src;
  audio.play().catch(() => {
    el("micStatus").textContent = "Could not play audio — try again.";
  });
  heard = true;
  el("micStatus").textContent = "Now tap Speak and say the sentence in English.";
  syncMicButton();
}

function syncMicButton() {
  const btn = el("btnSpeak");
  if (!btn) return;
  const listening = isCapturing();
  btn.classList.toggle("live", listening);
  btn.textContent = listening ? "Listening…" : "Speak";
  btn.disabled = !checkerReady || grading || listening || (!heard && !listening);
}

async function gradeBlob(blob, item) {
  const candidates = [item.english].concat(item.alts || []);
  let bestOut = null;
  let bestTarget = candidates[0];
  for (const c of candidates) {
    const out = await grade(blob, c, "day4", { passAt: passPct });
    const result = out.result || out;
    if (!bestOut || (result.scorePct || 0) > (bestOut.result?.scorePct || 0)) {
      bestOut = out;
      bestTarget = c;
    }
    if (result.pass) break;
  }
  return { out: bestOut, target: bestTarget };
}

function normalizePageResult(result) {
  const doorFail = !!(result && result.doorFail);
  const rawWords = doorFail ? [] : result?.words || [];
  const words = rawWords.map((w) => {
    const pct = Number(w.scorePct ?? (w.score != null ? w.score * 100 : 0)) || 0;
    return {
      word: w.word,
      scorePct: pct,
      band: w.band || bandFor(pct),
    };
  });
  const scorePct = doorFail ? 0 : Math.round(Number(result?.scorePct) || 0);
  const pass = !doorFail && (result?.pass ?? scorePct >= passPct);
  return { words, scorePct, pass, doorFail };
}

function showGradeResult(result, target, itemIndex) {
  const page = normalizePageResult(result);
  rowResults[itemIndex] = page;
  const doorFail = page.doorFail;
  const score = page.scorePct;
  const pass = page.pass;
  const box = el("resultBox");
  box.hidden = false;
  box.className = "result " + (pass ? "pass" : "fail");
  const graded = el("gradedLine");
  if (graded) {
    graded.innerHTML = englishWordsColored(pack.items[itemIndex], page);
  }
  if (doorFail) {
    el("resultScore").textContent = "Try again";
    el("resultDetail").textContent = DOOR_FAIL_TEXT;
  } else {
    el("resultScore").textContent = (pass ? "✓ " : "") + score + "%";
    const weak = (result.weak || result.missedWords || []).join(", ");
    el("resultDetail").textContent = weak
      ? `“${target}” · practice: ${weak}`
      : `“${target}”`;
  }
  el("englishReveal").hidden = false;
  el("micStatus").textContent = pass
    ? "Passed! Tap Next."
    : doorFail
      ? DOOR_FAIL_TEXT
      : `Under ${passPct}% — Hear English, then Speak again.`;
  const board = app.querySelector(".cp-board");
  if (board) board.outerHTML = renderBoard();
  if (pass) {
    passedCurrent = true;
    el("btnNext").hidden = false;
    el("btnSkip").hidden = true;
    const idxAtPass = index;
    setTimeout(() => {
      if (passedCurrent && index === idxAtPass) nextItem();
    }, 1600);
  }
}

async function toggleMic() {
  if (isCapturing()) {
    cancelMicTake();
    syncMicButton();
    return;
  }
  if (!checkerReady) {
    el("micStatus").textContent = checkerError
      ? "Checker offline — refresh the page."
      : "Checker loading…";
    return;
  }
  if (!heard) {
    el("micStatus").textContent = "Hear English first.";
    return;
  }
  const itemIndex = index;
  const item = pack.items[index];
  el("micStatus").textContent = "Listening… speak in English.";
  syncMicButton();
  try {
    const started = await beginMicTake(async (blob) => {
      syncMicButton();
      if (!blob || index !== itemIndex) return;
      grading = true;
      el("micStatus").textContent = "Checking pronunciation…";
      syncMicButton();
      try {
        const { out, target } = await gradeBlob(blob, item);
        const result = out.result || out;
        if (index === itemIndex) showGradeResult(result, target, itemIndex);
      } catch (err) {
        console.error(err);
        if (index === itemIndex) el("micStatus").textContent = "Checking failed — try again.";
      } finally {
        grading = false;
        syncMicButton();
      }
    });
    if (started) syncMicButton();
  } catch (err) {
    console.error(err);
    el("micStatus").textContent = "Please allow microphone access.";
    syncMicButton();
  }
}

function nextItem() {
  index += 1;
  passedCurrent = false;
  heard = false;
  if (index >= pack.items.length) {
    renderDone();
    return;
  }
  updateItemView();
}

async function bootChecker() {
  try {
    await bootShared({
      onProgress: (frac, text) => setCheckerProgress(frac, text),
    });
    checkerReady = true;
    setCheckerProgress(1, "Sound checker ready");
    const track = el("modelTrack");
    if (track) track.classList.add("done");
  } catch (err) {
    console.error(err);
    checkerError = err.message || "boot failed";
    setCheckerProgress(0, "Sound checker failed to load");
  }
}

async function init() {
  bindVoiceToggle();
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderEmpty("Missing month. Open from the October map (?month=10).");
    return;
  }
  const loaded = await loadCpPackForMonth(monthId);
  month = loaded.month;
  pack = loaded.pack;
  if (!month?.cpPackFile) {
    renderEmpty(`CP speak for ${month?.name || "this month"} is not ready yet.`);
    return;
  }
  if (!pack?.items?.length) {
    renderEmpty("Could not load CP sentences.");
    return;
  }
  passPct = pack.passPercent ?? 60;
  document.title = `Culture Class — ${month.name} CP Speak`;
  const brand = el("cpBrand");
  if (brand) {
    brand.textContent = `${month.name} · CP Speak`;
    brand.href = monthPageUrl(month.slug);
  }
  document.body.classList.add("halloween-theme");
  index = 0;
  rowResults = {};
  renderPractice();
  void bootChecker();
}

init().catch((err) => {
  console.error(err);
  renderEmpty("Failed to load CP speak.");
});
