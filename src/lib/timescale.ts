import { HIT_ZONE_Z, NET_Z, SLOWMO_MIN } from "./constants";

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/**
 * Ziel-Zeitfaktor abhängig von der Ballposition.
 * Netz 1,0× → kurz vor Kontakt ~0,1× → nach Kontakt zurück zu 1,0× am Netz.
 */
export function targetTimeScale(z: number, phase: "incoming" | "outgoing" | "idle", hitZ = HIT_ZONE_Z) {
  if (phase === "idle") return 1;
  const t = (z - NET_Z) / (hitZ - NET_Z); // 0 am Netz, 1 am Treffpunkt
  return 1 - (1 - SLOWMO_MIN) * smooth(t);
}

/** Weich zum Ziel nähern (framerate-unabhängig). */
export const approach = (cur: number, target: number, dt: number, k = 6) =>
  target + (cur - target) * Math.exp(-k * dt);
