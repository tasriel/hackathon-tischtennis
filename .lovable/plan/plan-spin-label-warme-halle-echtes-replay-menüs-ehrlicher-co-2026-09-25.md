# Plan: Spin-Label, warme Halle, echtes Replay, Menüs, ehrlicher Coach, Review-Tabelle

## 1. Spin-Text über dem Ball
- Über dem fliegenden Ball wieder ein Label mit der aktuellen Spin-Art (Unterschnitt / Oberschnitt / Seitschnitt / ohne), folgt dem Ball, immer zur Kamera gedreht.

## 2. Halle wärmer und einladender
- Boden fast schwarz, matt, leichte Textur.
- Wände horizontal geteilt: oben Backsteinstruktur (warmes Rotbraun), unten dunkelgrüner Stoff; schmale Holzleiste als Trennung.
- Decke mit Holzbalken, warme Lichter (warmweiß) von oben, etwas wärmeres Umgebungslicht.
- Texturen prozedural (Canvas), keine neuen Pakete.

## 3. Review-Fenster als echtes Replay
- Replay-Kamera zeigt die komplette Umgebung (Halle, Tisch, Netz, Ziel, Schläger- und Ball-Modell) wie in der Live-Ansicht – aufgezeichnete Ball-/Schlägerpositionen werden abgespielt, darüber die Schlaglinien.
- Eigene Schlaglinie: schwarz (statt weiß/grau). Perfekte Linie bleibt grün.

## 4. Einstellungs-Menüs
- Beide Fenster links vom Spieler auf Seitenhöhe (nicht in Tischrichtung), so gedreht, dass man sie frontal sieht, wenn man sich um 90° nach links dreht (Blick Richtung −X, Fenster zeigen zum Spieler).
- Untereinander bzw. leicht nebeneinander, gut lesbare Distanz (~1,2 m).
- Button-Rahmen und Text gleich ausgerichtet (keine Eigenrotation der Rahmen).

## 5. Coach-Rückmeldung passt zur Abweichung
- Gesamtbewertung aus den Einzelabweichungen (Winkel, Tempo, Richtung): liegt ein Wert "weit daneben", ist das Feedback nie positiv; nur bei allen Werten im grünen Bereich positiv.
- Titel/Farbe des Feedbacks folgt dieser Bewertung.

## 6. Review-Tabelle
- Text nicht mehr links abgeschnitten (Labels linksbündig innerhalb der Spalte verankert, Panel-Breite berücksichtigt).
- Größere Schrift, kleinere Zeilenabstände.
- Zwei Spalten „Du“ | „Perfekt“, Zeilen nur Werte: Blattwinkel (°), Tempo (m/s), Richtung (°), ggf. Spin-Ergebnis.
- Tipp kurz und konkret, z. B. „Blatt 15° mehr öffnen · langsamer · mehr nach vorn“.

## Technische Details
- `Simulation.tsx`: Spin-Label an Ball-Position (Layer 0).
- `GymRoom.tsx`: Canvas-Texturen Backstein/Stoff, Holzbalken, warme Point-/Spotlights.
- `SpinOverlay.tsx`: im Replay Layer 0 nicht mehr deaktivieren; stattdessen Live-Ball/-Schläger während Replay ausblenden und Replay-Ghost-Modelle (SceneModel-Klone) auf Overlay-Layer zeigen; `USER`-Farbe → schwarz; Tabellen-Layout mit linksverankerten Labels (Label bekommt `anchor`-Option).
- `LeftMenu.tsx`: Positionen ca. `[-1.2, 1.2, 0.0]` / `[-1.2, 0.72, 0.0]` relativ zum Spielerstand, Rotation `[0, π/2, 0]`; Buttons ohne eigene Rotation.
- `coaching.ts`/`SpinOverlay.tsx`: gemeinsame `overallGrade` = schlechteste Einzelnote, steuert Text.
