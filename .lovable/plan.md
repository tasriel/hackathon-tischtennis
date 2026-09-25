# Fokus-Shift: Spin verstehen statt Tischtennis simulieren

## Ziel
Ein dauerhaft sichtbares Nahaufnahme-Overlay zeigt den Schlägerkontakt von der Seite, damit man sieht, **warum** der Ball mit Unterschnitt zurückkommt. Nur ein Szenario: Unterschnitt wird eingespielt und soll mit Unterschnitt (Schupf) zurückgespielt werden.

## 1. Spin-Overlay (wichtigster Punkt)
- Zweite Kamera, die die gleiche Szene rendert: Nahansicht des Schlägers **von links** (aus Spielersicht, Schläger in der rechten Hand, Ball kommt von rechts im Bild / vom Gegner).
- Die Kamera folgt dem Schläger, der Schläger ist immer mittig im Bild. Ausschnitt ca. 60 cm breit, damit der Ball früh hineinfliegt.
- Dieselben Objekte wie in der Szene: Position und Drehung von Ball und Schläger stimmen immer überein. Zeitlupe ist automatisch mit dabei.
- Desktop: Overlay als Fenster unten rechts. VR: als schwebende Tafel links neben dem Tisch im Blickfeld (Render-to-Texture).
- Darin sichtbar:
  - **Rotations-Pfeil** um den Ball (gebogener Pfeil), Farbe nach Art: Unterschnitt blau, Topspin orange, ohne Spin grau. Größe nach Spinstärke.
  - **Schlag-Pfeil** am Schläger in Schwungrichtung, Länge proportional zur Schlägergeschwindigkeit (live, auch vor dem Kontakt).
  - **Schlägerwinkel** als Zahl und Bogen (z. B. "45° offen").
  - **Beim Kontakt:** Zeitlupe kurz fast bis Stillstand (~1 s), eingefroren gezeigt: Reibungs-Pfeil am Kontaktpunkt (Richtung, in die der Belag den Ball "bürstet"), Rotations-Pfeil vorher (blass) und nachher (kräftig), Ball-Geschwindigkeit vorher/nachher.
  - Kurzer Text darunter, z. B. "Blatt offen, Bewegung nach vorn-unten → Belag reibt unten am Ball → Unterschnitt bleibt".

## 2. Physik: Unterschnitt realistisch
Recherche-Stand (wird vor der Umsetzung nochmals gegengeprüft):
- Ein Unterschnittball **behält nach dem Tischaufprall seinen Unterschnitt**, nur schwächer. Er springt flacher und langsamer ab ("bremst"). Ein Umdrehen zu Topspin passiert real nicht. Unser aktuelles Verhalten ist also in der Richtung korrekt; angepasst wird die Stärke: Absprung deutlich langsamer/flacher, Spin um ca. 30–50 % reduziert.
- Beim Schläger gilt: Unterschnitt auf geschlossenen Schläger → Ball fällt ins Netz. Richtig zurück mit Unterschnitt = **Schupf**: Blatt offen (~40–60°), Bewegung nach vorn und leicht nach unten, Belag reibt unter dem Ball durch → Rückspiel mit Unterschnitt. Alternativ Topspin nur mit starker Aufwärtsbewegung.
- Umsetzung: Belag-Reibung (Grip) erhöhen, damit Reibung den Spin beim Kontakt klar prägt; Kontaktmodell so prüfen, dass Schupf-Bewegung Unterschnitt erzeugt und passiver offener Schläger den Unterschnitt reflektiert (Ball geht hoch). Rechentests für die drei Fälle: Schupf → Unterschnitt über das Netz, geschlossen passiv → Netz, zu offen/zu schnell → Aus.
- Coach-Sätze an Schupf-Technik anpassen.

## 3. Flugkurve als glatte Kurve
Ursachen im Code: Vorschau springt, weil sie alle 3 Frames mit der gerade verwackelten Schlägergeschwindigkeit neu berechnet wird, und nur jeder 6. Physikschritt als Punkt genommen wird (grobe Ecken).
- Punkte feiner abtasten (jeden 2. Schritt), mit Catmull-Rom-Spline glätten.
- Für die Vorschau eine stärker geglättete Schlägerbewegung verwenden, damit die Kurve nicht zappelt; Übergänge zwischen Neuberechnungen weich überblenden.
- Linie als Röhre statt gestrichelte Linie (besser sichtbar in VR).

## 4. Physik auf die Quest 3 abstimmen (Arm und Schwung)
- Realistische Werte: Ein Schupf läuft mit ca. 1–3 m/s Schlägergeschwindigkeit, ein Topspin mit 5–10 m/s. Handgelenk-Drehung bis ca. 10–15 rad/s. Reichweite Schulter → Blatt ca. 0,6–0,8 m.
- Die Quest-3-Controller erfassen Bewegungen gut, aber schnelle Schwünge werden je Frame (72–90 Hz) etwas ungenau. Lösung: Schlägergeschwindigkeit über die letzten 3–4 Frames mitteln, statt nur zwei Frames zu vergleichen.
- Zeitlupe: Der Spieler bewegt sich in echter Zeit, der Ball langsam. Die Umrechnung wird so gedeckelt, dass ein normaler Schupf (1–3 m/s echt) auch in der Zeitlupe als Schupf wirkt und kein Schlag unrealistisch stark wird. Grenze pro Schlagart statt fester 14 m/s (Schupf-Bereich um 3–4 m/s).
- Armreichweite: Treffpunkt und Aufschlag so legen, dass der Ball bequem in Reichweite vor der rechten Körperseite ankommt (ca. 30–50 cm vor dem Körper, auf Hüft- bis Brusthöhe), ohne Laufen.
- Die Schlägerposition in der Hand (Griff-Versatz, Winkel) an die Quest-3-Controller anpassen, damit sich der Winkel natürlich anfühlt.
- Im Overlay wird die gemessene Schwunggeschwindigkeit angezeigt ("2,1 m/s – passend für Schupf"), damit man ein Gefühl dafür bekommt.

## Nicht jetzt
Andere Spin-Arten als Eingang, Gegner, Punkte, Menüs.

## Technische Details
- Neue Dateien: `SpinOverlay.tsx` (zweite `PerspectiveCamera`, `useFBO`/Scissor-Render im Desktop, Texture-Plane in VR), `SpinArrows.tsx` (gebogene Pfeile aus `TubeGeometry` + Kegel), `ContactSnapshot` in einem Ref (Ball-/Schlägerzustand vor/nach Kontakt, Reibungsimpuls `_dv` aus `collideRacket` zurückgeben).
- `physics.ts`: `collideRacket` gibt Kontaktdaten zurück; Tischaufprall Tangential-Dämpfung/Restitution nachtunen; `RACKET_GRIP` ~0.6–0.8.
- `timescale.ts`: kurzer Freeze nach Kontakt.
- `trajectory.ts`: Punktdichte, Spline-Glättung; Simulation nutzt separat geglättete `racket.vel` für die Vorschau.
