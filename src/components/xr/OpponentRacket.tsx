import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { RUBBERS } from "@/lib/constants";
import type { OpponentPlan } from "@/lib/opponent";
import { RacketModel } from "./RacketModel";

const ARM_COLOR = "#d2a080";
const SLEEVE_COLOR = "#466a59";
const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
export function OpponentRacket({ state }: { state: { current: { plan: OpponentPlan | null; oppClock: number; phase: string } } }) {
  const blade = useRef<THREE.Group>(null);
  const upper = useRef<THREE.Mesh>(null);
  const forearm = useRef<THREE.Mesh>(null);
  const wrist = useRef<THREE.Mesh>(null);
  const face = useRef<THREE.MeshStandardMaterial>(null);
  const vectors = useMemo(() => ({ p: new THREE.Vector3(), n: new THREE.Vector3(), hand: new THREE.Vector3(), elbow: new THREE.Vector3(), shoulder: new THREE.Vector3(), delta: new THREE.Vector3(), q: new THREE.Quaternion(), start: new THREE.Vector3(), end: new THREE.Vector3(), rest: new THREE.Vector3(-0.15, 1.05, -1.8) }), []);
  const lastPlan = useRef<OpponentPlan | null>(null);
  const start = useRef(new THREE.Vector3(-0.15, 1.05, -1.8));
  const elapsed = useRef(0);
  useFrame((_, rawDt) => {
    const b = blade.current;
    if (!b) return;
    const s = state.current, plan = s.plan, v = vectors;
    if (plan !== lastPlan.current) {
      start.current.copy(b.position);
      elapsed.current = 0;
      lastPlan.current = plan;
    }
    elapsed.current += Math.min(rawDt, 0.05);
    v.p.copy(v.rest); v.n.set(0, 0, 1);
    if (plan) {
      const duration = Math.max(plan.steps / 240, 0.001);
      const t = s.phase === "opp" ? THREE.MathUtils.clamp(s.oppClock / duration, 0, 1) : 1;
      const back = v.start.copy(plan.point).addScaledVector(plan.vel, -0.18);
      if (s.phase === "opp") {
        // Continuous quadratic backswing -> contact; the final tangent follows the stroke.
        v.p.copy(start.current).multiplyScalar((1 - t) ** 2).addScaledVector(back, 2 * t * (1 - t)).addScaledVector(plan.point, t * t);
        const wristTurn = t * t * (3 - 2 * t);
        v.n.lerp(plan.normal, wristTurn).normalize();
      } else {
        const after = Math.max(0, elapsed.current - duration);
        const follow = THREE.MathUtils.smoothstep(after, 0, 0.35);
        v.end.copy(plan.point).addScaledVector(plan.vel, 0.18);
        v.p.lerpVectors(plan.point, v.end, follow);
        v.n.copy(plan.normal).applyAxisAngle(Y, Math.sin(follow * Math.PI / 2) * 0.18);
        const recover = THREE.MathUtils.smoothstep(after, 0.5, 1.1);
        v.p.lerp(v.rest, recover); v.n.lerp(new THREE.Vector3(0, 0, 1), recover).normalize();
      }
      face.current?.color.set(RUBBERS[plan.rubber].color);
    }
    b.position.copy(v.p);
    v.q.setFromUnitVectors(X, v.n);
    // Rotate the handle around the blade normal for a visible, modest wrist roll.
    const roll = plan ? Math.sin(Math.min(1, elapsed.current / Math.max(plan.steps / 240, 0.15)) * Math.PI / 2) * 0.18 : 0;
    b.quaternion.copy(v.q).multiply(new THREE.Quaternion().setFromAxisAngle(X, roll));
    v.hand.set(0, 0, 0.13).applyQuaternion(b.quaternion).add(v.p);
    v.shoulder.set(v.p.x - 0.24, 1.38, Math.min(-1.55, v.p.z - 0.42));
    v.elbow.lerpVectors(v.shoulder, v.hand, 0.55).add(new THREE.Vector3(-0.08, -0.17, 0.04));
    const segment = (mesh: THREE.Mesh | null, a: THREE.Vector3, c: THREE.Vector3) => {
      if (!mesh) return;
      mesh.position.copy(a).add(c).multiplyScalar(0.5);
      v.delta.subVectors(c, a);
      mesh.scale.set(1, Math.max(v.delta.length(), 0.001), 1);
      mesh.quaternion.setFromUnitVectors(Y, v.delta.normalize());
    };
    segment(upper.current, v.shoulder, v.elbow);
    segment(forearm.current, v.elbow, v.hand);
    wrist.current?.position.copy(v.hand);
  });
  return <group name="opponent-motion">
    <mesh ref={upper}><cylinderGeometry args={[0.035, 0.04, 1, 10]} /><meshStandardMaterial color={SLEEVE_COLOR} roughness={0.9} /></mesh>
    <mesh ref={forearm}><cylinderGeometry args={[0.022, 0.03, 1, 10]} /><meshStandardMaterial color={ARM_COLOR} roughness={0.85} /></mesh>
    <mesh ref={wrist}><sphereGeometry args={[0.03, 12, 8]} /><meshStandardMaterial color={ARM_COLOR} roughness={0.85} /></mesh>
    <group ref={blade} position={[-0.15, 1.05, -1.8]}>
      <RacketModel />
      <mesh position={[0.014, 0, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.078, 32]} /><meshStandardMaterial ref={face} color={RUBBERS.smooth.color} roughness={0.7} /></mesh>
    </group>
  </group>;
}