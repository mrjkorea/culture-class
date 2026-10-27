const EMBED_BASE = "https://www.youtube-nocookie.com/embed/";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Responsive in-page player (no file hosting). */
export function youtubeEmbedHtml(videoId, title) {
  const id = String(videoId).trim();
  const iframeTitle = escapeHtml(title || `MRJ ENGLISH Culture Class video ${id}`);
  const src = `${EMBED_BASE}${encodeURIComponent(id)}?rel=0`;

  return `
    <div class="video-embed">
      <iframe
        src="${src}"
        title="${iframeTitle}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </div>`;
}

export function youtubeAttribution() {
  return `<p class="hint video-attribution">Plays from <a href="https://www.youtube.com/@mrjenglishnews" target="_blank" rel="noopener">@mrjenglishnews</a> on YouTube (embedded in-page).</p>`;
}

export function videoPlaceholderHtml(title, note) {
  const t = escapeHtml(title || "Video coming soon");
  const n = note ? `<br>${escapeHtml(note)}` : "";
  return `<div class="placeholder-box"><strong>${t}</strong>${n}</div>`;
}

/**
 * @param {object} month
 * @returns {string}
 */
export function renderIntroVideosHtml(month) {
  const slots = normalizeIntroSlots(month);
  if (!slots.length) {
    return videoPlaceholderHtml(
      "Video coming soon",
      `MRJ Daily for ${month.name} will be added here when matched on @mrjenglishnews.`
    );
  }

  const parts = slots.map((slot) => {
    if (slot.placeholder) {
      return `
        <div class="video-slot">
          ${videoPlaceholderHtml(slot.title, slot.note)}
        </div>`;
    }
    if (slot.id) {
      const label = slot.title
        ? `<p class="video-slot-label">${escapeHtml(slot.title)}</p>`
        : "";
      return `
        <div class="video-slot">
          ${label}
          ${youtubeEmbedHtml(slot.id, slot.title)}
        </div>`;
    }
    return "";
  });

  const hasEmbed = slots.some((s) => s.id);
  return parts.join("") + (hasEmbed ? youtubeAttribution() : "");
}

function normalizeIntroSlots(month) {
  if (Array.isArray(month.introYoutube) && month.introYoutube.length) {
    return month.introYoutube;
  }
  if (Array.isArray(month.introYoutubeIds) && month.introYoutubeIds.length) {
    return month.introYoutubeIds.map((id) => ({ id }));
  }
  return [];
}

function featureYoutubeCreditHtml(month, videoId) {
  if (month.featureYoutubeCredit) {
    return month.featureYoutubeCredit;
  }
  const watch = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  return `Plays from <a href="${watch}" target="_blank" rel="noopener">YouTube</a> (embedded in-page). Not from <a href="https://www.youtube.com/@mrjenglishnews" target="_blank" rel="noopener">@mrjenglishnews</a>.`;
}

export function renderFeatureVideoHtml(month) {
  if (month.featureYoutubeId) {
    const title = month.featureTitle || month.featureLabel || "Feature video";
    const videoId = String(month.featureYoutubeId).trim();
    const mountId = `yt-feature-${month.id || videoId}`;
    const label = escapeHtml(title);
    return `
      <div class="video-feature" data-youtube-feature-id="${escapeHtml(videoId)}" data-player-mount-id="${escapeHtml(mountId)}">
        <p class="video-slot-label">${label}</p>
        <div class="video-embed youtube-feature-mount" id="${escapeHtml(mountId)}"></div>
        <div class="video-toolbar">
          <button type="button" class="btn btn-green-subtitles" data-green-subtitles aria-pressed="false">
            Green subtitles
          </button>
        </div>
        <p class="hint video-attribution">${featureYoutubeCreditHtml(month, videoId)}</p>
      </div>`;
  }

  const featureTitle = month.featureTitle || "Feature show";
  const featureDetail = month.featureDetail || month.featureLabel || "";
  return `<div class="placeholder-box">
    <strong>${escapeHtml(month.featureLabel || featureTitle)}</strong><br>
    ${escapeHtml(featureDetail)}
  </div>`;
}
