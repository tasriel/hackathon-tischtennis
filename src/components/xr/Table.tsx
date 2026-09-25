import {
  NET_H, NET_OVERHANG, NET_Z, TABLE_FAR_Z, TABLE_H, TABLE_L, TABLE_NEAR_Z, TABLE_W,
} from "@/lib/constants";

export type Glow = "none" | "success" | "fail";

const LINE = 0.02;

export function Table({ glow }: { glow: Glow }) {
  const cz = (TABLE_NEAR_Z + TABLE_FAR_Z) / 2;
  const top = 0.025;
  const oppZ = (NET_Z + TABLE_FAR_Z) / 2;
  return (
    <group>
      {/* Platte */}
      <mesh position={[0, TABLE_H - top / 2, cz]} receiveShadow>
        <boxGeometry args={[TABLE_W, top, TABLE_L]} />
        <meshStandardMaterial color="#1d4f86" roughness={0.6} />
      </mesh>
      {/* weiße Linien: Seitenlinien, Grundlinien, Mittellinie */}
      {[-1, 1].map((s) => (
        <mesh key={`s${s}`} position={[s * (TABLE_W / 2 - LINE / 2), TABLE_H + 0.001, cz]}>
          <boxGeometry args={[LINE, 0.002, TABLE_L]} />
          <meshBasicMaterial color="#f4f4f4" />
        </mesh>
      ))}
      {[TABLE_NEAR_Z, TABLE_FAR_Z].map((z) => (
        <mesh key={`e${z}`} position={[0, TABLE_H + 0.001, z + (z === TABLE_NEAR_Z ? -LINE / 2 : LINE / 2)]}>
          <boxGeometry args={[TABLE_W, 0.002, LINE]} />
          <meshBasicMaterial color="#f4f4f4" />
        </mesh>
      ))}
      <mesh position={[0, TABLE_H + 0.001, cz]}>
        <boxGeometry args={[0.003, 0.002, TABLE_L]} />
        <meshBasicMaterial color="#f4f4f4" />
      </mesh>

      {/* Feedback-Leuchten auf der Gegnerseite */}
      {glow !== "none" && (
        <mesh position={[0, TABLE_H + 0.003, oppZ]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[TABLE_W, TABLE_L / 2]} />
          <meshBasicMaterial
            color={glow === "success" ? "#3ddc84" : "#ff4d4f"}
            transparent opacity={0.35} depthWrite={false}
          />
        </mesh>
      )}

      {/* Netz */}
      <mesh position={[0, TABLE_H + NET_H / 2, NET_Z]}>
        <boxGeometry args={[TABLE_W + 2 * NET_OVERHANG, NET_H, 0.004]} />
        <meshStandardMaterial
          color={glow === "fail" ? "#ff6b6b" : "#e8e8e8"}
          transparent opacity={0.75}
        />
      </mesh>
      <mesh position={[0, TABLE_H + NET_H, NET_Z]}>
        <boxGeometry args={[TABLE_W + 2 * NET_OVERHANG, 0.012, 0.008]} />
        <meshStandardMaterial color="#fafafa" />
      </mesh>

      {/* Beine */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[sx * (TABLE_W / 2 - 0.1), (TABLE_H - top) / 2, cz + sz * (TABLE_L / 2 - 0.2)]}>
          <boxGeometry args={[0.05, TABLE_H - top, 0.05]} />
          <meshStandardMaterial color="#2b2b2b" />
        </mesh>
      ))}
    </group>
  );
}
