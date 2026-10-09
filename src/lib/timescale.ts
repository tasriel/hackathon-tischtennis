import { GRAVITY, TABLE, TIME_MAX, TIME_MIN } from "./constants";

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Fester Zeitfaktor fürs Review (dauerhaft orange). */
export const FREEZE_SCALE = 0.02;

/** Vorlauf in Simulationssekunden: kurz vor dem Scheitel weich verlangsamen. */
export const APEX_LEAD_SECONDS = 0.28;

/** Dauer der Zeitlupe nach dem Treffer: Halten + weiches Hochfahren (Echtzeit, s). */
export type SlowDuration = "instant" | "short" | "medium" | "long";
export const SLOW_DURATIONS: Record<SlowDuration, { hold: number; ramp: number; label: string }> = {
  instant: { hold: 0, ramp: 0.12, label: "Sofort" },
  short: { hold: 0.25, ramp: 0.35, label: "Kurz" },
  medium: { hold: 0.6, ramp: 0.5, label: "Mittel" },
  long: { hold: 1.1, ramp: 0.7, label: "Lang" },
};

export type SlowOptions = { min: number; duration: SlowDuration };
const DEFAULT_OPTS: SlowOptions = { min: TIME_MIN, duration: "medium" };

/** Tischende Spielerseite (z) und Rampenlänge davor (m). */
const EDGE_Z = TABLE.length / 2 - 0.05;
const EDGE_RAMP = 0.3;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Live-Zeitfaktor. Vor dem Scheitel nach dem ersten Aufsprung (spätestens am Plattenende)
 * weich auf `min` verlangsamen; nach dem Kontakt kurz halten und weich hochfahren –
 * ohne Standbild-Plateau.
 */
export function timeScaleFor(
  enabled: boolean,
  bouncedNear: boolean,
  verticalVelocity: number,
  hit: boolean,
  secondsSinceHit = Infinity,
  ballZ = 0,
  ballVz = 0,
  opts: SlowOptions = DEFAULT_OPTS,
): number {
  if (!enabled) return TIME_MAX;
  const min = opts.min;
  if (!hit) {
    const edge = ballVz > 0 ? clamp01((ballZ - (EDGE_Z - EDGE_RAMP)) / EDGE_RAMP) : 0;
    let t = edge;
    if (bouncedNear) {
      if (verticalVelocity <= 0) return min;
      const toApex = verticalVelocity / Math.abs(GRAVITY);
      t = Math.max(t, 1 - Math.min(1, toApex / APEX_LEAD_SECONDS));
    }
    return TIME_MAX + (min - TIME_MAX) * smooth(t);
  }
  const d = SLOW_DURATIONS[opts.duration];
  if (secondsSinceHit < d.hold) return min;
  const k = Math.min(1, (secondsSinceHit - d.hold) / d.ramp);
  return min + (TIME_MAX - min) * smooth(k);
}
