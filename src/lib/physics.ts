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
  vel: THREE.Vector3; // Geschwindigkeit der Blattmitte (Echtzeit, m/s)
  angVel: THREE.Vector3; // Winkelgeschwindigkeit des Blatts (Echtzeit, rad/s)
  /** Geschwindigkeit der Hand/des Controllers (Echtzeit). Fehlt sie, gilt vel. */
  handVel?: THREE.Vector3;
  quat: THREE.Quaternion;
  /** aktueller Zeitlupenfaktor: Echtzeit-Bewegung wird in Simulationszeit umgerechnet */
  timeScale: number;
};

/** max. Schlägergeschwindigkeit am Kontaktpunkt in Simulationszeit (m/s) */
const MAX_RACKET_SPEED = 8;
/** Zeitlupen-Umrechnung ist gedeckelt: echte Armbewegung wirkt höchstens 3× stärker. */
const MAX_SLOWMO_BOOST = 3;

/** Momentaufnahme des letzten Schlägerkontakts (fürs Overlay). */
export const lastContact = {
  point: new THREE.Vector3(),
  normal: new THREE.Vector3(),
  friction: new THREE.Vector3(), // Reibungs-Geschwindigkeitsänderung am Ball
  spinBefore: new THREE.Vector3(),
  spinAfter: new THREE.Vector3(),
  velBefore: new THREE.Vector3(),
  velAfter: new THREE.Vector3(),
  racketVel: new THREE.Vector3(), // wirksame Schlägergeschwindigkeit (Simulationszeit)
};

/** Umrechnungsfaktor Echtzeit-Armbewegung → Simulationszeit. */
export function slowmoBoost(timeScale: number) {
  return Math.min(1 / Math.max(timeScale, 0.05), MAX_SLOWMO_BOOST);
}
const _rv = new THREE.Vector3();
const _arm = new THREE.Vector3();

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

/** max. realistische Handgelenk-Drehgeschwindigkeit (rad/s) */
export const MAX_WRIST = 12;
/** Zeitlupen-Verstärkung für den Handgelenk-Anteil höchstens 1,5× */
const MAX_WRIST_BOOST = 1.5;
const _hand = new THREE.Vector3();
const _w = new THREE.Vector3();
const _np = new THREE.Vector3();

/**
 * Wirksame Schlägergeschwindigkeit (Simulationszeit) an einem Punkt des Blatts.
 * Armbewegung (Hand) wird mit der Zeitlupe verstärkt (≤3×), der Handgelenk-Anteil
 * (Hebel Hand→Blatt + Drehung am Trefferpunkt) höchstens 1,5×.
 */
export function racketPointVel(r: RacketState, arm: THREE.Vector3, out: THREE.Vector3) {
  const boost = slowmoBoost(r.timeScale);
  const hand = r.handVel ?? r.vel;
  _hand.copy(hand).multiplyScalar(boost);
  _w.copy(r.angVel);
  if (_w.length() > MAX_WRIST) _w.setLength(MAX_WRIST);
  // Handgelenk: Blattmitte relativ zur Hand + Drehung um die Blattmitte
  out.subVectors(r.vel, hand).add(_t.crossVectors(_w, arm));
  out.multiplyScalar(Math.min(boost, MAX_WRIST_BOOST)).add(_hand);
  if (out.length() > MAX_RACKET_SPEED) out.setLength(MAX_RACKET_SPEED);
  return out;
}

/**
 * Schläger-Ball-Kollision. Durchlauf-Test relativ zum Blatt: alter Ballabstand zur
 * alten Blattebene vs. neuer zur neuen. So wird auch ein schnell über den Ball
 * streichendes Blatt erkannt (kein Durchfliegen).
 */
export function collideRacket(
  b: BallState,
  prevPos: THREE.Vector3,
  r: RacketState,
  rPrev?: { pos: THREE.Vector3; normal: THREE.Vector3 },
): boolean {
  _n.copy(r.normal).normalize();
  _np.copy(rPrev ? rPrev.normal : r.normal).normalize();
  const d0 = _off.subVectors(prevPos, rPrev ? rPrev.pos : r.pos).dot(_np);
  const d1 = _off.subVectors(b.pos, r.pos).dot(_n);
  const crossed = d0 * d1 <= 0 || Math.abs(d1) < BALL_RADIUS + 0.004;
  if (!crossed) return false;
  // Abstand in der Ebene
  _off.subVectors(b.pos, r.pos);
  const inPlane = _off.addScaledVector(_n, -_off.dot(_n)).length();
  if (inPlane > RACKET_RADIUS + BALL_RADIUS) return false;

  // Normale zeigt zur Seite, von der der Ball kam
  if (d0 < 0 || (d0 === 0 && d1 < 0)) _n.negate();
  _arm.subVectors(b.pos, r.pos).addScaledVector(_n, -_off.subVectors(b.pos, r.pos).dot(_n));
  racketPointVel(r, _arm, _rv);
  _rel.subVectors(b.vel, _rv);
  const vn = _rel.dot(_n);
  if (vn >= 0) return false; // bewegt sich schon weg

  lastContact.spinBefore.copy(b.spin);
  lastContact.velBefore.copy(b.vel);
  const relT = _vt.copy(_rel).addScaledVector(_n, -vn);
  // Kontaktpunktgeschwindigkeit inkl. Spin
  _r.copy(_n).multiplyScalar(-BALL_RADIUS);
  _vc.crossVectors(b.spin, _r).add(relT);
  _dv.copy(_vc).multiplyScalar(-RACKET_GRIP);

  b.vel.copy(_rv).addScaledVector(_n, -vn * RACKET_RESTITUTION).add(relT).add(_dv);
  _t.crossVectors(_r, _dv).multiplyScalar(3 / (2 * BALL_RADIUS * BALL_RADIUS));
  b.spin.add(_t);

  // Begrenzen, damit nichts explodiert
  if (b.vel.length() > 18) b.vel.setLength(18);
  if (b.spin.length() > 180) b.spin.setLength(180);

  lastContact.normal.copy(_n);
  lastContact.friction.copy(_dv);
  lastContact.spinAfter.copy(b.spin);
  lastContact.velAfter.copy(b.vel);
  lastContact.racketVel.copy(_rv);
  b.pos.copy(r.pos).add(_off.subVectors(b.pos, r.pos).addScaledVector(_n, -_off.dot(_n)));
  lastContact.point.copy(b.pos);
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
