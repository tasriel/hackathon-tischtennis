// Regelbasierter Coach. Interpretiert Messwerte → ein kurzer Satz.
// Später austauschbar gegen ein KI-Modell mit derselben Signatur.

export type ShotResult = "success" | "net" | "out" | "own" | "miss";

export type ShotMetrics = {
  incomingSpin: string;
  outgoingSpin: string;
  openDeg: number; // + = offen (Blatt nach oben geneigt)
  upSpeed: number; // m/s
  forwardSpeed: number; // m/s Richtung Gegner
  result: ShotResult;
};

export function describe(m: ShotMetrics): string {
  const angle = `${Math.abs(Math.round(m.openDeg))}° ${m.openDeg >= 0 ? "offen" : "geschlossen"}`;
  const mv: string[] = [];
  if (m.upSpeed > 0.5) mv.push("aufwärts");
  if (m.upSpeed < -0.5) mv.push("abwärts");
  if (m.forwardSpeed > 0.5) mv.push("vorwärts");
  const move = mv.length ? mv.join(" + ") : "kaum Bewegung";
  return `Rein: ${m.incomingSpin} · Winkel: ${angle} · ${move} · Raus: ${m.outgoingSpin}`;
}

export function coach(m: ShotMetrics): string {
  switch (m.result) {
    case "miss":
      return "Verfehlt – halte das Blatt dorthin, wo der Ball hinfliegt.";
    case "net":
    case "own":
      if (m.openDeg < 15) return "Schläger weiter öffnen – der Unterschnitt zieht den Ball nach unten.";
      return "Mehr Bewegung nach oben, um den Unterschnitt aufzuheben.";
    case "out":
      if (m.openDeg > 50) return "Schläger etwas schließen – der Ball steigt zu stark.";
      return "Weniger Tempo nach vorne – kürzer und kontrollierter.";
    case "success":
      if (m.upSpeed > 1) return "Stark! Die Aufwärtsbewegung erzeugt Topspin.";
      return "Guter Winkel. Mehr Aufwärtsbewegung erzeugt mehr Topspin.";
  }
}
