import * as THREE from "three";
import { BALL_RADIUS, DRAG, GRAVITY, MAGNUS, RUBBERS, TABLE, type RubberType } from "./constants";
import { cloneBall, collideRacket, spinType, stepBall, type BallState, type RacketState } from "./physics";

export const OPP_DT = 1 / 240;
export const FOREHAND_X = 0.38;
export type OpponentPlan = {
  steps: number;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  vel: THREE.Vector3;
  rubber: RubberType;
  stroke: string;
  outgoingVel: THREE.Vector3;
  outgoingSpin: THREE.Vector3;
  assisted: boolean;
};
const racket: RacketState = {
  pos: new THREE.Vector3(), normal: new THREE.Vector3(), vel: new THREE.Vector3(),
  angVel: new THREE.Vector3(), quat: new THREE.Quaternion(), timeScale: 1,
};
export function hitWithRubber(b: BallState, normal: THREE.Vector3, vel: THREE.Vector3, rubber: RubberType): boolean {
  const point = b.pos.clone();
  racket.pos.copy(point);
  racket.normal.copy(normal);
  racket.vel.copy(vel);
  const prev = point.clone().addScaledVector(normal, BALL_RADIUS * 2);
  b.pos.copy(point).addScaledVector(normal, -0.001);
  return collideRacket(b, prev, racket, undefined, RUBBERS[rubber]);
}

/** Airborne integration matches stepBall, without premature table/net clipping during aiming. */
function flightEnd(point: THREE.Vector3, velocity: THREE.Vector3, spin: THREE.Vector3, time: number) {
  const p = point.clone(), v = velocity.clone(), w = spin.clone(), a = new THREE.Vector3();
  const count = Math.ceil(time / OPP_DT), dt = time / count;
  for (let i = 0; i < count; i++) {
    a.crossVectors(w, v).multiplyScalar(MAGNUS).addScaledVector(v, -DRAG * v.length());
    a.y += GRAVITY;
    v.addScaledVector(a, dt); p.addScaledVector(v, dt); w.multiplyScalar(Math.exp(-0.05 * dt));
  }
  return p;
}
function aim(point: THREE.Vector3, spin: THREE.Vector3, time: number) {
  const target = new THREE.Vector3(FOREHAND_X, TABLE.height + BALL_RADIUS, 1.05);
  const v = target.clone().sub(point).divideScalar(time);
  v.y -= GRAVITY * time / 2;
  for (let i = 0; i < 12; i++) v.addScaledVector(target.clone().sub(flightEnd(point, v, spin, time)), 0.8 / time);
  return v;
}
function playable(point: THREE.Vector3, vel: THREE.Vector3, spin: THREE.Vector3) {
  const b = { pos: point.clone(), vel: vel.clone(), spin: spin.clone() };
  let clearance = 0;
  for (let i = 0; i < 600; i++) {
    const z = b.pos.z;
    const ev = stepBall(b, OPP_DT);
    if (z < 0 && b.pos.z >= 0) clearance = b.pos.y - TABLE.height - TABLE.netHeight;
    if (ev === "table-near") return clearance > 0.08 && b.pos.x > 0.15 && b.pos.x < 0.65;
    if (ev) return false;
  }
  return false;
}

/** Every valid far-side bounce gets a plan. Rubber contact generates spin; a bounded
 * teaching aim makes the return accessible rather than trying to win the rally. */
