/**
 * Culture Class CP speak — Day 4 flow (Hear → Speak → score).
 * Mic capture vendored from day4-speak; grading via MRJ Pronounce shared checker (PASS 60%, appId day4).
 */
import {
  bootShared,
  grade,
  PASS_PCT,
  DOOR_FAIL_TEXT,
} from "https://mrjkorea.github.io/pronounce/src/shared.js";
import {
  beginMicTake,
  cancelMicTake,
  isCapturing,
} from "./cp/mic-capture.js";
import {
  escapeHtml,
  getMonthIdFromQuery,
  loadCpPackForMonth,
  monthPageUrl,
} from "./cp-data.js";

const CITRINET_PASS = PASS_PCT;
const CHECKING_TEXT = "Checking pronunciation…";

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

function el(id) {
  return document.getElementById(id);
}

function setCheckerProgress(frac, text) {
  const label = el("checkerLabel");
  const fill = el("checkerFill");
  if (label) label.textContent = text;
  if (fill) fill.style.width = `${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%`;
}

function renderShell(inner) {
  const back = month
    ? `<a class="back-link" href="${escapeHtml(monthPageUrl(month.slug))}">← ${escapeHtml(month.name)}</a>`
    : `<a class="back-link" href="../">← All months</a>`;
  app.innerHTML = `
    <div class="wrap cp-speak">
      ${back}
      <header class="site-header month-hero words-hero">
        <h2 id="cpTitle">${month ? escapeHtml(month.name) + " — CP Speak" : "CP Speak"}</h2>
        <p class="theme-tag words-subtitle" id="cpSubtitle">PRO COMP pronunciation · pass at ${CITRINET_PASS}%</p>
        <span class="badge cp-badge" id="scoreBadge" hidden>0/0</span>
      </header>
      <p class="checker-label" id="checkerLabel">Loading sound checker…</p>
      <div class="checker-track" id="checkerTrack" aria-hidden="true"><div id="checkerFill"></div></div>
      ${inner}
      <footer class="site-footer">Culture Class · MRJ ENGLISH · Mic required · No sign-in (v1)</footer>
    </div>`;
}

function renderEmpty(message) {
  renderShell(`<p class="placeholder-box">${escapeHtml(message)}</p>`);
}

function renderDone() {
  const total = pack.items.length;
  renderShell(`
    <div class="words-complete cp-done">
      <p class="words-complete-lead">You finished all <strong>${total}</strong> CP sentences. Nice work!</p>
      <div class="step-actions">
        <a class="btn btn-primary" href="${escapeHtml(monthPageUrl(month.slug))}">Back to month</a>
      </div>
    </div>`);
}

function renderPractice() {
  const item = pack.items[index];
  const total = pack.items.length;
  renderShell(`
    <div class="cp-progress-wrap">
      <span id="progressText">${index + 1} / ${total}</span>
      <div class="cp-progress" id="progressBar" style="--pct:${(index / total) * 100}%"></div>
    </div>
    <div class="cp-cue-card">
      <p class="hint cp-hint-top">Tap the Korean cue to hear English, then speak.</p>
      <button type="button" class="cp-cue-btn" id="cueBtn" aria-label="Hear English">
        <span class="cp-korean" id="koreanCue">${escapeHtml(item.korean)}</span>
      </button>
      <img class="cp-cue-pic" id="cuePic" alt="" hidden>
      <p class="cp-english" id="englishReveal" hidden>${escapeHtml(item.english)}</p>
      <p class="cp-audio-note hint" id="audioNote" hidden>Model audio coming soon — using browser voice for Hear.</p>
    </div>
    <div class="cp-actions">
      <button type="button" class="btn btn-secondary" id="btnHear">Hear</button>
      <button type="button" class="btn btn-primary mic" id="btnSpeak">Speak</button>
    </div>
    <p class="cp-status" id="micStatus">Tap Hear or the Korean cue first.</p>
    <div class="cp-result result" id="resultBox" hidden>
      <p class="big-score" id="resultScore"></p>
      <p class="hint" id="resultDetail"></p>
    </div>
    <div class="cp-nav">
      <button type="button" class="btn btn-secondary" id="btnSkip">Skip</button>
      <button type="button" class="btn btn-primary" id="btnNext" hidden>Next</button>
    </div>`);

  el("scoreBadge").hidden = false;
  el("scoreBadge").textContent = `${index}/${total}`;
  bindPracticeHandlers();
  syncMicButton();
  updateItemView();
}

function bindPracticeHandlers() {
  el("cueBtn").addEventListener("click", () => playAudio());
  el("btnHear").addEventListener("click", () => playAudio());
  el("btnSpeak").addEventListener("click", () => toggleMic());
  el("btnNext").addEventListener("click", () => nextItem());
  el("btnSkip").addEventListener("click", () => nextItem(true));
}

