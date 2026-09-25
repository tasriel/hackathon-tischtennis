// Regelbasierter Coach. Interpretiert Messwerte → ein kurzer Satz.
// Ziel je Einspiel-Variante: Unterschnitt → Schupf, Ober-/Seitschnitt → Topspin.
// Später austauschbar gegen ein KI-Modell mit derselben Signatur.
import type { ServeType } from "./constants";
import { STROKES } from "./strokes";

export type ShotResult = "success" | "net" | "out" | "own" | "miss";

export type ShotMetrics = {
  incomingSpin: string;
  outgoingSpin: string;
  openDeg: number; // + = offen (Blatt nach oben geneigt)
  upSpeed: number; // m/s (Simulationszeit)
  forwardSpeed: number; // m/s Richtung Gegner
  result: ShotResult;
};

export function describe(m: ShotMetrics): string {
  const angle = `${Math.abs(Math.round(m.openDeg))}° ${m.openDeg >= 0 ? "offen" : "geschlossen"}`;
  const mv: string[] = [];
  if (m.forwardSpeed > 0.5) mv.push("vorwärts");
  if (m.upSpeed > 0.5) mv.push("aufwärts");
  if (m.upSpeed < -0.3) mv.push("abwärts");
  const move = mv.length ? mv.join(" + ") : "kaum Bewegung";
  return `Rein: ${m.incomingSpin} · Winkel: ${angle} · ${move} · Raus: ${m.outgoingSpin}`;
}

export function coach(m: ShotMetrics, serve: ServeType = "backspin"): string {
  const spec = STROKES[serve];
  if (spec.stroke === "Schupf") {
    switch (m.result) {
      case "miss":
        return "Verfehlt – halte das Blatt dorthin, wo der Ball hinfliegt.";
      case "net":
      case "own":
        if (m.openDeg < 25) return "Blatt weiter öffnen – der Unterschnitt drückt den Ball nach unten.";
        return "Mehr nach vorne schieben – unter dem Ball durchbürsten.";
      case "out":
        if (m.openDeg > 65) return "Blatt etwas schließen – der Ball steigt zu stark.";
        return "Weniger Tempo – ein Schupf ist kurz und ruhig.";
      case "success":
        if (m.outgoingSpin === "BACKSPIN") return "Sauberer Schupf! Der Belag reibt unter dem Ball → Unterschnitt zurück.";
        return "Drüber, aber ohne Unterschnitt – Blatt offener, nach vorn-unten bürsten.";
    }
  }
  // Topspin gegen Ober- oder Seitschnitt
  const side = serve === "sidespin";
  switch (m.result) {
    case "miss":
      return "Verfehlt – früh ausholen, Schläger unter Ballhöhe starten.";
    case "net":
    case "own":
      if (m.upSpeed < 0.8) return "Mehr von unten nach oben ziehen – der Ball braucht Bogen.";
      return side ? "Blatt etwas öffnen – der Seitschnitt zieht den Ball nach unten." : "Mehr nach vorn durchziehen, nicht nur nach oben.";
    case "out":
      if (m.openDeg > -10) return side ? "Blatt stärker schließen – sonst springt der Ball ab." : "Blatt schließen – Oberschnitt lässt den Ball steigen.";
      return "Weniger Tempo nach vorn, mehr bürsten statt schlagen.";
    case "success":
      if (m.outgoingSpin === "TOPSPIN") return "Starker Topspin! Der Belag bürstet oben am Ball → Vorwärtsdrall.";
      return "Drüber, aber ohne Topspin – Blatt geschlossen, schneller nach oben bürsten.";
  }
}
