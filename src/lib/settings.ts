import { useSyncExternalStore } from "react";
import { BALL_RADIUS, RACKET_RADIUS, type RubberType, type ServeType } from "./constants";
import type { SlowDuration } from "./timescale";

export type TargetSpot = "left" | "center" | "right";
export const TARGET_X: Record<TargetSpot, number> = { left: -0.45, center: 0, right: 0.45 };
export type TargetDepth = "short" | "long";
/** Ziel-z auf der Gegnerseite: kurz ≈ 40 cm hinter dem Netz, lang ≈ 25 cm vor der Grundlinie. */
export const TARGET_Z: Record<TargetDepth, number> = { short: -0.4, long: -1.37 + 0.25 };
/** Zielscheiben-Radius inkl. äußerer Ringe + Ballradius (Durchmesser = 4 × Schlägerradius). */
export const TARGET_HIT_RADIUS = RACKET_RADIUS * 2 + BALL_RADIUS;
export function isTargetHit(x: number, z: number, tx: number, tz: number): boolean {
  return Math.hypot(x - tx, z - tz) <= TARGET_HIT_RADIUS;
}
export const SERIES_LENGTHS = [5, 10, 20] as const;
export type MenuTab = "ball" | "opponent" | "slow" | "display";

/** Stufen der Zeitlupen-Stärke (kleinster Zeitfaktor). */
export const SLOW_STRENGTHS = [0.5, 0.3, 0.15, 0.1] as const;
export type SlowStrength = (typeof SLOW_STRENGTHS)[number];
/** Feinjustierung der Tischhöhe in der Brille (m), gleicht ungenaue Bodenerkennung aus. */
export const TABLE_OFFSETS = [-0.05, 0, 0.05, 0.1, 0.15, 0.2] as const;
export type TableOffset = (typeof TABLE_OFFSETS)[number];
/** Positive Werte drehen den Griff nach unten und das Blatt nach oben. */
export const DEFAULT_GRIP_ANGLE_DEG = 30;
export const GRIP_ANGLE_MIN_DEG = 0;
export const GRIP_ANGLE_MAX_DEG = 60;
export const GRIP_ANGLE_STEP_DEG = 2;
export const CALIBRATION_STORAGE_KEY = "spin-correct:calibration-v1";

type CalibrationStorage = Pick<Storage, "getItem" | "setItem">;

export function clampGripAngle(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_GRIP_ANGLE_DEG;
  return Math.min(GRIP_ANGLE_MAX_DEG, Math.max(GRIP_ANGLE_MIN_DEG, Math.round(value)));
}

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
  gripAngleDeg: number;
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
  gripAngleDeg: DEFAULT_GRIP_ANGLE_DEG,
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

function isTableOffset(value: unknown): value is TableOffset {
  return typeof value === "number" && TABLE_OFFSETS.some((offset) => offset === value);
}

function saveCalibration(storage: CalibrationStorage) {
  storage.setItem(
    CALIBRATION_STORAGE_KEY,
    JSON.stringify({ gripAngleDeg: settings.gripAngleDeg, tableOffset: settings.tableOffset }),
  );
}

/** Lädt nur persönliche XR-Kalibrierungen; alle Trainingswerte bleiben flüchtig. */
export function loadCalibration(storage: CalibrationStorage): boolean {
  try {
    const raw = storage.getItem(CALIBRATION_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { gripAngleDeg?: unknown; tableOffset?: unknown };
    settings.gripAngleDeg = clampGripAngle(
      typeof parsed.gripAngleDeg === "number" ? parsed.gripAngleDeg : DEFAULT_GRIP_ANGLE_DEG,
    );
    settings.tableOffset = isTableOffset(parsed.tableOffset) ? parsed.tableOffset : 0;
    version++;
    listeners.forEach((listener) => listener());
    return true;
  } catch {
    return false;
  }
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  if (key === "gripAngleDeg") value = clampGripAngle(value as number) as Settings[K];
  if (settings[key] === value) return;
  settings[key] = value;
  if ((key === "gripAngleDeg" || key === "tableOffset") && typeof window !== "undefined") {
    try {
      saveCalibration(window.localStorage);
    } catch {
      // Private Browsermodi dürfen die Kalibrierung ablehnen, ohne das Training zu blockieren.
    }
  }
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
