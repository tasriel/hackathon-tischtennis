# AI × XR Tischtennis – ein Lernmoment (Quest 3)

Zielgerät: Meta Quest 3, nur Controller, WebXR im Meta-Browser. Schluss spätestens 22 Uhr; Reihenfolge nach Gefühl, kein fester Zeitplan.

**Leitsatz:** Kein Tischtennisspiel bauen, sondern einen Lernmoment. XR macht die Interaktion beobachtbar, der Coach macht sie verständlich.

**Lernziel (Anfänger):** Verstehen, wie ankommender Spin, Schlägerneigung, Schlägerbewegung, Schlägergeschwindigkeit und Treffzeitpunkt den abgehenden Spin und die Flugbahn beeinflussen. Nach der Nutzung soll man den Schlag bewusst verändern können und sehen, was sich ändert.

Lernschleife: **Beobachten → Vorhersagen → Handeln → Erleben → Feedback → Anpassen → Wiederholen**

## 1. Szene und Spielerposition

- Spieler steht bereits perfekt am Tisch. Positionierung und Beinarbeit sind ausgeblendet, kein Laufen.
- Der Schläger ist in der rechten Hand, rechts vom Spieler sichtbar.
- Nur Arm und Handgelenk werden bewegt. Die Bewegung ist auf eine realistische Armlänge begrenzt:
  - Schläger drehen (Neigung offen/geschlossen, Handgelenk),
  - vor/zurück entlang der Ballachse (auf den Ball zu),
  - hoch/runter.
- Szene: Tisch, Netz, Boden, schlichte Umgebung. Lernklarheit geht vor realistischer Halle.

## 2. Übung: Unterschnitt zurückspielen

- Der Ball kommt frontal auf den Schläger zu, mit mäßigem Unterschnitt (Backspin). Immer derselbe Aufschlag, damit Versuche vergleichbar sind.
- Ziel: den Ball auf die gegnerische Tischhälfte zurückspielen.
- Versuch 1 (typisch): Schläger zu geschlossen → Vorschau zeigt schlechte Bahn → Ball geht ins Netz → rot.
- Hinweis: Pfeil / Winkelanzeige schlägt eine offenere Haltung und mehr Aufwärtsbewegung vor.
- Versuch 2: Haltung angepasst → Vorschau ändert sich → Ball landet drüben → grün.
- Neustart per Trigger-Taste, sofort derselbe Ball.

## 3. Zeitlupe

- Ball startet mit normaler Geschwindigkeit (1,0×).
- Ab etwa dem Netz beginnt die Verlangsamung und wird schrittweise stärker, bis ca. **0,1×** kurz vor dem Schläger.
- Nach dem Treffer wird schrittweise wieder beschleunigt, sodass am Netz wieder **1,0×** erreicht ist.
- Übergänge weich, abhängig von der Ballposition. Werte sind Startwerte und werden auf Verständlichkeit getunt.

## 4. Ballphysik

- Qualitativ realistisch statt wissenschaftlich exakt. Priorität: Stabilität → intuitives Verhalten → Lernwert → Leistung.
- Modell: ankommende Geschwindigkeit + ankommender Spin + Schlägerneigung + Schlägergeschwindigkeit + Kontakt → abgehende Geschwindigkeit + abgehender Spin → Flugbahn.
- Schwerkraft, Luftwiderstand und Magnus-Effekt, damit Spin die Bahn sichtbar krümmt.
- Tischabsprung mit Spin-Einfluss, Netzkollision.
- Nur glatter Belag (Noppen, Anti, Belagverformung = spätere Erweiterung).
- Physik bestimmt, was passiert. Keine KI für Physik.

## 5. Spin sichtbar machen

- Ein weißer Ball dreht sich zu schnell, um es trotz Zeitlupe zu erkennen. Deshalb Lernball mit farbiger Markierung, sichtbarer Rotationsachse und animierter Oberfläche.
- Kurzes Label am Ball: **↻ TOPSPIN** / **↺ BACKSPIN**.
- Der Nutzer sieht direkt: **ankommende Rotation → Kontakt → abgehende Rotation**.
- Keine übertriebenen Effekte.

## 6. Flugbahn-Vorschau

- Während der Zeitlupe und vor dem Kontakt: halbtransparente vorhergesagte Flugbahn.
- Berechnet aus Ballgeschwindigkeit, Spin sowie aktueller Schlägerhaltung und -bewegung.
- Schläger bewegen → Bahn ändert sich sofort. Dezent, verdeckt nicht die Sicht.

## 7. Kontakt-Inspektion (Zoom beim Schlag)

Ablauf: Normale Sicht → Zeit friert ein → vergrößerte Schläger/Ball-Darstellung → Kontaktinteraktion → zurück zur normalen Sicht.

- Wunsch: Die Perspektive „fliegt" zum Kontaktpunkt, Ball und Schläger erscheinen riesig.
- Sichtbar: ankommender Spin, Kontaktpunkt, wie sich die Rotation beim Aufprall ändert. Zusätzliche Animationen dürfen die Rotationsänderung verdeutlichen, sollen aber möglichst wenig künstlich wirken.
- **Warnung VR-Übelkeit:** Die Kamera in VR aktiv zu bewegen verursacht leicht Übelkeit. Empfohlene Umsetzung: nicht die Kamera, sondern eine vergrößerte Kopie von Ball und Schläger schwebt kurz vor dem Spieler (oder die Welt skaliert um den Kontaktpunkt). Wirkt wie „hineinzoomen", ist stabil und angenehm. Echter Kameraflug nur, wenn am Ende Zeit bleibt.

