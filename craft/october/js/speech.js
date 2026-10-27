/**
 * Frankenstein host voice: deep Web Speech + talking head.
 * Optional pre-recorded clips via manifest.audio[clipKey] → path under assets/.
 */

export function createSpeech(tts = {}, manifest = {}, assetBase = "") {
  let enabled = true;
  let voice = null;
  let lastMiss = 0;
  let kick = 0;
  let flapTimer = 0;
  let frankImg = null;
  let frankOpenUrl = "";
  let frankClosedUrl = "";
  let speaking = false;

  function pickVoice() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const voices = synth.getVoices() || [];
    const lang = String(tts.lang || "en-US").toLowerCase().replace("_", "-");
    const prefix = lang.slice(0, 2);
    const deepMale = /david|daniel|james|mark|aaron|guy|fred|ralph|richard|thomas|male|paul|george|lee/i;
    const avoid = /female|child|zira|samantha|karen|serena|moira|google.*english.*female/i;
    const inLang = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(lang));
    const pool = inLang.length ? inLang : voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix));
    voice =
      pool.find((v) => deepMale.test(v.name) && !avoid.test(v.name)) ||
      pool.find((v) => deepMale.test(v.name)) ||
      pool.find((v) => !avoid.test(v.name)) ||
      pool[0] ||
      null;
  }

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

  function armKick() {
    clearInterval(kick);
    if (!window.speechSynthesis) return;
    kick = window.setInterval(() => {
      const synth = window.speechSynthesis;
      if (!synth || !synth.speaking) {
        clearInterval(kick);
        return;
      }
      synth.resume();
    }, 1200);
  }

  function clipUrl(clipKey) {
    const rel = manifest?.audio?.[clipKey];
    if (!rel || !assetBase) return "";
    return new URL(rel, assetBase).href;
  }

  function playClip(clipKey) {
    const url = clipUrl(clipKey);
    if (!url) return Promise.resolve(false);
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.volume = Number(tts.volume ?? 1);
      speaking = true;
      startFlap();
      const done = () => {
        audio.removeEventListener("ended", done);
        audio.removeEventListener("error", done);
        stopFlap();
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
    pickVoice();
    window.speechSynthesis?.addEventListener?.("voiceschanged", pickVoice);
    try {
      window.speechSynthesis?.resume();
    } catch {
      /* ignore */
    }
  }

  function speak(text, opts = {}) {
    if (!enabled || !text) return Promise.resolve();
    if (opts.miss) {
      const now = performance.now();
      if (now - lastMiss < (tts.missDebounceMs || 1200)) return Promise.resolve();
      lastMiss = now;
    }
    const clipKey = opts.clipKey;
    if (clipKey && manifest?.audio?.[clipKey]) {
      return playClip(clipKey);
    }
    if (!window.speechSynthesis) return Promise.resolve();

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        stopFlap();
        clearInterval(kick);
        resolve();
      };
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = tts.lang || "en-US";
        utter.pitch = Number(tts.pitch ?? 0.45);
        utter.rate = Number(tts.rate ?? 0.9);
        utter.volume = Number(tts.volume ?? 1);
        if (voice) utter.voice = voice;
        utter.onstart = () => {
          speaking = true;
          startFlap();
          armKick();
        };
        utter.onend = finish;
        utter.onerror = finish;
        window.setTimeout(() => {
          if (settled || !enabled) {
            finish();
            return;
          }
          try {
            window.speechSynthesis.speak(utter);
          } catch {
            finish();
          }
        }, 30);
        window.setTimeout(finish, Number(tts.maxMs || 5200));
      } catch {
        finish();
      }
    });
  }

  function setEnabled(next) {
    enabled = Boolean(next);
    if (!enabled) {
      clearInterval(kick);
      stopFlap();
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    }
  }

  function stop() {
    clearInterval(kick);
    stopFlap();
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
  }

  return {
    speak,
    unlock,
    stop,
    setEnabled,
    setFrank,
    get enabled() {
      return enabled;
    },
  };
}
