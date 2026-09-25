import { useFrame } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  CylinderCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useXRInputSourceState } from "@react-three/xr";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BALL_RADIUS, TABLE } from "@/lib/constants";
import type { BallState } from "@/lib/physics";

// Umgedrehte Plastikbecher (Öffnung unten), Maße in m
const CUP_H = 0.1;
const CUP_R_BOTTOM = 0.04; // Öffnung (liegt auf)
const CUP_R_TOP = 0.028; // Boden (oben)
const GAP = 2 * CUP_R_BOTTOM + 0.006;

/** 3 unten, 2 darüber, 1 oben – relative Mittelpunkte. */
const LAYOUT: [number, number][] = [
  [-GAP, 0],
  [0, 0],
  [GAP, 0],
  [-GAP / 2, 1],
  [GAP / 2, 1],
  [0, 2],
];

function cupHome(i: number, off: THREE.Vector2) {
  const [x, row] = LAYOUT[i]!;
  return new THREE.Vector3(off.x + x, TABLE.height + CUP_H / 2 + row * (CUP_H + 0.001) + 0.001, off.y);
}

/** Becher-Hülle (austauschbar gegen ein GLB). */
function CupModel() {
  const geo = useMemo(() => {
    const pts = [
      new THREE.Vector2(CUP_R_BOTTOM, -CUP_H / 2),
      new THREE.Vector2(CUP_R_BOTTOM - 0.002, -CUP_H / 2 + 0.006),
      new THREE.Vector2(CUP_R_TOP, CUP_H / 2),
      new THREE.Vector2(0, CUP_H / 2),
    ];
    return new THREE.LatheGeometry(pts, 24);
  }, []);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#c8322b" roughness={0.45} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Cups({ ball, enabled }: { ball: BallState; enabled: () => boolean }) {
  const offset = useRef(new THREE.Vector2(0, -TABLE.length / 2 + 0.25));
  const cups = useRef<(RapierRigidBody | null)[]>([]);
  const ballBody = useRef<RapierRigidBody>(null);
  const ballWasOn = useRef(false);
  const allDownAt = useRef(0);
  const needReset = useRef(true);
  const left = useXRInputSourceState("controller", "left");
  const _q = useMemo(() => new THREE.Quaternion(), []);
  const _v = useMemo(() => new THREE.Vector3(), []);

  const reset = () => {
    cups.current.forEach((c, i) => {
      if (!c) return;
      const h = cupHome(i, offset.current);
      c.setTranslation(h, true);
      c.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      c.setLinvel({ x: 0, y: 0, z: 0 }, true);
      c.setAngvel({ x: 0, y: 0, z: 0 }, true);
    });
    allDownAt.current = 0;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const o = offset.current;
      if (e.code === "ArrowLeft") o.x -= 0.05;
      else if (e.code === "ArrowRight") o.x += 0.05;
      else if (e.code === "ArrowUp") o.y -= 0.05;
      else if (e.code === "ArrowDown") o.y += 0.05;
      else return;
      e.preventDefault();
      clampOffset(o);
      needReset.current = true;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    // Quest: linker Thumbstick verschiebt die Pyramide
    const st = left?.gamepad?.["xr-standard-thumbstick"];
    const ax = st?.xAxis ?? 0;
    const ay = st?.yAxis ?? 0;
    if (Math.abs(ax) > 0.2 || Math.abs(ay) > 0.2) {
      offset.current.x += ax * dt * 0.5;
      offset.current.y += ay * dt * 0.5;
      clampOffset(offset.current);
      needReset.current = true;
    }
    if (needReset.current && cups.current.every(Boolean)) {
      needReset.current = false;
      reset();
    }

    // Ball als bewegter Körper, der die Becher anstößt (nur nach dem eigenen Schlag)
    const bb = ballBody.current;
    if (bb) {
      const on = enabled();
      if (on && ballWasOn.current) bb.setNextKinematicTranslation(ball.pos);
      else if (on) bb.setTranslation(ball.pos, true);
      else bb.setTranslation({ x: 0, y: -10, z: 0 }, true);
      ballWasOn.current = on;
    }

    // Umgefallen? → alle unten: nach 1,5 s neu aufbauen
    let down = 0;
    cups.current.forEach((c, i) => {
      if (!c) return;
      const r = c.rotation();
      _q.set(r.x, r.y, r.z, r.w);
      const upY = _v.set(0, 1, 0).applyQuaternion(_q).y;
      const t = c.translation();
      const h = cupHome(i, offset.current);
      if (upY < 0.8 || Math.abs(t.x - h.x) > 0.04 || Math.abs(t.z - h.z) > 0.04 || t.y < h.y - 0.03) down++;
    });
    if (down === LAYOUT.length) {
      if (!allDownAt.current) allDownAt.current = performance.now();
      else if (performance.now() - allDownAt.current > 1500) reset();
    } else allDownAt.current = 0;
  });

  const bounce = (cupIdx: number) => {
    const c = cups.current[cupIdx];
    if (!c) return;
    const t = c.translation();
    const n = _v.set(ball.pos.x - t.x, ball.pos.y - t.y, ball.pos.z - t.z).normalize();
    const vn = ball.vel.dot(n);
    if (vn < 0) ball.vel.addScaledVector(n, -1.5 * vn);
    ball.vel.multiplyScalar(0.8);
  };

  return (
    <>
      {/* Tischplatte und Boden */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[TABLE.width / 2, 0.01, TABLE.length / 2]} position={[0, TABLE.height - 0.01, 0]} friction={0.6} />
        <CuboidCollider args={[5, 0.05, 5]} position={[0, -0.05, 0]} />
      </RigidBody>
      <RigidBody ref={ballBody} type="kinematicPosition" colliders={false} position={[0, -10, 0]}>
        <BallCollider args={[BALL_RADIUS]} />
      </RigidBody>
      {LAYOUT.map((_, i) => (
        <RigidBody
          key={i}
          ref={(r) => {
            cups.current[i] = r;
          }}
          colliders={false}
          position={cupHome(i, offset.current).toArray()}
          linearDamping={0.1}
          angularDamping={0.2}
          onCollisionEnter={({ other }) => {
            if (other.rigidBody && other.rigidBody === ballBody.current) bounce(i);
          }}
        >
          <CylinderCollider args={[CUP_H / 2, (CUP_R_BOTTOM + CUP_R_TOP) / 2]} mass={0.004} friction={0.5} restitution={0.2} />
          <CupModel />
        </RigidBody>
      ))}
    </>
  );
}

function clampOffset(o: THREE.Vector2) {
  o.x = THREE.MathUtils.clamp(o.x, -TABLE.width / 2 + 0.15, TABLE.width / 2 - 0.15);
  o.y = THREE.MathUtils.clamp(o.y, -TABLE.length / 2 + 0.12, -0.35);
}

/** Becher-Pyramide (6 Becher) am hinteren Tischende mit Starrkörper-Physik. */
export function CupPyramid({ ball, enabled }: { ball: BallState; enabled: () => boolean }) {
  return (
    <Suspense fallback={null}>
      <Physics gravity={[0, -9.81, 0]} timeStep={1 / 120}>
        <Cups ball={ball} enabled={enabled} />
      </Physics>
    </Suspense>
  );
}
