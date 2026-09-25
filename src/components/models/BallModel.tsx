// Nur Aussehen des Balls (Platzhalter). Später z.B. durch ein Meshy-GLB ersetzbar:
// Radius = BALL_R, Mittelpunkt im Ursprung. Physik/Kollision hängt NICHT hiervon ab.
import { BALL_R } from "@/lib/constants";

export function BallModel({ scale = 1 }: { scale?: number }) {
  const r = BALL_R * scale;
  return (
    <group>
      <mesh>
        <sphereGeometry args={[r, 24, 16]} />
        <meshStandardMaterial color="#fff6e8" roughness={0.5} />
      </mesh>
      {/* Farbiger Ring + Punkt, damit Rotation sichtbar ist */}
      <mesh>
        <torusGeometry args={[r * 1.005, r * 0.18, 8, 32]} />
        <meshStandardMaterial color="#e5484d" roughness={0.6} />
      </mesh>
      <mesh position={[r * 0.98, 0, 0]}>
        <sphereGeometry args={[r * 0.28, 12, 8]} />
        <meshStandardMaterial color="#1f6feb" />
      </mesh>
    </group>
  );
}
