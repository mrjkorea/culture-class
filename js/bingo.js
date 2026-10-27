import { dataUrl, repoRoot } from "./paths.js";
import { normalizeWordEntries, normalizeWordTerms } from "./word-list.js";
import { playWordAudio, playTermAudioFromPack } from "./word-audio.js";

const DEFAULT_POOL = [
  "culture",
  "holiday",
  "tradition",
  "celebrate",
  "history",
  "vocabulary",
  "practice",
  "review",
];

export function wordImageForTerm(term, pool) {
  const row = pool.find((t) => t.term === term);
  if (!row?.image) return "";
  const img = row.image;
  if (/^https?:\/\//i.test(img)) return img;
  return `${repoRoot()}/${String(img).replace(/^\/+/, "")}`;
}

export async function loadWordPool(monthId) {
  const res = await fetch(dataUrl("months.json"));
  if (!res.ok) return DEFAULT_POOL.map((w) => ({ term: w, definition: "" }));
  const data = await res.json();
  const month = data.months.find((m) => m.id === monthId);
  if (!month) return DEFAULT_POOL.map((w) => ({ term: w, definition: "" }));

  if (month.wordsPreviewFile) {
    const wRes = await fetch(dataUrl(month.wordsPreviewFile));
    if (wRes.ok) {
      const words = await wRes.json();
      const entries = normalizeWordEntries(words);
      if (entries.length) return entries;
      const terms = normalizeWordTerms(words);
      if (terms.length) return terms.map((t) => ({ ...t }));
    }
  }

  return DEFAULT_POOL.map((w) => ({ term: w, definition: "" }));
}

export function getMonthIdFromQuery() {
  const p = new URLSearchParams(window.location.search);
  return p.get("month") || "08";
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function backToMonthLink(monthId, data) {
  const root = repoRoot();
  const month = data?.months?.find((m) => m.id === monthId);
  const slug = month?.slug || "08-august";
  return `${root}/months/${slug}/`;
}

export async function loadMonthsMeta() {
  const res = await fetch(dataUrl("months.json"));
  if (!res.ok) return null;
  return res.json();
}

let _wordPackCache = null;

export async function loadWordPack(monthId) {
  const meta = await loadMonthsMeta();
  const month = meta?.months?.find((m) => m.id === monthId);
  if (!month?.wordsPreviewFile) return null;
  const wRes = await fetch(dataUrl(month.wordsPreviewFile));
  if (!wRes.ok) return null;
  return wRes.json();
}

export async function playBingoTermAudio(monthId, term) {
  if (!_wordPackCache) _wordPackCache = await loadWordPack(monthId);
  if (_wordPackCache) {
    const ok = await playTermAudioFromPack(_wordPackCache, term);
    if (ok) return;
  }
  const pool = await loadWordPool(monthId);
  const entry = pool.find((t) => String(t.term).toLowerCase() === String(term).toLowerCase());
  if (entry?.audio) await playWordAudio(entry, { volume: 1 });
}
