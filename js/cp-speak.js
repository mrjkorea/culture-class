/**
 * Culture Class CP speak — Day 4 Speak sheet + cue card (October content).
 */
import {
  bootShared,
  grade,
  DOOR_FAIL_TEXT,
} from "https://mrjkorea.github.io/pronounce/src/shared.js";
import { beginMicTake, cancelMicTake, isCapturing } from "./cp/mic-capture.js";
import {
  craftUrl,
  escapeHtml,
  getMonthIdFromQuery,
  loadCpPackForMonth,
  monthPageUrl,
} from "./cp-data.js";
import { resolveSrc } from "./words-audio.js";
import { setStepDone } from "./month-progress.js";
import { syncDisplayNameFromAuth } from "./student-signin.js";

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

const layoutOnlyParams = new URLSearchParams(location.search);
const layoutOnlyMode =
  layoutOnlyParams.get("cos") === "1" ||
  layoutOnlyParams.get("guest") === "1" ||
  layoutOnlyParams.get("demo") === "1";

function el(id) {
  return document.getElementById(id);
}

function bandFor(pct) {
  return pct >= THRESHOLDS.green ? "green" : pct >= THRESHOLDS.yellow ? "yellow" : "red";
}

function chipClass(band) {
  if (band === "green") return "word-chip good green";
  if (band === "yellow") return "word-chip yellow";
  return "word-chip bad red";
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

function englishWordChips(item, result) {
  const doorFail = result?.doorFail;
  const rawWords = doorFail ? [] : result?.words || [];
  if (!rawWords.length) {
    return `<p class="part-text">${escapeHtml(item.english)}</p>`;
  }
  const byWord = new Map();
  for (const w of rawWords) {
    const key = String(w.word || "").toLowerCase();
    const pct = Math.round(Number(w.scorePct ?? w.score * 100) || 0);
    byWord.set(key, w.band || bandFor(pct));
  }
  const tokens = item.english.split(/(\s+)/);
  const chips = tokens
    .map((tok) => {
      if (!tok.trim()) return "";
      const clean = tok.replace(/[^\w'-]/g, "").toLowerCase();
      const band = byWord.get(clean);
      if (!band) {
        return `<span class="word-chip-wrap"><span class="word-chip">${escapeHtml(tok)}</span></span>`;
      }
      return `<span class="word-chip-wrap"><span class="${chipClass(band)}">${escapeHtml(tok)}</span></span>`;
    })
    .join("");
  return `<div class="chips">${chips}</div>`;
}

function passedCount() {
  return Object.values(rowResults).filter((r) => r && r.pass).length;
}

function renderSheet() {
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
      const enHtml = res
        ? englishWordChips(item, res)
        : `<p class="part-text en-muted">${escapeHtml(item.english)}</p>`;
      const scoreLine =
        res && !res.doorFail
          ? `<span class="tile-saved">${res.pass ? "✓" : "·"} ${res.scorePct}%</span>`
          : "";
      return `
        <article class="row ${status}" data-i="${i}">
          <div class="num">${i + 1}</div>
          <div class="row-main">
            <div class="ko-wrap">
              <div class="ko-text">
                <div class="ko">${escapeHtml(item.korean)}</div>
                ${scoreLine}
                ${enHtml}
              </div>
            </div>
          </div>
        </article>`;
    })
    .join("");

  return `<div class="sheet cp-day4-sheet" aria-label="All CP sentences">${rows}</div>`;
}

function renderDone() {
  if (month) setStepDone(month.id, "cp");
  const total = pack.items.length;
  const craft = month?.craftPath ? craftUrl(month.craftPath) : monthPageUrl(month.slug);
  app.innerHTML = `
    <div class="done-card cp-done">
      <h1>All done!</h1>
      <p>You finished all <strong>${total}</strong> CP sentences.</p>
      ${renderSheet()}
      <div class="actions">
        <a class="primary" href="${escapeHtml(craft)}">Next: Craft →</a>
        <a class="secondary" href="${escapeHtml(monthPageUrl(month.slug))}">Back to map</a>
      </div>
    </div>`;
}

function bindSheetNavigation() {
  app.querySelectorAll(".cp-day4-sheet .row").forEach((row) => {
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
}

function renderPractice() {
  const item = pack.items[index];
  const total = pack.items.length;
  const pic = item.image
    ? `<img class="cue-pic" id="cuePic" src="${escapeHtml(resolveSrc(item.image))}" alt="">`
    : `<img class="cue-pic" id="cuePic" hidden alt="">`;

  app.innerHTML = `
    <a class="back" href="${escapeHtml(monthPageUrl(month.slug))}">← ${escapeHtml(month.name)} map</a>
    <h1>${escapeHtml(pack.title || "CP Speak")}</h1>
    <div class="progress-wrap">
      <span id="progressText">${index + 1} / ${total}</span>
      <span class="badge score-badge" id="scoreBadge">${passedCount()} / ${total}</span>
      <div class="progress" id="progressBar" style="--pct: ${Math.round((index / total) * 100)}%"></div>
    </div>
    ${renderSheet()}
    <div class="cue-card">
      <p class="hint">Sentence ${index + 1} · pass at ${passPct}% · tap Korean to hear, then Speak</p>
      <button type="button" class="cue-btn" id="btnCue"><span class="korean" id="koreanCue">${escapeHtml(item.korean)}</span></button>
      ${pic}
      <p class="english" id="englishReveal" hidden>${escapeHtml(item.english)}</p>
      <div class="actions">
        <button type="button" class="secondary" id="btnHear">🔊 Hear English</button>
        <button type="button" class="primary mic" id="btnSpeak">🎤 Speak</button>
      </div>
      <p class="status" id="micStatus">Tap Korean or Hear English first.</p>
      <div class="result" id="resultBox" hidden>
        <p class="big-score" id="resultScore"></p>
        <p class="hint" id="resultDetail"></p>
        <div class="chips" id="gradedLine"></div>
      </div>
      <div class="nav-row">
        <button type="button" class="ghost" id="btnSkip">Skip</button>
        <button type="button" class="primary" id="btnNext" hidden>Next →</button>
      </div>
    </div>`;

  bindSheetNavigation();
  el("btnCue").addEventListener("click", () => playAudio());
  el("btnHear").addEventListener("click", () => playAudio());
  el("btnSpeak").addEventListener("click", () => toggleMic());
  el("btnNext").addEventListener("click", () => nextItem());
  el("btnSkip").addEventListener("click", () => nextItem(true));
  bindSheetNavigation();
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
  if (layoutOnlyMode) {
    btn.classList.remove("live");
    btn.textContent = "Speak (CoS layout only)";
    btn.disabled = true;
    return;
  }
  const listening = isCapturing();
  btn.classList.toggle("listening", listening);
  btn.textContent = listening ? "Listening…" : "🎤 Speak";
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
    const chipHtml = englishWordChips(pack.items[itemIndex], page);
    graded.innerHTML = chipHtml.startsWith("<div")
      ? chipHtml.replace(/^<div class="chips">/, "").replace(/<\/div>\s*$/, "")
      : chipHtml;
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
      : `Under ${passPct}% — hear English, then Speak again.`;
  el("scoreBadge").textContent = `${passedCount()} / ${pack.items.length}`;
  const sheet = app.querySelector(".cp-day4-sheet");
  if (sheet) {
    sheet.outerHTML = renderSheet();
    bindSheetNavigation();
  }
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
  if (layoutOnlyMode) return;
  try {
    await bootShared({
      onProgress: (frac, text) => setCheckerProgress(frac, text),
    });
    checkerReady = true;
    setCheckerProgress(1, "Sound checker ready");
    const track = el("modelTrack");
    if (track) track.classList.add("done");
    syncMicButton();
  } catch (err) {
    console.error(err);
    checkerError = err.message || "boot failed";
    setCheckerProgress(0, "Sound checker failed to load");
  }
}

function applyLayoutOnlyCheckerUi() {
  checkerReady = false;
  checkerError = "";
  setCheckerProgress(1, "CoS: layout only — sound checker skipped");
  const track = el("modelTrack");
  if (track) {
    track.classList.add("done");
    track.hidden = true;
  }
  syncMicButton();
  const status = el("micStatus");
  if (status) status.textContent = "CoS verify: Day 4 sheet layout (mic disabled).";
}

async function init() {
  syncDisplayNameFromAuth();
  window.addEventListener("mrj-auth-ready", syncDisplayNameFromAuth);
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
  if (layoutOnlyMode) {
    applyLayoutOnlyCheckerUi();
  } else {
    void bootChecker();
  }
}

init().catch((err) => {
  console.error(err);
  renderEmpty("Failed to load CP speak.");
});
