import * as THREE from "three";
import { OPPONENT_NET_GAP, OPPONENT_TARGET_X, RUBBERS, TABLE, type RubberType } from "./constants";
import { cloneBall, collideRacket, spinType, stepBall, type BallState, type RacketState } from "./physics";

export const OPP_DT = 1 / 240;

export type OpponentPlan = {
  /** Physikschritte ab Planungszeitpunkt bis zum Treffer */
  steps: number;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  vel: THREE.Vector3; // Schlägergeschwindigkeit (Simulationszeit)
  rubber: RubberType;
  stroke: string;
  /** Notlösung aktiv (keine Belag-Bewegung landete sicher) */
  override?: boolean;
  /** Vorab berechneter Ballzustand direkt nach dem Treffer – garantiert den Rückschlag */
  result: { pos: THREE.Vector3; vel: THREE.Vector3; spin: THREE.Vector3 };
};

/**
 * Plant bereits direkt nach dem Spielerkontakt. Der Treffer wird ausschließlich
 * zwischen dem ersten und einem möglichen zweiten Aufsprung auf der Gegnerseite gewählt.
 */
export function planOpponentFromFlight(ballAfterPlayerHit: BallState, rubber: RubberType): OpponentPlan | null {
  const flight = cloneBall(ballAfterPlayerHit);
  for (let stepsToBounce = 1; stepsToBounce <= 720; stepsToBounce++) {
    const ev = stepBall(flight, OPP_DT);
    if (ev === "table-far") {
      const plan = planOpponent(flight, rubber);
      plan.steps += stepsToBounce;
      return plan;
    }
    if (ev === "net" || ev === "floor" || ev === "table-near") return null;
  }
  return null;
}

const _prev = new THREE.Vector3();
const _Y = new THREE.Vector3(0, 1, 0);
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

/** Führt den geplanten Gegnerschlag am Ball aus (inkl. Notlösung). */
export function applyOpponentHit(b: BallState, plan: OpponentPlan) {
  b.pos.copy(plan.result.pos);
  b.vel.copy(plan.result.vel);
  b.spin.copy(plan.result.spin);
}

/** Fliegt der Ball und landet auf der Spielerseite? Liefert Bewertung oder −Infinity. */
function rate(t: BallState, targetZ: number) {
  let gap = -1;
  for (let i = 0; i < 600; i++) {
    const pz = t.pos.z;
    const e = stepBall(t, OPP_DT);
    if (Math.sign(pz) !== Math.sign(t.pos.z)) gap = t.pos.y - (TABLE.height + TABLE.netHeight);
    if (!e) continue;
    if (e !== "table-near" || gap < 0.03) return { ok: false, score: -1e3 - Math.abs(t.pos.z - targetZ) };
    const s =
      10 -
      Math.abs(t.pos.z - targetZ) * 5 -
      Math.abs(t.pos.x - OPPONENT_TARGET_X) * 4 -
      Math.abs(gap - OPPONENT_NET_GAP) * 12;
    return { ok: true, score: s };
  }
  return { ok: false, score: -2e3 };
}

/**
 * Plant den Lehrball des Gegners: sucht den Trefferpunkt nach dem Aufsprung und die
 * Belag-typische Bewegung (abhängig vom ankommenden Spin), die sicher in die Vorhand
 * des Spielers landet. Kein "Siegball". Findet sich nichts, gibt es einen Notfall-Ball –
 * der Gegner spielt also jeden Ball zurück, der auf seiner Seite aufkommt.
 */
