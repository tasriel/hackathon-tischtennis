import { useEffect } from "react";
import * as THREE from "three";
import { RUBBERS, type RubberType, type ServeType } from "@/lib/constants";
import { setSetting, settings, useSettings, type TargetSpot } from "@/lib/settings";
import { STROKES } from "@/lib/strokes";
import { Label } from "./Label";

const PANEL = "#050914";
const PANEL_2 = "#0d1732";
const ACTIVE = "#7c3aed";
const ACTIVE_EDGE = "#c4b5fd";
const TEXT = "#f8fafc";
const MUTED = "#aeb8cc";
const GOLD = "#e6d36a";
// Fenster liegen wie bei der Quest 3 auf einem Kreisbogen um den Spieler, jedes zu ihm gedreht.
const CENTER = { x: 0, z: 1.95 };
const RADIUS = 1.35;
/** Winkel in Grad: 0 = genau links vom Spieler, + = weiter nach hinten */
function arc(deg: number, y: number): { position: [number, number, number]; rotation: [number, number, number] } {
  const a = THREE.MathUtils.degToRad(deg);
  const x = CENTER.x - RADIUS * Math.cos(a);
  const z = CENTER.z + RADIUS * Math.sin(a);
  return { position: [x, y, z], rotation: [0, Math.atan2(CENTER.x - x, CENTER.z - z), 0] };
}

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
      <Label text={label} position={[0, 0, 0.018]} height={height * 0.55} flat bg="rgba(0,0,0,0)" color={TEXT} />
    </group>
  );
}

function Panel({ title, subtitle, angle, y, size, children }: { title: string; subtitle: string; angle: number; y: number; size: [number, number]; children: React.ReactNode }) {
  const [w, h] = size;
  const { position, rotation } = arc(angle, y);
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[w, h, 0.018]} />
        <meshStandardMaterial color={PANEL} transparent opacity={0.93} roughness={0.36} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[w - 0.028, h - 0.028]} />
        <meshBasicMaterial color={PANEL_2} transparent opacity={0.38} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, h / 2 - 0.035, 0.002]}>
        <boxGeometry args={[w - 0.035, 0.012, 0.01]} />
        <meshBasicMaterial color={ACTIVE} />
      </mesh>
      <Label text={title} position={[0, h / 2 - 0.078, 0.012]} height={0.043} flat color={GOLD} bg="rgba(0,0,0,0)" />
      <Label text={subtitle} position={[0, h / 2 - 0.128, 0.012]} height={0.023} flat color={MUTED} bg="rgba(0,0,0,0)" />
      {children}
    </group>
  );
}

const SERVES: ServeType[] = ["backspin", "topspin", "sidespin"];
const RUBBER_KEYS: RubberType[] = ["smooth", "longPips", "shortPips", "anti"];
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
      const rubber = { Digit5: "smooth", Digit6: "longPips", Digit7: "shortPips", Digit8: "anti" }[e.code] as RubberType | undefined;
      if (rubber) setSetting("rubber", rubber);
      const ret = { Digit9: 1, Digit0: 2, Minus: 3 }[e.code] as 1 | 2 | 3 | undefined;
      if (ret) setSetting("returns", ret);
      if (e.code === "KeyM") setSetting("slowMotion", !settings.slowMotion);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Panel title="Slow-Motion" subtitle="M" angle={100} y={1.4} size={[0.54, 0.26]}>
        <MenuButton label="An" active={s.slowMotion} position={[-0.12, -0.035, 0]} width={0.2} height={0.08} onSelect={() => setSetting("slowMotion", true)} />
        <MenuButton label="Aus" active={!s.slowMotion} position={[0.12, -0.035, 0]} width={0.2} height={0.08} onSelect={() => setSetting("slowMotion", false)} />
      </Panel>

      <Panel title="Rückschläge" subtitle="9 / 0 / ß" angle={70} y={1.62} size={[0.54, 0.26]}>
        {([1, 2, 3] as const).map((n, i) => (
          <MenuButton
            key={n}
            label={String(n)}
            active={s.returns === n}
            position={[(i - 1) * 0.16, -0.035, 0]}
            width={0.14}
            height={0.08}
            onSelect={() => setSetting("returns", n)}
          />
        ))}
      </Panel>

      <Panel title="Belag Gegner" subtitle="5 / 6 / 7 / 8" angle={70} y={1.15} size={[0.54, 0.53]}>
        {RUBBER_KEYS.map((k, i) => (
          <MenuButton
            key={k}
            label={RUBBERS[k].label}
            active={s.rubber === k}
            position={[0, 0.07 - i * 0.092, 0]}
            width={0.44}
            height={0.078}
            onSelect={() => setSetting("rubber", k)}
          />
        ))}
      </Panel>

      <Panel title="Schnitt-Variante" subtitle="1 / 2 / 3" angle={40} y={1.2} size={[0.54, 0.43]}>
        {SERVES.map((k, i) => (
          <MenuButton
            key={k}
            label={STROKES[k].serveLabel}
            active={s.serve === k}
            position={[0, 0.055 - i * 0.1, 0]}
            width={0.44}
            height={0.082}
            onSelect={() => setSetting("serve", k)}
          />
        ))}
      </Panel>

      <Panel title="Target" subtitle="J / K / L" angle={10} y={1.2} size={[0.74, 0.3]}>
        {SPOTS.map((sp, i) => (
          <MenuButton
            key={sp.key}
            label={sp.label}
            active={s.target === sp.key}
            position={[(i - 1) * 0.23, -0.035, 0]}
            width={0.2}
            height={0.105}
            onSelect={() => setSetting("target", sp.key)}
          />
        ))}
      </Panel>
    </>
  );
}
