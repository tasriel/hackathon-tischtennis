import { useFrame } from "@react-three/fiber";
import { useXRInputSourceState } from "@react-three/xr";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import targetAsset from "@/assets/target.glb.asset.json";
import { BALL_RADIUS, RACKET_RADIUS, TABLE } from "@/lib/constants";
import type { BallState } from "@/lib/physics";
import { SceneModel } from "./SceneModel";

const TARGET_DIAMETER = RACKET_RADIUS * 4;
const TARGET_THICKNESS = 0.012;

export function Target({ ball, enabled }: { ball: BallState; enabled: () => boolean }) {
  const position = useRef(new THREE.Vector2(0, -TABLE.length / 2 + 0.38));
  const left = useXRInputSourceState("controller", "left");
  const hit = useRef(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const p = position.current;
      if (event.code === "ArrowLeft") p.x -= 0.05;
      else if (event.code === "ArrowRight") p.x += 0.05;
      else if (event.code === "ArrowUp") p.y -= 0.05;
      else if (event.code === "ArrowDown") p.y += 0.05;
      else return;
      event.preventDefault();
      clampTarget(p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const stick = left?.gamepad?.["xr-standard-thumbstick"];
    const x = stick?.xAxis ?? 0;
    const y = stick?.yAxis ?? 0;
    if (Math.abs(x) > 0.2 || Math.abs(y) > 0.2) {
      position.current.x += x * dt * 0.5;
      position.current.y += y * dt * 0.5;
      clampTarget(position.current);
    }

    const dx = ball.pos.x - position.current.x;
    const dz = ball.pos.z - position.current.y;
    hit.current = enabled() && Math.hypot(dx, dz) <= TARGET_DIAMETER / 2 && Math.abs(ball.pos.y - TABLE.height) < BALL_RADIUS * 2;
    if (group.current) {
      group.current.position.set(position.current.x, TABLE.height + TARGET_THICKNESS / 2 + 0.002, position.current.y);
      group.current.scale.setScalar(hit.current ? 1.08 : 1);
    }
  });

  const group = useRef<THREE.Group>(null);
  const scale = TARGET_DIAMETER / 1.90243;
  return (
    <group ref={group} rotation={[-Math.PI / 2, 0, 0]}>
      <SceneModel url={targetAsset.url} scale={scale} />
    </group>
  );
}

function clampTarget(position: THREE.Vector2) {
  const radius = TARGET_DIAMETER / 2;
  position.x = THREE.MathUtils.clamp(position.x, -TABLE.width / 2 + radius, TABLE.width / 2 - radius);
  position.y = THREE.MathUtils.clamp(position.y, -TABLE.length / 2 + radius, -radius);
}