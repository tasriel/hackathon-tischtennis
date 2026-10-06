# Gegner-Anpassungen (Runde 2)

## Fenster
- Review-Fenster wandert nach links, neben die Platte (seitlich auf Tischhöhe, zum Spieler gedreht), etwas größer skaliert, damit die Schrift trotz Abstand gut lesbar bleibt.
- Die drei Einstellungsfenster (Schnitt-Variante, Target, Belag Gegner) rücken weiter nach links/hinten, damit sie das Review-Fenster nicht verdecken.

## Gegner-Rückschlag
- Gegner spielt immer in die Vorhand des Spielers.
- Jeder Ball, der auf der Gegnerseite aufkommt, wird zurückgespielt: Ist kein "schöner" Schlag möglich, wird der Ball garantiert mit einer passenden Ersatzbewegung zurückgespielt (Ball wird auf eine sichere Flugbahn gebracht).
- Flugkurve: Höchster Punkt im Normalfall etwas oberhalb der Netzhöhe (ca. 20–30 cm über Netzkante) – mit schlagtypischer Bewegung, nicht pauschal von unten.
- Allgemein weniger Abschusstempo, mehr Spin-Aufnahme (Physik in der Schlägerberechnung prüfen und Belag-Werte neu abstimmen).

## Schlagtechnik des Gegners pro Belag
| Belag | Ankommend Ober-/Seitschnitt | Ankommend Unterschnitt |
|---|---|---|
| Glatt | Topspin (gemäßigt, konterartig – leicht zu returnieren) | Schupf |
| Lange Noppe | Schupf, steilere Bewegung nach unten (ergibt Unterschnitt) | Schupf (ergibt leichten Oberschnitt / leer) |
| Kurze Noppe | Konter, leichte Topspin-Bewegung, frontaler Treffpunkt | Schupf, leicht frontal |
| Anti | frontaler Schupf, Schläger relativ stark geschlossen | frontaler Schupf, Schläger offener |

- Noppen: deutlich langsamer, Ball "tropft ab".
- Anti: Ball fast ohne Tempo und praktisch ohne Spin; nach dem Aufsprung bleibt er nahezu in der Luft stehen.

## Sichtbare Gegner-Bewegung
- Kein Teleportieren: Schläger fährt aus einer Grundposition in einer durchgehenden Bewegung (Ausholen → Treffer → Ausschwung → zurück) zum Treffpunkt.
- Handgelenk dreht sich sichtbar mit: Schlägerwinkel öffnet/schließt sich passend zum Schlag schon in der Ausholphase, damit der Spieler den Schlag vorhersehen kann.

## Review
- Die vorgeschlagene "perfekte" Bewegung richtet sich nach dem tatsächlichen Spin des Balls direkt vor dem jeweiligen Schlag (nicht nach der Schnitt-Variante). Beispiel: Unterschnitt eingespielt → Schupf → lange Noppe schupft → Ball kommt mit Oberschnitt/leer → perfekt: Topspin.

## Testanzeige
- Über dem Spin-Text am Ball: aktuelle Ballgeschwindigkeit in km/h mit einer Nachkommastelle (z. B. "23,4 km/h").

## Technische Details
- `constants.ts`: RUBBERS neu abstimmen (Stroke-Raster open/speed/dir je Belag × ankommendem Spin gemäß Tabelle; Anti restitution/spinKeep sehr klein); OPPONENT_TARGET_X Vorhand fix; Zielscheitel netHeight + ~0,25 m.
- `physics.ts`: Racket-Kontakt prüfen – tangentiale Reibung stärker in Spin, normale Restitution niedriger; Test-Sweep mit korrekter Spin-Richtung (+x = Topspin bei +z-Flug).
- `opponent.ts`: `rate()` bevorzugt Scheitel über Netz statt flach; Fallback garantiert Rückschlag (override-Geschwindigkeit/Spin berechnet via Wurfparabel auf Vorhand-Ziel).
- `Simulation.tsx`: Gegner-Pose als Kurve über Zeit (Start-, Aushol-, Treffer-, Ausschwungpose, gleichmäßig interpoliert, Quaternion-Slerp für Handgelenk), Start beim Aufsprung auf Gegnerseite; Speed-Label über Spin-Label.
- `coaching.ts`/`SpinOverlay.tsx`: Ideal-Schlag aus spinType des Balls im Kontakt-Snapshot ableiten.
- Positionen in `SpinOverlay.tsx` (Review) und `LeftMenu.tsx` (Menüs) verschieben; Verifikation per Test-Sweep, Typprüfung und Browser-Check.
