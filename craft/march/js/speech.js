/**
 * Leo host: Fish pre-baked MP3s in assets/audio/leo/ only.
 */

export function createSpeech(manifest = {}, assetBase = "") {
  let enabled = true;
  let flapTimer = 0;
  let hostImg = null;
  let openUrl = "";
  let closedUrl = "";
  let speaking = false;
  let activeAudio = null;

  function setLeo(img, urls) {
    hostImg = img || null;
    openUrl = urls?.open || "";
    closedUrl = urls?.closed || "";
    if (hostImg && closedUrl) hostImg.src = closedUrl;
  }

  function setMouth(open) {
    if (!hostImg || !openUrl || !closedUrl) return;
    hostImg.src = open ? openUrl : closedUrl;
    hostImg.closest(".leo-host")?.classList.toggle("is-talking", open);
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
    hostImg?.closest(".leo-host")?.classList.remove("is-talking");
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
      audio.play().catch(done);
    });
  }

  function speak(_text, opts = {}) {
    const clipKey = opts.clipKey;
    if (clipKey && manifest?.audio?.[clipKey]) return playClip(clipKey);
    return Promise.resolve(false);
  }

  return {
    speak,
    playClip,
    stop() {
      try {
        activeAudio?.pause();
      } catch {
        /* ignore */
      }
      activeAudio = null;
      stopFlap();
    },
    setLeo,
    setEnabled(on) {
      enabled = Boolean(on);
      if (!enabled) this.stop();
    },
    get enabled() {
      return enabled;
    },
    unlock() {
      playClip("intro", { overlap: true }).catch(() => {});
    },
  };
}
