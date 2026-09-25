import { Suspense } from "react";
import { RACKET_RADIUS } from "@/lib/constants";
import { MeshyModel } from "./MeshyModel";

/**
 * Austauschbare Schläger-Hülle (Demo). Konvention:
 * - Blattmitte im Ursprung, Blattnormale = lokale X-Achse,
 * - Griff zeigt in lokale +Z-Richtung (zur Hand).
 * Ein Meshy-GLB muss nur so ausgerichtet werden. Physik nutzt RACKET_RADIUS.
 */
export function RacketModel({ tint, opacity }: { tint?: string | undefined; opacity?: number | undefined } = {}) {
  return (
    <Suspense fallback={<DemoRacket tint={tint} opacity={opacity} />}>
      {/* Meshy: Roh-Z = Blattnormale, Roh-Y = Längsachse. */}
      <group rotation={[Math.PI / 2, 0, Math.PI / 2]} position={[0, 0, 0.04]} scale={0.145}>
        <MeshyModel name="paddle" tint={tint} opacity={opacity} />
      </group>
    </Suspense>
  );
}

function DemoRacket({ tint, opacity = 1 }: { tint?: string | undefined; opacity?: number | undefined }) {
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[RACKET_RADIUS, RACKET_RADIUS, 0.008, 32]} />
        <meshStandardMaterial color={tint ?? "#c62828"} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <mesh position={[0, 0, RACKET_RADIUS + 0.045]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.025, 0.1, 0.03]} />
        <meshStandardMaterial color={tint ?? "#b8864b"} transparent={opacity < 1} opacity={opacity} />
      </mesh>
    </group>
  );
}
