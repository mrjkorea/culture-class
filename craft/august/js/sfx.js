/** History Day craft SFX */

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

  const byStage = {
    egypt: () => tone(280, 0.06, "triangle", 0.08),
    mesopotamia: () => noise(0.05, 0.07, 500),
    indus: () => tone(420, 0.05, "sine", 0.07),
    china: () => tone(320, 0.05, "square", 0.06),
    greece: () => tone(440, 0.08, "sine", 0.07),
    rome: () => noise(0.04, 0.06, 400),
    maya: () => tone(360, 0.06, "sine", 0.07),
    mali: () => tone(520, 0.05, "triangle", 0.08),
    inca: () => tone(300, 0.05, "sine", 0.07),
    modern: () => {
      tone(523, 0.1, "sine", 0.09);
      tone(659, 0.12, "sine", 0.08);
    },
  };

  return {
    unlock() {
      ac();
    },
    setEnabled(on) {
      enabled = Boolean(on);
    },
    miss() {
      tone(200, 0.12, "sawtooth", 0.05, -40);
    },
    win() {
      tone(392, 0.1, "sine", 0.08);
      tone(523, 0.12, "sine", 0.07);
    },
    stage(key) {
      (byStage[key] || (() => tone(300, 0.06, "sine", 0.06)))();
    },
  };
}
