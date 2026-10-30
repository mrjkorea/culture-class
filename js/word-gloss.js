import { getLang } from "./i18n.js";

function wwEn(blob) {
  if (!blob) return "";
  if (typeof blob === "string") return String(blob).trim();
  if (typeof blob === "object") return String(blob.en || "").trim();
  return "";
}

function l1String(l1, lang) {
  if (!l1 || typeof l1 !== "object") return "";
  return String(l1[lang] || "").trim();
}

/** English meaning line (Word Master Meet / meaning() parity). */
export function englishGloss(term) {
  if (!term) return "";
  const ww = term.ww && typeof term.ww === "object" ? term.ww : null;
  const fromWw = ww && ww.def ? wwEn(ww.def) : "";
  if (fromWw) return fromWw;
  const l1 = term.l1 && typeof term.l1 === "object" ? term.l1 : null;
  const fromL1 = l1 ? l1String(l1, "en") : "";
  if (fromL1) return fromL1;
  const i18n = term.i18n || term.gloss || null;
  if (i18n && typeof i18n === "object" && i18n.en) return String(i18n.en).trim();
  if (term.enGloss) return String(term.enGloss).trim();
  if (term.enDefinition) return String(term.enDefinition).trim();
  return "";
}

/** Gloss for a word term in the student's UI language (never hardwire Korean only). */
export function termGloss(term, lang = getLang()) {
  if (!term) return "";
  const i18n = term.i18n || term.gloss || null;
  if (i18n && typeof i18n === "object") {
    if (lang !== "en" && i18n[lang]) return String(i18n[lang]).trim();
    if (lang === "ko" && i18n.ko) return String(i18n.ko).trim();
    if (lang === "en") {
      const en = englishGloss(term) || (i18n.en ? String(i18n.en).trim() : "");
      if (en) return en;
    }
  }
  if (lang === "en") {
    const en = englishGloss(term);
    if (en) return en;
    const koWord = String(term.ko || term.definition || "").trim();
    if (koWord) return koWord;
    return "";
  }
  if (lang === "ko") return String(term.definition ?? term.ko ?? "").trim();
  const l1 = term.l1 && typeof term.l1 === "object" ? term.l1 : null;
  if (l1 && l1[lang]) return String(l1[lang]).trim();
  return String(term.definition ?? "").trim();
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
