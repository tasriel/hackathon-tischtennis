import * as THREE from "three";
import { TABLE, type ServeType } from "./constants";
import { STROKES } from "./strokes";
import { collideRacket, spinType, stepBall, type BallState, type RacketState } from "./physics";

export type IdealShot = {
  openDeg: number; // Blattöffnung
  speed: number; // m/s (Simulationszeit, am Trefferpunkt)
  dirDeg: number; // Schwungrichtung: + = nach oben, − = nach unten (0 = waagerecht nach vorn)
  wrist: number; // empfohlene max. Handgelenk-Drehung (rad/s)
  found: boolean;
};

export type IdealMovement = {
  open: [number, number, number];
  speed: [number, number, number];
  dir: [number, number, number];
  fallback: Pick<IdealShot, "openDeg" | "speed" | "dirDeg">;
};

export const SHORT_PIPS_BACKSPIN_IDEAL: IdealMovement = {
  open: [15, 55, 5],
  speed: [0.6, 3.2, 0.4],
  dir: [-40, 0, 5],
  fallback: { openDeg: 32, speed: 1.8, dirDeg: -20 },
};

/** Standard-Schupf, solange noch nichts berechnet wurde. */
export const DEFAULT_IDEAL: IdealShot = { openDeg: 45, speed: 1.8, dirDeg: -5, wrist: 3, found: false };

export function defaultIdeal(serve: ServeType): IdealShot {
  return { ...STROKES[serve].fallback, wrist: 3, found: false };
}

const _prev = new THREE.Vector3();

/**
 * Sucht mit derselben Physik den Schupf, der den ankommenden Ball am sichersten
 * mit Unterschnitt mittig auf die Gegnerseite bringt. Rein deterministisch.
 */
export function findIdealShot(
  point: THREE.Vector3,
  velIn: THREE.Vector3,
  spinIn: THREE.Vector3,
  serve: ServeType = "backspin",
  movement?: IdealMovement,
): IdealShot {
  const spec = STROKES[serve];
  const search = movement ?? spec;
  const racket: RacketState = {
    pos: point.clone(),
    normal: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    angVel: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    timeScale: 1,
  };
  const b: BallState = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), spin: new THREE.Vector3() };
  let best = movement ? { ...movement.fallback, wrist: 3, found: false } : defaultIdeal(serve);
  let bestScore = -Infinity;
  const dt = 1 / 240;

  for (let open = search.open[0]; open <= search.open[1]; open += search.open[2]) {
    const o = THREE.MathUtils.degToRad(open);
    racket.normal.set(0, Math.sin(o), -Math.cos(o));
    for (let speed = search.speed[0]; speed <= search.speed[1] + 0.01; speed += search.speed[2]) {
      for (let dir = search.dir[0]; dir <= search.dir[1]; dir += search.dir[2]) {
        const d = THREE.MathUtils.degToRad(dir);
        racket.vel.set(0, Math.sin(d), -Math.cos(d)).multiplyScalar(speed);
        b.pos.copy(point).addScaledVector(velIn, -dt * 3);
        b.vel.copy(velIn);
        b.spin.copy(spinIn);
        _prev.copy(b.pos);
        b.pos.copy(point).addScaledVector(racket.normal, -0.001);
        if (!collideRacket(b, _prev, racket)) continue;
        const outSpin = spinType(b);
        let score = -Infinity;
        let minNetGap = Infinity;
        for (let i = 0; i < 240 * 2; i++) {
          const pz = b.pos.z;
          const e = stepBall(b, dt);
          if (Math.sign(pz) !== Math.sign(b.pos.z)) minNetGap = b.pos.y - (TABLE.height + TABLE.netHeight);
          if (!e) continue;
          if (e === "table-far") {
            const landZ = b.pos.z;
            score = 10 - Math.abs(landZ + TABLE.length / 4) * 6 - Math.abs(b.pos.x) * 2;
            if (outSpin === spec.wantSpin) score += 4;
            score += Math.min(minNetGap, 0.12) * 20 - Math.max(0, minNetGap - 0.25) * 10;
            score -= spec.stroke === "Schupf" ? speed * 0.3 : Math.abs(speed - 3) * 0.2;
          }
          break;
        }
        if (score > bestScore) {
          bestScore = score;
          best = { openDeg: open, speed, dirDeg: dir, wrist: 3, found: true };
        }
      }
    }
  }
  return best;
}
