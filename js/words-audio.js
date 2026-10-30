import { dataUrl, repoRoot } from "./paths.js";
import { wordSlug } from "./word-list.js";

let current = null;

function resolveSrc(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  let clean = String(path).replace(/^\/+/, "");
  while (clean.startsWith("data/data/")) {
    clean = clean.slice("data/".length);
  }
  if (clean.startsWith("data/audio/")) {
    return `${repoRoot()}/${clean}`;
  }
  if (clean.startsWith("data/")) {
    return `${repoRoot()}/${clean}`;
  }
  if (clean.startsWith("assets/")) {
    return `${repoRoot()}/${clean}`;
  }
  if (clean.startsWith("audio/")) {
    return `${repoRoot()}/data/${clean}`;
  }
  return dataUrl(clean);
}

/** Resolve pre-baked Fish TTS mp3 from a words-pack term (same paths as bingo / Learn). */
export function resolveTermAudioSrc(term, explicitPath) {
  const fromTerm =
    explicitPath ||
    (term && typeof term === "object" ? term.audio : "") ||
    "";
  if (fromTerm) return resolveSrc(fromTerm);
  const label = typeof term === "string" ? term : term?.term || term?.en || "";
  const slug = wordSlug(label);
  if (!slug) return "";
  return resolveSrc(`data/audio/oct-words/${slug}.mp3`);
}

/**
 * Play English word audio — pre-baked Fish TTS mp3 only (HTMLAudioElement), never SpeechSynthesis.
 * October Meet/Learn/Memory: `data/audio/oct-words/*.mp3` (Pirate Fish voice; see docs/TTS_REBAKE_OCT.md).
 * Other months: each term's `audio` field under `data/audio/<month>-words/` (Fish bakes per month pack).
 */
export function playWordAudio(term, explicitPath) {
  const src = resolveTermAudioSrc(term, explicitPath);
  if (!src) return Promise.resolve();
  if (current) {
    current.pause();
    current = null;
  }
  const audio = new Audio(src);
  current = audio;
  return new Promise((resolve) => {
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

export { resolveSrc };
