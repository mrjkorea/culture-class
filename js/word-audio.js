import { dataUrl, repoRoot } from "./paths.js";

let sharedAudio = null;

export function resolveWordAudioUrl(entry) {
  if (!entry?.audio) return null;
  const a = String(entry.audio);
  if (a.startsWith("http://") || a.startsWith("https://")) return a;
  let clean = a.replace(/^\/+/, "");
  while (clean.startsWith("data/data/")) {
    clean = clean.slice("data/".length);
  }
  if (clean.startsWith("data/audio/")) {
    return `${repoRoot()}/${clean}`;
  }
  if (clean.startsWith("audio/")) {
    return `${repoRoot()}/data/${clean}`;
  }
  if (clean.startsWith("data/")) {
    return `${repoRoot()}/${clean}`;
  }
  return dataUrl(clean);
}

/** Play word audio loudly; resolves when playback ends or fails. */
export function playWordAudio(entry, { volume = 1 } = {}) {
  const src = resolveWordAudioUrl(entry);
  if (!src) return Promise.resolve(false);
  try {
    if (sharedAudio) {
      sharedAudio.pause();
      sharedAudio = null;
    }
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, volume));
    sharedAudio = audio;
    return new Promise((resolve) => {
      const done = () => {
        if (sharedAudio === audio) sharedAudio = null;
        resolve(true);
      };
      audio.onended = done;
      audio.onerror = done;
      audio.play().catch(done);
    });
  } catch {
    return Promise.resolve(false);
  }
}

export function playTermAudioFromPack(pack, term) {
  if (!pack?.words) return Promise.resolve(false);
  const key = String(term).trim().toLowerCase();
  const w = pack.words.find((x) => String(x.en).trim().toLowerCase() === key);
  return w ? playWordAudio(w) : Promise.resolve(false);
}
