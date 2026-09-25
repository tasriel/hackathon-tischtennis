// Nur Aussehen des Schlägers (Platzhalter). Lokales System:
// Blattmitte im Ursprung, Belag-Normale = +x, Griff zeigt Richtung +z.
// Ein späteres Meshy-GLB muss nur so ausgerichtet werden – Kollision bleibt gleich.
import { BLADE_R } from "@/lib/constants";

export function RacketModel({ scale = 1 }: { scale?: number }) {
  const s = scale;
  return (
    <group scale={s}>
      {/* Blatt: Zylinder mit Achse entlang x */}
      <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1.07]}>
        <cylinderGeometry args={[BLADE_R, BLADE_R, 0.006, 40]} />
        <meshStandardMaterial color="#c9a26b" roughness={0.8} />
      </mesh>
      {/* Belag rot (+x) und schwarz (-x) */}
      <mesh position={[0.0035, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1.07]}>
        <cylinderGeometry args={[BLADE_R * 0.97, BLADE_R * 0.97, 0.002, 40]} />
        <meshStandardMaterial color="#c8102e" roughness={0.9} />
      </mesh>
      <mesh position={[-0.0035, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1.07]}>
        <cylinderGeometry args={[BLADE_R * 0.97, BLADE_R * 0.97, 0.002, 40]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      {/* Griff */}
      <mesh position={[0, 0, BLADE_R + 0.045]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.024, 0.1, 0.03]} />
        <meshStandardMaterial color="#8a5a2b" roughness={0.7} />
      </mesh>
    </group>
  );
}
