import { useEffect, useMemo } from "react";
import * as THREE from "three";

type Props = {
  text: string;
  color?: string;
  bg?: string;
  height?: number;
  /** "left": Text beginnt an der Position und läuft nach rechts */
  anchor?: "center" | "left";
  /** true: flache Fläche statt Sprite (dreht sich nicht zur Kamera) */
  flat?: boolean;
} & Omit<React.ComponentProps<"group">, "scale">;

/** Einfaches Text-Label ohne externe Schriftdateien. */
export function Label({ text, color = "#ffffff", bg = "rgba(20,24,30,0.78)", height = 0.06, anchor = "center", flat = false, renderOrder, visible, ...props }: Props & { renderOrder?: number }) {
  const { texture, aspect } = useMemo(() => {
    const c = document.createElement("canvas");
    const g = c.getContext("2d")!;
    const H = 96;
    const font = "600 64px system-ui, sans-serif";
    g.font = font;
    const w = Math.max(48, Math.ceil(g.measureText(text || " ").width) + 40);
    c.width = w;
    c.height = H;
    g.font = font;
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(0, 0, w, H, 22);
    g.fill();
    g.fillStyle = color;
    g.textBaseline = "middle";
    g.fillText(text, 20, H / 2 + 3);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return { texture: t, aspect: w / H };
  }, [text, color, bg]);

  useEffect(() => () => texture.dispose(), [texture]);

  const w = height * aspect;
  const show = !!text && visible !== false;
  const ro = renderOrder ?? 30;

  if (flat) {
    return (
      <group {...props} visible={show}>
        <mesh position={[anchor === "left" ? w / 2 : 0, 0, 0]} renderOrder={ro}>
          <planeGeometry args={[w, height]} />
          <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    );
  }
  return (
    <group {...props} visible={show}>
      <sprite renderOrder={ro} scale={[w, height, 1]} center={anchor === "left" ? new THREE.Vector2(0, 0.5) : new THREE.Vector2(0.5, 0.5)}>
        <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  );
}
