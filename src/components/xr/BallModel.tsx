import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BALL_RADIUS } from "@/lib/constants";

const NORMAL_BALL = new THREE.Color("#f7f3ea");
const SLOWMO_BALL = new THREE.Color("#ef8e39");
const SPIN_BAND = "#8f2d1f";
const SPIN_CROSS = "#175b91";

/**
 * Austauschbare Ball-Hülle (Demo). Später durch Meshy-GLB ersetzen:
 * Größe = BALL_RADIUS, Mittelpunkt im Ursprung. Physik ist unabhängig davon.
 * Farbige Streifen machen die Rotation sichtbar.
 */
export function BallModel({ isSlowMotion = () => false }: { isSlowMotion?: () => boolean }) {
  const blend = useRef(0);
  const lastBase = useRef("");
  const mixedColor = useMemo(() => new THREE.Color(), []);
  const surface = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const context = c.getContext("2d");
    if (!context) return null;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { context, texture: t };
  }, []);

  useFrame((_, delta) => {
    if (!surface) return;
    const target = isSlowMotion() ? 1 : 0;
    blend.current += (target - blend.current) * (1 - Math.exp(-7 * Math.min(delta, 0.05)));
    const base = `#${mixedColor.copy(NORMAL_BALL).lerp(SLOWMO_BALL, blend.current).getHexString()}`;
    if (base === lastBase.current) return;
    lastBase.current = base;
    const { context: g, texture } = surface;
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = SPIN_BAND;
    g.fillRect(0, 54, 256, 20); // dunkler Äquator-Streifen mit klarem Kontrast zum Zeitlupen-Orange
    g.fillStyle = SPIN_CROSS;
    g.fillRect(0, 0, 32, 128);
    g.fillRect(128, 0, 32, 128);
    texture.needsUpdate = true;
  });

  return (
    <mesh>
      <sphereGeometry args={[BALL_RADIUS, 24, 16]} />
      <meshStandardMaterial map={surface?.texture ?? null} roughness={0.5} />
    </mesh>
  );
}
