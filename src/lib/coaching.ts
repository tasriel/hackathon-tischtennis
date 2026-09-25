// Regelbasierter Coach. Interpretiert Messwerte → ein kurzer Satz.
// Ziel: Unterschnitt mit Unterschnitt zurückspielen (Schupf).
// Später austauschbar gegen ein KI-Modell mit derselben Signatur.

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

export function coach(m: ShotMetrics): string {
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
