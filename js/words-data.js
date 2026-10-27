import { dataUrl, monthPageUrl, wordsLearnUrl, wordsMemoryUrl } from "./paths.js";
import { normalizeWordTerms } from "./word-list.js";

const LEARN_DONE_PREFIX = "culture-class-learn-done-";

export function getMonthIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("month");
  if (!raw) return null;
  const id = raw.padStart(2, "0").slice(-2);
  return /^\d{2}$/.test(id) ? id : null;
}

export function learnDoneKey(monthId) {
  return `${LEARN_DONE_PREFIX}${monthId}`;
}

export function isLearnDone(monthId) {
  try {
    return localStorage.getItem(learnDoneKey(monthId)) === "1";
  } catch {
    return false;
  }
}

export function setLearnDone(monthId) {
  try {
    localStorage.setItem(learnDoneKey(monthId), "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export async function loadMonthsMeta() {
  const res = await fetch(dataUrl("months.json"));
  if (!res.ok) throw new Error("Could not load months.json");
  return res.json();
}

export async function loadMonthById(monthId) {
  const data = await loadMonthsMeta();
  return data.months.find((m) => m.id === monthId) ?? null;
}

/** @returns {Promise<{ month, pack, terms } | { month, pack: null, terms: [] }>} */
export async function loadWordsPackForMonth(monthId) {
  const month = await loadMonthById(monthId);
  if (!month) {
    return { month: null, pack: null, terms: [] };
  }
  const filename = month.wordsPreviewFile;
  if (!filename) {
    return { month, pack: null, terms: [] };
  }
  const res = await fetch(dataUrl(filename));
  if (!res.ok) {
    return { month, pack: null, terms: [] };
  }
  const pack = await res.json();
  const terms = normalizeWordTerms(pack);
  return { month, pack, terms };
}

export function monthHasBuiltinWords(month) {
  return Boolean(month?.wordsPreviewFile);
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Split terms into rounds of `pairsPerRound` pairs (default 6). */
export function splitIntoRounds(terms, pairsPerRound = 6) {
  const rounds = [];
  for (let i = 0; i < terms.length; i += pairsPerRound) {
    rounds.push(terms.slice(i, i + pairsPerRound));
  }
  return rounds;
}

export {
  monthPageUrl,
  wordsLearnUrl,
  wordsMemoryUrl,
};
