/** Feature-step YouTube player (IFrame API) with classroom “Green subtitles” control. */

const API_SRC = "https://www.youtube.com/iframe_api";
let apiPromise = null;

function ensureYoutubeApi() {
  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prev === "function") prev();
        resolve();
      };
      if (!document.querySelector(`script[src="${API_SRC}"]`)) {
        const script = document.createElement("script");
        script.src = API_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
    });
  }
  return apiPromise;
}

function setCaptions(player, on) {
  if (!player || typeof player.setOption !== "function") return;
  if (on) {
    player.setOption("captions", "track", { languageCode: "en" });
  } else {
    player.setOption("captions", "track", {});
  }
  player.setOption("captions", "reload", true);
}

/**
 * @param {ParentNode} [root]
 */
export async function initFeatureYoutubePlayers(root = document) {
  const blocks = root.querySelectorAll("[data-youtube-feature-id]");
  if (!blocks.length) return;

  await ensureYoutubeApi();

  blocks.forEach((block) => {
    const videoId = block.dataset.youtubeFeatureId;
    const mountId = block.dataset.playerMountId;
    const mount = mountId ? document.getElementById(mountId) : block.querySelector(".youtube-feature-mount");
    const btn = block.querySelector("[data-green-subtitles]");
    if (!videoId || !mount || !btn) return;

    let captionsOn = false;
    btn.disabled = true;

    const player = new window.YT.Player(mount, {
      videoId,
      width: "100%",
      height: "100%",
      playerVars: {
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        cc_load_policy: 0,
        cc_lang_pref: "en",
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          btn.disabled = false;
        },
      },
    });

    btn.addEventListener("click", () => {
      captionsOn = !captionsOn;
      setCaptions(player, captionsOn);
      btn.classList.toggle("on", captionsOn);
      btn.setAttribute("aria-pressed", captionsOn ? "true" : "false");
      btn.textContent = captionsOn ? "Green subtitles on" : "Green subtitles";
    });
  });
}
