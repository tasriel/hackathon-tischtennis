// Ballgeräusche direkt per Web Audio (keine Dateien). Nur im Browser aufrufen.
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.15));
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** "Tock" (Tisch) bzw. helleres "Plock" (Schläger); strength 0..1 steuert die Lautstärke. */
export function playBallSound(kind: "table" | "racket", strength: number) {
  const a = audio();
  if (!a || !noise) return;
  const t = a.currentTime;
  const vol = 0.08 + 0.32 * Math.min(1, Math.max(0, strength));
  const gain = a.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0008, t + (kind === "table" ? 0.07 : 0.05));
  gain.connect(a.destination);

  const src = a.createBufferSource();
  src.buffer = noise;
  const bp = a.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = kind === "table" ? 1900 : 3200;
  bp.Q.value = 1.4;
  src.connect(bp).connect(gain);
  src.start(t);

  const osc = a.createOscillator();
  osc.frequency.setValueAtTime(kind === "table" ? 1150 : 1700, t);
  osc.frequency.exponentialRampToValueAtTime(kind === "table" ? 700 : 1100, t + 0.04);
  const og = a.createGain();
  og.gain.value = 0.5;
  osc.connect(og).connect(gain);
  osc.start(t);
  osc.stop(t + 0.07);
}

/** Kurzer Vibrationsimpuls am Controller (falls unterstützt). */
export function pulse(gamepad: Gamepad | undefined | null, intensity: number, ms: number) {
  const act = (gamepad as unknown as { hapticActuators?: { pulse?: (v: number, d: number) => Promise<boolean> }[] } | null)?.hapticActuators?.[0];
  void act?.pulse?.(Math.min(1, Math.max(0, intensity)), ms)?.catch?.(() => {});
}
