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
  sidespin: { pos: [0.1, TABLE.height + 0.3, -1.5], vel: [0.1, 1.7, 5.0], spin: [30, 130, 0] },
};
export const SERVE = SERVES.backspin;

// Zeitlupe
export const TIME_MIN = 0.1;
export const TIME_MAX = 1.0;
