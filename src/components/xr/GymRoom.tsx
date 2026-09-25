import { useMemo } from "react";
import * as THREE from "three";

const FLOOR = "#121212";
const WOOD = "#7a4a2a";
const WOOD_DARK = "#5a3419";
const LIGHT = "#ffd9a3";
const WALL_H = 3.2;
const SPLIT = 1.35; // Höhe der Teilung (unten Stoff, oben Backstein)

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat: [number, number]) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  return t;
}

function brick(len: number) {
  return canvasTex(
    256,
    256,
    (g) => {
      g.fillStyle = "#c9b8a2"; // Fuge
      g.fillRect(0, 0, 256, 256);
      const bh = 32;
      for (let r = 0; r < 8; r++) {
        const off = r % 2 ? 32 : 0;
        for (let c = -1; c < 4; c++) {
          const hue = 12 + Math.random() * 10;
          const l = 32 + Math.random() * 10;
          g.fillStyle = `hsl(${hue} 50% ${l}%)`;
          g.fillRect(c * 64 + off + 3, r * bh + 3, 58, bh - 6);
        }
      }
    },
    [len / 1.0, (WALL_H - SPLIT) / 0.5],
  );
}

function cloth(len: number) {
  return canvasTex(
    128,
    128,
    (g) => {
      g.fillStyle = "#1f3b2c";
      g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 128; i += 2) {
        g.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.03})`;
        g.fillRect(i, 0, 1, 128);
        g.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.05})`;
        g.fillRect(0, i, 128, 1);
      }
    },
    [len / 0.3, SPLIT / 0.3],
  );
}

function floorTex() {
  return canvasTex(
    256,
    256,
    (g) => {
      g.fillStyle = FLOOR;
      g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 1200; i++) {
        g.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
        g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
    },
    [6, 6],
  );
}

function Wall({ position, rotation = [0, 0, 0], len }: { position: [number, number, number]; rotation?: [number, number, number]; len: number }) {
  const tex = useMemo(() => ({ b: brick(len), c: cloth(len) }), [len]);
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, SPLIT + (WALL_H - SPLIT) / 2, 0]}>
        <planeGeometry args={[len, WALL_H - SPLIT]} />
        <meshStandardMaterial map={tex.b} roughness={0.9} />
      </mesh>
      <mesh position={[0, SPLIT / 2, 0]}>
        <planeGeometry args={[len, SPLIT]} />
        <meshStandardMaterial map={tex.c} roughness={1} />
      </mesh>
      <mesh position={[0, SPLIT, 0.02]}>
        <boxGeometry args={[len, 0.07, 0.04]} />
        <meshStandardMaterial color={WOOD} roughness={0.6} />
      </mesh>
    </group>
  );
}

export function GymRoom() {
  const floor = useMemo(() => floorTex(), []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.004, 0]}>
        <planeGeometry args={[9, 10]} />
        <meshStandardMaterial map={floor} roughness={0.7} metalness={0.05} />
      </mesh>
      <Wall position={[0, 0, -3.2]} len={8.8} />
      <Wall position={[-4.4, 0, 0.8]} rotation={[0, Math.PI / 2, 0]} len={8.0} />
      <Wall position={[4.4, 0, 0.8]} rotation={[0, -Math.PI / 2, 0]} len={8.0} />
      <Wall position={[0, 0, 4.8]} rotation={[0, Math.PI, 0]} len={8.8} />

      {/* Decke + Holzbalken */}
      <mesh rotation-x={Math.PI / 2} position={[0, WALL_H, 0.8]}>
        <planeGeometry args={[8.8, 8]} />
        <meshStandardMaterial color="#2a1c13" roughness={1} />
      </mesh>
      {[-3, -1.5, 0, 1.5, 3].map((x) => (
        <mesh key={x} position={[x, WALL_H - 0.1, 0.8]}>
          <boxGeometry args={[0.16, 0.2, 8]} />
          <meshStandardMaterial color={WOOD} roughness={0.7} />
        </mesh>
      ))}
      {[-2.4, -0.8, 0.8, 2.4].map((z) => (
        <mesh key={z} position={[0, WALL_H - 0.24, z]}>
          <boxGeometry args={[8.8, 0.12, 0.12]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
        </mesh>
      ))}
      {/* Warme Lampen von oben */}
      {[-1.5, 1.5].flatMap((x) =>
        [-1.6, 0.4, 2.2].map((z) => (
          <group key={`${x}${z}`} position={[x * 0.7, WALL_H - 0.45, z]}>
            <mesh>
              <cylinderGeometry args={[0.14, 0.2, 0.12, 20]} />
              <meshStandardMaterial color={LIGHT} emissive={LIGHT} emissiveIntensity={2} />
            </mesh>
            <pointLight position={[0, -0.12, 0]} intensity={1.6} distance={5} decay={1.4} color={LIGHT} />
          </group>
        )),
      )}
    </group>
  );
}