## 8. Sofortiges Feedback

- Ball landet auf gegnerischer Hälfte → Tisch leuchtet dezent **grün**.
- Netz oder daneben/drüber → Tisch/Netz leuchtet **rot**.
- Ohne viel Text verständlich.

## 9. Coach

- Kein Chatbot, keine eigene Oberfläche, keine Figur. Soll intuitiv verständlich bleiben.
- Vor allem räumlich und visuell: Bewegungspfeile, Schlägerwinkel-Anzeige, Flugbahn-Vorschau, kurze Hinweise.
- Nach dem Schlag höchstens ein kurzer Satz, erzeugt aus Messwerten, z. B.:
  - Ankommender Spin: Backspin · Schlägerwinkel: 35° offen · Bewegung: aufwärts + vorwärts · Treffzeitpunkt: leicht spät · Ergebnis: Treffer
  - → „Guter Schlägerwinkel. Mehr Aufwärtsbewegung erzeugt mehr Topspin."
- Zuerst regelbasiert (zuverlässig, ohne Server). So gebaut, dass später ein echtes KI-Modell denselben Satz liefern kann.

## 10. Austauschbare 3D-Modelle

- Ball und Schläger starten als einfache Demo-Modelle (Grundformen).
- Aussehen und Physik sind getrennt: Die Physik rechnet mit festen Maßen (Ballradius, Schlägerfläche), das Modell ist nur die Hülle. Später einfach eine Meshy-Datei (GLB) einsetzen, ohne Physik anzufassen.
- Wenn ein Import Probleme macht: sofort zurück auf die Demo-Form.

## 11. Technik und Zugang zur Brille

- React Three Fiber + WebXR in diesem Lovable-Projekt. Kein Backend, alles läuft im Browser.
- Auf der Quest 3: Meta-Browser öffnen, Vorschau-Adresse eingeben, „VR starten". Die Adresse ist bereits HTTPS, mehr braucht WebXR nicht. Voraussetzung: Brille im WLAN mit Internet – das ist der allererste Test.
- Fallback ohne Brille: Desktop-Ansicht mit Maus-Schläger zum Entwickeln.

## 12. Reihenfolge (jeweils ein Git-Commit)

1. WebXR-Szene mit Tisch/Netz, auf der Brille getestet (gemeinsam)
2. Schläger folgt Controller (gemeinsam)
3. Ball + Aufschlag mit sichtbarem Backspin
4. Kollision + Rückschlag
5. Zeitlupe
6. Grün/Rot-Feedback + Neustart → **MVP fertig**
7. Flugbahn-Vorschau
8. Coach: Pfeile, Winkelanzeige, ein Satz
9. Kontakt-Inspektion
10. Feinschliff, Meshy-Modelle einsetzen

## 13. Aufteilung zu zweit

Schritte 1–2 gemeinsam. Danach:
- **Dev A (XR/Interaktion):** Schläger, Controller, Armlängen-Begrenzung, Zeitlupe, Kontakt-Inspektion.
- **Dev B (Lernen/Simulation):** Ballphysik, Spin-Modell, Flugbahn-Vorschau, Feedback, Coach-Regeln.

Nur die zentrale Szenendatei ist gemeinsam – vorher absprechen. In Lovable nicht gleichzeitig Prompts senden. Git: nur `main`, Commit nach jedem funktionierenden Schritt.

## 14. Größte Risiken

| Risiko | Warnzeichen | Fallback |
|---|---|---|
| WebXR startet nicht auf der Brille | „VR starten" fehlt | Veröffentlichte Adresse / Handy-Hotspot; notfalls Desktop-Demo |
| Ruckeln in VR | Stottern mit Ball/Effekten | Schatten weg, einfachere Materialien, Vorschau seltener berechnen |
| Ball fliegt durch den Schläger | Klare Treffer werden ignoriert | Größere Trefferzone, Durchlauf-Kollision, früher verlangsamen |
| Physik wirkt falsch | Ball fliegt absurd | Geschwindigkeit/Spin begrenzen, auf Lernwirkung tunen |
| Kontakt-Inspektion zu aufwendig | Übelkeit oder Bugs | Vergrößerte Kopie statt Kameraflug, oder weglassen |

## Nicht jetzt

Gegner-KI, Matches, Punkte, Mehrspieler, Konten, Bestenliste, Laufen, Beinarbeit, Ganzkörper-Avatar, andere Beläge, Menüs, eigene KI-Modelle.

## Technische Details

- Pakete: `three`, `@react-three/fiber@^9`, `@react-three/drei@^10`, `@react-three/xr`.
- `src/routes/index.tsx` mit `ssr: false`.
- Komponenten: `src/components/xr/XRScene.tsx` (gemeinsam), `Table.tsx`, `Racket.tsx` + `RacketModel.tsx`, `Ball.tsx` + `BallModel.tsx` (Modell-Dateien sind die austauschbaren Hüllen).
- Logik: `src/lib/physics.ts`, `spin.ts`, `trajectory.ts`, `timescale.ts`, `coaching.ts`, `constants.ts` (Maße, Zeitlupenwerte).
- Simulationszustand in Refs innerhalb `useFrame`, kein React-State pro Frame. Fester Physik-Unterschritt, skaliert mit Zeitfaktor.
