# Blass-oranger Ball als Zeitlupen-Signal

## Umsetzung
- Der Ball bleibt im normalen Spielzustand unverändert.
- Sobald die laufende Simulation tatsächlich in Zeitlupe ist, wird seine Grundfarbe deutlich blass orange eingefärbt.
- Die vorhandenen orangefarbenen und blauen Rotationsmuster bleiben vollständig sichtbar, damit Drehrichtung und Spin weiterhin eindeutig erkennbar sind.
- Beim weichen Übergang in und aus der Zeitlupe blendet auch die Ballfarbe weich zwischen Normalfarbe und Blassorange über; dadurch ist der verlangsamte Zustand klar, ohne abruptes Umschalten.
- Die gleiche Darstellung wird in Live-Ansicht und Replay verwendet, sofern der jeweils dargestellte Moment verlangsamt ist.

## Technische Details
- `BallModel` erhält den aktuellen Zeitfaktor und steuert ausschließlich Materialfarbe beziehungsweise Farbmischung; Geometrie, Mustertextur, Rotation und Physik bleiben unverändert.
- Der bestehende Zeitfaktor aus der Simulation wird als alleinige Quelle genutzt, damit Farbe und tatsächliche Zeitlupe synchron bleiben.
- Anschließend werden normale Geschwindigkeit, Zeitlupe und Rückkehr zu Echtzeit visuell im Browser geprüft; zusätzlich werden Build und Typprüfung kontrolliert.

## Nicht betroffen
- Spin-Berechnung, Flugkurve, Ballgeschwindigkeit und Coaching-Werte werden nicht verändert.
