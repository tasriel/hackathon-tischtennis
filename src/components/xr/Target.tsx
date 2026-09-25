import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import targetAsset from "@/assets/target.glb.asset.json";
import { BALL_RADIUS, RACKET_RADIUS, TABLE } from "@/lib/constants";
import type { BallState } from "@/lib/physics";
import { settings, TARGET_X } from "@/lib/settings";
import { SceneModel } from "./SceneModel";

const TARGET_DIAMETER = RACKET_RADIUS * 4;
const TARGET_THICKNESS = 0.012;
const TARGET_Z = -TABLE.length / 2 + 0.38;

export function Target({ ball, enabled }: { ball: BallState; enabled: () => boolean }) {
  const group = useRef<THREE.Group>(null);
  const x = useRef(0);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    x.current += (TARGET_X[settings.target] - x.current) * (1 - Math.exp(-10 * dt));
    const hit =
      enabled() &&
      Math.hypot(ball.pos.x - x.current, ball.pos.z - TARGET_Z) <= TARGET_DIAMETER / 2 &&
      Math.abs(ball.pos.y - TABLE.height) < BALL_RADIUS * 2;
    if (group.current) {
      group.current.position.set(x.current, TABLE.height + TARGET_THICKNESS / 2 + 0.002, TARGET_Z);
      group.current.scale.setScalar(hit ? 1.08 : 1);
    }
  });

  const scale = TARGET_DIAMETER / 1.90243;
  const thicknessScale = TARGET_THICKNESS / 0.200291;
  return (
    <group ref={group} rotation={[-Math.PI / 2, 0, 0]}>
      <SceneModel url={targetAsset.url} scale={[scale, scale, thicknessScale]} />
    </group>
  );
}
