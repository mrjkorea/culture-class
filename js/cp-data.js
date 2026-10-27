import { dataUrl, monthPageUrl } from "./paths.js";

export function getMonthIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("month");
  if (!raw) return null;
  const id = raw.padStart(2, "0").slice(-2);
  return /^\d{2}$/.test(id) ? id : null;
}

export async function loadMonthsMeta() {
  const res = await fetch(dataUrl("months.json"));
  if (!res.ok) throw new Error("Could not load months.json");
  return res.json();
}

export async function loadMonthById(monthId) {
  const data = await loadMonthsMeta();
  return data.months.find((m) => m.id === monthId) ?? null;
}

export function monthHasCpSpeak(month) {
  return Boolean(month?.cpPackFile);
}

export async function loadCpPackForMonth(monthId) {
  const month = await loadMonthById(monthId);
  if (!month?.cpPackFile) {
    return { month, pack: null };
  }
  const res = await fetch(dataUrl(month.cpPackFile));
  if (!res.ok) {
    return { month, pack: null };
  }
  const pack = await res.json();
  return { month, pack };
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export { monthPageUrl };
