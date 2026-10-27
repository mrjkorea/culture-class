/**
 * Word Factory algorithm — ported from mrjkorea/word-master (factory-algo.js).
 * NEED=2 streak2: A (meaning MCQ) → B (dictation) → C (write from Korean).
 */
export const NEED = 2;
export const MODE_META = {
  A: { ko: "배우기", hint: "Listen and pick the Korean meaning" },
  B: { ko: "받아쓰기", hint: "Listen and type the English word" },
  C: { ko: "쓰기", hint: "Read Korean and type English" },
};

export function emptyWins() {
  return { winsA: {}, winsB: {}, winsC: {} };
}

export function bucket(state, mode) {
  if (mode === "A") return state.winsA;
  if (mode === "B") return state.winsB;
  return state.winsC;
}

function partDone(words, wins) {
  return words.every((w) => (wins[w.id] || 0) >= NEED);
}

export function remaining(words, wins) {
  return words.filter((w) => (wins[w.id] || 0) < NEED);
}

export function nextMode(mode) {
  if (mode === "A") return "B";
  if (mode === "B") return "C";
  return null;
}

export function startMode(words, state) {
  if (!partDone(words, state.winsA)) return "A";
  if (!partDone(words, state.winsB)) return "B";
  if (!partDone(words, state.winsC)) return "C";
  return null;
}

export function factoryProgress(words, state) {
  let got = 0;
  const need = words.length * NEED * 3;
  for (const w of words) {
    got += Math.min(NEED, state.winsA[w.id] || 0);
    got += Math.min(NEED, state.winsB[w.id] || 0);
    got += Math.min(NEED, state.winsC[w.id] || 0);
  }
  return need ? Math.round((got / need) * 100) : 0;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeQueue(words, wins) {
  return shuffle(remaining(words, wins));
}

export function nextWord(queue, words, wins) {
  queue = queue.filter((w) => (wins[w.id] || 0) < NEED);
  if (!queue.length) queue = shuffle(remaining(words, wins));
  if (!queue.length) return { queue, cur: null, partDone: true };
  const cur = queue.shift();
  return { queue, cur, partDone: false };
}

export function applyGrade(queue, words, wins, cur, ok) {
  if (ok) {
    wins[cur.id] = (wins[cur.id] || 0) + 1;
    if ((wins[cur.id] || 0) < NEED) queue.push(cur);
  } else {
    wins[cur.id] = 0;
    queue.push(cur);
  }
  return nextWord(queue, words, wins);
}
