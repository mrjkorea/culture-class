import { dataUrl, repoRoot } from "./paths.js";
import { normalizeWordTerms } from "./word-list.js";

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
