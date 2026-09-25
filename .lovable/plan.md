# Fixes + Becher-Pyramide + "Perfekter Schlag" im Overlay

## Fixes

### 1. Ruckeln nach dem Treffer
Ursache im Code: Der Ball wird nur an festen Physikschritten (1/240 s) gezeichnet. In der Zeitlupe (0,02× Freeze) kommt nur alle paar Bilder ein Schritt, also springt der Ball. Außerdem springt die Zeitlupe nach dem Freeze hart von 0,02× auf den normalen Wert.
- Ballposition und -drehung zwischen zwei Physikschritten weich interpolieren (auch bei 0,02× flüssig).
- Übergang nach dem Kontakt weich: kurzer Freeze, dann über ~0,5 s sanft beschleunigen statt sprunghaft.

### 2. Overlay: Schlag 3 s lang ansehen
- Beim Treffer wird eine komplette Momentaufnahme gespeichert: Schlägerposition, Blattwinkel, Schwung-Pfeil (grün), Spin vorher/nachher, Geschwindigkeiten, Zeitlupe.
- Die Nahaufnahme bleibt ~3 s (Echtzeit) auf diesem Moment stehen: Kamera, Schläger-Geist (halbtransparent), grüner Pfeil und alle Zahlen zeigen den Kontakt-Zeitpunkt. Hinweis "Wiederholung deines Schlags" + kleiner Countdown-Balken.
- Die Hauptansicht läuft währenddessen normal weiter. Danach blendet das Overlay auf Live-Werte zurück.

### 3. Handgelenk gibt zu viel Schwung
Ursache: Die Blattmitte sitzt 13 cm vor der Hand. Eine Handgelenksdrehung bewegt sie schon dadurch schnell (steckt bereits in der Schlägergeschwindigkeit), zusätzlich wird die Drehung noch einmal als eigener Anteil addiert und beides mit bis zu 3× Zeitlupen-Faktor verstärkt. Rauschen in der Drehmessung verstärkt das weiter.
- Drehanteil nicht mehr doppelt zählen (nur noch der kleine Rest am Trefferpunkt relativ zur Blattmitte), Drehgeschwindigkeit auf realistische ~12 rad/s begrenzen und stärker glätten.
- Zeitlupen-Verstärkung nur auf die Armbewegung, Handgelenk-Anteil höchstens 1,5×.
- Rechentest: reine Handgelenksdrehung (10 rad/s) ergibt am Blatt max. ~1,5–2 m/s, also Schupf-Bereich.

### 4. Roter Pfeil nach dem Treffer
Befund: Der rote Pfeil zeigt nicht die Schlägerbewegung, sondern die Reibungskraft auf den Ball. Die wird hauptsächlich von der Flugrichtung und dem Spin des ankommenden Balls bestimmt, deshalb wirkt sie oft "falsch" zur Schlägerbewegung. Zusätzlich wird er am Treffpunkt eingefroren, während der grüne Pfeil live weiterläuft.
- Klare Trennung mit Beschriftung: grün = Schlägerbewegung beim Kontakt (eingefroren, s. Punkt 2), rot = "Belag bürstet den Ball" (Reibung), am Ballrand angesetzt, wo der Belag wirklich reibt.
- Beide Pfeile in die Seitenansicht projiziert (nur vor/zurück + hoch/runter), damit die Richtung auf der Tafel eindeutig stimmt; seitliche Anteile als kleine Zahl.
- Rot verschwindet mit Ende der 3-s-Wiederholung.

