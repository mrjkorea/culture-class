/** localStorage leaderboard. Fastest time, then fewer misses. */

export function cleanName(raw) {
  return String(raw || "")
    .replace(/[\u0000-\u001F]/g, "")
    .trim()
    .slice(0, 16);
}

export function formatTime(ms) {
  const clamped = Math.max(0, Math.round(Number(ms) || 0));
  const minutes = Math.floor(clamped / 60000);
  const seconds = Math.floor(clamped / 1000) % 60;
  const tenths = Math.floor(clamped / 100) % 10;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function validEntry(row) {
  return (
    row &&
    typeof row.name === "string" &&
    row.name.length > 0 &&
    Number.isFinite(row.timeMs) &&
    Number.isFinite(row.misses)
  );
}

export function loadBoard(key) {
  try {
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    return list.filter(validEntry);
  } catch {
    return [];
  }
}

export function saveRun(key, entry) {
  const list = loadBoard(key);
  list.push(entry);
  list.sort((a, b) => a.timeMs - b.timeMs || a.misses - b.misses || a.at - b.at);
  const trimmed = list.slice(0, 20);
  try {
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    /* storage full or blocked — the run still finishes on screen */
  }
  return trimmed;
}
