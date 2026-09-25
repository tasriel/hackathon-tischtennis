import { useEffect, useMemo } from "react";
import * as THREE from "three";

/** Textschild als Canvas-Textur (funktioniert in VR, keine Font-Downloads). */
export function Label({
  text, color = "#ffffff", bg = "rgba(15,20,25,0.78)", height = 0.06,
  position, billboard = true,
}: {
  text: string; color?: string; bg?: string; height?: number;
  position?: [number, number, number]; billboard?: boolean;
}) {
  const { texture, aspect } = useMemo(() => {
    const lines = text.split("\n");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const fs = 56;
    ctx.font = `600 ${fs}px system-ui, sans-serif`;
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + fs;
    const h = lines.length * fs * 1.25 + fs * 0.5;
    canvas.width = Math.ceil(w);
    canvas.height = Math.ceil(h);
    ctx.font = `600 ${fs}px system-ui, sans-serif`;
    ctx.fillStyle = bg;
    const r = fs * 0.4;
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, r);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    lines.forEach((l, i) => ctx.fillText(l, canvas.width / 2, fs * 0.25 + fs * 1.25 * (i + 0.5)));
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return { texture: t, aspect: canvas.width / canvas.height };
  }, [text, color, bg]);

  useEffect(() => () => texture.dispose(), [texture]);

  const lineCount = text.split("\n").length;
  const hh = height * lineCount;
  if (billboard) {
    return (
      <sprite position={position} scale={[hh * aspect, hh, 1]}>
        <spriteMaterial map={texture} transparent depthTest={false} />
      </sprite>
    );
  }
  return (
    <mesh position={position}>
      <planeGeometry args={[hh * aspect, hh]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}
