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
  /** Mindest-Spin (rad/s) des Rückballs, z.B. kräftiger Unterschnitt beim Schupf */
  minSpin?: number;
};
export type Rubber = {
  label: string;
  grip: number;
  restitution: number;
  spinKeep: number;
  /** Aufprall-Normaltempo (m/s), ab dem der ankommende Spin komplett geschluckt wird
   *  (Eindringen in den Belag). Ohne Wert: konstanter spinKeep. */
  spinDamp?: number;
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
export const OPPONENT_NET_GAP = 0.17;
export const RUBBERS: Record<RubberType, Rubber> = {
  smooth: {
    label: "Glatt", grip: 0.75, restitution: 0.45, spinKeep: 1, color: "#c0392b", targetZ: 0.95,
    vsBack: { stroke: "Schupf", open: [30, 65, 5], speed: [1.5, 5, 0.25], dir: [-35, 5, 5], typ: { open: 50, speed: 3, dir: -15 }, wantSpin: "BACKSPIN", minSpin: 110 },
    vsTop: { stroke: "Topspin (Konter)", open: [-35, 0, 5], speed: [1.5, 5, 0.25], dir: [5, 40, 5], typ: { open: -15, speed: 3, dir: 20 }, wantSpin: "TOPSPIN" },
  },
  longPips: {
    label: "lange Noppe", grip: 0.06, restitution: 0.35, spinKeep: 0.9, color: "#1f2937", targetZ: 0.85,
    vsBack: { stroke: "Schupf (Spin-Umkehr)", open: [10, 50, 5], speed: [0.5, 3.5, 0.25], dir: [-25, 5, 5], typ: { open: 30, speed: 1.5, dir: -10 }, wantSpin: null },
    vsTop: { stroke: "Schupf steil nach unten", open: [5, 50, 5], speed: [0.5, 3.5, 0.25], dir: [-55, -15, 5], typ: { open: 25, speed: 1.8, dir: -35 }, wantSpin: "BACKSPIN" },
  },
  shortPips: {
    label: "kurze Noppe", grip: 0.3, restitution: 0.4, spinKeep: 0.98, spinDamp: 60, color: "#2563eb", targetZ: 0.9,
    vsBack: { stroke: "Schupf (frontal)", open: [15, 55, 5], speed: [0.5, 3.2, 0.25], dir: [-35, 0, 5], typ: { open: 32, speed: 1.6, dir: -20 }, wantSpin: "BACKSPIN" },
    vsTop: { stroke: "Konter / Block (frontal)", open: [-25, 10, 5], speed: [0.5, 3.5, 0.25], dir: [0, 25, 5], typ: { open: -8, speed: 1.6, dir: 10 }, wantSpin: null },
  },
  // Anti: kaum Reibung ⇒ Rotation bleibt im Raum erhalten (Schnittumkehr), Tempo wird geschluckt.
  anti: {
    label: "Anti", grip: 0.015, restitution: 0.2, spinKeep: 0.9, color: "#a16207", targetZ: 0.45,
    vsBack: { stroke: "frontaler Schupf (offen)", open: [10, 50, 5], speed: [0.3, 3, 0.2], dir: [-15, 15, 5], typ: { open: 30, speed: 1.2, dir: 0 }, wantSpin: null },
    vsTop: { stroke: "frontaler Schupf (geschlossen)", open: [-35, 5, 5], speed: [0.3, 3, 0.2], dir: [-15, 15, 5], typ: { open: -20, speed: 1.2, dir: 0 }, wantSpin: "BACKSPIN" },
  },
};
