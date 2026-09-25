import { useFrame } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { BallState } from "@/lib/physics";
import { BallModel } from "@/components/models/BallModel";
import { BALL_R } from "@/lib/constants";
import { Label } from "./Label";

const Y = new THREE.Vector3(0, 1, 0);

/** Ball + sichtbare Rotationsachse + Beschriftung (ÜBERSCHNITT/UNTERSCHNITT). */
export function Ball({
  ballRef, orientRef, label, labelColor,
}: {
  ballRef: MutableRefObject<BallState>;
  orientRef: MutableRefObject<THREE.Quaternion>;
  label: string;
  labelColor: string;
}) {
  const root = useRef<THREE.Group>(null);
  const spinner = useRef<THREE.Group>(null);
  const axis = useRef<THREE.Group>(null);

  useFrame(() => {
    const b = ballRef.current;
    root.current?.position.copy(b.p);
    spinner.current?.quaternion.copy(orientRef.current);
    if (axis.current) {
      const mag = b.w.length();
      axis.current.visible = mag > 5;
      if (mag > 5) axis.current.quaternion.setFromUnitVectors(Y, b.w.clone().divideScalar(mag));
    }
  });

  const L = BALL_R * 3;
  return (
    <group ref={root}>
      <group ref={spinner}>
        <BallModel />
      </group>
      {/* Rotationsachse (Rechte-Hand-Regel), Pfeilspitze in Richtung ω */}
      <group ref={axis}>
        <mesh>
          <cylinderGeometry args={[0.002, 0.002, L * 2, 6]} />
          <meshBasicMaterial color={labelColor} />
        </mesh>
        <mesh position={[0, L, 0]}>
          <coneGeometry args={[0.007, 0.018, 10]} />
          <meshBasicMaterial color={labelColor} />
        </mesh>
      </group>
      <Label text={label} color={labelColor} height={0.035} position={[0, 0.07, 0]} />
    </group>
  );
}
