import * as THREE from "three";
import {
  BALL_RADIUS,
  DRAG,
  GRAVITY,
  MAGNUS,
  RACKET_GRIP,
  RACKET_RADIUS,
  RACKET_RESTITUTION,
  SERVE,
  TABLE,
  TABLE_FRICTION,
  TABLE_RESTITUTION,
} from "./constants";

export type BallState = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  spin: THREE.Vector3; // Winkelgeschwindigkeit rad/s
};

export type RacketState = {
  pos: THREE.Vector3; // Mitte des Blatts
  normal: THREE.Vector3; // Blattnormale (Welt)
  vel: THREE.Vector3; // Geschwindigkeit des Blatts
  quat: THREE.Quaternion;
};

export type TableEvent = "table-near" | "table-far" | "net" | "floor" | null;

export function makeBall(): BallState {
  return { pos: new THREE.Vector3(), vel: new THREE.Vector3(), spin: new THREE.Vector3() };
}

export function resetServe(b: BallState) {
  b.pos.set(...SERVE.pos);
  b.vel.set(...SERVE.vel);
  b.spin.set(...SERVE.spin);
}

export function cloneBall(b: BallState): BallState {
  return { pos: b.pos.clone(), vel: b.vel.clone(), spin: b.spin.clone() };
}

const _a = new THREE.Vector3();
const _t = new THREE.Vector3();
const _r = new THREE.Vector3();
const _vc = new THREE.Vector3();
const _dv = new THREE.Vector3();

/** Ein Physikschritt (Schwerkraft, Luftwiderstand, Magnus, Tisch, Netz). */
export function stepBall(b: BallState, dt: number): TableEvent {
  const prevZ = b.pos.z;
  _a.set(0, GRAVITY, 0);
  _a.addScaledVector(b.vel, -DRAG * b.vel.length());
  _t.crossVectors(b.spin, b.vel).multiplyScalar(MAGNUS);
  _a.add(_t);
  b.vel.addScaledVector(_a, dt);
  b.pos.addScaledVector(b.vel, dt);
  b.spin.multiplyScalar(Math.exp(-0.05 * dt));

  // Netz
  const netTop = TABLE.height + TABLE.netHeight;
  if (
    Math.sign(prevZ) !== Math.sign(b.pos.z) &&
    b.pos.y < netTop + BALL_RADIUS &&
    b.pos.y > TABLE.height - 0.02 &&
    Math.abs(b.pos.x) < TABLE.width / 2 + 0.15
  ) {
    b.pos.z = prevZ > 0 ? BALL_RADIUS : -BALL_RADIUS;
    b.vel.z *= -0.15;
    b.vel.x *= 0.3;
    b.spin.multiplyScalar(0.3);
    return "net";
  }

  // Tisch
  const onTable =
    Math.abs(b.pos.x) <= TABLE.width / 2 && Math.abs(b.pos.z) <= TABLE.length / 2;
  if (onTable && b.vel.y < 0 && b.pos.y <= TABLE.height + BALL_RADIUS && b.pos.y > TABLE.height - 0.05) {
    b.pos.y = TABLE.height + BALL_RADIUS;
    const vyIn = -b.vel.y;
    b.vel.y = vyIn * TABLE_RESTITUTION;
    // Reibung am Kontaktpunkt (Coulomb-begrenzt) -> Spin beeinflusst den Absprung
    _r.set(0, -BALL_RADIUS, 0);
    _vc.crossVectors(b.spin, _r).add(b.vel);
    _vc.y = 0;
    const slip = _vc.length();
    if (slip > 1e-6) {
      // max. Reibungsimpuls: mu * Normalimpuls; höchstens bis Rollen (Hohlkugel: 2/5)
      const dvMag = Math.min(TABLE_FRICTION * (1 + TABLE_RESTITUTION) * vyIn, 0.4 * slip);
      _dv.copy(_vc).multiplyScalar(-dvMag / slip);
      b.vel.add(_dv);
      _t.crossVectors(_r, _dv).multiplyScalar(3 / (2 * BALL_RADIUS * BALL_RADIUS));
      b.spin.add(_t);
    }
    return b.pos.z < 0 ? "table-far" : "table-near";
  }

  if (b.pos.y < BALL_RADIUS) {
    b.pos.y = BALL_RADIUS;
    b.vel.set(0, 0, 0);
    return "floor";
  }
  return null;
}

const _n = new THREE.Vector3();
const _rel = new THREE.Vector3();
const _off = new THREE.Vector3();
const _vt = new THREE.Vector3();

/**
 * Schläger-Ball-Kollision (Durchlauf-Test gegen die Blattebene).
 * Gibt true zurück, wenn getroffen wurde; Ball-Zustand wird angepasst.
 */
export function collideRacket(b: BallState, prevPos: THREE.Vector3, r: RacketState): boolean {
  _n.copy(r.normal).normalize();
  const d0 = _off.subVectors(prevPos, r.pos).dot(_n);
  const d1 = _off.subVectors(b.pos, r.pos).dot(_n);
  const crossed = d0 * d1 <= 0 || Math.abs(d1) < BALL_RADIUS;
  if (!crossed) return false;
  // Abstand in der Ebene
  _off.subVectors(b.pos, r.pos);
  const inPlane = _off.addScaledVector(_n, -_off.dot(_n)).length();
  if (inPlane > RACKET_RADIUS + BALL_RADIUS) return false;

  // Normale zeigt zur Seite, von der der Ball kam
  if (d0 < 0) _n.negate();
  _rel.subVectors(b.vel, r.vel);
  const vn = _rel.dot(_n);
  if (vn >= 0) return false; // bewegt sich schon weg

  const relT = _vt.copy(_rel).addScaledVector(_n, -vn);
  // Kontaktpunktgeschwindigkeit inkl. Spin
  _r.copy(_n).multiplyScalar(-BALL_RADIUS);
  _vc.crossVectors(b.spin, _r).add(relT);
  _dv.copy(_vc).multiplyScalar(-RACKET_GRIP);

  b.vel.copy(r.vel).addScaledVector(_n, -vn * RACKET_RESTITUTION).add(relT).add(_dv);
  _t.crossVectors(_r, _dv).multiplyScalar(3 / (2 * BALL_RADIUS * BALL_RADIUS));
  b.spin.add(_t);

  // Begrenzen, damit nichts explodiert
  if (b.vel.length() > 18) b.vel.setLength(18);
  if (b.spin.length() > 180) b.spin.setLength(180);

  b.pos.copy(r.pos).add(_off.subVectors(b.pos, r.pos).addScaledVector(_n, -_off.dot(_n)));
  b.pos.addScaledVector(_n, BALL_RADIUS * 1.2);
  return true;
}

/** Spin-Art relativ zur Flugrichtung. */
export function spinType(b: BallState): "TOPSPIN" | "BACKSPIN" | "OHNE SPIN" {
  const v = b.vel.clone();
  v.y = 0;
  if (v.lengthSq() < 1e-4) return "OHNE SPIN";
  v.normalize();
  const t = _t.crossVectors(b.spin, new THREE.Vector3(0, 1, 0)).dot(v);
  if (t > 8) return "TOPSPIN";
  if (t < -8) return "BACKSPIN";
  return "OHNE SPIN";
}
