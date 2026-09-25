# Plan: Meshy-Modelle in die XR-Tischtennis-Szene integrieren

## Ziel
Die hochgeladenen Meshy-Modelle für Tisch, Netz, Schläger und Neon-Bullseye werden als sichtbare Objekte in die bestehende Szene eingebaut. Die bisherige Becher-Pyramide wird vollständig durch das Bullseye ersetzt. Physik, Lern-Overlay und Controller-Steuerung bleiben erhalten.

## Umsetzung

1. **Aktuellen leeren Bildschirm beheben**
   - Die nachgewiesene doppelte `@react-three/fiber`-Auflösung zwischen Szene und Physik-Paket vereinheitlichen, die den `useContext`-/Dispatcher-Fehler im `Physics`-Element verursacht.
   - Danach sicherstellen, dass die Szene wieder ohne Laufzeitfehler sichtbar ist.

2. **Vier GLB-Dateien als Projekt-Assets aufnehmen**
   - Tisch, Netz, Schläger und Bullseye über Lovable Assets bereitstellen, damit die großen Binärdateien nicht im Quellcode-Repository liegen.
   - Kleine, getrennte Modell-Komponenten anlegen; jedes Modell erhält eine eigene zentrale Skalierung, Rotation und Verschiebung.
   - Modelle vorab laden und beim Laden der Szene eine unaufdringliche Fallback-Darstellung verwenden.

3. **Tisch und Netz ersetzen**
   - Die bisherigen Demo-Flächen für Tischplatte, Beine und Netz visuell durch die beiden Meshy-Modelle ersetzen.
   - Beide Modelle exakt auf die bestehenden realen Tischmaße von 2,74 × 1,525 m, 0,76 m Höhe und 15,25 cm Netzhöhe ausrichten.
   - Unsichtbare, einfache Kollisionsflächen und die vorhandenen Tisch-/Netz-Berechnungen unverändert als physikalische Grundlage behalten.

4. **Schläger ersetzen**
   - Das Demo-Schlägermodell durch den roten Meshy-Schläger ersetzen.
   - Blattmittelpunkt, Blattnormale und Griffachse auf die bestehende Controller-Konvention kalibrieren, damit Trefferzone, Handlage und Overlay weiterhin übereinstimmen.
   - Dasselbe Modell auch in der Nahaufnahme sowie für die Schlag-Wiederholung verwenden; Ideal- und Vergleichsschläger bleiben über Materialfarbe beziehungsweise Transparenz unterscheidbar.

5. **Bullseye statt Becher-Pyramide**
   - Die Becher und deren Wiederaufbau-Logik entfernen.
   - Das Neon-Bullseye auf der gegnerischen Tischhälfte als verschiebbares Ziel platzieren; die vorhandene Steuerung mit Pfeiltasten beziehungsweise linkem Quest-Stick beibehalten.
   - Eine einfache, zum Modell passende Kollisionsform verwenden. Ein Treffer reagiert physikalisch nachvollziehbar und das Ziel wird anschließend automatisch in seine Ausgangslage zurückgesetzt.
   - Das Bullseye wird nur vom zurückgespielten Ball aktiviert, nicht vom eingespielten Ball.

6. **Abschlussprüfung**
   - Desktop-Szene auf sichtbare Modelle, korrekte Größen, Ausrichtung, Treffer und fehlende Überschneidungen prüfen.
   - Den vollständigen Ablauf testen: anfliegender Unterschnitt, Schlägertreffer, Overlay-Wiederholung, Tisch-/Netzkollision und Bullseye-Treffer.
   - Einen Quest-tauglichen Bildausschnitt sowie fehlerfreie Konsole und Netzwerkaufrufe verifizieren.

## Technische Leitplanken
- Sichtbare GLB-Modelle bleiben strikt von den vereinfachten Physikformen getrennt, damit Modelle später erneut austauschbar sind.
- Die bestehende Tischtennis-Physik wird nicht auf komplexe Dreiecks-Kollisionen der Meshy-Modelle umgestellt.
- Die ermittelten Rohproportionen werden normalisiert: Tisch ca. 1,90 × 0,49 × 1,06, Netz ca. 1,90 × 0,33 × 0,10, Schläger ca. 1,07 × 1,90 × 0,29 und Bullseye ca. 1,90 × 1,90 × 0,20 Modelleinheiten.
- Keine Backend- oder Kontofunktionen.
