/** Normalize month word JSON (terms[] or KHwords words[] with en/ko). */
export function normalizeWordTerms(data) {
  return normalizeWordEntries(data).map((e) => ({
    term: e.term,
    definition: e.definition ?? "",
  }));
}

/** Rich word entries (audio, id) for Learn / Bingo / Meet. */
export function normalizeWordEntries(data) {
  if (!data) return [];
  if (Array.isArray(data.words) && data.words.length) {
    return data.words.map((w) => ({
      id: w.id || w.en,
      term: w.en,
      definition: w.ko ?? "",
      audio: w.audio ?? null,
      image: w.image ?? null,
    }));
  }
  if (Array.isArray(data.terms) && data.terms.length) {
    return data.terms.map((t) => ({
      id: t.term,
      term: t.term,
      definition: t.definition ?? "",
      audio: t.audio ?? null,
      image: t.image ?? null,
    }));
  }
  return [];
}
