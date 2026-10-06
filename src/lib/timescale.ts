import { GRAVITY, TABLE, TIME_MAX, TIME_MIN } from "./constants";

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Dauer (Echtzeit, s) der Beinahe-Standbild-Phase direkt nach dem Kontakt. */
export const FREEZE_SECONDS = 0.6;
/** Danach sanftes Hochfahren auf normale Zeit (Echtzeit, s). */
export const RAMP_SECONDS = 0.5;
export const FREEZE_SCALE = 0.02;

/** Vorlauf in Simulationssekunden: kurz vor dem Scheitel weich verlangsamen. */
export const APEX_LEAD_SECONDS = 0.28;

/** Tischende Spielerseite (z) und Rampenlänge davor (m). */
const EDGE_Z = TABLE.length / 2 - 0.05;
const EDGE_RAMP = 0.3;
const THREE_CLAMP = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Live-Zeitfaktor nach dem ersten Aufsprung auf der Spielerseite.
 * Vor dem Scheitel wird weich verlangsamt; nach dem Kontakt folgt die kurze Pause.
 */
export function timeScaleFor(
  enabled: boolean,
  bouncedNear: boolean,
  verticalVelocity: number,
  hit: boolean,
  secondsSinceHit = Infinity,
  ballZ = 0,
  ballVz = 0,
): number {
  if (!enabled) return TIME_MAX;
  if (!hit) {
    // Spätestens kurz vor dem Plattenende verlangsamen (sehr lange Bälle)
    const edge = ballVz > 0 ? THREE_CLAMP((ballZ - (EDGE_Z - EDGE_RAMP)) / EDGE_RAMP) : 0;
    let t = edge;
    if (bouncedNear) {
      if (verticalVelocity <= 0) return TIME_MIN;
      const toApex = verticalVelocity / Math.abs(GRAVITY);
      t = Math.max(t, 1 - Math.min(1, toApex / APEX_LEAD_SECONDS));
    }
    return TIME_MAX + (TIME_MIN - TIME_MAX) * smooth(t);
  }
  if (secondsSinceHit < FREEZE_SECONDS) return FREEZE_SCALE;
  const k = Math.min(1, (secondsSinceHit - FREEZE_SECONDS) / RAMP_SECONDS);
  return FREEZE_SCALE + (TIME_MAX - FREEZE_SCALE) * smooth(k);
}
