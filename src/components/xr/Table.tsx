import { forwardRef, Suspense } from "react";
import * as THREE from "three";
import { TABLE } from "@/lib/constants";
import { MeshyModel } from "./MeshyModel";

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
        <Suspense fallback={<DemoTable top={top} materialRef={r} />}>
          <group position={[0, 0.35, 0]} scale={[0.803, 1.56, 2.598]}>
            <MeshyModel name="table" />
          </group>
          <group position={[0, TABLE.height + TABLE.netHeight / 2, 0]} scale={[0.959, 0.463, 0.4]}>
            <MeshyModel name="net" />
          </group>
          {/* Unsichtbare Feedback-Flächen behalten die Lernsignale unabhängig vom Modell. */}
          <mesh position={[0, top + 0.002, -TABLE.length / 4]}>
            <boxGeometry args={[TABLE.width, 0.004, TABLE.length / 2]} />
            <meshStandardMaterial ref={(m) => { if (r) r.current = { ...r.current, far: m }; }} color="#1d4f8a" transparent opacity={0.08} />
          </mesh>
          <mesh position={[0, TABLE.height + TABLE.netHeight / 2, 0]}>
            <boxGeometry args={[TABLE.width + 0.3, TABLE.netHeight, 0.012]} />
            <meshStandardMaterial ref={(m) => { if (r) r.current = { ...r.current, net: m }; }} color="#eeeeee" transparent opacity={0.08} />
          </mesh>
        </Suspense>
      </group>
    );
  },
);

function DemoTable({ top, materialRef }: { top: number; materialRef: React.MutableRefObject<{ far: THREE.MeshStandardMaterial | null; net: THREE.MeshStandardMaterial | null }> }) {
  return (
    <>
      <mesh position={[0, top, 0]}>
        <boxGeometry args={[TABLE.width, 0.03, TABLE.length]} />
        <meshStandardMaterial ref={(m) => { materialRef.current = { ...materialRef.current, far: m }; }} color="#1d4f8a" />
      </mesh>
      <mesh position={[0, TABLE.height + TABLE.netHeight / 2, 0]}>
        <boxGeometry args={[TABLE.width + 0.3, TABLE.netHeight, 0.01]} />
        <meshStandardMaterial ref={(m) => { materialRef.current = { ...materialRef.current, net: m }; }} color="#eeeeee" />
      </mesh>
    </>
  );
}
