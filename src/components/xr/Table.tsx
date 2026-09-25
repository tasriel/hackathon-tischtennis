import { forwardRef } from "react";
import * as THREE from "three";
import { TABLE } from "@/lib/constants";

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
        {/* Boden */}
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[14, 14]} />
          <meshStandardMaterial color="#8a6b4f" roughness={0.9} />
        </mesh>
        {/* Gegnerseite (z < 0) */}
        <mesh position={[0, top, -TABLE.length / 4]}>
          <boxGeometry args={[TABLE.width, 0.03, TABLE.length / 2]} />
          <meshStandardMaterial
            ref={(m) => {
              if (r) r.current = { ...r.current, far: m };
            }}
            color="#1d4f8a"
            roughness={0.6}
          />
        </mesh>
        {/* Eigene Seite */}
        <mesh position={[0, top, TABLE.length / 4]}>
          <boxGeometry args={[TABLE.width, 0.03, TABLE.length / 2]} />
          <meshStandardMaterial color="#1d4f8a" roughness={0.6} />
        </mesh>
        {/* Linien */}
        <mesh position={[0, TABLE.height + 0.001, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.006, TABLE.length]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Netz */}
        <mesh position={[0, TABLE.height + TABLE.netHeight / 2, 0]}>
          <boxGeometry args={[TABLE.width + 0.3, TABLE.netHeight, 0.01]} />
          <meshStandardMaterial
            ref={(m) => {
              if (r) r.current = { ...r.current, net: m };
            }}
            color="#eeeeee"
            transparent
            opacity={0.75}
          />
        </mesh>
        {/* Beine */}
        {[-1, 1].map((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * 0.65, top / 2, sz * 1.1]}>
              <boxGeometry args={[0.05, top, 0.05]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
          )),
        )}
      </group>
    );
  },
);
