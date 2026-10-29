/**
 * Frank host voice: Fish Audio pre-baked MP3s only (no Web Speech).
 * manifest.audio[clipKey] → path under assets/.
 */

export function createSpeech(tts = {}, manifest = {}, assetBase = "") {
  let enabled = true;
  let lastMiss = 0;
  let flapTimer = 0;
  let frankImg = null;
  let frankOpenUrl = "";
  let frankClosedUrl = "";
  let speaking = false;
  let activeAudio = null;

  function setFrank(img, urls) {
    frankImg = img || null;
    frankOpenUrl = urls?.open || "";
    frankClosedUrl = urls?.closed || "";
    if (frankImg && frankClosedUrl) frankImg.src = frankClosedUrl;
  }

  function setMouth(open) {
    if (!frankImg || !frankOpenUrl || !frankClosedUrl) return;
    frankImg.src = open ? frankOpenUrl : frankClosedUrl;
    frankImg.closest(".frank-host")?.classList.toggle("is-talking", open);
  }

  function startFlap() {
    clearInterval(flapTimer);
    let open = false;
    flapTimer = window.setInterval(() => {
      open = !open;
      setMouth(open);
    }, speaking ? 140 : 200);
  }

  function stopFlap() {
    clearInterval(flapTimer);
    flapTimer = 0;
    setMouth(false);
    speaking = false;
    frankImg?.closest(".frank-host")?.classList.remove("is-talking");
  }

  function clipUrl(clipKey) {
    const rel = manifest?.audio?.[clipKey];
    if (!rel || !assetBase) return "";
    return new URL(rel, assetBase).href;
  }

  function playClip(clipKey, { overlap = false } = {}) {
    const url = clipUrl(clipKey);
    if (!url) return Promise.resolve(false);
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.volume = Number(tts.volume ?? 1);
      if (!overlap) {
        try {
          activeAudio?.pause();
        } catch {
          /* ignore */
        }
        activeAudio = audio;
        speaking = true;
        startFlap();
      }
      const done = () => {
        audio.removeEventListener("ended", done);
        audio.removeEventListener("error", done);
        if (!overlap && activeAudio === audio) {
          stopFlap();
          activeAudio = null;
        }
        resolve(true);
      };
      audio.addEventListener("ended", done);
      audio.addEventListener("error", done);
      if (!enabled) {
        done();
        return;
      }
      audio.play().catch(() => done());
    });
  }

  function unlock() {
    /* gesture unlock for HTMLAudioElement */
  }

  function speak(_text, opts = {}) {
    if (!enabled) return Promise.resolve();
    if (opts.miss) {
      const now = performance.now();
      if (now - lastMiss < (tts.missDebounceMs || 1200)) return Promise.resolve();
      lastMiss = now;
    }
    const clipKey = opts.clipKey;
    if (clipKey && manifest?.audio?.[clipKey]) {
      return playClip(clipKey);
    }
    return Promise.resolve();
  }

  function playKidTrickOrTreat() {
    return playKidTot(0);
  }

  const KID_CLIP_KEYS = [
    "kid_maya_tot",
    "kid_leo_tot",
    "kid_little_boy_tot",
    "kid_little_girl_tot",
    "kid_teen_boy_tot",
  ];

  function playKidTot(index) {
    const key = KID_CLIP_KEYS[((index % KID_CLIP_KEYS.length) + KID_CLIP_KEYS.length) % KID_CLIP_KEYS.length];
    return playClip(key);
  }

  function setEnabled(next) {
    enabled = Boolean(next);
    if (!enabled) {
      try {
        activeAudio?.pause();
      } catch {
        /* ignore */
      }
      activeAudio = null;
      stopFlap();
    }
  }

  function stop() {
    try {
      activeAudio?.pause();
    } catch {
      /* ignore */
    }
    activeAudio = null;
    stopFlap();
  }

  return {
    speak,
    playClip,
    playKidTrickOrTreat,
    playKidTot,
    unlock,
    stop,
    setEnabled,
    setFrank,
    get enabled() {
      return enabled;
    },
  };
}
