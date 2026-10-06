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
/** Lehrbewegung des Gegners. Suchraster [min, max, Schritt]: Blattwinkel (°, + = offen),
 *  Schlägertempo (m/s), Schwungrichtung (°, + = nach oben). */
export type RubberStroke = {
  stroke: string;
  open: [number, number, number];
  speed: [number, number, number];
  dir: [number, number, number];
  typ: { open: number; speed: number; dir: number };
  wantSpin: "TOPSPIN" | "BACKSPIN" | null;
};
export type Rubber = {
  label: string;
  grip: number;
  restitution: number;
  spinKeep: number;
  color: string;
  /** Ziel-Aufsprung auf der Spielerseite (z, Abstand vom Netz) */
  targetZ: number;
  /** Bewegung gegen ankommenden Unterschnitt bzw. gegen Ober-/Seitschnitt */
  vsBack: RubberStroke;
  vsTop: RubberStroke;
};
/** Gegner spielt vorerst immer in die Vorhand des (rechtshändigen) Spielers. */
export const OPPONENT_TARGET_X = 0.38;
/** gewünschte Höhe über der Netzkante (m) – eher etwas höher als flach */
export const OPPONENT_NET_GAP = 0.28;
export const RUBBERS: Record<RubberType, Rubber> = {
  smooth: {
    label: "Glatt", grip: 0.4, restitution: 0.62, spinKeep: 1, color: "#c0392b", targetZ: 0.95,
    vsBack: { stroke: "Topspin", open: [-35, 10, 5], speed: [2, 4.5, 0.5], dir: [20, 70, 10], typ: { open: -15, speed: 3, dir: 45 }, wantSpin: "TOPSPIN" },
    vsTop: { stroke: "Konter / leichter Topspin", open: [-30, 5, 5], speed: [1, 3, 0.25], dir: [0, 35, 5], typ: { open: -12, speed: 1.8, dir: 15 }, wantSpin: "TOPSPIN" },
  },
  longPips: {
    label: "lange Noppe", grip: 0.06, restitution: 0.4, spinKeep: 0.9, color: "#1f2937", targetZ: 0.85,
    vsBack: { stroke: "Block (Spin-Umkehr)", open: [-10, 35, 5], speed: [0.1, 1.0, 0.15], dir: [-20, 20, 10], typ: { open: 10, speed: 0.4, dir: 0 }, wantSpin: null },
    vsTop: { stroke: "Block (Spin-Umkehr)", open: [-15, 30, 5], speed: [0.1, 1.0, 0.15], dir: [-20, 20, 10], typ: { open: 0, speed: 0.3, dir: 0 }, wantSpin: null },
  },
  shortPips: {
    label: "kurze Noppe", grip: 0.25, restitution: 0.5, spinKeep: 0.6, color: "#2563eb", targetZ: 0.9,
    vsBack: { stroke: "Schupf", open: [25, 60, 5], speed: [0.4, 1.8, 0.2], dir: [-20, 20, 10], typ: { open: 40, speed: 0.9, dir: 0 }, wantSpin: "BACKSPIN" },
    vsTop: { stroke: "Konter / Block", open: [-25, 10, 5], speed: [0.2, 1.6, 0.2], dir: [-10, 20, 5], typ: { open: -8, speed: 0.8, dir: 5 }, wantSpin: null },
  },
  anti: {
    label: "Anti", grip: 0.01, restitution: 0.3, spinKeep: 0.05, color: "#a16207", targetZ: 0.55,
    vsBack: { stroke: "passiver Block", open: [-10, 50, 5], speed: [0, 1.0, 0.1], dir: [-15, 25, 10], typ: { open: 15, speed: 0.2, dir: 0 }, wantSpin: null },
    vsTop: { stroke: "passiver Block", open: [-15, 45, 5], speed: [0, 1.0, 0.1], dir: [-15, 25, 10], typ: { open: 5, speed: 0.1, dir: 0 }, wantSpin: null },
  },
};
