import { CONTACT_Z, TIME_MAX, TIME_MIN } from "./constants";

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Zeitfaktor abhängig von der Ballposition.
 * Anflug: ab Netz (z=0) 1.0× → kurz vor dem Schläger 0.1×.
 * Rückflug: vom Schläger 0.1× → am Netz wieder 1.0×.
 */
export function timeScaleFor(ballZ: number, hit: boolean): number {
  const t = Math.min(1, Math.max(0, ballZ / (CONTACT_Z - 0.1)));
  const s = smooth(t);
  if (!hit) return TIME_MAX + (TIME_MIN - TIME_MAX) * s;
  return TIME_MAX + (TIME_MIN - TIME_MAX) * s;
}
