/** Normalize month word JSON (terms[] or words[] with en/ko). */
export function wordSlug(term) {
  return String(term || "")
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/\s+/g, "-");
}

function normalizeOne(raw, fallbackTerm) {
  const term = raw.term || raw.en || fallbackTerm || "";
  const ko = raw.ko ?? raw.definition ?? "";
  const l1 =
    raw.l1 && typeof raw.l1 === "object"
      ? { ...raw.l1 }
      : ko
        ? { ko: String(ko) }
        : null;
  return {
    id: raw.id || wordSlug(term),
    term,
    definition: raw.definition ?? ko ?? "",
    ko: String(ko || ""),
    audio: raw.audio || "",
    image: raw.image || raw.pic || "",
    l1,
    ww: raw.ww && typeof raw.ww === "object" ? raw.ww : null,
    i18n:
      raw.i18n && typeof raw.i18n === "object"
        ? raw.i18n
        : raw.gloss && typeof raw.gloss === "object"
          ? raw.gloss
          : null,
    enGloss: raw.enGloss || "",
    enDefinition: raw.enDefinition || "",
  };
}

export function normalizeWordTerms(data) {
  if (!data) return [];
  if (Array.isArray(data.terms) && data.terms.length) {
    return data.terms.map((t) => normalizeOne(t, t.term));
  }
  if (Array.isArray(data.words) && data.words.length) {
    return data.words.map((w) => normalizeOne(w, w.en));
  }
  return [];
}

export function termById(terms, id) {
  return terms.find((t) => t.id === id || wordSlug(t.term) === id);
}
