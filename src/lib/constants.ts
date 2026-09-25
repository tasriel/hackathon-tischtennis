// Zentrale Maße und Tuning-Werte. Einheiten: Meter, Sekunden, rad/s.
// Koordinaten: Spieler steht bei z ≈ 0, Blick Richtung -z (zum Tisch).

// --- Tisch (Normmaße) ---
export const TABLE_L = 2.74;
export const TABLE_W = 1.525;
export const TABLE_H = 0.76;
export const TABLE_NEAR_Z = -0.6; // Tischkante auf Spielerseite
export const TABLE_FAR_Z = TABLE_NEAR_Z - TABLE_L;
export const NET_Z = TABLE_NEAR_Z - TABLE_L / 2;
export const NET_H = 0.1525;
export const NET_OVERHANG = 0.1525;

// --- Ball ---
export const BALL_R = 0.02;

// --- Schläger ---
export const BLADE_R = 0.08; // halbe Blattbreite (Kollision)
// Blattmitte relativ zum Controller-Griff (lokale Koordinaten)
export const BLADE_OFFSET: [number, number, number] = [0, 0, -0.13];

// --- Physik (lehrreich getunt, nicht exakt) ---
export const G = 9.81;
export const DRAG_K = 0.12; // a = -k |v| v
export const MAGNUS_K = 0.004; // a = k (w × v)
export const SPIN_DECAY = 0.2;
export const TABLE_RESTITUTION = 0.88;
export const TABLE_GRIP = 0.22;
export const RACKET_RESTITUTION = 0.8;
export const RACKET_GRIP = 0.4; // glatter Belag: Ball "rollt" am Belag ab
export const SUBSTEP = 1 / 240;

// --- Aufschlag: mittlerer Unterschnitt ---
export const SERVE_POS: [number, number, number] = [0.05, 0.98, TABLE_FAR_Z + 0.1];
export const SERVE_VEL: [number, number, number] = [0, 0.9, 4.6];
export const SERVE_SPIN: [number, number, number] = [-90, 0, 0]; // -x = Unterschnitt bei Flug Richtung +z

// --- Zeitlupe ---
export const SLOWMO_MIN = 0.1;
export const HIT_ZONE_Z = TABLE_NEAR_Z + 0.25; // wo der Ball ca. getroffen wird
export const AUTO_RESTART_S = 3.5;
