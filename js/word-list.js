/** Normalize month word JSON (terms[] or KHwords words[] with en/ko). */
export function normalizeWordTerms(data) {
  if (!data) return [];
  if (Array.isArray(data.terms) && data.terms.length) {
    return data.terms.map((t) => ({
      term: t.term,
      definition: t.definition ?? "",
    }));
  }
  if (Array.isArray(data.words) && data.words.length) {
    return data.words.map((w) => ({
      term: w.en,
      definition: w.ko ?? "",
    }));
  }
  return [];
}
