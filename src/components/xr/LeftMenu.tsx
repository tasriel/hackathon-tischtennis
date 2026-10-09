import { useFrame, useThree } from "@react-three/fiber";
import { useXR, useXRInputSourceState } from "@react-three/xr";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RUBBERS, type RubberType, type ServeType } from "@/lib/constants";
import {
  SERIES_LENGTHS,
  setSetting,
  settings,
  SLOW_STRENGTHS,
  TABLE_OFFSETS,
  useSettings,
  type MenuTab,
  type TargetSpot,
} from "@/lib/settings";
import { SLOW_DURATIONS, type SlowDuration } from "@/lib/timescale";
import { STROKES } from "@/lib/strokes";
import { series } from "@/lib/series";
import { Label } from "./Label";

const PANEL = "#050914";
const PANEL_2 = "#0d1732";
const ACTIVE = "#7c3aed";
const ACTIVE_EDGE = "#c4b5fd";
const TEXT = "#f8fafc";
const MUTED = "#aeb8cc";
const GOLD = "#e6d36a";

/** Feste VR-Position des Review-Fensters (Mitte), muss zu SpinOverlay passen. */
export const REVIEW_XR_POS = new THREE.Vector3(-1.3, 1.25, 0.85);
const REVIEW_HALF_W = 0.42;
const MENU_W = 0.78;
const MENU_H = 0.68;
const MENU_DIST = 0.85;

/** Wählt eine Blickrichtung für das Menü, die sich nicht mit dem Review-Fenster überlappt. */
export function menuYaw(head: THREE.Vector3, headYaw: number, review: THREE.Vector3 | null): number {
  if (!review) return headYaw;
  const dx = review.x - head.x;
  const dz = review.z - head.z;
  const dist = Math.hypot(dx, dz);
  const reviewYaw = Math.atan2(-dx, -dz);
  const need = Math.atan((MENU_W / 2) / MENU_DIST) + Math.atan(REVIEW_HALF_W / Math.max(dist, 0.3)) + 0.08;
  let diff = headYaw - reviewYaw;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  if (Math.abs(diff) >= need) return headYaw;
  return reviewYaw + (diff >= 0 ? need : -need);
}

function MenuButton({
  label,
  active,
  position,
  width,
  height = 0.065,
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
      <Label text={label} position={[0, 0, 0.018]} height={height * 0.5} flat bg="rgba(0,0,0,0)" color={TEXT} />
    </group>
  );
}

function Caption({ text, y, x = 0 }: { text: string; y: number; x?: number }) {
  return <Label text={text} position={[x, y, 0.012]} height={0.022} flat color={MUTED} bg="rgba(0,0,0,0)" />;
}

/** Reihe von gleich breiten Knöpfen */
function Row<T>({ items, y, value, label, onSelect, w = 0.13 }: { items: readonly T[]; y: number; value: T; label: (v: T) => string; onSelect: (v: T) => void; w?: number }) {
  const gap = w + 0.012;
  return (
    <>
      {items.map((v, i) => (
        <MenuButton key={String(v)} label={label(v)} active={value === v} position={[(i - (items.length - 1) / 2) * gap, y, 0]} width={w} onSelect={() => onSelect(v)} />
      ))}
    </>
  );
}

const onOff = (b: boolean) => (b ? "An" : "Aus");
const BOOL = [true, false] as const;
const DURATIONS: SlowDuration[] = ["instant", "short", "medium", "long"];
const SERVES: ServeType[] = ["backspin", "topspin", "sidespin"];
const RUBBER_KEYS: RubberType[] = ["smooth", "longPips", "shortPips", "anti"];
const SPOTS: TargetSpot[] = ["left", "center", "right"];
const SPOT_DE: Record<TargetSpot, string> = { left: "Links", center: "Mitte", right: "Rechts" };
const TABS: { key: MenuTab; label: string }[] = [
  { key: "ball", label: "Ball" },
  { key: "opponent", label: "Gegner" },
  { key: "slow", label: "Zeitlupe" },
  { key: "display", label: "Anzeige" },
];

export function startSeries() {
  series.balls = [];
  series.summary = null;
  setSetting("seriesDone", 0);
  setSetting("seriesActive", true);
}

