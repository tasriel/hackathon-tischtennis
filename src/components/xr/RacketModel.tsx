import { RACKET_RADIUS } from "@/lib/constants";

/**
 * Austauschbare Schläger-Hülle (Demo). Konvention:
 * - Blattmitte im Ursprung, Blattnormale = lokale X-Achse,
 * - Griff zeigt in lokale +Z-Richtung (zur Hand).
 * Ein Meshy-GLB muss nur so ausgerichtet werden. Physik nutzt RACKET_RADIUS.
 */
export function RacketModel() {
  return (
    <group>
      {/* Blatt: rote und schwarze Seite */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.003, 0, 0]}>
        <cylinderGeometry args={[RACKET_RADIUS, RACKET_RADIUS, 0.004, 32]} />
        <meshStandardMaterial color="#c62828" roughness={0.8} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.003, 0, 0]}>
        <cylinderGeometry args={[RACKET_RADIUS, RACKET_RADIUS, 0.004, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      {/* Griff */}
      <mesh position={[0, 0, RACKET_RADIUS + 0.045]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.025, 0.1, 0.03]} />
        <meshStandardMaterial color="#b8864b" roughness={0.7} />
      </mesh>
    </group>
  );
}
