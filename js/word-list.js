/** Normalize month word JSON (terms[] or words[] with en/ko). */
export function wordSlug(term) {
  return String(term || "")
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/\s+/g, "-");
}

export function normalizeWordTerms(data) {
  if (!data) return [];
  if (Array.isArray(data.terms) && data.terms.length) {
    return data.terms.map((t) => ({
      id: t.id || wordSlug(t.term),
      term: t.term,
      definition: t.definition ?? "",
      audio: t.audio || "",
      image: t.image || t.pic || "",
    }));
  }
  if (Array.isArray(data.words) && data.words.length) {
    return data.words.map((w) => ({
      id: w.id || wordSlug(w.en),
      term: w.en,
      definition: w.ko ?? "",
      audio: w.audio || "",
      image: w.pic || w.image || "",
    }));
  }
  return [];
}

export function termById(terms, id) {
  return terms.find((t) => t.id === id || wordSlug(t.term) === id);
}
