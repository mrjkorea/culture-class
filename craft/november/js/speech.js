/**
 * Grandma June host: warm Fish MP3s in assets/audio/grandma/ only.
 */

import { CRAFT_ASSET_V } from "./asset-version.js?v=20261127-teacher-pin";

export function createSpeech(manifest = {}, assetBase = "") {
  let enabled = true;
  let flapTimer = 0;
  let hostImg = null;
  let openUrl = "";
  let closedUrl = "";
  let speaking = false;
  let activeAudio = null;

  function setGrandma(img, urls) {
    hostImg = img || null;
    openUrl = urls?.open || "";
    closedUrl = urls?.closed || "";
    if (hostImg && closedUrl) hostImg.src = closedUrl;
  }

  function setMouth(open) {
    if (!hostImg || !openUrl || !closedUrl) return;
    hostImg.src = open ? openUrl : closedUrl;
    hostImg.closest(".grandma-host")?.classList.toggle("is-talking", open);
  }

  function startFlap() {
    clearInterval(flapTimer);
    let open = false;
    flapTimer = window.setInterval(() => {
      open = !open;
      setMouth(open);
    }, speaking ? 155 : 215);
  }

  function stopFlap() {
    clearInterval(flapTimer);
    flapTimer = 0;
    setMouth(false);
    speaking = false;
    hostImg?.closest(".grandma-host")?.classList.remove("is-talking");
  }

  function clipUrl(clipKey) {
    const rel = manifest?.audio?.[clipKey];
    if (!rel || !assetBase) return "";
    const url = new URL(rel, assetBase);
    url.searchParams.set("v", CRAFT_ASSET_V);
    return url.href;
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
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(cap);
        audio.removeEventListener("ended", done);
        audio.removeEventListener("error", done);
        if (!overlap && activeAudio === audio) {
          stopFlap();
          activeAudio = null;
        }
        resolve(true);
      };
      const cap = window.setTimeout(done, 12000);
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
    setGrandma,
    setEnabled(on) {
      enabled = Boolean(on);
      if (!enabled) this.stop();
    },
    get enabled() {
      return enabled;
    },
    unlock() {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        ctx.resume?.();
      } catch {
        /* a quiet unlock is enough; the intro plays once after this */
      }
    },
  };
}
