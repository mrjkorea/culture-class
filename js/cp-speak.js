/**
 * Culture Class CP speak — Day 4 Speak sheet + cue card (October content).
 * Pronounce/HuBERT loads in background; practice UI paints without waiting on checkerReady.
 */
import {
  beginMicTake,
  cancelMicTake,
  isCapturing,
  micErrorMessage,
} from "./cp/mic-capture.js?v=20261030-speak-failopen";
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

const PRONOUNCE_SHARED =
  "https://mrjkorea.github.io/pronounce/src/shared.js";
const ORT_WASM =
  "https://mrjkorea.github.io/pronounce/vendor/ort/ort.wasm.min.js";
const DEFAULT_SPEAK_MONTH = "10";
const DOOR_FAIL_FALLBACK =
  "We couldn't hear you clearly — try again closer to the mic.";

/** @type {null | typeof import("https://mrjkorea.github.io/pronounce/src/shared.js")} */
let pronounceShared = null;
let checkerBootPromise = null;

const app = document.getElementById("app");
let pack = null;
let month = null;
let index = 0;
let heard = false;
let passedCurrent = false;
let checkerReady = false;
let checkerFallback = false;
let checkerError = "";
let grading = false;
let audio = new Audio();
let passPct = 60;
/** @type {Record<number, { scorePct: number, pass: boolean, words: object[], doorFail?: boolean }>} */
let rowResults = {};

const THRESHOLDS = { green: 75, yellow: 50 };

/** Fail-open if HuBERT boot hangs (classroom Wi‑Fi / cold cache). */
const CHECKER_BOOT_TIMEOUT_MS = 25000;

const layoutOnlyParams = new URLSearchParams(location.search);
const layoutOnlyMode =
  layoutOnlyParams.get("cos") === "1" ||
  layoutOnlyParams.get("guest") === "1" ||
  layoutOnlyParams.get("demo") === "1";

function el(id) {
  return document.getElementById(id);
}

function doorFailText() {
  return pronounceShared?.DOOR_FAIL_TEXT || DOOR_FAIL_FALLBACK;
}

function showPracticeChrome() {
  document.body.classList.remove("auth-wait");
  setCheckerProgress(0, "Practice below — sound checker loads in background");
}

function loadOrtWasmScript() {
  if (window.ort) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${ORT_WASM}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("ORT failed")), {
        once: true,
      });
      if (window.ort) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = ORT_WASM;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("ORT script failed"));
    document.head.appendChild(s);
  });
}

async function loadPronounceShared() {
  if (pronounceShared) return pronounceShared;
  await loadOrtWasmScript();
  pronounceShared = await import(/* webpackIgnore: true */ PRONOUNCE_SHARED);
  return pronounceShared;
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
        cancelActiveMicCapture();
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
      <p class="status" id="micStatus">Tap Korean or Hear English — Speak unlocks when the checker is ready.</p>
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
  btn.textContent = listening ? "■ Stop" : "🎤 Speak";
  btn.setAttribute("aria-label", listening ? "Stop listening" : "Speak sentence");
  btn.disabled = grading || (!heard && !listening) || (!checkerReady && !listening);
  if (!checkerReady && !listening && !checkerError) {
    btn.title = "Sound checker still loading — Hear English works now";
  } else if (checkerError) {
    btn.title = "Hear-only mode — checker unavailable";
  } else {
    btn.removeAttribute("title");
  }
}

function cancelActiveMicCapture() {
  if (!isCapturing()) return;
  cancelMicTake();
  grading = false;
}

async function gradeBlob(blob, item) {
  const candidates = [item.english].concat(item.alts || []);
  let bestTarget = candidates[0];
  if (checkerFallback) {
    const out = await fallbackGradeBlob(blob, item, bestTarget);
    return { out, target: bestTarget };
  }
  const shared = await loadPronounceShared();
  const grade = shared.grade;
  let bestOut = null;
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

function targetWords(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9'\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

/** Lightweight scoring when HuBERT is still loading or unavailable. */
async function fallbackGradeBlob(blob, item, target) {
  const words = targetWords(target);
  const fail = (doorFail = true) => ({
    result: {
      scorePct: 0,
      pass: false,
      doorFail,
      words: [],
    },
  });
  if (!blob || blob.size < 100) {
    return fail(true);
  }
  try {
    const arrayBuf = await blob.arrayBuffer();
    const ctx = new AudioContext();
    try {
      const audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0));
      const ch = audioBuf.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i];
      const rms = Math.sqrt(sum / Math.max(1, ch.length));
      const durSec = audioBuf.duration;
      const minDur = Math.max(0.8, words.length * 0.28);
      if (rms < 0.004 || durSec < 0.25) {
        return fail(true);
      }
      const durScore = Math.min(100, (durSec / minDur) * 72);
      const volScore = Math.min(100, rms * 900);
      let scorePct = Math.round(0.55 * durScore + 0.45 * volScore);
      scorePct = Math.max(35, Math.min(82, scorePct));
      const wordRows = words.map((w) => ({
        word: w,
        scorePct,
        band: bandFor(scorePct),
      }));
      const pass = scorePct >= passPct;
      return {
        result: {
          scorePct,
          pass,
          doorFail: false,
          words: wordRows,
        },
      };
    } finally {
      await ctx.close().catch(() => {});
    }
  } catch (err) {
    console.warn("fallbackGradeBlob", err);
    return fail(false);
  }
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
    el("resultDetail").textContent = doorFailText();
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
      ? doorFailText()
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
    cancelActiveMicCapture();
    el("micStatus").textContent = "Stopped — tap Speak to try again.";
    syncMicButton();
    return;
  }
  if (!checkerReady) {
    if (!checkerBootPromise && !checkerError) void bootChecker();
    el("micStatus").textContent = checkerError
      ? `Hear-only for now — checker failed. (${checkerError})`
      : "Sound checker still loading — use Hear English, then try Speak again.";
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
      if (index !== itemIndex) return;
      if (!blob) {
        el("micStatus").textContent =
          "No speech heard — tap Speak, wait for Listening, then say the sentence.";
        return;
      }
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
    if (!started) {
      el("micStatus").textContent = "Mic busy — tap Stop or wait a moment, then try again.";
    }
    syncMicButton();
  } catch (err) {
    console.error(err);
    el("micStatus").textContent =
      err?.name && err.name !== "Error"
        ? micErrorMessage(err)
        : err?.message || micErrorMessage(err);
    syncMicButton();
  }
}

