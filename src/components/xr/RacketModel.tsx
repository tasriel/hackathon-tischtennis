import { SceneModel } from "./SceneModel";

const RACKET_MODEL_URL: string = "/models/racket-quality.glb";
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
      url={RACKET_MODEL_URL}
      position={[0, 0, 0.063]}
      rotation={[-Math.PI / 2, Math.PI / 2, 0]}
      scale={0.158}
    />
  );
}
