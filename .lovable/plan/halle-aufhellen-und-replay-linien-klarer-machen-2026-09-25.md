# Halle aufhellen und Replay-Linien klarer machen

## Ziel
Die Turnhalle wirkt wieder freundlich und deutlich heller. Im Replay stehen nur die Schlagbewegungen im Vordergrund: eigene Bewegung rot, perfekte Bewegung grün, beide gut sichtbar – ohne störende Controller-Zeigestrählen.

## Umsetzung
1. Den fast schwarzen Hallenboden durch ein helles, zurückhaltendes Grün ersetzen. Den unteren Wandbereich als etwas dunkleres Grün gestalten; die Backsteinwand oben beibehalten. Decke und Beleuchtung so aufhellen, dass der Raum insgesamt heller wirkt und Tisch, Ball und Menüs lesbar bleiben.
2. Die Zeigestrahlen und gegebenenfalls deren Zielpunkte nur für das Bild im Replay-Fenster ausblenden. In der normalen VR-Ansicht bleiben sie für die Menübedienung verfügbar.
3. Die eigene Schlägerbewegung im Replay von Schwarz auf ein klares Rot umstellen. Eigene und perfekte Bewegungslinie dicker zeichnen, ohne ihre Positionen, Animation oder Vergleichswerte zu ändern. Grün für die perfekte Bewegung beibehalten.

## Technische Details
- Die Raumfarben und Lichtstärken in `GymRoom.tsx` und, soweit für die Helligkeit nötig, in `XRScene.tsx` anpassen.
- Die Replay-Kamera rendert die Halle weiterhin mit; XR-Zeigevisualisierungen während des separaten Replay-Renderings gezielt ausschließen und danach unverändert wiederherstellen. Die eigentliche Strahl-Interaktion nicht deaktivieren.
- Die bisherigen `THREE.Line`-Spuren in `SpinOverlay.tsx` verwenden `LineBasicMaterial`, dessen Linienstärke im WebGL-Browser nicht zuverlässig einstellbar ist. Für sichtbar dickere Spuren eine geometrisch breite Linienvariante verwenden; rote Spielerfarbe auch für den zugehörigen Bewegungs-Pfeil und Geist-Schläger konsistent setzen.

## Prüfung
- Desktop: Halle sichtbar heller, Boden hellgrün, Wand unten dunkler grün; Replay zeigt rote und grüne, deutlich dickere Spuren.
- VR: Controller-Strahlen bleiben in der Live-Ansicht bedienbar, erscheinen aber nicht im Replay. Falls kein Headset verfügbar ist, diesen Punkt als noch nicht am Gerät geprüft kennzeichnen.
