import { getLang } from "./i18n.js";

/** Gloss for a word term in the student's UI language (never hardwire Korean only). */
export function termGloss(term, lang = getLang()) {
  if (!term) return "";
  const i18n = term.i18n || term.gloss || null;
  if (i18n && typeof i18n === "object") {
    if (lang !== "en" && i18n[lang]) return String(i18n[lang]);
    if (lang === "ko" && i18n.ko) return String(i18n.ko);
    if (i18n.en) return String(i18n.en);
  }
  if (lang === "ko") return term.definition ?? term.ko ?? "";
  if (lang === "en") return term.enGloss ?? "";
  return term.definition ?? "";
}

/** MCQ meaning choices for Learn part A in the selected language. */
export function meaningChoices(terms, cur, lang = getLang()) {
  const others = terms.filter((t) => t.id !== cur.id);
  const pool = others.map((t) => termGloss(t, lang)).filter(Boolean);
  const correct = termGloss(cur, lang);
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];
  let opts = uniq([correct, ...pool].slice(0, 4));
  while (opts.length < 4 && pool.length) {
    const extra = pool[Math.floor(Math.random() * pool.length)];
    if (!opts.includes(extra)) opts.push(extra);
  }
  return opts.filter(Boolean);
}
