import * as THREE from "three";
import { cloneBall, collideRacket, stepBall, type BallState, type RacketState } from "./physics";

const _prev = new THREE.Vector3();

/**
 * Sagt die Flugbahn voraus: Ball fliegt weiter bis zum Schläger (aktuelle Haltung +
 * Bewegung), danach die Rückflugbahn. Gibt Punkte der Rückflugbahn zurück.
 */
export function predictReturn(
  ball: BallState,
  racket: RacketState,
  out: THREE.Vector3[],
  maxPoints = 40,
): number {
  const b = cloneBall(ball);
  const dt = 1 / 240;
  let hit = false;
  let n = 0;
  for (let i = 0; i < 240 * 3 && n < maxPoints; i++) {
    _prev.copy(b.pos);
    const e = stepBall(b, dt);
    if (!hit) {
      if (collideRacket(b, _prev, racket)) {
        hit = true;
        out[n++]!.copy(b.pos);
      }
      if (b.pos.z > 2.4 || e === "floor") return 0;
    } else {
      if (i % 6 === 0) out[n++]!.copy(b.pos);
      if (e === "net" || e === "floor" || e === "table-far" || e === "table-near") {
        if (n < maxPoints) out[n++]!.copy(b.pos);
        break;
      }
    }
  }
  return n;
}
