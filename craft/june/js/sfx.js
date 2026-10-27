/** Stage SFX + crowd murmur for silence stage. Mute follows speech.enabled from game. */

export function createSfx() {
  let ctx = null;
  let enabled = true;
  let crowdTimer = null;

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

  function murmurBurst() {
    if (!enabled) return;
    noise(0.12 + Math.random() * 0.08, 0.04 + Math.random() * 0.03, 500 + Math.random() * 400);
    if (Math.random() > 0.5) tone(180 + Math.random() * 80, 0.06, "triangle", 0.03);
  }

  const byStage = {
    dig: () => noise(0.06, 0.07, 350),
    plant: () => tone(400, 0.05, "sine", 0.06),
    water: () => noise(0.1, 0.06, 900),
    grow: () => tone(330, 0.08, "sine", 0.06, 40),
    pick: () => tone(520, 0.05, "sine", 0.07),
    pin: () => tone(880, 0.03, "square", 0.06),
    march: () => noise(0.04, 0.04, 450),
    place: () => tone(220, 0.12, "sine", 0.08),
    card: () => noise(0.03, 0.05, 2500),
    silence: () => tone(264, 0.2, "sine", 0.04),
  };

  return {
    unlock() {
      ac();
    },
    setEnabled(on) {
      enabled = Boolean(on);
      if (!enabled) this.stopCrowd();
    },
    startCrowd() {
      if (!enabled || crowdTimer) return;
      murmurBurst();
      crowdTimer = window.setInterval(murmurBurst, 420 + Math.random() * 280);
    },
    stopCrowd() {
      if (crowdTimer) window.clearInterval(crowdTimer);
      crowdTimer = null;
    },
    miss() {
      tone(220, 0.12, "sine", 0.06, -30);
    },
    win() {
      tone(392, 0.1, "sine", 0.07);
      tone(523, 0.12, "sine", 0.06);
    },
    splash() {
      noise(0.1, 0.07, 1200);
    },
    stage(key) {
      (byStage[key] || (() => tone(300, 0.06, "sine", 0.06)))();
    },
  };
}