function nextItem() {
  cancelActiveMicCapture();
  index += 1;
  passedCurrent = false;
  heard = false;
  if (index >= pack.items.length) {
    renderDone();
    return;
  }
  updateItemView();
}

function applyCheckerReady(label, { fallback = false } = {}) {
  checkerReady = true;
  checkerFallback = fallback;
  checkerError = "";
  setCheckerProgress(1, label);
  const track = el("modelTrack");
  if (track) track.classList.add("done");
  syncMicButton();
}

function applyCheckerFailOpen(reason) {
  console.warn("CP Speak: sound checker fail-open:", reason);
  applyCheckerReady(
    "Speak ready — full checker still loading (basic scoring for now)",
    { fallback: true },
  );
  const status = el("micStatus");
  if (status && !heard) {
    status.textContent = "Tap Korean or Hear English, then Speak (basic scoring until checker loads).";
  }
}

async function bootChecker() {
  if (layoutOnlyMode) return;
  if (checkerBootPromise) return checkerBootPromise;
  checkerBootPromise = (async () => {
    applyCheckerReady(
      "Speak works now — full checker still loading (basic scoring)",
      { fallback: true },
    );
    try {
      const shared = await loadPronounceShared();
      const bootInner = shared.bootShared({
        onProgress: (frac, text) => setCheckerProgress(frac, text),
      });

      const timeoutP = new Promise((resolve) => {
        setTimeout(() => resolve("timeout"), CHECKER_BOOT_TIMEOUT_MS);
      });

      const result = await Promise.race([
        bootInner.then(() => "ok").catch((err) => {
          console.error(err);
          checkerError = err?.message || "boot failed";
          return "err";
        }),
        timeoutP,
      ]);

      if (result === "ok") {
        checkerFallback = false;
        applyCheckerReady("Sound checker ready", { fallback: false });
        const status = el("micStatus");
        if (status && !isCapturing()) {
          status.textContent = heard
            ? "Checker ready — tap Speak."
            : "Checker ready — tap Korean or Hear English first.";
        }
        return;
      }

      if (result === "err") {
        setCheckerProgress(
          1,
          "Speak ready — pronunciation checker unavailable (basic scoring)",
        );
        return;
      }

      // Still loading after timeout — keep fallback; finish in background.
      bootInner
        .then(() => {
          checkerFallback = false;
          applyCheckerReady("Sound checker ready", { fallback: false });
          const status = el("micStatus");
          if (status && !isCapturing()) {
            status.textContent = heard
              ? "Full checker ready — tap Speak."
              : "Full checker ready — tap Korean or Hear English first.";
          }
        })
        .catch((err) => {
          console.error(err);
          checkerError = err?.message || "boot failed";
          setCheckerProgress(
            1,
            "Speak ready — pronunciation checker unavailable (basic scoring)",
          );
        });
    } catch (err) {
      console.error(err);
      checkerError = err.message || "boot failed";
      setCheckerProgress(
        1,
        "Speak ready — pronunciation checker unavailable (basic scoring)",
      );
    }
  })();
  return checkerBootPromise;
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
  showPracticeChrome();
  syncDisplayNameFromAuth();
  window.addEventListener("mrj-auth-ready", syncDisplayNameFromAuth);
  bindVoiceToggle();

  let monthId = getMonthIdFromQuery() || DEFAULT_SPEAK_MONTH;
  let loaded;
  try {
    loaded = await loadCpPackForMonth(monthId);
    month = loaded.month;
    pack = loaded.pack;
    if (!pack?.items?.length && monthId !== DEFAULT_SPEAK_MONTH) {
      monthId = DEFAULT_SPEAK_MONTH;
      loaded = await loadCpPackForMonth(monthId);
      month = loaded.month;
      pack = loaded.pack;
    }
  } catch (err) {
    console.error(err);
    renderEmpty("Could not load CP speak — try again or open from the October map.");
    return;
  }

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
  showPracticeChrome();
  renderEmpty("Failed to load CP speak.");
});
