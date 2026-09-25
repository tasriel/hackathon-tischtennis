import { CONTACT_Z, TIME_MAX, TIME_MIN } from "./constants";

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Dauer (Echtzeit, s) der Beinahe-Standbild-Phase direkt nach dem Kontakt. */
export const FREEZE_SECONDS = 0.6;
/** Danach sanftes Hochfahren auf normale Zeit (Echtzeit, s). */
export const RAMP_SECONDS = 0.5;
export const FREEZE_SCALE = 0.02;

/**
 * Zeitfaktor abhängig von der Ballposition.
 * Anflug: ab Netz (z=0) 1.0× → kurz vor dem Schläger 0.1×.
 * Nach dem Kontakt: kurz fast Stillstand, dann weich zurück auf das normale Tempo.
 */
export function timeScaleFor(ballZ: number, hit: boolean, secondsSinceHit = Infinity): number {
  const t = Math.min(1, Math.max(0, ballZ / (CONTACT_Z - 0.1)));
  const normal = TIME_MAX + (TIME_MIN - TIME_MAX) * smooth(t);
  if (!hit) return normal;
  if (secondsSinceHit < FREEZE_SECONDS) return FREEZE_SCALE;
  const k = Math.min(1, (secondsSinceHit - FREEZE_SECONDS) / RAMP_SECONDS);
  return FREEZE_SCALE + (normal - FREEZE_SCALE) * smooth(k);
}
