# AI × XR Tischtennis – Ein Lernmoment (Quest 3)

Zielgerät: Meta Quest 3, nur Controller, WebXR im Meta Browser. Spätestens 22 Uhr ist Schluss.
Leitsatz: **Kein Tischtennisspiel bauen, sondern einen Lernmoment.**
**XR macht die Interaktion beobachtbar, die KI macht sie verständlich.**

## 1. Lernziel

Anfänger sollen verstehen, wie diese fünf Faktoren Rotation und Flugbahn des Rückschlags beeinflussen:

1. Rotation des ankommenden Balls
2. Schlägerneigung (Blattwinkel offen/geschlossen)
3. Schlagbewegung (Richtung: nach vorne / nach oben / nach unten)
4. Schlägergeschwindigkeit
5. Treffzeitpunkt (früh / optimal / spät)

Beobachtbares Ergebnis: Nach der Nutzung kann ein Anfänger seine Schlägerhaltung bewusst verändern und erklären, warum sich Rotation und Flugbahn dadurch ändern.
Fortgeschrittene Techniken sind nicht Teil des MVP.

Warum XR: Der entscheidende Kontakt zwischen Ball und Schläger dauert in der Realität nur Millisekunden. XR erlaubt es, **Zeit, Größe und Perspektive** zu verändern – Ball verlangsamen, Kontakt vergrößert betrachten, Schlägerwinkel bewusst ändern und sofort die Folge sehen.

## 2. Die Übung: Unterschnitt zurückspielen

- Der Ball kommt mit **mittlerem Unterschnitt (Backspin)** von der Gegenseite.
- Ziel: den Ball auf die gegenüberliegende Tischhälfte zurückspielen.
- Physikalischer Kern, den der Lernende erleben soll: Unterschnitt lässt den Ball vom Schläger **nach unten** abspringen. Wer den Schläger zu gerade/geschlossen hält, spielt ins Netz. Richtig ist ein **geöffneter Schläger (ca. 30–45°)** und/oder eine **Bewegung nach vorne-oben**, die den Unterschnitt ausgleicht oder in Überschnitt (Topspin) umwandelt.

Lernschleife: **Beobachten → Vorhersagen → Handeln → Erleben → Feedback → Anpassen → Wiederholen**

- Versuch 1: ungünstiger Winkel → Vorschau zeigt schlechte Bahn → Ball ins Netz oder ins Aus → rotes Feedback.
- Hinweis: dezenter Pfeil bzw. Winkelanzeige für eine bessere Bewegung.
- Versuch 2: Winkel/Bewegung angepasst → Vorschau ändert sich → Ball landet drüben → grünes Feedback.

Nur ein Aufschlag, immer derselbe Unterschnitt. Wiederholbarkeit ist wichtiger als Abwechslung.

## 3. Szene

- **Tisch** in Normmaßen: 2,74 m × 1,525 m, Höhe 76 cm, dunkelblau/grün mit weißen Linien (Grundlinien, Seitenlinien, Mittellinie).
- **Netz**: 15,25 cm hoch, mittig quer über den Tisch.
- **Ball**: 40 mm Durchmesser, ca. 2,7 g; weiß/orange mit **farbiger Markierung** (Streifen/Punkt), damit die Rotation erkennbar ist.
- **Schläger**: Standard-Belag (glatt/Noppen innen), rundes Blatt ca. 15 × 16 cm mit Griff. Andere Beläge (Noppen außen, lange Noppen, Anti) kommen später.
- **Spielerposition**: fest vor dem Tisch, richtig ausgerichtet. Kein Laufen, keine Beinarbeit, kein Körper-Avatar.
- **Steuerung**: rechter Controller = Schläger, 1:1 Position und Drehung (Handgelenk, vor/zurück, hoch/runter). Trigger = Übung sofort neu starten.

## 4. Zeitlupe

Die Geschwindigkeit hängt von der Position des Balls ab, weich und ohne Sprünge:

- Netz / Tischmitte: **1,0×**
- Annäherung an den Spieler: zunehmend langsamer
- Direkt vor dem Kontakt: **ca. 0,1×**
- Nach dem Kontakt: wieder schneller, am Netz zurück bei **1,0×**

Werte sind Startwerte und werden auf Verständlichkeit getunt. Lernklarheit geht vor echtem Timing.

## 5. Ballphysik

Qualitativ realistisch, nicht wissenschaftlich exakt. Priorität: Stabilität → intuitives Verhalten → Lernwert → Performance.

**Eingehende Geschwindigkeit + Eingangsrotation + Schlägerneigung + Schlägergeschwindigkeit + Treffpunkt → Ausgangsgeschwindigkeit + Ausgangsrotation → Flugbahn**

- Schwerkraft, Luftwiderstand und **Magnus-Effekt** (Überschnitt taucht ab, Unterschnitt "schwebt"), damit Rotation sichtbar die Bahn beeinflusst.
- Tischaufprall mit Rotationseinfluss (Unterschnitt bremst, Überschnitt springt nach vorne).
- Netzberührung und Aus werden erkannt.
- Keine LLM-Berechnung der Physik.

## 6. Rotation sichtbar machen

- Farbige Markierung auf dem Ball
- Sichtbare Rotationsachse bzw. Drehpfeile
- Kurze Beschriftung **ÜBERSCHNITT / UNTERSCHNITT / OHNE** vor und nach dem Kontakt
- So wird klar: **Rotation davor → Kontakt → Rotation danach**
- Keine übertriebenen Effekte.

## 7. Feedback und Coaching

