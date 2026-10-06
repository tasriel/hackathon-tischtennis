import * as THREE from "three";
import { RUBBERS, TABLE, type RubberType } from "./constants";
import { cloneBall, collideRacket, spinType, stepBall, type BallState, type RacketState } from "./physics";

export const OPP_DT = 1 / 240;

export type OpponentPlan = {
  /** Physikschritte ab dem Aufsprung auf der Gegnerseite bis zum Treffer */
  steps: number;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  vel: THREE.Vector3; // Schlägergeschwindigkeit (Simulationszeit)
  rubber: RubberType;
};

const _prev = new THREE.Vector3();
const racket: RacketState = {
  pos: new THREE.Vector3(),
  normal: new THREE.Vector3(),
  vel: new THREE.Vector3(),
  angVel: new THREE.Vector3(),
  quat: new THREE.Quaternion(),
  timeScale: 1,
};

/** Gegner-Schläger trifft den Ball an seinem aktuellen Ort. Ball fliegt Richtung −z an. */
export function hitWithRubber(b: BallState, normal: THREE.Vector3, vel: THREE.Vector3, rubber: RubberType): boolean {
  const point = b.pos.clone();
  racket.pos.copy(point);
  racket.normal.copy(normal);
  racket.vel.copy(vel);
  _prev.copy(point).addScaledVector(b.vel, -OPP_DT * 3);
  b.pos.copy(point).addScaledVector(normal, -0.001);
  return collideRacket(b, _prev, racket, undefined, RUBBERS[rubber]);
}

/**
 * Plant den Lehrball des Gegners: sucht den Trefferpunkt nach dem Aufsprung und die
 * Belag-typische Bewegung, die sicher mittig-tief auf der Spielerseite landet.
 * Kein "Siegball" – Abweichung von der typischen Bewegung wird bestraft.
 */
export function planOpponent(ballAfterBounce: BallState, rubber: RubberType): OpponentPlan | null {
  const spec = RUBBERS[rubber];
  const b = cloneBall(ballAfterBounce);
  let steps = 0;
  let ok = false;
  for (; steps < 480; steps++) {
    const ev = stepBall(b, OPP_DT);
    if (ev && ev !== "table-far") return null;
    const pastEnd = b.pos.z < -TABLE.length / 2 - 0.2;
    if ((b.vel.y < 0 && b.pos.y < TABLE.height + 0.3) || pastEnd) {
      ok = b.pos.y > TABLE.height + 0.04;
      steps++;
      break;
    }
  }
  if (!ok) return null;
  const contact = cloneBall(b);
  const n = new THREE.Vector3();
  const v = new THREE.Vector3();
  const t = cloneBall(b);
  let best: OpponentPlan | null = null;
  let bestScore = -Infinity;
  for (let open = spec.open[0]; open <= spec.open[1]; open += spec.open[2]) {
    const o = THREE.MathUtils.degToRad(open);
    n.set(0, Math.sin(o), Math.cos(o));
    for (let speed = spec.speed[0]; speed <= spec.speed[1] + 0.01; speed += spec.speed[2]) {
      for (let dir = spec.dir[0]; dir <= spec.dir[1]; dir += spec.dir[2]) {
        const d = THREE.MathUtils.degToRad(dir);
        v.set(0, Math.sin(d), Math.cos(d)).multiplyScalar(speed);
        t.pos.copy(contact.pos);
        t.vel.copy(contact.vel);
        t.spin.copy(contact.spin);
        if (!hitWithRubber(t, n, v, rubber)) continue;
        const outSpin = spinType(t);
        let gap = Infinity;
        let score = -Infinity;
        for (let i = 0; i < 480; i++) {
          const pz = t.pos.z;
          const e = stepBall(t, OPP_DT);
          if (Math.sign(pz) !== Math.sign(t.pos.z)) gap = t.pos.y - (TABLE.height + TABLE.netHeight);
          if (!e) continue;
          if (e === "table-near") {
            score = 10 - Math.abs(t.pos.z - 0.85) * 5 - Math.abs(t.pos.x) * 2;
            score += Math.min(gap, 0.1) * 30 - Math.max(0, gap - 0.3) * 10;
            if (spec.wantSpin && outSpin === spec.wantSpin) score += 3;
            score -= Math.abs(open - spec.typ.open) / 20 + Math.abs(speed - spec.typ.speed) / 1.5 + Math.abs(dir - spec.typ.dir) / 20;
          }
          break;
        }
        if (score > bestScore) {
          bestScore = score;
          best = { steps, point: contact.pos.clone(), normal: n.clone(), vel: v.clone(), rubber };
        }
      }
    }
  }
  return best;
}