export function planOpponent(ballAfterBounce: BallState, rubber: RubberType): OpponentPlan {
  const spec = RUBBERS[rubber];
  const b = cloneBall(ballAfterBounce);
  let steps = 0;
  let apex: { b: BallState; steps: number } | null = null;
  let chosen: { b: BallState; steps: number } | null = null;
  for (; steps < 480; steps++) {
    const wasUp = b.vel.y > 0;
    const before = cloneBall(b);
    const ev = stepBall(b, OPP_DT);
    if (wasUp && b.vel.y <= 0) apex = { b: cloneBall(b), steps: steps + 1 };
    if (ev === "floor" || ev === "net" || ev === "table-near") {
      chosen = apex ?? { b: before, steps };
      break;
    }
    const pastEnd = b.pos.z < -TABLE.length / 2 - 0.25;
    if ((b.vel.y < 0 && b.pos.y < TABLE.height + 0.25) || pastEnd) {
      chosen = b.pos.y > TABLE.height + 0.06 ? { b: cloneBall(b), steps: steps + 1 } : (apex ?? { b: cloneBall(b), steps: steps + 1 });
      break;
    }
  }
  if (!chosen) chosen = apex ?? { b: cloneBall(b), steps };
  const contact = chosen.b;
  steps = chosen.steps;

  const incoming = spinType(contact);
  // Ball fliegt Richtung −z an. Ankommender Unterschnitt aus Sicht des Gegners:
  const st = incoming === "BACKSPIN" ? spec.vsBack : spec.vsTop;
  const yaw = Math.atan2(OPPONENT_TARGET_X - contact.pos.x, spec.targetZ - contact.pos.z);

  const n = new THREE.Vector3();
  const v = new THREE.Vector3();
  const t = cloneBall(contact);
  let best: OpponentPlan | null = null;
  let bestScore = -Infinity;
  for (let open = st.open[0]; open <= st.open[1] + 0.01; open += st.open[2]) {
    const o = THREE.MathUtils.degToRad(open);
    for (const dy of [-0.08, 0, 0.08]) {
      n.set(0, Math.sin(o), Math.cos(o)).applyAxisAngle(_Y, yaw + dy);
      for (let speed = st.speed[0]; speed <= st.speed[1] + 0.01; speed += st.speed[2]) {
        for (let dir = st.dir[0]; dir <= st.dir[1] + 0.01; dir += st.dir[2]) {
          const d = THREE.MathUtils.degToRad(dir);
          v.set(0, Math.sin(d), Math.cos(d)).multiplyScalar(speed).applyAxisAngle(_Y, yaw + dy);
          t.pos.copy(contact.pos);
          t.vel.copy(contact.vel);
          t.spin.copy(contact.spin);
          if (!hitWithRubber(t, n, v, rubber)) continue;
          const outSpin = spinType(t);
          const res = { pos: t.pos.clone(), vel: t.vel.clone(), spin: t.spin.clone() };
          const r = rate(t, spec.targetZ);
          let score = r.score;
          if (r.ok) {
            if (st.wantSpin && outSpin === st.wantSpin) score += 3;
            if (st.minSpin) score -= Math.max(0, st.minSpin - res.spin.length()) / 15;
            score -= Math.abs(open - st.typ.open) / 20 + Math.abs(speed - st.typ.speed) / 1.2 + Math.abs(dir - st.typ.dir) / 20;
          }
          if (score > bestScore) {
            bestScore = score;
            best = { steps, point: contact.pos.clone(), normal: n.clone(), vel: v.clone(), rubber, stroke: st.stroke, result: res };
          }
        }
      }
    }
  }
  if (best && bestScore > -100) return best;
  return fallbackPlan(contact, steps, rubber, st.stroke, yaw);
}

/** Notfall: Ballflug direkt so wählen, dass er sicher in der Vorhand landet (Spin nach Belag). */
function fallbackPlan(contact: BallState, steps: number, rubber: RubberType, stroke: string, yaw: number): OpponentPlan {
  const spec = RUBBERS[rubber];
  // lange Noppe und Anti behalten den Weltspin (Umkehr), die anderen Beläge drehen nicht um
  const keepWorld = rubber === "longPips" || rubber === "anti";
  const spin = contact.spin.clone().multiplyScalar(spec.spinKeep * (keepWorld ? 0.8 : rubber === "shortPips" ? 0.72 : 0.5));
  if (!keepWorld) { spin.x = -spin.x; spin.z = -spin.z; }
  const t = cloneBall(contact);
  let best = { vel: new THREE.Vector3(0, 2, 4), score: -Infinity };
  const v = new THREE.Vector3();
  for (let vz = 1.5; vz <= 7; vz += 0.25) {
    for (let vy = -0.5; vy <= 3.5; vy += 0.25) {
      v.set(0, vy, vz).applyAxisAngle(_Y, yaw);
      t.pos.copy(contact.pos);
      t.pos.z += 0.03;
      t.vel.copy(v);
      t.spin.copy(spin);
      const r = rate(t, spec.targetZ);
      if (r.score > best.score) best = { vel: v.clone(), score: r.score };
    }
  }
  const n = best.vel.clone().normalize();
  const pos = contact.pos.clone();
  pos.z += 0.03;
  return { steps, point: contact.pos.clone(), normal: n, vel: best.vel.clone().multiplyScalar(0.3), rubber, stroke, override: true, result: { pos, vel: best.vel, spin } };
}
