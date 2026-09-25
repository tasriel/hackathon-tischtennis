import { forwardRef } from "react";
import * as THREE from "three";
import tableAsset from "@/assets/table.glb.asset.json";
import { TABLE } from "@/lib/constants";
import { SceneModel } from "./SceneModel";

/** Tisch, Netz, Boden. Die Tischplatten-Materialien werden fürs Feedback eingefärbt. */
export const Table = forwardRef<{ far: THREE.MeshStandardMaterial | null; net: THREE.MeshStandardMaterial | null }>(
  function Table(_, ref) {
    const r = ref as React.MutableRefObject<{
      far: THREE.MeshStandardMaterial | null;
      net: THREE.MeshStandardMaterial | null;
    }>;
    const top = TABLE.height - 0.015;
    return (
      <group>
        {/* Das Modell ersetzt Platte, Netz und Beine. Seine lange Achse wird auf Z gedreht. */}
        <SceneModel
          url={tableAsset.url}
          position={[0, 0.375, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={TABLE.length / 1.89957}
        />
        {/* Unsichtbare Feedback-Flächen behalten die bestehende Trefferanzeige bei. */}
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
        {/* Unsichtbares Netzmaterial für die rote Fehler-Rückmeldung. */}
        <mesh position={[0, TABLE.height + TABLE.netHeight / 2, 0]}>
          <boxGeometry args={[TABLE.width + 0.3, TABLE.netHeight, 0.01]} />
          <meshStandardMaterial
            ref={(m) => {
              if (r) r.current = { ...r.current, net: m };
            }}
            color="#eeeeee"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      </group>
    );
  },
);
