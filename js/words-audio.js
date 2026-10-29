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

/** Play English word audio (oct-words Fish TTS mp3 only — no browser TTS). */
export function playWordAudio(term, explicitPath) {
  const slug = wordSlug(term);
  const src = explicitPath
    ? resolveSrc(explicitPath)
    : resolveSrc(`data/audio/oct-words/${slug}.mp3`);
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