/** Einstellungsfenster: per X (linker Controller) bzw. Tab ein-/ausblenden. */
export function Menus() {
  const s = useSettings();
  const root = useRef<THREE.Group>(null);
  const left = useXRInputSourceState("controller", "left");
  const xWas = useRef(false);
  const placedFor = useRef(false);
  const { camera } = useThree();
  const isXR = useXR((st) => st.session != null);
  const head = useMemo(() => new THREE.Vector3(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Tab") {
        e.preventDefault();
        setSetting("menuOpen", !settings.menuOpen);
      }
      const serve = { Digit1: "backspin", Digit2: "topspin", Digit3: "sidespin" }[e.code] as ServeType | undefined;
      if (serve) setSetting("serve", serve);
      const spot = { KeyJ: "left", KeyK: "center", KeyL: "right" }[e.code] as TargetSpot | undefined;
      if (spot) setSetting("target", spot);
      const rubber = { Digit5: "smooth", Digit6: "longPips", Digit7: "shortPips", Digit8: "anti" }[e.code] as RubberType | undefined;
      if (rubber) setSetting("rubber", rubber);
      const ret = { Digit9: 0, Digit0: 1, Minus: 2, Equal: 3 }[e.code] as 0 | 1 | 2 | 3 | undefined;
      if (ret !== undefined) setSetting("returns", ret);
      if (e.code === "KeyM") setSetting("slowMotion", !settings.slowMotion);
      if (e.code === "KeyR") setSetting("showReview", !settings.showReview);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useFrame(() => {
    const pressed = left?.gamepad?.["x-button"]?.state === "pressed";
    if (pressed && !xWas.current) setSetting("menuOpen", !settings.menuOpen);
    xWas.current = pressed;
    const g = root.current;
    if (!g) return;
    g.visible = settings.menuOpen;
    if (!settings.menuOpen) {
      placedFor.current = false;
      return;
    }
    if (placedFor.current) return;
    // einmalig beim Öffnen vor dem Kopf platzieren (nicht kopfgebunden), Review aussparen
    placedFor.current = true;
    camera.getWorldPosition(head);
    camera.getWorldDirection(fwd);
    const yaw0 = Math.atan2(-fwd.x, -fwd.z) + 0.15; // leicht nach links
    // Am Rechner liegt das Review oben rechts im Bild; dort genügt etwas mehr Abstand nach links unten.
    const yaw = isXR ? menuYaw(head, yaw0, settings.showReview ? REVIEW_XR_POS : null) : yaw0 + 0.1;
    const d = isXR ? MENU_DIST : 2.2;
    g.position.set(head.x - Math.sin(yaw) * d, head.y - (isXR ? 0.12 : 0.45), head.z - Math.cos(yaw) * d);
    g.rotation.set(-0.12, yaw, 0, "YXZ");
  });

  const tabY = MENU_H / 2 - 0.14;
  const y0 = tabY - 0.1;
  return (
    <group ref={root} visible={false}>
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[MENU_W, MENU_H, 0.018]} />
        <meshStandardMaterial color={PANEL} transparent opacity={0.94} roughness={0.36} />
      </mesh>
      <mesh position={[0, MENU_H / 2 - 0.03, 0.002]}>
        <boxGeometry args={[MENU_W - 0.035, 0.01, 0.01]} />
        <meshBasicMaterial color={ACTIVE} />
      </mesh>
      <Label text="Einstellungen" position={[-0.2, MENU_H / 2 - 0.07, 0.012]} height={0.036} flat color={GOLD} bg="rgba(0,0,0,0)" />
      <Label text="X: schließen" position={[0.25, MENU_H / 2 - 0.07, 0.012]} height={0.02} flat color={MUTED} bg="rgba(0,0,0,0)" />
      <Row items={TABS.map((t) => t.key)} y={tabY} value={s.menuTab} label={(k) => TABS.find((t) => t.key === k)!.label} onSelect={(k) => setSetting("menuTab", k)} w={0.17} />

      {s.menuTab === "ball" && (
        <group position={[0, y0, 0]}>
          <Caption text="Schnitt-Variante" y={0} />
          <Row items={SERVES} y={-0.05} value={s.serve} label={(k) => STROKES[k].serveLabel} onSelect={(k) => setSetting("serve", k)} w={0.22} />
          <Caption text="Ziel" y={-0.105} />
          <Row items={SPOTS} y={-0.155} value={s.target} label={(k) => SPOT_DE[k]} onSelect={(k) => setSetting("target", k)} w={0.14} />
          <group position={[0, -0.075, 0]}>
            <Row items={["short", "long"] as const} y={-0.155} value={s.targetDepth} label={(k) => (k === "short" ? "Kurz" : "Lang")} onSelect={(k) => setSetting("targetDepth", k)} w={0.2} />
          </group>
          <Caption text={s.seriesActive ? `Serie läuft: ${s.seriesDone} / ${s.seriesLength}` : "Serie"} y={-0.29} />
          <group position={[-0.12, 0, 0]}>
            <Row items={SERIES_LENGTHS} y={-0.34} value={s.seriesLength} label={(n) => `${n} Bälle`} onSelect={(n) => setSetting("seriesLength", n)} w={0.12} />
          </group>
          <MenuButton label={s.seriesActive ? "Abbrechen" : "Serie starten"} active={s.seriesActive} position={[0.26, -0.34, 0]} width={0.18} onSelect={() => (settings.seriesActive ? setSetting("seriesActive", false) : startSeries())} />
        </group>
      )}

      {s.menuTab === "opponent" && (
        <group position={[0, y0, 0]}>
          <Caption text="Belag Gegner" y={0} />
          <Row items={RUBBER_KEYS} y={-0.05} value={s.rubber} label={(k) => RUBBERS[k].label} onSelect={(k) => setSetting("rubber", k)} w={0.17} />
          <Caption text="Rückschläge" y={-0.12} />
          <Row items={[0, 1, 2, 3] as const} y={-0.17} value={s.returns} label={String} onSelect={(n) => setSetting("returns", n)} w={0.12} />
        </group>
      )}

      {s.menuTab === "slow" && (
        <group position={[0, y0, 0]}>
          <Caption text="Zeitlupe" y={0} />
          <Row items={BOOL} y={-0.05} value={s.slowMotion} label={onOff} onSelect={(b) => setSetting("slowMotion", b)} w={0.2} />
          <Caption text="Stärke" y={-0.1} />
          <Row items={SLOW_STRENGTHS} y={-0.145} value={s.slowStrength} label={(v) => `${String(v).replace(".", ",")}×`} onSelect={(v) => setSetting("slowStrength", v)} />
          <Caption text="Dauer nach Schlag" y={-0.195} />
          <Row items={DURATIONS} y={-0.24} value={s.slowDuration} label={(d) => SLOW_DURATIONS[d].label} onSelect={(d) => setSetting("slowDuration", d)} />
          <Caption text="Rotation in Echtzeit" y={-0.29} />
          <Row items={BOOL} y={-0.335} value={s.realtimeSpin} label={onOff} onSelect={(b) => setSetting("realtimeSpin", b)} w={0.2} />
        </group>
      )}

      {s.menuTab === "display" && (
        <group position={[0, y0, 0]}>
          {(
            [
              ["Schnitt-Text", "showSpinText"],
              ["Tempo", "showSpeed"],
              ["Spin-Wert", "showSpinValue"],
              ["Review", "showReview"],
            ] as const
          ).map(([t, key], i) => (
            <group key={key} position={[0, -i * 0.068, 0]}>
              <Caption text={t} x={-0.2} y={-0.01} />
              <group position={[0.15, 0, 0]}>
                <Row items={BOOL} y={-0.01} value={s[key]} label={onOff} onSelect={(b) => setSetting(key, b)} w={0.12} />
              </group>
            </group>
          ))}
          <Caption text="Tischhöhe" y={-0.29} />
          <Row items={TABLE_OFFSETS} y={-0.335} value={s.tableOffset} label={(v) => (v === 0 ? "0" : `${v > 0 ? "+" : "−"}${Math.round(Math.abs(v) * 100)}`)} onSelect={(v) => setSetting("tableOffset", v)} w={0.1} />
        </group>
      )}
    </group>
  );
}
