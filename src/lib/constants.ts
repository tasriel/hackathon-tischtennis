// Alle Maße in Metern / Sekunden. Zentrale Stellschrauben.
export const TABLE = {
  length: 2.74,
  width: 1.525,
  height: 0.76,
  netHeight: 0.1525,
};

export const BALL_RADIUS = 0.02;
export const GRAVITY = -9.81;
export const DRAG = 0.12; // Luftwiderstand (a = -DRAG * |v| * v)
export const MAGNUS = 0.004; // a = MAGNUS * (spin × v)
export const TABLE_RESTITUTION = 0.88;
export const TABLE_FRICTION = 0.18; // Coulomb-Reibwert Ball–Tisch

// Schläger (glatter Belag)
export const RACKET_RADIUS = 0.085; // Trefferzone der Blattfläche
export const RACKET_RESTITUTION = 0.8;
export const RACKET_GRIP = 0.55; // Reibung Belag–Ball (tangential), griffiger Belag
export const ARM_REACH = 0.75; // max. Abstand Schulter → Schläger

// Spieler steht hinter dem Tischende (z positiv), Blick Richtung -z
export const PLAYER_Z = 1.95;
export const CONTACT_Z = 1.55; // erwartete Treffzone

// Einspiel-Varianten. spin in rad/s; x<0 = Unterschnitt, x>0 = Oberschnitt bei Flug Richtung +z,
// y = Seitschnitt (Drehung um die senkrechte Achse).
export type ServeType = "backspin" | "topspin" | "sidespin";
type Serve = { pos: readonly [number, number, number]; vel: readonly [number, number, number]; spin: readonly [number, number, number] };
export const SERVES: Record<ServeType, Serve> = {
  backspin: { pos: [0.25, TABLE.height + 0.3, -1.5], vel: [0.0, 1.5, 5.0], spin: [-150, 0, 0] },
  topspin: { pos: [0.25, TABLE.height + 0.3, -1.5], vel: [0.0, 2.2, 5.2], spin: [130, 0, 0] },
  sidespin: { pos: [0.1, TABLE.height + 0.3, -1.5], vel: [0.1, 2.2, 5.0], spin: [60, 120, 0] },
};
export const SERVE = SERVES.backspin;

// Zeitlupe
export const TIME_MIN = 0.1;
export const TIME_MAX = 1.0;

// Beläge des Gegners. grip = Reibung Belag–Ball, restitution = Rückprall, spinKeep = Anteil des
// ankommenden Spins, der den Kontakt übersteht (wenig Reibung ⇒ Spin bleibt in Weltrichtung ⇒ Spin-Umkehr).
export type RubberType = "smooth" | "longPips" | "shortPips" | "anti";
export type Rubber = {
  label: string;
  stroke: string;
  grip: number;
  restitution: number;
  spinKeep: number;
  color: string;
  /** Suchraster [min, max, Schritt] und typische Werte der Lehrbewegung */
  open: [number, number, number];
  speed: [number, number, number];
  dir: [number, number, number];
  typ: { open: number; speed: number; dir: number };
  wantSpin: "TOPSPIN" | "BACKSPIN" | null;
};
export const RUBBERS: Record<RubberType, Rubber> = {
  smooth: {
    label: "Glatt", stroke: "Topspin", grip: 0.55, restitution: 0.8, spinKeep: 1, color: "#c0392b",
    open: [-35, -5, 5], speed: [2.5, 5.5, 0.5], dir: [10, 50, 10], typ: { open: -20, speed: 4, dir: 30 }, wantSpin: "TOPSPIN",
  },
  longPips: {
    label: "lange Noppe", stroke: "Block (Spin-Umkehr)", grip: 0.08, restitution: 0.55, spinKeep: 0.9, color: "#1f2937",
    open: [-10, 35, 5], speed: [0.3, 2.1, 0.3], dir: [-20, 10, 10], typ: { open: 5, speed: 0.9, dir: 0 }, wantSpin: null,
  },
  shortPips: {
    label: "kurze Noppe", stroke: "flacher Konter", grip: 0.3, restitution: 0.85, spinKeep: 0.6, color: "#2563eb",
    open: [-20, 15, 5], speed: [2, 5.5, 0.5], dir: [-5, 20, 5], typ: { open: -5, speed: 3.5, dir: 5 }, wantSpin: null,
  },
  anti: {
    label: "Anti", stroke: "passiver Block", grip: 0.03, restitution: 0.45, spinKeep: 0.35, color: "#a16207",
    open: [-5, 40, 5], speed: [0.2, 1.4, 0.3], dir: [-15, 5, 10], typ: { open: 10, speed: 0.5, dir: 0 }, wantSpin: null,
  },
};
