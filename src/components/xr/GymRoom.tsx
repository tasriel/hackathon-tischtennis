import * as THREE from "three";
import { TABLE } from "@/lib/constants";

const FLOOR = "#cfd3d7";
const WALL = "#d9dde3";
const WALL_THREAD = "#b8c0ca";
const BEAM = "#192237";
const LIGHT = "#f8fbff";

function ClothWall({ position, rotation = [0, 0, 0], size }: { position: [number, number, number]; rotation?: [number, number, number]; size: [number, number] }) {
  const [w, h] = size;
  return (
    <group position={position} rotation={rotation}>
      <mesh receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={WALL} roughness={0.92} />
      </mesh>
      {Array.from({ length: Math.floor(w / 0.24) + 1 }, (_, i) => (
        <mesh key={`v-${i}`} position={[-w / 2 + i * 0.24, 0, 0.002]}>
          <boxGeometry args={[0.004, h, 0.003]} />
          <meshBasicMaterial color={WALL_THREAD} transparent opacity={0.28} />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={`h-${i}`} position={[0, -h / 2 + 0.38 + i * 0.42, 0.003]}>
          <boxGeometry args={[w, 0.004, 0.003]} />
          <meshBasicMaterial color={WALL_THREAD} transparent opacity={0.16} />
        </mesh>
      ))}
    </group>
  );
}

export function GymRoom() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.004, 0]} receiveShadow>
        <planeGeometry args={[9, 10]} />
        <meshStandardMaterial color={FLOOR} roughness={0.78} metalness={0.02} />
      </mesh>
      <ClothWall position={[0, 1.6, -3.2]} size={[8.8, 3.2]} />
      <ClothWall position={[-4.4, 1.6, 0.8]} rotation={[0, Math.PI / 2, 0]} size={[8.0, 3.2]} />
      <ClothWall position={[4.4, 1.6, 0.8]} rotation={[0, -Math.PI / 2, 0]} size={[8.0, 3.2]} />

      {[-2.8, -1.4, 0, 1.4, 2.8].map((x) => (
        <mesh key={x} position={[x, 3.15, 0]} castShadow>
          <boxGeometry args={[0.07, 0.12, 8.3]} />
          <meshStandardMaterial color={BEAM} roughness={0.55} />
        </mesh>
      ))}
      {[-1.05, 1.05].map((x) => (
        <group key={x} position={[x, 3.02, -0.2]}>
          <mesh>
            <boxGeometry args={[0.16, 0.035, 3.1]} />
            <meshStandardMaterial color={LIGHT} emissive={LIGHT} emissiveIntensity={1.5} roughness={0.25} />
          </mesh>
          <pointLight position={[0, -0.08, 0]} intensity={0.55} distance={4.2} color={LIGHT} />
        </group>
      ))}
      <mesh position={[0, TABLE.height - 0.012, 0]} visible={false}>
        <boxGeometry args={[TABLE.width, 0.02, TABLE.length]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
}
