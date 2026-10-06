# Gegner-Anpassungen (Runde 3)

## Mehr eigener Spin beim Gegner
- Glatt-Schupf gegen Unterschnitt erzeugt deutlich mehr Unterschnitt, sodass dein nächster Schupf flach auf der Platte landet statt darüber zu fliegen.
- Belag-Werte (Griffigkeit, Spin-Aufnahme) und Schlagraster so abstimmen, dass der Gegner sichtbar Spin erzeugt; Prüfung per Test: Schupf → Gegner-Schupf → Schupf landet auf der Gegnerseite.
- Lange Noppe und kurze Noppe gegen Oberschnitt bleiben unverändert.

## Kurze Noppe gegen Unterschnitt
- Schupf → Schupf: Ball hat weiterhin Unterschnitt, nur etwas weniger (ca. 60–70 % bleiben).
- Erst nach 2–3 Ballwechseln ist der Ball leer. Spinabbau weiter abhängig von der Eindringtiefe, aber milder.

## Anti (nach euren Infos)
- Fast keine Reibung: Der Belag bremst die Eigenrotation kaum und erzeugt selbst fast keinen Spin – die Drehrichtung im Raum bleibt erhalten.
- Folge: Oberschnitt kommt als Unterschnitt zurück (Schnittumkehr), Unterschnitt als leichter Oberschnitt/leer.
- Tempo wird stark geschluckt. Der Rückball fliegt flach und „schwebend“ (Auftrieb durch Unterschnitt) und fällt dann kurz und steil ab.
- Die bisherige Regel „Anti = praktisch kein Spin“ wird dadurch ersetzt.

## Fließende Gegnerbewegung
- Der Schläger fährt aus der Grundposition durchgehend zum Treffpunkt – kein Springen.
- Der Blattwinkel wird schon früh beim Ausholen eingedreht und bleibt während der Bewegung von hinten nach vorne durch den Ball stabil. Beim Treffer dreht sich nichts mehr.
- Dann folgen Ausschwung und Rückweg in die Grundposition.

## Neues Fenster „Rückschläge“
- Steht über „Belag Gegner“, Auswahl 1 / 2 / 3 (Desktop zusätzlich Tasten 9 / 0 / ß o. ä.).
- Der Ballwechsel läuft: Einspielen → du → Gegner → du … bis der Gegner so oft zurückgespielt hat wie eingestellt. Danach ist Schluss bis zum nächsten Trigger.
- Im Review lassen sich alle deiner Schläge durchblättern („Schlag n/N“, maximal 4).

## Fenster im Kreis
- Alle Einstellungsfenster stehen auf einem Bogen um den Spieler (ca. 1,3 m Radius), seitlich links bis schräg hinten, jedes zum Spieler gedreht – wie die Fenster auf der Quest 3.
- Das Review-Fenster bleibt links neben der Platte.

## Technische Details
- `constants.ts`: RUBBERS neu abstimmen (smooth vsBack Schupf mit mehr Grip/Spin, shortPips spinKeep-Kurve milder, anti: grip ≈ 0, spinKeep ≈ 0,9 Weltspin erhalten, restitution sehr klein); `RETURNS_MAX`.
- `physics.ts`: Belag-Kontakt mit Option „Weltspin erhalten“ (wie lange Noppe) für Anti; Eindring-Abbau für kurze Noppe abschwächen.
- `opponent.ts`: Fallback-Spin für Anti/kurze Noppe passend; `rate()` erlaubt kurze, steile Anti-Landung.
- `settings.ts`: `returns: 1|2|3`; `LeftMenu.tsx`: neues Panel, Positionen aus Winkel auf Kreisbogen berechnet, Rotation zum Spieler.
- `Simulation.tsx`: Phasen als Schleife mit Rückschlag-Zähler; Gegner-Pose: Orientierung vor Treffer fix (Slerp nur im Ausholen/Ausschwung), Position über glatte Kurve; Clips-Array bis 4.
- `SpinOverlay.tsx`: Label „Schlag n/N“ dynamisch.
- Verifikation: Test-Sweep pro Belag × Spin über mehrere Ballwechsel, Typprüfung, Browser-Check.
