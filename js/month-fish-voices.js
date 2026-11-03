/**
 * Locked Fish narrator per Culture Class month (pre-baked MP3s only — no SpeechSynthesis).
 * CP Speak and word packs use these folders; students do not pick Ray/Harper in CP.
 */
export const MONTH_FISH_VOICES = {
  "01": { host: "Coach Ray", fishId: "736de7d32d7949469ba4664bce9f3f32", key: "ray" },
  "02": { host: "Miss Harper", fishId: "736de7d32d7949469ba4664bce9f3f32", key: "harper" },
  "03": { host: "Leo", fishId: "a60e9fc6e78c4bdca656702c6d27ba08", key: "leo" },
  "04": { host: "Maya", fishId: "", key: "maya" },
  "05": { host: "Grandma June", fishId: "0a90765966ac4556a6ecfd86ef8057d3", key: "june" },
  "06": { host: "Grandpa Walt", fishId: "", key: "walt" },
  "07": { host: "Coach Ray", fishId: "736de7d32d7949469ba4664bce9f3f32", key: "ray" },
  "08": { host: "Harper", fishId: "736de7d32d7949469ba4664bce9f3f32", key: "harper" },
  "09": { host: "Nia", fishId: "", key: "nia" },
  "10": { host: "Frank Monster", fishId: "a1895a46a08d48578b8a679a035d79fe", key: "frank" },
  "11": { host: "Grandma June", fishId: "0a90765966ac4556a6ecfd86ef8057d3", key: "june" },
  "12": { host: "Santa", fishId: "ae1297174b0e4a9c838d218aa0419d8f", key: "santa" },
};

/** Locked Fish narrator per month — see `js/month-fish-voices.js`. */
export function getMonthFishVoice(monthId) {
  const n = parseInt(String(monthId ?? "10"), 10);
  const key =
    Number.isFinite(n) && n >= 1 && n <= 12 ? String(n).padStart(2, "0") : "10";
  return MONTH_FISH_VOICES[key] || MONTH_FISH_VOICES["10"];
}