### 5. Ball fliegt durch den Schläger
Ursache: Der Schläger springt pro Bild einige Zentimeter (Echtzeit), der Ball bewegt sich in der Zeitlupe kaum. Der Test prüft nur, ob der **Ball** die Blattebene kreuzt, nicht ob das **Blatt** über den Ball hinwegstreicht. Zusätzlich ist das Blatt während aller Physikschritte eines Bildes eingefroren.
- Schlägerpose innerhalb eines Bildes über die Physikschritte interpolieren.
- Kreuzungstest relativ zum Blatt (alter Abstand zur alten Blattebene vs. neuer zur neuen), Treffer auch wenn nur das Blatt sich bewegt.
- Etwas dickere Trefferzone (Blattdicke + Ballradius) und Rechentests: schneller Schwung durch ruhenden Ball, Ball durch ruhendes Blatt, Streifschuss am Rand.

## Neue Features

### 6. Becher-Pyramide (5 Becher)
- Aufbau 3 unten + 2 oben, am hinteren Tischende (Gegnerseite). Verschiebbar: Desktop Pfeiltasten, Quest linker Thumbstick (links/rechts, vor/zurück auf der Gegnerhälfte).
- Echte Starrkörper-Physik (Becher kippen, rollen, fallen vom Tisch). Der Ball stößt die Becher an und prallt leicht ab.
- Sind alle 5 getroffen/umgefallen, baut sich der Turm nach ~1,5 s automatisch wieder auf.

### 7. "Perfekter Schlag" im Overlay
- Beim Treffer wird für genau diesen ankommenden Ball berechnet, welcher Schupf ideal gewesen wäre (Blattwinkel, Schwungrichtung, Schwunggeschwindigkeit, Handgelenk), mit derselben Physik: Probe-Rückflüge, gewählt wird der, der sicher mit Unterschnitt mittig auf der Gegnerseite landet.
- In der 3-s-Wiederholung sichtbar:
  - Geister-Schläger in Idealposition (gestrichelt/weiß) neben deinem Schläger, weißer Idealpfeil neben dem grünen.
  - Vergleichstabelle: Winkel / Tempo / Richtung / Handgelenk – "du" vs. "ideal" mit Farbe (grün passt, gelb knapp, rot weit weg).
  - Ein konkreter Satz: z. B. "Blatt 15° weiter öffnen, etwas langsamer (2,6 → 1,8 m/s), mehr nach vorn statt nach oben".
- Live (vor dem Schlag) zeigt das Overlay die Idealwerte als Zielmarken am Winkelbogen und am Schwungpfeil.

## Nicht jetzt
Punkte/Zähler für Becher, weitere Spin-Arten, Gegner.

## Technische Details
- `Simulation.tsx`: `prevBall`/`currBall` + Render-Interpolation mit `acc/PHYS_DT`; Racket-Pose `prev/curr` pro Frame, Slerp/Lerp pro Physikschritt; erweitertes `ContactSnapshot` (racketPos, quat, vel, angVel, speed, openDeg, timeScale, ideal, t0).
- `timescale.ts`: Freeze 0,6 s + Smoothstep-Rampe 0,5 s.
- `physics.ts`: `collideRacket(b, prevBall, rPrev, rCurr)` mit relativem Kreuzungstest; Arm-Hebel aus Kontaktpunkt minus Blattmitte, `angVel` clamp 12 rad/s, getrennter Boost (Arm ≤3×, Drehung ≤1,5×).
- `SpinOverlay.tsx`: Replay-Modus 3 s, Pfeile auf Kamera-Ebene (y/z) projiziert, Ghost-Racket, Vergleichs-Labels.
- `idealShot.ts` (neu): Grid-Suche über Öffnung 30–65°, Tempo 0,8–3,5 m/s, Richtung −20…+20° mit `stepBall` + `collideRacket`, Score = Landung Mitte Gegnerhälfte + Unterschnitt + Netzabstand; einmal beim Kontakt, wenige ms.
- Becher: `@react-three/rapier` (WASM, clientseitig, Route ist schon `ssr:false`); 5 dynamische Zylinder-Hüllen (Becher-Modell austauschbar), Tisch als fixer Collider; Ball als kinematischer Sensor-Körper, bei Kontakt Impuls auf Becher + einfache Ball-Reflexion in der eigenen Physik. `CupPyramid.tsx`.
