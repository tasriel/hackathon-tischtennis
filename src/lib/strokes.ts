// Erwarteter Schlag je Einspiel-Variante (Technik-Referenz).
// Schupf: Blatt offen ~40–50°, kurz, ruhig nach vorn(-unten), Ball unten treffen.
// Topspin: Blatt geschlossen, Bewegung von unten nach oben-vorn, Ball hinten-oben bürsten;
// gegen Oberschnitt Blatt stärker schließen und mehr nach vorn.
import type { ServeType } from "./constants";

export type StrokeName = "Schupf" | "Topspin";

export type StrokeSpec = {
  serveLabel: string;
  stroke: StrokeName;
  wantSpin: "BACKSPIN" | "TOPSPIN";
  /** Suchraster für die Idealbewegung */
  open: [number, number, number];
  speed: [number, number, number];
  dir: [number, number, number];
  /** Standard-Idealwerte, bevor ein Treffer berechnet wurde */
  fallback: { openDeg: number; speed: number; dirDeg: number };
  tip: string;
};

export const STROKES: Record<ServeType, StrokeSpec> = {
  backspin: {
    serveLabel: "Unterschnitt",
    stroke: "Schupf",
    wantSpin: "BACKSPIN",
    open: [25, 70, 5],
    speed: [0.6, 3.4, 0.4],
    dir: [-30, 20, 10],
    fallback: { openDeg: 45, speed: 1.8, dirDeg: -5 },
    tip: "Blatt offen, kurz und ruhig unter dem Ball nach vorn schieben.",
  },
  topspin: {
    serveLabel: "Oberschnitt",
    stroke: "Topspin",
    wantSpin: "TOPSPIN",
    open: [-45, -5, 5],
    speed: [1.5, 5.5, 0.5],
    dir: [0, 50, 10],
    fallback: { openDeg: -25, speed: 3, dirDeg: 15 },
    tip: "Blatt geschlossen, mehr nach vorn als nach oben durchziehen.",
  },
  sidespin: {
    serveLabel: "Seitschnitt",
    stroke: "Topspin",
    wantSpin: "TOPSPIN",
    open: [-35, 0, 5],
    speed: [1.5, 5.5, 0.5],
    dir: [10, 60, 10],
    fallback: { openDeg: -15, speed: 2.5, dirDeg: 40 },
    tip: "Blatt leicht geschlossen, von unten nach oben bürsten, Seitendrall ausgleichen.",
  },
};
