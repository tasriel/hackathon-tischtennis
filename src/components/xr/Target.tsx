import { useFrame } from "@react-three/fiber";
import { useXRInputSourceState } from "@react-three/xr";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BALL_RADIUS, TABLE } from "@/lib/constants";
import type { BallState } from "@/lib/physics";
import { MeshyModel } from "./MeshyModel";

const TARGET_RADIUS = 0.15;
const TARGET_Z = -TABLE.length / 2 + 0.2;

/** Verschiebbares Bullseye, das beim Treffer zurückschwingt und sich selbst aufrichtet. */
export function Target({ ball, enabled }: { ball: BallState; enabled: () => boolean }) {
  const root = useRef<THREE.Group>(null);
  const offset = useRef(new THREE.Vector2(0, TARGET_Z));
  const hitCooldown = useRef(0);
  const tilt = useRef(0);
  const tiltVelocity = useRef(0);
  const previousBall = useRef(ball.pos.clone());
  const left = useXRInputSourceState("controller", "left");
  const center = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const current = offset.current;
      if (event.code === "ArrowLeft") current.x -= 0.05;
      else if (event.code === "ArrowRight") current.x += 0.05;
      else if (event.code === "ArrowUp") current.y -= 0.05;
      else if (event.code === "ArrowDown") current.y += 0.05;
      else return;
      event.preventDefault();
      clampOffset(current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const stick = left?.gamepad?.["xr-standard-thumbstick"];
    const x = stick?.xAxis ?? 0;
    const z = stick?.yAxis ?? 0;
    if (Math.abs(x) > 0.2 || Math.abs(z) > 0.2) {
      offset.current.x += x * dt * 0.5;
      offset.current.y += z * dt * 0.5;
      clampOffset(offset.current);
    }

    center.set(offset.current.x, TABLE.height + TARGET_RADIUS, offset.current.y);
    hitCooldown.current = Math.max(0, hitCooldown.current - dt);
    if (enabled() && hitCooldown.current === 0 && ball.vel.z < 0) {
      const before = previousBall.current;
      const crossedFace = before.z >= center.z && ball.pos.z <= center.z;
      const travelZ = before.z - ball.pos.z;
      const alpha = travelZ > 1e-5 ? THREE.MathUtils.clamp((before.z - center.z) / travelZ, 0, 1) : 1;
      const hitX = THREE.MathUtils.lerp(before.x, ball.pos.x, alpha);
      const hitY = THREE.MathUtils.lerp(before.y, ball.pos.y, alpha);
      const radial = Math.hypot(hitX - center.x, hitY - center.y);
      if (crossedFace && radial < TARGET_RADIUS + BALL_RADIUS) {
        hitCooldown.current = 0.5;
        tiltVelocity.current = Math.min(8, Math.max(3, -ball.vel.z * 1.4));
        ball.vel.z = Math.abs(ball.vel.z) * 0.45;
        ball.vel.multiplyScalar(0.82);
      }
    }
    previousBall.current.copy(ball.pos);

    tiltVelocity.current += (-tilt.current * 18 - tiltVelocity.current * 5) * dt;
    tilt.current += tiltVelocity.current * dt;
    if (root.current) {
      root.current.position.copy(center);
      root.current.rotation.x = tilt.current;
    }
  });

  return (
    <group ref={root}>
      <Suspense
        fallback={
          <mesh>
            <cylinderGeometry args={[TARGET_RADIUS, TARGET_RADIUS, 0.025, 32]} />
            <meshStandardMaterial color="#d64045" emissive="#d64045" emissiveIntensity={0.25} />
          </mesh>
        }
      >
        <group scale={[TARGET_RADIUS / 0.951, TARGET_RADIUS / 0.951, 0.3]}>
          <MeshyModel name="target" />
        </group>
      </Suspense>
    </group>
  );
}

function clampOffset(offset: THREE.Vector2) {
  offset.x = THREE.MathUtils.clamp(offset.x, -TABLE.width / 2 + TARGET_RADIUS, TABLE.width / 2 - TARGET_RADIUS);
  offset.y = THREE.MathUtils.clamp(offset.y, -TABLE.length / 2 + 0.12, -0.4);
}