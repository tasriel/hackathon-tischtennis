import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { BallModel } from "@/components/models/BallModel";
import { RacketModel } from "@/components/models/RacketModel";
import { Label } from "./Label";

export interface ContactSnapshot {
  racketQuat: THREE.Quaternion;
  ballOffset: THREE.Vector3; // Ball relativ zur Blattmitte
  wIn: THREE.Vector3;
  wOut: THREE.Vector3;
  inText: string;
  outText: string;
  inColor: string;
  outColor: string;
}

const SCALE = 4;
const Y = new THREE.Vector3(0, 1, 0);

function Arrow({ dir, color, len }: { dir: THREE.Vector3; color: string; len: number }) {
  const q = new THREE.Quaternion().setFromUnitVectors(Y, dir.clone().normalize());
  return (
    <group quaternion={q}>
      <mesh position={[0, len / 2, 0]}>
        <cylinderGeometry args={[0.004, 0.004, len, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, len, 0]}>
        <coneGeometry args={[0.012, 0.03, 10]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

/**
 * Kontakt-Detailansicht: vergrößertes Standbild von Schläger + Ball schwebt neben dem Tisch.
 * Keine Kamerabewegung (verhindert Übelkeit). Ball dreht sich mit der neuen Rotation.
 */
export function ContactInspection({ snap }: { snap: ContactSnapshot }) {
  const ball = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ball.current) return;
    const w = snap.wOut;
    const mag = w.length();
    if (mag < 1e-3) return;
    // stark verlangsamt, damit die Drehrichtung lesbar ist
    const dq = new THREE.Quaternion().setFromAxisAngle(w.clone().divideScalar(mag), mag * 0.03 * dt);
    ball.current.quaternion.premultiply(dq);
  });
  const bo = snap.ballOffset.clone().multiplyScalar(SCALE);
  return (
    <group position={[0.75, 1.3, -1.0]} rotation={[0, -0.5, 0]}>
      <group scale={SCALE}>
        <group quaternion={snap.racketQuat}>
          <RacketModel />
        </group>
      </group>
      <group position={bo}>
        <group ref={ball} scale={SCALE}>
          <BallModel />
        </group>
        {snap.wIn.length() > 5 && <group position={[-0.02, 0, 0]}><Arrow dir={snap.wIn} color={snap.inColor} len={0.14} /></group>}
        {snap.wOut.length() > 5 && <group position={[0.02, 0, 0]}><Arrow dir={snap.wOut} color={snap.outColor} len={0.14} /></group>}
      </group>
      <Label text={`Kontakt\nvorher: ${snap.inText}\nnachher: ${snap.outText}`} height={0.035} position={[0, 0.33, 0]} />
    </group>
  );
}
