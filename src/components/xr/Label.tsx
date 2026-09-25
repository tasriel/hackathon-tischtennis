import { useEffect, useMemo } from "react";
import * as THREE from "three";

/** Einfaches Text-Sprite ohne externe Schriftdateien. */
export function Label({
  text,
  color = "#ffffff",
  bg = "rgba(20,24,30,0.78)",
  height = 0.06,
  ...props
}: { text: string; color?: string; bg?: string; height?: number } & Omit<
  React.ComponentProps<"sprite">,
  "scale"
>) {
  const { texture, aspect } = useMemo(() => {
    const c = document.createElement("canvas");
    const g = c.getContext("2d")!;
    const font = "600 44px system-ui, sans-serif";
    g.font = font;
    const w = Math.max(40, Math.ceil(g.measureText(text || " ").width) + 40);
    c.width = w;
    c.height = 70;
    g.font = font;
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(0, 0, w, 70, 18);
    g.fill();
    g.fillStyle = color;
    g.textBaseline = "middle";
    g.fillText(text, 20, 37);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { texture: t, aspect: w / 70 };
  }, [text, color, bg]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite {...props} renderOrder={props.renderOrder ?? 30} scale={[height * aspect, height, 1]} visible={!!text && props.visible !== false}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} />
    </sprite>
  );
}
