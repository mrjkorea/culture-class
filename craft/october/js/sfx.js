/** Stage SFX via Web Audio. Mute follows speech.enabled from game. */

export function createSfx() {
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!enabled) return null;
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        return null;
      }
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type = "sine", gain = 0.12, slide = 0) {
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, gain = 0.08, filterHz = 800) {
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = filterHz;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(c.destination);
    src.start(t0);
    src.stop(t0 + dur);
  }

  function unlock() {
    ac();
  }

  function setEnabled(on) {
    enabled = Boolean(on);
  }

  const byStage = {
    patch: () => {
      tone(220, 0.06, "triangle", 0.1);
      tone(180, 0.08, "sine", 0.06, -40);
    },
    wash: () => {
      noise(0.12, 0.09, 1200);
      tone(520, 0.05, "sine", 0.05);
    },
    cut: () => {
      noise(0.04, 0.12, 2000);
      tone(140, 0.07, "sawtooth", 0.06);
    },
    scoop: () => {
      noise(0.14, 0.11, 600);
      tone(90, 0.1, "square", 0.04, -20);
    },
    roast: () => {
      noise(0.18, 0.1, 400);
      tone(60, 0.15, "sawtooth", 0.07);
    },
    pin: () => {
      tone(880, 0.03, "square", 0.08);
      tone(1200, 0.02, "sine", 0.04);
    },
    carve: () => {
      noise(0.06, 0.1, 1500);
      tone(200, 0.08, "triangle", 0.07, -80);
    },
    light: () => {
      noise(0.05, 0.06, 3000);
      tone(400, 0.12, "sine", 0.1, 200);
    },
    house: () => tone(160, 0.1, "triangle", 0.1, -30),
    candy: () => {
      tone(660, 0.05, "sine", 0.09);
      tone(880, 0.06, "sine", 0.07);
    },
  };

  return {
    unlock,
    setEnabled,
    miss() {
      tone(150, 0.14, "sawtooth", 0.1, -60);
    },
    win() {
      tone(523, 0.08, "sine", 0.1);
      tone(659, 0.1, "sine", 0.09);
      tone(784, 0.14, "sine", 0.08);
    },
    stage(key) {
      (byStage[key] || (() => tone(300, 0.06, "sine", 0.06)))();
    },
    scrape() {
      byStage.scoop();
    },
    flip() {
      noise(0.08, 0.07, 500);
      tone(70, 0.12, "triangle", 0.09, 40);
    },
    splash() {
      byStage.wash();
    },
  };
}
