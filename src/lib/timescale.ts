import { CONTACT_Z, TIME_MAX, TIME_MIN } from "./constants";

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Dauer (Echtzeit, s) der Beinahe-Standbild-Phase direkt nach dem Kontakt. */
export const FREEZE_SECONDS = 1.2;
export const FREEZE_SCALE = 0.02;

/**
 * Zeitfaktor abhängig von der Ballposition.
 * Anflug: ab Netz (z=0) 1.0× → kurz vor dem Schläger 0.1×.
 * Nach dem Kontakt: kurz fast Stillstand (Kontakt ansehen), dann Rückflug wieder schneller.
 */
export function timeScaleFor(ballZ: number, hit: boolean, secondsSinceHit = Infinity): number {
  if (hit && secondsSinceHit < FREEZE_SECONDS) return FREEZE_SCALE;
  const t = Math.min(1, Math.max(0, ballZ / (CONTACT_Z - 0.1)));
  return TIME_MAX + (TIME_MIN - TIME_MAX) * smooth(t);
}
