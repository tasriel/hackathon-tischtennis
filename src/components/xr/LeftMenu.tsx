import { useEffect } from "react";
import type { ServeType } from "@/lib/constants";
import { setSetting, useSettings, type TargetSpot } from "@/lib/settings";
import { STROKES } from "@/lib/strokes";
import { Label } from "./Label";

const PANEL = "#050914";
const PANEL_2 = "#0d1732";
const ACTIVE = "#7c3aed";
const ACTIVE_EDGE = "#c4b5fd";
const TEXT = "#f8fafc";
const MUTED = "#aeb8cc";
const GOLD = "#e6d36a";

function MenuButton({
  label,
  active,
  position,
  width,
  height = 0.075,
  onSelect,
}: {
  label: string;
  active: boolean;
  position: [number, number, number];
  width: number;
  height?: number;
  onSelect: () => void;
}) {
  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <boxGeometry args={[width, height, 0.018]} />
        <meshStandardMaterial color={active ? ACTIVE : PANEL_2} emissive={active ? ACTIVE : "#000000"} emissiveIntensity={active ? 0.35 : 0} roughness={0.45} />
      </mesh>
      {active && (
        <mesh position={[0, 0, 0.012]}>
          <boxGeometry args={[width + 0.012, height + 0.012, 0.004]} />
          <meshBasicMaterial color={ACTIVE_EDGE} transparent opacity={0.24} />
        </mesh>
      )}
      <Label text={label} position={[0, 0, 0.018]} height={height * 0.55} bg="rgba(0,0,0,0)" color={TEXT} />
    </group>
  );
}

function Panel({ title, subtitle, position, size, children }: { title: string; subtitle: string; position: [number, number, number]; size: [number, number]; children: React.ReactNode }) {
  const [w, h] = size;
  return (
    <group position={position} rotation={[0, 0, 0]}>
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[w, h, 0.018]} />
        <meshStandardMaterial color={PANEL} transparent opacity={0.93} roughness={0.36} />
      </mesh>
      <mesh position={[0, h / 2 - 0.035, 0.002]}>
        <boxGeometry args={[w - 0.035, 0.012, 0.01]} />
        <meshBasicMaterial color={ACTIVE} />
      </mesh>
      <Label text={title} position={[0, h / 2 - 0.078, 0.012]} height={0.043} color={GOLD} bg="rgba(0,0,0,0)" />
      <Label text={subtitle} position={[0, h / 2 - 0.128, 0.012]} height={0.023} color={MUTED} bg="rgba(0,0,0,0)" />
      {children}
    </group>
  );
}

const SERVES: ServeType[] = ["backspin", "topspin", "sidespin"];
const SPOTS: { key: TargetSpot; label: string }[] = [
  { key: "left", label: "Links" },
  { key: "center", label: "Mitte" },
  { key: "right", label: "Rechts" },
];

export function Menus() {
  const s = useSettings();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const serve = { Digit1: "backspin", Digit2: "topspin", Digit3: "sidespin" }[e.code] as ServeType | undefined;
      if (serve) setSetting("serve", serve);
      const spot = { KeyJ: "left", KeyK: "center", KeyL: "right" }[e.code] as TargetSpot | undefined;
      if (spot) setSetting("target", spot);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Panel title="Schnitt-Variante" subtitle="1 / 2 / 3" position={[-1.04, 1.14, 1.58]} size={[0.48, 0.39]}>
        {SERVES.map((k, i) => (
          <MenuButton
            key={k}
            label={STROKES[k].serveLabel}
            active={s.serve === k}
            position={[0, 0.055 - i * 0.092, 0]}
            width={0.39}
            onSelect={() => setSetting("serve", k)}
          />
        ))}
      </Panel>

      <Panel title="Target" subtitle="J / K / L" position={[-1.04, 0.67, 1.58]} size={[0.62, 0.26]}>
        {SPOTS.map((sp, i) => (
          <MenuButton
            key={sp.key}
            label={sp.label}
            active={s.target === sp.key}
            position={[(i - 1) * 0.19, -0.035, 0]}
            width={0.17}
            height={0.09}
            onSelect={() => setSetting("target", sp.key)}
          />
        ))}
      </Panel>
    </>
  );
}
