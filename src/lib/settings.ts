import { useSyncExternalStore } from "react";
import type { RubberType, ServeType } from "./constants";
import type { SlowDuration } from "./timescale";

export type TargetSpot = "left" | "center" | "right";
export const TARGET_X: Record<TargetSpot, number> = { left: -0.45, center: 0, right: 0.45 };

/** Stufen der Zeitlupen-Stärke (kleinster Zeitfaktor). */
export const SLOW_STRENGTHS = [0.5, 0.3, 0.15, 0.1] as const;
export type SlowStrength = (typeof SLOW_STRENGTHS)[number];
/** Feinjustierung der Tischhöhe in der Brille (m), gleicht ungenaue Bodenerkennung aus. */
export const TABLE_OFFSETS = [-0.05, 0, 0.05, 0.1] as const;
export type TableOffset = (typeof TABLE_OFFSETS)[number];

type Settings = {
  serve: ServeType;
  target: TargetSpot;
  rubber: RubberType;
  reviewIndex: number;
  reviewCount: number;
  returns: 0 | 1 | 2 | 3;
  slowMotion: boolean;
  slowStrength: SlowStrength;
  slowDuration: SlowDuration;
  realtimeSpin: boolean;
  showSpinText: boolean;
  showSpeed: boolean;
  tableOffset: TableOffset;
};

/** Kleiner Modul-Store für die Menü-Einstellungen (ohne React-State pro Frame). */
export const settings: Settings = {
  serve: "backspin",
  target: "center",
  rubber: "smooth",
  reviewIndex: 0,
  reviewCount: 0,
  returns: 1,
  slowMotion: true,
  slowStrength: 0.15,
  slowDuration: "medium",
  realtimeSpin: false,
  showSpinText: true,
  showSpeed: true,
  tableOffset: 0,
};
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
