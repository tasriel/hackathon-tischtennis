import { useTexture } from "@react-three/drei";
import { forwardRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import tableAsset from "@/assets/table-quality.glb.asset.json";
import netTextureAsset from "@/assets/net-texture.png.asset.json";
import { TABLE } from "@/lib/constants";
import { SceneModel } from "./SceneModel";

/** Maßstäblicher Tisch und leichtes Textur-Netz; Physik bleibt an TABLE gebunden. */
export const Table = forwardRef<{ far: THREE.MeshStandardMaterial | null; net: THREE.MeshStandardMaterial | null }>(
  function Table(_, ref) {
    const r = ref as React.MutableRefObject<{
      far: THREE.MeshStandardMaterial | null;
      net: THREE.MeshStandardMaterial | null;
    }>;
    const top = TABLE.height - 0.015;
    const source = useTexture(netTextureAsset.url);
    const netTexture = useMemo(() => {
      const texture = source.clone();
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.repeat.set(Math.round(1.83 / TABLE.netHeight), 1);
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.needsUpdate = true;
      return texture;
    }, [source]);
    useEffect(() => () => netTexture.dispose(), [netTexture]);
    return (
      <group>
        {/* Lange Modellachse auf Z; Modelloberkante auf physikalischer Plattenhöhe. */}
        <SceneModel
          url={tableAsset.url}
          position={[0, TABLE.height - 0.262611 * (TABLE.length / 1.89957), 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={TABLE.length / 1.89957}
        />
        {/* Unterkante 2 mm über der Platte, ohne zusätzliche GLB-Geometrie. */}
        <mesh position={[0, TABLE.height + 0.002 + TABLE.netHeight / 2, 0]}>
          <planeGeometry args={[1.83, TABLE.netHeight]} />
          <meshStandardMaterial
            ref={(m) => {
              if (r) r.current = { ...r.current, net: m };
            }}
            map={netTexture}
            transparent
            alphaTest={0.5}
            side={THREE.DoubleSide}
            roughness={0.8}
            depthWrite={false}
          />
        </mesh>
        {/* Unsichtbare Feedback-Fläche für die Tischhälfte. */}
        <mesh position={[0, top, -TABLE.length / 4]}>
          <boxGeometry args={[TABLE.width, 0.03, TABLE.length / 2]} />
          <meshStandardMaterial
            ref={(m) => {
              if (r) r.current = { ...r.current, far: m };
            }}
            color="#1d4f8a"
            transparent
            opacity={0}
            depthWrite={false}
            roughness={0.6}
          />
        </mesh>
      </group>
    );
  },
);
