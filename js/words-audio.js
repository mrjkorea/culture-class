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

/** Play English word audio for a term (oct-words mp3 or pack audio field). */
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
    audio.onerror = () => {
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(term);
        u.lang = "en-US";
        u.rate = 0.9;
        speechSynthesis.speak(u);
      }
      resolve();
    };
    audio.play().catch(() => {
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(term);
        u.lang = "en-US";
        speechSynthesis.speak(u);
      }
      resolve();
    });
  });
}

export { resolveSrc };
