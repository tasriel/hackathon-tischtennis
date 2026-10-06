# Anpassungen #4: Echtzeit-Physik, Zeitlupe, Spin-Anzeige und Konter-Empfehlung

## 1. Rückschläge: auch „0“
- Das Fenster „Rückschläge“ bekommt die Option **0** (neben 1, 2, 3), Desktop-Taste ergänzt.
- Bei 0 spielt der Gegner nicht zurück: Einspielen → du schlägst → Ende (Review zeigt nur diesen Schlag).

## 2. Ohne Slow-Motion zu schnell – Physik gründlich prüfen
Ursache noch nicht bestätigt; erster Schritt ist eine Messung, dann die Korrektur.
- Alle Umrechnungen Echtzeit ↔ Simulationszeit prüfen: Schlägertempo-Messung, Zeitlupen-Verstärkung der Armbewegung, Handgelenk-Anteil, Physik-Schrittweite, Ballrotation, Gegner-Animation, Nach-Treffer-Pause.
- Reproduzierbarer Messlauf: gleicher Einspielball und gleiche Schlagbewegung einmal mit, einmal ohne Zeitlupe; verglichen werden Flugzeit, Balltempo (km/h) und Landepunkt. Ergebnis muss physikalisch identisch sein – nur das Abspieltempo darf sich unterscheiden.
- Realistische Ballmaschinen-Tempi gegenprüfen (Einspielball ca. 15–25 km/h, Flugzeit über die Platte realistisch). Falls die Grundwerte für Zeitlupe überhöht wurden, werden sie auf Echtzeit-Werte zurückgesetzt, sodass beide Modi stimmen.

## 3. Zeitlupe spätestens vor Plattenende
- Zusätzlich zum Start kurz vor dem Scheitelpunkt: Erreicht der Ball kurz vor der Tischkante auf deiner Seite, startet die Zeitlupe sofort (für lange Bälle). Es gilt der frühere der beiden Auslöser; weiterhin einmal pro Anflug.

## 4. Unterschnitt des Spielers fliegt zu schnell/hoch
- Schupf-Kontakt prüfen: Rückprall bei offenem Blatt, Reibungsanteil und das Tempo-Limit nach dem Treffer (bisher bis zu 9 m/s). Ziel: typischer Schupf mit ca. 3–5 m/s, flacher Bogen, kräftiger Unterschnitt.
- Auftrieb durch Unterschnitt (Magnus) prüfen, damit der Ball nicht unrealistisch steigt.

## 5. Frontaler Treffer schießt nach hinten weg
- Rückprall bei geschlossenem bzw. senkrechtem Blatt prüfen (Energie aus ankommendem Ball + Schlägertempo).
- Luftwiderstand und Spin-Abbau in der Luft gegen reale Werte prüfen (Tischtennisball verliert deutlich Tempo), Magnus-Stärke abgleichen. Werte so anpassen, dass ein harter Ball spürbar abbremst.
- Physiktests: frontaler Block/Konter bei mehreren Tempi, mit Landepunkt und Endtempo.

## 6. Seitschnitt-Text nur bei klarem Überwiegen
- „Seitschnitt“ erscheint nur, wenn der Seitschnitt deutlich stärker ist als Ober-/Unterschnitt (z. B. mindestens 1,5-fach) und eine Mindeststärke hat; sonst wird Topspin/Unterschnitt angezeigt.

## 7. Neue Review-Empfehlung: Konter/Schuss bei kurzem Ball
- Kommt der Ball knapp hinter dem Netz auf (kurzer, hoch abspringender Ball), empfiehlt das Review keinen Topspin, sondern **„Konter / Schuss“**: früh hoch ansetzen, Blatt leicht geschlossen, frontal und schnell nach vorn durch den Ball, optional kleiner Handgelenkschwung.
- Eigene grüne Ideallinie, Winkel-/Tempo-/Richtungswerte und kurzer Tipp, z. B. „Früh hoch ansetzen, frontal durchschlagen.“

## Technische Details
- `settings.ts` / `LeftMenu.tsx`: `returns: 0|1|2|3`, Button 0; `Simulation.tsx` beendet bei 0 nach dem ersten Treffer.
- `physics.ts`: `slowmoBoost`, `racketPointVel`, `collideRacket` (Restitution, Reibung, Tempo-Limit), `stepBall` (DRAG, MAGNUS, Spin-Abbau); `constants.ts` Einspielwerte.
- `Simulation.tsx` Frame-Loop: Messung von Schläger-/Handgeschwindigkeit pro Echtzeit-Frame vs. Simulationsschritt, Gegner-Animation-Zeitbasis.
- `timescale.ts`: zusätzlicher Auslöser über Ball-z nahe Tischende (Spielerseite), nur nach erstem Aufprall bzw. als Fallback davor.
- Spin-Label in `Simulation.tsx` (aktuell Faktor 0,8) auf strengere Schwelle.
- `idealShot.ts` / `strokes.ts` / `SpinOverlay.tsx`: neue Bewegung `COUNTER_SHORT` mit Auswahl nach Aufsprungpunkt (z. B. ≤ ca. 40 cm hinter dem Netz).

## Prüfung
- Bun-Physiktests: Zeitlupe An/Aus identische Flugbahn; Schupf-, Konter-, Topspin-Sweeps mit Tempo und Landepunkt.
- Browser: Rückschläge 0–3, Zeitlupe mit langem Ball, Spin-Text bei leichtem Seitschnitt, Review-Empfehlung bei kurzem Ball. Headset-Test bleibt offen.
