import * as THREE from "three";
import {
  BALL_R, DRAG_K, G, MAGNUS_K, NET_H, NET_OVERHANG, NET_Z, SPIN_DECAY, SUBSTEP,
  TABLE_FAR_Z, TABLE_GRIP, TABLE_H, TABLE_NEAR_Z, TABLE_RESTITUTION, TABLE_W,
  RACKET_GRIP, RACKET_RESTITUTION,
} from "./constants";

export interface BallState {
  p: THREE.Vector3;
  v: THREE.Vector3;
  w: THREE.Vector3; // Winkelgeschwindigkeit
}

export type BallEvent =
  | { type: "table"; side: "player" | "opponent" }
  | { type: "net" }
  | { type: "floor" };

export interface RacketPose {
  valid: boolean;
  center: THREE.Vector3;
  normal: THREE.Vector3; // Belag-Normale (beide Seiten gleich)
  quat: THREE.Quaternion;
  vel: THREE.Vector3; // Echtzeit-Geschwindigkeit (m/s)
}

export const cloneBall = (b: BallState): BallState => ({
  p: b.p.clone(), v: b.v.clone(), w: b.w.clone(),
});

const _a = new THREE.Vector3();
const _t = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/**
 * Kontakt mit einer Fläche (Tisch oder Schläger).
 * Normalanteil wird mit e reflektiert; der Tangentialanteil wird über "Grip"
 * zwischen Geschwindigkeit und Rotation ausgetauscht (hohle Kugel, I = 2/3 m R²).
 * Genau daraus entsteht: Unterschnitt + gerader Schläger → Ball fällt nach unten.
 */
export function applyContact(
  b: BallState, n: THREE.Vector3, e: number, grip: number, surfaceVel?: THREE.Vector3,
) {
  const vr = b.v.clone();
  if (surfaceVel) vr.sub(surfaceVel);
  const vn = vr.dot(n);
  if (vn >= 0) return;
  const vt = vr.clone().addScaledVector(n, -vn);
  const r = n.clone().multiplyScalar(-BALL_R);
  const vc = vt.clone().add(new THREE.Vector3().crossVectors(b.w, r));
  const newVr = vt.addScaledVector(vc, -grip).addScaledVector(n, -e * vn);
  b.w.add(new THREE.Vector3().crossVectors(n, vc).multiplyScalar((3 * grip) / (2 * BALL_R)));
  b.v.copy(newVr);
  if (surfaceVel) b.v.add(surfaceVel);
}

/** Ein fester Physik-Unterschritt. */
export function stepBall(b: BallState, dt: number): BallEvent | null {
  const speed = b.v.length();
  _a.set(0, -G, 0)
    .addScaledVector(b.v, -DRAG_K * speed)
    .add(_t.crossVectors(b.w, b.v).multiplyScalar(MAGNUS_K));
  const prevZ = b.p.z;
  b.v.addScaledVector(_a, dt);
  b.p.addScaledVector(b.v, dt);
  b.w.multiplyScalar(Math.exp(-SPIN_DECAY * dt));

  const inX = Math.abs(b.p.x) <= TABLE_W / 2;

  // Netz
  if (
    Math.sign(prevZ - NET_Z) !== Math.sign(b.p.z - NET_Z) &&
    Math.abs(b.p.x) < TABLE_W / 2 + NET_OVERHANG &&
    b.p.y < TABLE_H + NET_H + BALL_R && b.p.y > TABLE_H - 0.02
  ) {
    b.p.z = prevZ;
    b.v.set(b.v.x * 0.2, b.v.y * 0.3, -b.v.z * 0.15);
    b.w.multiplyScalar(0.3);
    return { type: "net" };
  }

  // Tisch
  if (
    b.v.y < 0 && b.p.y - BALL_R < TABLE_H && b.p.y > TABLE_H - 0.05 &&
    inX && b.p.z <= TABLE_NEAR_Z && b.p.z >= TABLE_FAR_Z
  ) {
    b.p.y = TABLE_H + BALL_R;
    applyContact(b, UP, TABLE_RESTITUTION, TABLE_GRIP);
    return { type: "table", side: b.p.z > NET_Z ? "player" : "opponent" };
  }

  // Boden
  if (b.v.y < 0 && b.p.y - BALL_R < 0) {
    b.p.y = BALL_R;
    b.v.set(b.v.x * 0.6, -b.v.y * 0.5, b.v.z * 0.6);
    return { type: "floor" };
  }
  return null;
}

/** Trifft der Schläger den Ball? Führt den Kontakt ggf. aus. prevD = Abstand im letzten Frame. */
export function racketHit(b: BallState, r: RacketPose, prevD: number | null, generous = 1): boolean {
  const rel = b.p.clone().sub(r.center);
  const d = rel.dot(r.normal);
  const lateral = rel.clone().addScaledVector(r.normal, -d).length();
  const crossed = prevD !== null && Math.sign(prevD) !== Math.sign(d);
  if (lateral > (BLADE_R + BALL_R) * generous) return false;
  if (!(Math.abs(d) < BALL_R || crossed)) return false;
  // Seite, von der der Ball kam
  let side = prevD !== null && prevD !== 0 ? Math.sign(prevD) : Math.sign(d) || 1;
  const n = r.normal.clone().multiplyScalar(side);
  // Schlägergeschwindigkeit wird wie in Echtzeit angesetzt (Zeitlupe verändert den Schlag nicht)
  applyContact(b, n, RACKET_RESTITUTION, RACKET_GRIP, r.vel);
  b.p.copy(r.center).add(rel.addScaledVector(r.normal, -d)).addScaledVector(n, BALL_R + 0.003);
  if (b.v.dot(n) < 0.5) b.v.addScaledVector(n, 0.5); // nie im Schläger kleben
  side = 0;
  return true;
}

export function racketDistance(b: BallState, r: RacketPose) {
  return b.p.clone().sub(r.center).dot(r.normal);
}

export interface Prediction {
  points: THREE.Vector3[];
  success: boolean | null;
}

/**
 * Vorhersage: Ball fliegt bis zur Schlägerebene, Kontakt mit aktueller
 * Schlägerhaltung und -bewegung, danach Flugbahn bis zum ersten Aufprall.
 */
export function predict(ball: BallState, r: RacketPose): Prediction {
  const b = cloneBall(ball);
  let prevD = racketDistance(b, r);
  let hit = false;
  for (let i = 0; i < 240 && !hit; i++) {
    stepBall(b, SUBSTEP * 2);
    const d = racketDistance(b, r);
    if (Math.sign(d) !== Math.sign(prevD) || Math.abs(d) < BALL_R) {
      hit = racketHit(b, r, prevD, 3);
      if (!hit) break;
    }
    prevD = d;
    if (b.p.z > r.center.z + 0.5) break;
  }
  if (!hit) return { points: [], success: null };
  const points = [b.p.clone()];
  let success: boolean | null = null;
  for (let i = 0; i < 360; i++) {
    const ev = stepBall(b, SUBSTEP * 2);
    if (i % 3 === 0) points.push(b.p.clone());
    if (ev) {
      points.push(b.p.clone());
      success = ev.type === "table" && ev.side === "opponent";
      break;
    }
  }
  return { points, success };
}
