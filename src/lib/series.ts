/** Ballserie: Werte je Ball sammeln und auswerten (nur in der Sitzung, ohne Speicherung). */
export type SeriesBall = {
  /** Ball vom Schläger getroffen */
  hit: boolean;
  /** Ball regelkonform auf der Gegnerseite */
  legal: boolean;
  /** Zielscheibe getroffen */
  target: boolean;
  /** Ausgangstempo nach deinem Schlag (km/h) */
  speedKmh: number;
  /** Drehzahl nach deinem Schlag (U/s) */
  spinRps: number;
  /** Schnittart wie empfohlen */
  rightSpin: boolean;
  /** schlechteste Einzelabweichung zur idealen Technik, 0 = perfekt, 1 = deutlich daneben */
  deviation: number;
};

export type SeriesSummary = {
  count: number;
  avgSpeedKmh: number;
  avgSpinRps: number;
  rightSpinRate: number;
  hitRate: number;
  legalRate: number;
  targetRate: number;
  grade: "Sehr gut" | "Solide" | "Üben";
};

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function summarizeSeries(balls: SeriesBall[]): SeriesSummary {
  const n = balls.length;
  const hits = balls.filter((b) => b.hit);
  const rate = (k: (b: SeriesBall) => boolean) => (n ? balls.filter(k).length / n : 0);
  const legalRate = rate((b) => b.legal);
  const dev = hits.length ? avg(hits.map((b) => b.deviation)) : 1;
  const grade = legalRate >= 0.7 && dev < 0.35 ? "Sehr gut" : legalRate >= 0.4 && dev < 0.7 ? "Solide" : "Üben";
  return {
    count: n,
    avgSpeedKmh: avg(hits.map((b) => b.speedKmh)),
    avgSpinRps: avg(hits.map((b) => b.spinRps)),
    rightSpinRate: hits.length ? hits.filter((b) => b.rightSpin).length / hits.length : 0,
    hitRate: hits.length / Math.max(n, 1),
    legalRate,
    targetRate: rate((b) => b.target),
    grade,
  };
}

/** Modulspeicher der laufenden Serie. */
export const series = { balls: [] as SeriesBall[], summary: null as SeriesSummary | null };

/** Drehzahl in Umdrehungen pro Sekunde aus Winkelgeschwindigkeit (rad/s). */
export const toRps = (radPerSec: number) => radPerSec / (2 * Math.PI);
