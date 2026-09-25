import { useEffect } from "react";
import type { ServeType } from "@/lib/constants";
import { TABLE } from "@/lib/constants";
import { setSetting, useSettings, type TargetSpot } from "@/lib/settings";
import { STROKES } from "@/lib/strokes";
import { Label } from "./Label";

const ON = "#2e9e4f";
const OFF = "#2a3340";

function Button({
  label,
  active,
  position,
  width,
  onSelect,
}: {
  label: string;
  active: boolean;
  position: [number, number, number];
  width: number;
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
        <boxGeometry args={[width, 0.06, 0.012]} />
        <meshBasicMaterial color={active ? ON : OFF} />
      </mesh>
      <Label text={label} position={[0, 0, 0.012]} height={0.035} bg="rgba(0,0,0,0)" color="#ffffff" />
    </group>
  );
}

const SERVES: ServeType[] = ["backspin", "topspin", "sidespin"];
const SPOTS: { key: TargetSpot; label: string }[] = [
  { key: "left", label: "Links" },
  { key: "center", label: "Mitte" },
  { key: "right", label: "Rechts" },
];

/**
 * Zwei schwebende Menüs, bedienbar mit dem linken Controller (zeigen + Trigger)
 * oder am Desktop per Klick bzw. Tasten 1/2/3 (Einspielen) und J/K/L (Ziel).
 */
export function Menus({ onServeChange }: { onServeChange: () => void }) {
  const s = useSettings();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const serve = { Digit1: "backspin", Digit2: "topspin", Digit3: "sidespin" }[e.code] as ServeType | undefined;
      if (serve) {
        setSetting("serve", serve);
        onServeChange();
      }
      const spot = { KeyJ: "left", KeyK: "center", KeyL: "right" }[e.code] as TargetSpot | undefined;
      if (spot) setSetting("target", spot);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onServeChange]);

  return (
    <>
      {/* Einspiel-Variante: links neben dem Spieler, unter der Nahaufnahme */}
      <group position={[-0.62, 0.95, 1.35]} rotation={[-0.35, 0.7, 0]}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[0.36, 0.3]} />
          <meshBasicMaterial color="#141a22" transparent opacity={0.85} />
        </mesh>
        <Label text="Einspielen" position={[0, 0.11, 0.01]} height={0.03} color="#ffe066" bg="rgba(0,0,0,0)" />
        {SERVES.map((k, i) => (
          <Button
            key={k}
            label={STROKES[k].serveLabel}
            active={s.serve === k}
            position={[0, 0.045 - i * 0.075, 0]}
            width={0.3}
            onSelect={() => {
              setSetting("serve", k);
              onServeChange();
            }}
          />
        ))}
      </group>

      {/* Ziel-Position: hinter der Platte */}
      <group position={[0, TABLE.height + 0.35, -TABLE.length / 2 - 0.35]}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[0.78, 0.18]} />
          <meshBasicMaterial color="#141a22" transparent opacity={0.85} />
        </mesh>
        <Label text="Ziel" position={[0, 0.06, 0.01]} height={0.03} color="#ffe066" bg="rgba(0,0,0,0)" />
        {SPOTS.map((sp, i) => (
          <Button
            key={sp.key}
            label={sp.label}
            active={s.target === sp.key}
            position={[(i - 1) * 0.25, -0.02, 0]}
            width={0.22}
            onSelect={() => setSetting("target", sp.key)}
          />
        ))}
      </group>
    </>
  );
}
