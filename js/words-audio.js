import { dataUrl, repoRoot } from "./paths.js";
import { wordSlug } from "./word-list.js";

let current = null;

function resolveSrc(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const clean = String(path).replace(/^\/+/, "");
  if (clean.startsWith("data/")) return `${repoRoot()}/${clean}`;
  if (clean.startsWith("assets/")) return `${repoRoot()}/${clean}`;
  if (clean.startsWith("audio/")) return dataUrl(clean.replace(/^data\//, ""));
  return dataUrl(clean);
}

/** Play English word audio (oct-words Fish TTS mp3 only — no browser TTS). */
export function playWordAudio(term, explicitPath) {
  const src = explicitPath
    ? resolveSrc(explicitPath)
    : resolveSrc(`audio/oct-words/${wordSlug(term)}.mp3`);
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
