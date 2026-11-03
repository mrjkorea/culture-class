/**
 * Locked Fish narrator per Culture Class month (pre-baked MP3s only — no SpeechSynthesis).
 * CP Speak and word packs use these folders; students do not pick Ray/Harper in CP.
 */
export const MONTH_FISH_VOICES = {
  "01": { host: "Sports announcer", fishId: "c8bacb39cd624721b8638ed8f2ec773e", key: "coach" },
  "02": { host: "Valentino", fishId: "a1fe2e1b6f324e27929d5088f2d09be3", key: "harper" },
  "03": { host: "Lively Irish", fishId: "29509e20f1a14a8698ffb42134fc944d", key: "leo" },
  "04": { host: "Dolly Parton", fishId: "234e60f891c1414dabf5737c98190e1c", key: "maya" },
  "05": { host: "Bedtime", fishId: "2ecec70ca91b4febbb84a3bc6ed46c2d", key: "walt" },
  "06": { host: "Docs / Morgan Freeman", fishId: "3ad4d432023c47ee9e6c7805b973630a", key: "june" },
  "07": { host: "Noah", fishId: "d9ce1833c191476db346efb50aa20722", key: "robot" },
  "08": { host: "Patrick Stewart", fishId: "de960f838fca4db6952947296b96d0fe", key: "sage" },
  "09": { host: "Grandpa Walt", fishId: "86d2e997840443a1832c999ee71468b2", key: "nia" },
  "10": { host: "Frank Monster", fishId: "a1895a46a08d48578b8a679a035d79fe", key: "frank" },
  "11": { host: "Grandma June", fishId: "0a90765966ac4556a6ecfd86ef8057d3", key: "grandma" },
  "12": { host: "Santa", fishId: "ae1297174b0e4a9c838d218aa0419d8f", key: "nature" },
};

/** Locked Fish narrator per month — see `js/month-fish-voices.js`. */
export function getMonthFishVoice(monthId) {
  const n = parseInt(String(monthId ?? "10"), 10);
  const key =
    Number.isFinite(n) && n >= 1 && n <= 12 ? String(n).padStart(2, "0") : "10";
  return MONTH_FISH_VOICES[key] || MONTH_FISH_VOICES["10"];
}
