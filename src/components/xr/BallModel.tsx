import { useMemo } from "react";
import * as THREE from "three";
import { BALL_RADIUS } from "@/lib/constants";

/**
 * Austauschbare Ball-Hülle (Demo). Später durch Meshy-GLB ersetzen:
 * Größe = BALL_RADIUS, Mittelpunkt im Ursprung. Physik ist unabhängig davon.
 * Farbige Streifen machen die Rotation sichtbar.
 */
export function BallModel() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = "#f7f3ea";
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = "#e0561b";
    g.fillRect(0, 54, 256, 20); // Äquator-Streifen
    g.fillStyle = "#1f6fb5";
    g.fillRect(0, 0, 32, 128);
    g.fillRect(128, 0, 32, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[BALL_RADIUS, 24, 16]} />
      <meshStandardMaterial map={texture} roughness={0.5} />
    </mesh>
  );
}
