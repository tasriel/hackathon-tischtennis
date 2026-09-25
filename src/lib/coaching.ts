// Regelbasiertes Coaching: Die Physik bestimmt, WAS passiert ist.
// Diese Schicht erklärt es in einem Satz. Später durch eine KI ersetzbar
// (gleiche Eingabe, gleicher Rückgabetyp).
import type { SpinType } from "./spin";

export type Outcome = "success" | "net" | "long" | "own" | "miss";

export interface HitMetrics {
  incomingSpin: SpinType;
  outgoingSpin: SpinType;
  openAngleDeg: number; // + = offen (nach oben), - = geschlossen
  forward: number; // m/s Richtung Gegner
  up: number; // m/s nach oben
  timing: "früh" | "optimal" | "spät";
}

export function describeMovement(m: HitMetrics) {
  const parts: string[] = [];
  if (m.forward > 0.4) parts.push("vorne");
  if (m.up > 0.3) parts.push("oben");
  if (m.up < -0.3) parts.push("unten");
  return parts.length ? parts.join(" + ") : "kaum";
}

export function coach(outcome: Outcome, m: HitMetrics | null): string {
  if (outcome === "miss" || !m) return "Ball verpasst – halte den Schläger früher in die Flugbahn.";
  if (outcome === "success") {
    if (m.outgoingSpin === "ÜBERSCHNITT") return "Stark! Die Aufwärtsbewegung hat den Unterschnitt in Überschnitt verwandelt.";
    if (m.openAngleDeg > 20) return "Guter Winkel. Mehr Aufwärtsbewegung erzeugt mehr Überschnitt.";
    return "Getroffen! Probiere, den Schläger bewusst etwas mehr zu öffnen.";
  }
  if (outcome === "net") {
    if (m.openAngleDeg < 20) return "Unterschnitt zieht den Ball nach unten – öffne den Schläger (ca. 30–45°).";
    return "Guter Winkel – schwinge zusätzlich nach vorne-oben, um den Ball übers Netz zu heben.";
  }
  if (outcome === "long") {
    if (m.openAngleDeg > 50) return "Zu weit geöffnet – schließe den Schläger etwas.";
    return "Zu viel Tempo – schwinge ruhiger und mehr nach oben als nach vorne.";
  }
  return "Der Ball muss auf die andere Seite – schwinge mehr nach vorne.";
}
