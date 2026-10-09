# Anpassungen #5: Zeitlupe einstellbar, Anzeigen schaltbar, weicherer Belag, Sound und Vibration

## 1. Zeitlupe stufenlos einstellen
- Das Fenster „Slow-Motion“ bekommt zusätzlich zu An/Aus zwei Regler mit je 3–4 Stufen:
  - **Stärke:** wie langsam der Ball wird (z. B. 0,5× / 0,3× / 0,15× / 0,1×).
  - **Dauer:** wie lange die Zeitlupe nach dem Treffer anhält, bevor sie wieder auf Normaltempo geht (kurz / mittel / lang).
- Kein abruptes Anhalten mehr: Das bisherige Beinahe-Standbild direkt nach dem Treffer entfällt. Stattdessen sinkt das Tempo weich ab und steigt am Ende ebenso weich wieder an.
- Das Review behält seine eigene Zeitlupe und bleibt orange.

## 2. Schalter „Rotation in Echtzeit“
- Neue Option im Slow-Motion-Fenster: Bei aktiver Zeitlupe fliegt der Ball langsam, das Muster auf dem Ball dreht sich aber in normalem Tempo.
- Nur die Darstellung ändert sich, die Physik bleibt gleich. So erkennt man den Schnitt besser, vor allem bei Noppen (Spin-Umkehr, „leere“ Bälle).

## 3. Schalter für die Anzeigen am Ball
- Neues kleines Fenster „Anzeige“ mit zwei Schaltern: **Schnitt-Text** (An/Aus) und **Tempo** (An/Aus).
- Sind beide aus, sieht der Spieler nur noch den Ball und sein Muster und muss den Schnitt selbst erkennen.
- Das Review bleibt davon unberührt.

## 4. Ball springt spürbar in den Belag
- Der Treffer am eigenen Schläger fühlt sich bisher wie Holz an: harter, sofortiger Rückprall.
- Neu: ein Belag-Modell mit Gummi und Schwamm:
  - Der Ball sinkt sichtbar wenige Millimeter ein und bleibt sehr kurz am Belag.
  - Weiche Treffer werden stärker geschluckt, schnelle Schläge werden durch den Schwamm stärker „katapultiert“.
  - Der Ball nimmt dabei mehr Spin aus der Schlagbewegung auf.
  - Der Ball fliegt in einem flacheren, kontrollierteren Bogen ab.
- Dazu eine kurze Stauchung des Balls (rein optisch) beim Kontakt.
- Die Gegner-Beläge bleiben wie abgestimmt.

## 5. Langsamer einspielen und zurückspielen
- Alle drei Einspiel-Varianten kommen etwa 15–20 % langsamer, mit etwas höherem Bogen, damit sie weiter sicher aufkommen.
- Der Rückball des Gegners zielt auf ein niedrigeres Tempo (etwa 12–18 km/h statt 15–25 km/h).
- Ziel: Auch ohne Zeitlupe gut spielbar.

## 6. Tischhöhe
- Laut ITTF-Regel ist die Spielfläche 76 cm hoch. Genau dieser Wert ist im Projekt schon eingestellt.
- Dass der Tisch in der Brille zu niedrig wirkt, liegt deshalb wahrscheinlich daran, wo die Brille den Boden vermutet, und nicht an der Tischhöhe selbst.
- Geplant:
  - Die Szene richtet sich am echten Boden der Quest aus (Boden-Bezug der Brille).
  - Im Fenster „Anzeige“ kommt eine Feinjustierung „Tischhöhe“ dazu (−5 / 0 / +5 / +10 cm). Damit lässt sich ein ungenau erkannter Boden ausgleichen.
  - Die Physik verschiebt sich dabei mit, damit Ballflug und Tisch zusammenpassen.

## 7. Ballsound und Vibration
- Kurzer, typischer „Tock“-Klang bei jedem Aufprall auf dem Tisch, etwas helleres „Plock“ bei jedem Schlägerkontakt (eigener und gegnerischer Schläger).
- Die Klänge werden direkt im Browser erzeugt, ohne Audiodateien. Ihre Lautstärke hängt von der Aufprallstärke ab.
- Bei eigenem Schlägerkontakt vibriert der rechte Controller kurz und leicht (ca. 30–50 ms). Ein stärkerer Schlag vibriert etwas kräftiger.

## Technische Details
- `settings.ts`: neue Werte `slowStrength`, `slowDuration`, `realtimeSpin`, `showSpinText`, `showSpeed`, `tableOffset`.
- `timescale.ts`:
  - `TIME_MIN` und Freeze werden durch Parameter ersetzt.
  - Weiche Kurve ohne `FREEZE_SCALE`-Plateau im Live-Spiel.
  - Das Review nutzt weiterhin den eigenen festen Wert.
- `BallModel`: Die Drehung des Musters integriert optional mit Echtzeit-`dt` statt Simulations-`dt`.
- `physics.ts` → `collideRacket`:
  - Neues Spieler-Belagprofil mit tempoabhängiger Restitution (Schwamm-Katapult), höherem Grip und kurzer Kontaktzeit (Ball bleibt 1–2 Simulationsschritte am Blatt).
  - Die Tempo-Obergrenze bleibt.
- `constants.ts`: angepasste `SERVES`-Werte und geringeres Gegner-Zieltempo.
- Höhe: Prüfen, ob `XROrigin`/`local-floor` korrekt gesetzt ist. Den `tableOffset` als Verschiebung der ganzen Spielwelt umsetzen, damit `TABLE.height` und die Physik konsistent bleiben.
- Audio: Web Audio mit gefiltertem Rauschimpuls plus kurzem Sinus.
- Haptik: `inputSource.gamepad.hapticActuators[0].pulse(intensity, ms)` am rechten Controller.
- `physics.test.ts`:
  - Tests für die tempoabhängige Belag-Restitution.
  - Test, dass die Zeitlupe ohne Freeze-Plateau verläuft.
  - Prüfung der neuen Einspieltempi.
- Neue Fenster werden im bestehenden Bogen links angeordnet.
