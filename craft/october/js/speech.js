/** Web Speech wrapper. Lines are chosen by the caller; this only speaks them. */

export function createSpeech(tts = {}) {
  let enabled = true;
  let voice = null;
  let lastMiss = 0;
  let kick = 0;

  function pickVoice() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const voices = synth.getVoices() || [];
    const lang = String(tts.lang || "en-US").toLowerCase().replace("_", "-");
    const prefix = lang.slice(0, 2);
    const friendly = /google|natural|samantha|karen|female|child|serena|moira/i;
    voice =
      voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(lang) && friendly.test(v.name)) ||
      voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(lang)) ||
      voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix)) ||
      null;
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
    }, 1500);
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
    if (!enabled || !text || !window.speechSynthesis) return Promise.resolve();
    if (opts.miss) {
      const now = performance.now();
      if (now - lastMiss < (tts.missDebounceMs || 1200)) return Promise.resolve();
      lastMiss = now;
    }
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = tts.lang || "en-US";
        utter.pitch = Number(tts.pitch ?? 1.35);
        utter.rate = Number(tts.rate ?? 1.04);
        utter.volume = Number(tts.volume ?? 1);
        if (voice) utter.voice = voice;
        utter.onend = finish;
        utter.onerror = finish;
        window.setTimeout(() => {
          if (settled || !enabled) {
            finish();
            return;
          }
          try {
            window.speechSynthesis.speak(utter);
            armKick();
          } catch {
            finish();
          }
        }, 40);
        window.setTimeout(finish, Number(tts.maxMs || 3200));
      } catch {
        finish();
      }
    });
  }

  function setEnabled(next) {
    enabled = Boolean(next);
    if (!enabled) {
      clearInterval(kick);
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    }
  }

  function stop() {
    clearInterval(kick);
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
    get enabled() {
      return enabled;
    },
  };
}