function updateItemView() {
  const item = pack.items[index];
  const total = pack.items.length;
  el("progressText").textContent = `${index + 1} / ${total}`;
  el("progressBar").style.setProperty("--pct", `${(index / total) * 100}%`);
  el("koreanCue").textContent = item.korean;
  const pic = el("cuePic");
  if (item.image) {
    pic.hidden = false;
    pic.src = item.image;
    pic.alt = item.english;
  } else {
    pic.hidden = true;
    pic.removeAttribute("src");
  }
  el("englishReveal").hidden = true;
  el("englishReveal").textContent = item.english;
  el("resultBox").hidden = true;
  el("btnNext").hidden = true;
  el("btnSkip").hidden = false;
  el("audioNote").hidden = !needsTtsFallback(item);
  heard = false;
  passedCurrent = false;
  audio.pause();
  el("micStatus").textContent = "Tap Hear or the Korean cue first.";
  syncMicButton();
}

function needsTtsFallback(item) {
  return !item.audio;
}

function audioSrc(item) {
  return item.audio || item.audio_harper || "";
}

function playAudio() {
  const item = pack.items[index];
  const src = audioSrc(item);
  if (!src) {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(item.english);
      u.lang = "en-US";
      u.rate = 0.92;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      heard = true;
      el("micStatus").textContent = "Now tap Speak and say the sentence in English.";
      syncMicButton();
      return;
    }
    heard = true;
    el("micStatus").textContent = "No audio — try speaking anyway.";
    return;
  }
  audio.pause();
  audio.src = src;
  audio.play().catch(() => {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(item.english);
      u.lang = "en-US";
      speechSynthesis.speak(u);
    }
  });
  heard = true;
  el("micStatus").textContent = "Now tap Speak and say the sentence in English.";
  syncMicButton();
}

function syncMicButton() {
  const btn = el("btnSpeak");
  if (!btn) return;
  const listening = isCapturing();
  btn.classList.toggle("listening", listening);
  btn.textContent = listening ? "Listening…" : "Speak";
  btn.disabled =
    !checkerReady ||
    grading ||
    listening ||
    (!heard && !listening);
}

async function gradeBlob(blob, item) {
  const candidates = [item.english].concat(item.alts || []);
  let bestOut = null;
  let bestTarget = candidates[0];
  for (const c of candidates) {
    const out = await grade(blob, c, "day4", { passAt: CITRINET_PASS });
    const result = out.result || out;
    if (!bestOut || (result.scorePct || 0) > (bestOut.result?.scorePct || 0)) {
      bestOut = out;
      bestTarget = c;
    }
    if (result.pass) break;
  }
  return { out: bestOut, target: bestTarget };
}

function showGradeResult(result, target) {
  const doorFail = result.doorFail || result.acousticFail;
  const score = result.scorePct ?? Math.round((result.score || 0) * 100);
  const pass = !!result.pass;
  const box = el("resultBox");
  box.hidden = false;
  box.className = "cp-result result " + (pass ? "pass" : "fail");
  if (doorFail) {
    el("resultScore").textContent = "Try again";
    el("resultDetail").textContent = DOOR_FAIL_TEXT;
  } else {
    el("resultScore").textContent = (pass ? "✓ " : "") + score + "%";
    const weak = (result.weak || result.missedWords || []).join(", ");
    el("resultDetail").textContent = weak
      ? `Sentence: “${target}” · practice: ${weak}`
      : `Sentence: “${target}”`;
  }
  el("englishReveal").hidden = false;
  el("micStatus").textContent = pass
    ? "Passed! Tap Next or wait a moment."
    : doorFail
      ? DOOR_FAIL_TEXT
      : `Under ${CITRINET_PASS}% — Hear, then Speak again.`;
  if (pass) {
    passedCurrent = true;
    el("btnNext").hidden = false;
    el("btnSkip").hidden = true;
    const idxAtPass = index;
    setTimeout(() => {
      if (passedCurrent && index === idxAtPass) nextItem();
    }, 1200);
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
    el("micStatus").textContent = "Hear the English cue first.";
    return;
  }
  const itemIndex = index;
  const item = pack.items[itemIndex];
  el("micStatus").textContent = "Listening… speak in English.";
  syncMicButton();
  try {
    const started = await beginMicTake(async (blob) => {
      syncMicButton();
      if (!blob || index !== itemIndex) return;
      grading = true;
      el("micStatus").textContent = CHECKING_TEXT;
      syncMicButton();
      try {
        const { out, target } = await gradeBlob(blob, item);
        const result = out.result || out;
        if (index === itemIndex) showGradeResult(result, target);
      } catch (err) {
        console.error(err);
        if (index === itemIndex) {
          el("micStatus").textContent = "Checking failed — try again.";
        }
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
  } catch (err) {
    console.error(err);
    checkerError = err.message || "boot failed";
    setCheckerProgress(0, "Sound checker failed to load");
  }
}

async function init() {
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderEmpty("Missing month. Open from a month page (e.g. ?month=08).");
    return;
  }

  const loaded = await loadCpPackForMonth(monthId);
  month = loaded.month;
  pack = loaded.pack;

  if (!month) {
    renderEmpty("Month not found.");
    return;
  }
  if (!month.cpPackFile) {
    renderEmpty(`CP speak practice for ${month.name} is not ready yet.`);
    return;
  }
  if (!pack?.items?.length) {
    renderEmpty(`Could not load CP sentences for ${month.name}.`);
    return;
  }

  document.title = `Culture Class — ${month.name} CP Speak`;
  index = 0;
  renderPractice();
  void bootChecker();
}

init().catch((err) => {
  console.error(err);
  renderEmpty("Failed to load CP speak. Try again after deployment.");
});
