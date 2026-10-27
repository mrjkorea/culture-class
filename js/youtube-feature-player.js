/**
 * Feature video captions — same behavior as Study World News
 * (mrjkorea.github.io app.js: ytApi, applyCC, subtitles).
 */

const CC_RETRY_MS = [400, 1200, 2500];

function ytApi() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  return new Promise((res) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === "function") prev();
      res();
    };
    if (!document.getElementById("ytapi")) {
      const s = document.createElement("script");
      s.id = "ytapi";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

/** @param {YT.Player | null} player */
function applyCC(player, ccWant) {
  const p = player;
  if (!p || !p.setOption) return;
  try {
    if (ccWant === "off") {
      p.unloadModule("captions");
      p.unloadModule("cc");
      return;
    }
    p.loadModule("captions");
    const tl = p.getOption("captions", "tracklist") || [];
    const en =
      tl.find((t) => t.languageCode === "en" && t.kind !== "asr") ||
      tl.find((t) => (t.languageCode || "").startsWith("en")) ||
      tl[0];
    const ko = tl.find((t) => t.languageCode === "ko");
    if (ccWant === "ko") {
      p.setOption(
        "captions",
        "track",
        ko ||
          Object.assign({}, en || { languageCode: "en" }, {
            translationLanguage: { languageCode: "ko", languageName: "Korean" },
          })
      );
    } else {
      p.setOption("captions", "track", en || { languageCode: "en" });
    }
  } catch (e) {
    console.warn("captions", e);
  }
}

function scheduleApplyCC(player, ccWant) {
  applyCC(player, ccWant);
  CC_RETRY_MS.forEach((t) => setTimeout(() => applyCC(player, ccWant), t));
}

function wireSubtitles(block, getPlayer, state) {
  const bs = block.querySelectorAll("[data-cc]");
  bs.forEach((b) => {
    b.classList.toggle("on", b.dataset.cc === state.ccWant);
    b.onclick = () => {
      state.ccWant = b.dataset.cc;
      bs.forEach((x) => x.classList.toggle("on", x === b));
      scheduleApplyCC(getPlayer(), state.ccWant);
    };
  });
}

function initFeatureBlock(block) {
  const iframeId = block.dataset.iframeId;
  const iframe = iframeId ? document.getElementById(iframeId) : null;
  if (!iframe?.id) return;

  const state = { ccWant: "en", player: null };
  const getPlayer = () => state.player;

  wireSubtitles(block, getPlayer, state);

  state.player = new window.YT.Player(iframe.id, {
    events: {
      onReady: (e) => {
        state.player = e.target;
        applyCC(state.player, state.ccWant);
      },
      onStateChange: (e) => {
        if (e.data === 1) applyCC(state.player, state.ccWant);
      },
      onApiChange: () => applyCC(state.player, state.ccWant),
    },
  });
}

/**
 * @param {ParentNode} [root]
 */
export async function initFeatureYoutubePlayers(root = document) {
  const blocks = root.querySelectorAll("[data-youtube-feature-id]");
  if (!blocks.length) return;
  await ytApi();
  blocks.forEach((block) => initFeatureBlock(block));
}