- **Treffer auf der Gegenseite**: dezentes grünes Leuchten der Tischhälfte.
- **Netz oder Aus**: rotes Leuchten an Tisch/Netz.
- Nach jedem Schlag eine kurze Auswertung der Messwerte, z. B.:
  Eingang: Unterschnitt · Winkel: 35° offen · Bewegung: vorne + oben · Timing: leicht spät · Ergebnis: Treffer
- **Ein kurzer Satz**, z. B. „Guter Winkel. Mehr Aufwärtsbewegung erzeugt mehr Überschnitt.“
- Zuerst regelbasiert (Messwerte → Satz). Später durch echte KI austauschbar. Kein Chat, keine Figur, keine große Oberfläche.
- Räumliche Hinweise haben Vorrang: Bewegungspfeil, Winkelanzeige am Schläger, Flugbahn-Vorschau.

## 8. Muss / Soll / Kann

**Muss (MVP):** WebXR läuft auf der Quest 3 · Controller steuert Schläger (Position + Drehung) · Ball mit Unterschnitt kommt · Kollision Schläger–Ball · automatische Zeitlupe · Schlag beeinflusst Ergebnis · plausible Flugbahn · Rotation davor/danach erkennbar · grün/rot Feedback · schneller Neustart.

**Soll:** Flugbahn-Vorschau vor dem Kontakt (halbtransparent, reagiert sofort auf Schlägerbewegung) · Kontakt-Detailansicht · Bewegungspfeile · Winkelanzeige · Magnus-Visualisierung · regelbasiertes Coaching.

**Kann:** KI-formulierte Hinweise · weitere Rotationsarten · weitere Übungen · Sound · polierte Übergänge · Meshy-Modelle.

**Nicht jetzt:** Gegner-KI, Matches, Punkte, Multiplayer, Accounts, Bestenlisten, Fortbewegung, Avatare, weitere Beläge, Menüs.

## 9. Kontakt-Detailansicht (Soll)

Ablauf: Normalansicht → Zeitlupe → Kontakt → vergrößerte Darstellung → Ausgangsrotation → zurück.
Einfachste stabile Umsetzung: Im Moment des Kontakts kurz einfrieren und ein **vergrößertes Modell von Ball und Schläger** vor dem Spieler einblenden (Kontaktpunkt, Rotation davor/danach). Keine Kamerabewegung – vermeidet Übelkeit.

## 10. Technik

- React Three Fiber + WebXR in diesem Projekt. Alles läuft im Browser, **kein Backend**.
- Auf die Brille: Vorschau-URL (HTTPS) im Meta Browser öffnen → „Enter VR“. Braucht normales WLAN mit Internet. Falls das nicht geht: veröffentlichen und über Handy-Hotspot öffnen. **Das wird als allererstes getestet.**
- **Austauschbare Modelle:** Ball und Schläger sind eigene Bausteine mit einem Platzhalter-Modell (Demo). Ein späteres Meshy-Modell (GLB) wird nur an einer Stelle eingetragen; Größe, Ausrichtung und Kollision bleiben unabhängig vom Aussehen.

## 11. Reihenfolge (je ein Commit)

1. WebXR-Szene mit Tisch und Netz – auf der Brille geprüft
2. Schläger folgt dem Controller
3. Ball mit Unterschnitt und Markierung
4. Kollision und Rückschlag
5. Zeitlupe
6. Grün/Rot-Feedback und Neustart → **MVP fertig**
7. Flugbahn-Vorschau
8. Coaching (Satz + Winkelanzeige/Pfeil)
9. Kontakt-Detailansicht, Feinschliff

## 12. Arbeitsteilung

Schritte 1–2 gemeinsam. Danach:
- **Entwickler A (XR/Interaktion):** Schläger, Controller, Zeitlupe, Kontakt-Detailansicht.
- **Entwickler B (Lernen/Simulation):** Ballphysik, Rotationsmodell, Flugbahn-Vorschau, Feedback, Coaching.

Die gemeinsame Szenen-Datei nur nach Absprache ändern. In Lovable nicht gleichzeitig Prompts abschicken. Git: nur `main`, Commit nach jedem Schritt.

## 13. Größte Risiken

| Risiko | Warnsignal | Ausweg |
|---|---|---|
| WebXR startet nicht auf der Brille | „Enter VR“ fehlt | HTTPS/Meta Browser prüfen, veröffentlichte URL, notfalls Desktop-Demo mit Maus |
| Ruckeln in VR | Stottern mit Ball/Effekten | Schatten weg, einfachere Materialien, weniger Vorschaupunkte |
| Ball fliegt durch den Schläger | klare Treffer werden ignoriert | größerer Trefferradius, Bewegung zwischen Frames prüfen, früher verlangsamen |
| Physik wirkt falsch | absurde Flugbahnen | Werte begrenzen, lehrreich statt realistisch tunen |
| Zeit reicht nicht | MVP abends nicht fertig | bei Schritt 6 einfrieren |

## Technische Details

- Pakete: `three`, `@react-three/fiber@^9`, `@react-three/drei@^10`, `@react-three/xr`, `@types/three`.
- `src/routes/index.tsx` mit `ssr: false`.
- Bausteine: `src/components/xr/XRScene.tsx` (gemeinsam), `Table.tsx`, `Net.tsx`, `Racket.tsx`, `Ball.tsx`; Modelle in `src/components/models/BallModel.tsx` und `RacketModel.tsx` (nur Aussehen, später GLB).
- Logik: `src/lib/physics.ts`, `spin.ts`, `timescale.ts`, `coaching.ts`, `constants.ts` (Tischmaße, Ballgröße, Zeitlupenwerte).
- Simulationszustand in Refs innerhalb von `useFrame`, fester Physik-Unterschritt (z. B. 1/240 s) skaliert mit dem Zeitfaktor. Nur Ereignisse (Treffer/Fehler, Hinweistext) gehen in React-State.
