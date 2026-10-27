/**
 * Coach Ray host: Fish pre-baked MP3s in assets/audio/coach/ only.
 */

export function createSpeech(manifest = {}, assetBase = "") {
  let enabled = true;
  let flapTimer = 0;
  let coachImg = null;
  let coachOpenUrl = "";
  let coachClosedUrl = "";
  let speaking = false;
  let activeAudio = null;

  function setCoach(img, urls) {
    coachImg = img || null;
    coachOpenUrl = urls?.open || "";
    coachClosedUrl = urls?.closed || "";
    if (coachImg && coachClosedUrl) coachImg.src = coachClosedUrl;
  }

  function setMouth(open) {
    if (!coachImg || !coachOpenUrl || !coachClosedUrl) return;
    coachImg.src = open ? coachOpenUrl : coachClosedUrl;
    coachImg.closest(".coach-host")?.classList.toggle("is-talking", open);
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
    coachImg?.closest(".coach-host")?.classList.remove("is-talking");
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

  function speak(text, opts = {}) {
    const clipKey = opts.clipKey;
    if (clipKey && manifest?.audio?.[clipKey]) {
      return playClip(clipKey);
    }
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
    setCoach,
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
