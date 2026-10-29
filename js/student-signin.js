import { studentDisplayName } from "./i18n.js";

export const DISPLAY_NAME_KEY = "culture-class-display-name";

/** Keep culture-class-display-name in sync with MRJ sign-in when present. */
export function syncDisplayNameFromAuth() {
  try {
    if (window.MRJ_AUTH && typeof window.MRJ_AUTH.student === "function") {
      const id = String(window.MRJ_AUTH.student() || "").trim();
      if (id) {
        localStorage.setItem(DISPLAY_NAME_KEY, id.slice(0, 24));
        return id.slice(0, 24);
      }
    }
  } catch {
    /* ignore */
  }
  return studentDisplayName();
}

export function rememberDisplayName(raw) {
  const name = String(raw || "")
    .replace(/[\u0000-\u001F]/g, "")
    .trim()
    .slice(0, 24);
  if (!name) return "";
  try {
    localStorage.setItem(DISPLAY_NAME_KEY, name);
  } catch {
    /* ignore */
  }
  return name;
}

/** Name for leaderboards — never prompts; uses MRJ auth or saved name. */
export function leaderboardDisplayName(fallback = "Student") {
  syncDisplayNameFromAuth();
  return studentDisplayName() || fallback;
}