export function planOpponent(ballAfterBounce: BallState, rubber: RubberType): OpponentPlan {
  const spec = RUBBERS[rubber];
  const incoming = spinType(ballAfterBounce);
  const side = Math.abs(ballAfterBounce.spin.y) > Math.hypot(ballAfterBounce.spin.x, ballAfterBounce.spin.z) * 0.8;
  const push = rubber === "shortPips" && incoming === "BACKSPIN" && !side;
  const stroke = push ? "Schupf" : rubber === "shortPips" ? "weicher Konter / Block" : spec.stroke;
  const contacts: { ball: BallState; steps: number }[] = [{ ball: cloneBall(ballAfterBounce), steps: 0 }];
  const flight = cloneBall(ballAfterBounce);
  for (let i = 1; i <= 180; i++) {
    if (stepBall(flight, OPP_DT)) break;
    if (i % 12 === 0 && flight.pos.y > TABLE.height + 0.07 && flight.pos.z < -0.06) contacts.push({ ball: cloneBall(flight), steps: i });
  }
  // Prefer a readable preparation interval, but retain immediate contact for edge cases.
  contacts.sort((a, b) => Math.abs(a.steps * OPP_DT - 0.3) - Math.abs(b.steps * OPP_DT - 0.3));
  let best: OpponentPlan | undefined;
  let bestScore = Infinity;
  for (const contact of contacts) {
    for (let open = push ? 25 : spec.open[0]; open <= spec.open[1]; open += 10) {
      const o = THREE.MathUtils.degToRad(open);
      const normal = new THREE.Vector3(0, Math.sin(o), Math.cos(o));
      for (let speed = spec.speed[0]; speed <= spec.speed[1] + 0.01; speed += spec.speed[2]) {
        const dir = THREE.MathUtils.degToRad(push ? -15 : spec.typ.dir);
        const vel = new THREE.Vector3(0, Math.sin(dir), Math.cos(dir)).multiplyScalar(speed);
        const out = cloneBall(contact.ball);
        if (!hitWithRubber(out, normal, vel, rubber)) continue;
        for (let time = spec.flightTime[0]; time <= spec.flightTime[1] + 0.01; time += 0.15) {
          const aimed = aim(out.pos, out.spin, time);
          const error = aimed.distanceTo(out.vel);
          const score = error * 0.3 + aimed.length() + Math.abs(speed - spec.typ.speed) * 0.2 + Math.abs(contact.steps * OPP_DT - 0.3) * 20;
          if (score >= bestScore || !playable(out.pos, aimed, out.spin)) continue;
          bestScore = score;
          best = { steps: contact.steps, point: contact.ball.pos.clone(), normal, vel, rubber, stroke,
            outgoingVel: aimed, outgoingSpin: out.spin.clone(), assisted: error > 0.25 };
        }
      }
    }
    if (best && bestScore < 1) break;
  }
  if (best) return best;
  // A very short/edge bounce still receives a high, slow teaching lob. No rally is dropped.
  const point = ballAfterBounce.pos.clone();
  const spin = ballAfterBounce.spin.clone().multiplyScalar(spec.spinKeep);
  const normal = new THREE.Vector3(0, 0.65, 0.76).normalize();
  const outPoint = point.clone().addScaledVector(normal, BALL_RADIUS * 1.2);
  let outgoingVel = aim(outPoint, spin, 1.2);
  for (let time = 1.2; time <= 2; time += 0.15) {
    outgoingVel = aim(outPoint, spin, time);
    if (playable(outPoint, outgoingVel, spin)) break;
  }
  return { steps: 0, point, normal, vel: new THREE.Vector3(0, 0.2, 0.3), rubber, stroke,
    outgoingVel, outgoingSpin: spin, assisted: true };
}

export function applyOpponentPlan(ball: BallState, plan: OpponentPlan) {
  ball.pos.copy(plan.point).addScaledVector(plan.normal, BALL_RADIUS * 1.2);
  ball.vel.copy(plan.outgoingVel);
  ball.spin.copy(plan.outgoingSpin);
  ball.nearBounceDamping = plan.rubber === "anti" ? { speed: 0.15, spin: 0.03, friction: 0.002 }
    : plan.rubber === "shortPips" ? { speed: 0.7, spin: 1, friction: 0.18 }
    : plan.rubber === "longPips" ? { speed: 0.75, spin: 1, friction: 0.18 } : undefined;
}
