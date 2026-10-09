import { useSyncExternalStore } from "react";
import type { RubberType, ServeType } from "./constants";
import type { SlowDuration } from "./timescale";

export type TargetSpot = "left" | "center" | "right";
export const TARGET_X: Record<TargetSpot, number> = { left: -0.45, center: 0, right: 0.45 };
export type TargetDepth = "short" | "long";
/** Ziel-z auf der Gegnerseite: kurz ≈ 40 cm hinter dem Netz, lang ≈ 25 cm vor der Grundlinie. */
export const TARGET_Z: Record<TargetDepth, number> = { short: -0.4, long: -1.37 + 0.25 };
export const SERIES_LENGTHS = [5, 10, 20] as const;
export type MenuTab = "ball" | "opponent" | "slow" | "display";

/** Stufen der Zeitlupen-Stärke (kleinster Zeitfaktor). */
export const SLOW_STRENGTHS = [0.5, 0.3, 0.15, 0.1] as const;
export type SlowStrength = (typeof SLOW_STRENGTHS)[number];
/** Feinjustierung der Tischhöhe in der Brille (m), gleicht ungenaue Bodenerkennung aus. */
export const TABLE_OFFSETS = [-0.05, 0, 0.05, 0.1, 0.15, 0.2] as const;
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
  menuOpen: boolean;
  menuTab: MenuTab;
  showReview: boolean;
  showSpinValue: boolean;
  targetDepth: TargetDepth;
  seriesLength: (typeof SERIES_LENGTHS)[number];
  /** laufende Serie: Anzahl gespielter Bälle, 0 = keine Serie */
  seriesActive: boolean;
  seriesDone: number;
  seriesSummaryVersion: number;
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
  menuOpen: false,
  menuTab: "ball",
  showReview: true,
  showSpinValue: false,
  targetDepth: "long",
  seriesLength: 10,
  seriesActive: false,
  seriesDone: 0,
  seriesSummaryVersion: 0,
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
