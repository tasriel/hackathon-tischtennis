# Netz als leichte Texturfläche

## Ziel
- Das bisherige detaillierte Netzmodell wird durch eine flache, transparente Netzfläche ersetzt. Die Tischtennisplatte, Ballphysik und Netzhöhe bleiben unverändert.

## Umsetzung
1. Die gelieferte PNG-Textur verwenden. Der vorgeschlagene PlaneGeometry-/MeshStandardMaterial-Ansatz passt grundsätzlich; die PNG besitzt bereits einen Alphakanal. Deshalb wird sie als Farbtextur mit eigener Transparenz genutzt, ohne eine zweite, nicht gelieferte `netAlphaTexture`. Eine separate `alphaMap` mit dieser dunklen PNG wäre bei `alphaTest: 0.5` ungeeignet, weil die dunklen Fäden ebenfalls verschwinden könnten.
2. Das Netz auf 1,83 m Breite und 0,1525 m Höhe als beidseitig sichtbare Fläche quer zur Spielrichtung bei z = 0 aufstellen. Die Unterkante sitzt etwa 2 mm über der Tischoberfläche. Die quadratische Textur wird über die Breite wiederholt, statt auf das lange Netz verzerrt zu werden.
3. Das alte Netz-GLB aus der Szene entfernen; die bestehende Rückmeldung bei Netzfehlern auf die neue Netzfläche übertragen, ohne Ballflug oder Trefferlogik zu verändern. Das alte Asset nicht vom CDN löschen, damit frühere Versionen nicht beschädigt werden.
4. Desktop- und mobile Vorschau auf Sichtbarkeit, Transparenz und Position prüfen; zusätzlich das Rendering und die Projektprüfung kontrollieren. Die tatsächliche Leistung auf der Quest 3 bleibt bis zu einem Headset-Test unbestätigt.

## Technische Details
- Die vorhandenen Maße `TABLE.width`, `TABLE.height` und `TABLE.netHeight` bleiben Grundlage für Tisch und Kollision. Die sichtbare Netzbreite 1,83 m umfasst den Überstand links und rechts der 1,525-m-Platte.
- Die Alphatransparenz des PNG wird direkt im Material ausgewertet (`transparent`, `alphaTest: 0.5`, `DoubleSide`, `roughness: 0.8`); Textur-Wiederholung mit korrektem Farbraum und scharfem Muster.
