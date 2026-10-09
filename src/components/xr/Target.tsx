import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { BALL_RADIUS, RACKET_RADIUS, TABLE } from "@/lib/constants";
import { settings, TARGET_X, TARGET_Z } from "@/lib/settings";
import { SceneModel } from "./SceneModel";

const TARGET_MODEL_URL: string = "/models/target-quality.glb";
const TARGET_DIAMETER = RACKET_RADIUS * 4;
const TARGET_THICKNESS = 0.012;
const CONFETTI_COUNT = 46;

type Confetti = { x: number; z: number; vx: number; vy: number; vz: number; color: THREE.Color };

function playCelebration() {
  const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return;
  const ctx = new AudioCtor();
  void ctx.resume();
  const now = ctx.currentTime;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + i * 0.055);
    gain.gain.setValueAtTime(0.0001, now + i * 0.055);
    gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.055 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.055 + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + i * 0.055);
    osc.stop(now + i * 0.055 + 0.24);
  });
  window.setTimeout(() => void ctx.close(), 700);
}

export type TargetImpact = { x: number; z: number; sequence: number };

export function Target({ impact }: { impact: RefObject<TargetImpact> }) {
  const root = useRef<THREE.Group>(null);
  const model = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const confetti = useRef<THREE.Points>(null);
  const x = useRef(0);
  const z = useRef(TARGET_Z.long);
  const lastImpact = useRef(0);
  const effect = useRef(0);
  const confettiAge = useRef(99);

  const pieces = useMemo<Confetti[]>(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => {
        const a = (i / CONFETTI_COUNT) * Math.PI * 2;
        const r = 0.015 + (i % 7) * 0.006;
        return {
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          vx: Math.cos(a) * (0.12 + (i % 5) * 0.025),
          vy: 0.26 + (i % 9) * 0.025,
          vz: Math.sin(a) * (0.12 + (i % 4) * 0.03),
          color: new THREE.Color(["#ffffff", "#7c3aed", "#22c55e", "#e6d36a"][i % 4]),
        };
      }),
    [],
  );

  const confettiGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(CONFETTI_COUNT * 3), 3));
    g.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(pieces.flatMap((p) => [p.color.r, p.color.g, p.color.b])), 3),
    );
    return g;
  }, [pieces]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    x.current += (TARGET_X[settings.target] - x.current) * (1 - Math.exp(-10 * dt));
    z.current += (TARGET_Z[settings.targetDepth] - z.current) * (1 - Math.exp(-10 * dt));
    const hit = impact.current.sequence !== lastImpact.current &&
      Math.hypot(impact.current.x - x.current, impact.current.z - z.current) <= TARGET_DIAMETER / 2 + BALL_RADIUS;
    if (impact.current.sequence !== lastImpact.current) lastImpact.current = impact.current.sequence;

    if (hit) {
      effect.current = 1;
      confettiAge.current = 0;
      playCelebration();
    }
    effect.current = Math.max(0, effect.current - dt * 1.15);
    confettiAge.current += dt;

    const pulse = hit ? 1.1 : 1 + Math.sin(effect.current * Math.PI) * 0.28;
    if (root.current) root.current.position.set(x.current, TABLE.height + TARGET_THICKNESS / 2 + 0.002, z.current);
    if (model.current?.scale) model.current.scale.set(pulse, pulse, pulse);
    if (glow.current?.scale) {
      glow.current.visible = effect.current > 0.02;
      const glowScale = 1 + effect.current * 1.6;
      glow.current.scale.set(glowScale, glowScale, glowScale);
      const mat = glow.current.material as THREE.MeshBasicMaterial;
      mat.opacity = effect.current * 0.75;
    }
    if (confetti.current) {
      confetti.current.visible = confettiAge.current < 1.35;
      const arr = confettiGeometry.getAttribute("position").array as Float32Array;
      const t = confettiAge.current;
      pieces.forEach((p, i) => {
        const k = i * 3;
        arr[k] = p.x + p.vx * t;
        arr[k + 1] = 0.025 + p.vy * t - 0.28 * t * t;
        arr[k + 2] = p.z + p.vz * t;
      });
      confettiGeometry.getAttribute("position").needsUpdate = true;
      const mat = confetti.current.material as THREE.PointsMaterial;
      mat.opacity = THREE.MathUtils.clamp(1.35 - t, 0, 1);
    }
  });

  const scale = TARGET_DIAMETER / 1.90243;
  const thicknessScale = TARGET_THICKNESS / 0.200291;
  return (
    <group ref={root} rotation={[-Math.PI / 2, 0, 0]}>
      <group ref={model}>
        <SceneModel url={TARGET_MODEL_URL} scale={[scale, scale, thicknessScale]} />
      </group>
      <mesh ref={glow} position={[0, 0, 0.01]}>
        <ringGeometry args={[TARGET_DIAMETER * 0.5, TARGET_DIAMETER * 0.78, 48]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <points ref={confetti} geometry={confettiGeometry} rotation={[Math.PI / 2, 0, 0]}>
        <pointsMaterial size={0.018} vertexColors transparent opacity={0} depthWrite={false} />
      </points>
    </group>
  );
}
