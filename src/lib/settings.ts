import { useSyncExternalStore } from "react";
import type { ServeType } from "./constants";

export type TargetSpot = "left" | "center" | "right";
export const TARGET_X: Record<TargetSpot, number> = { left: -0.45, center: 0, right: 0.45 };

type Settings = { serve: ServeType; target: TargetSpot };

/** Kleiner Modul-Store für die Menü-Einstellungen (ohne React-State pro Frame). */
export const settings: Settings = { serve: "backspin", target: "center" };
const listeners = new Set<() => void>();
let version = 0;

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  if (settings[key] === value) return;
  settings[key] = value;
  version++;
  listeners.forEach((l) => l());
}

export function useSettings(): Settings {
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
    () => version,
  );
  return settings;
}
