import racketAsset from "@/assets/racket.glb.asset.json";
import { SceneModel } from "./SceneModel";

/**
 * Austauschbare Schläger-Hülle. Konvention:
 * - Blattmitte im Ursprung, Blattnormale = lokale X-Achse,
 * - Griff zeigt in lokale +Z-Richtung (zur Hand).
 * Das Meshy-Modell ist maßstäblich auf 17 cm Blattbreite skaliert; die Physik
 * bleibt unabhängig davon und nutzt RACKET_RADIUS.
 */
export function RacketModel() {
  return (
    <SceneModel
      url={racketAsset.url}
      position={[0, 0, 0.148]}
      rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      scale={0.158}
    />
  );
}
