import * as THREE from "three";
import { cloneBall, collideRacket, stepBall, type BallState, type RacketState } from "./physics";

const _prev = new THREE.Vector3();

/**
 * Sagt die Flugbahn voraus: Ball fliegt weiter bis zum Schläger (aktuelle Haltung +
 * Bewegung), danach die Rückflugbahn. Punkte werden fein abgetastet (alle 2 Schritte),
 * damit daraus eine glatte Kurve entsteht. Gibt die Anzahl Punkte zurück.
 */
export function predictReturn(ball: BallState, racket: RacketState, out: THREE.Vector3[]): number {
  const maxPoints = out.length;
  const b = cloneBall(ball);
  const dt = 1 / 240;
  let hitStep = -1;
  let n = 0;
  for (let i = 0; i < 240 * 3 && n < maxPoints; i++) {
    _prev.copy(b.pos);
    const e = stepBall(b, dt);
    if (hitStep < 0) {
      if (collideRacket(b, _prev, racket)) {
        hitStep = i;
        out[n++]!.copy(b.pos);
        continue;
      }
      if (b.pos.z > 2.4 || e === "floor") return 0;
    } else {
      if ((i - hitStep) % 2 === 0) out[n++]!.copy(b.pos);
      if (e) {
        if (n < maxPoints) out[n++]!.copy(b.pos);
        break;
      }
    }
  }
  return n;
}
