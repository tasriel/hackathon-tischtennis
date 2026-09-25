# Schwung-Übertragung, Menüs, Ball auf Knopfdruck, Overlay-Animation

## 1. Schwung realistischer auf den Ball übertragen
- Zeitlupen-Verstärkung der Armbewegung deutlich senken (von bis zu 3× auf höchstens ~1,3×), Handgelenk-Anteil 1×.
- Belag-Rückprall abhängig vom Tempo: kleine Bewegungen geben wenig Tempo, das meiste Tempo kommt aus Reibung (Spin) statt Stoß.
- Höchsttempo am Blatt auf ~6 m/s senken.
- Rechentests: ruhiges Blatt → Ball fällt kurz; Schupf 1,5–2 m/s → landet auf Gegnerseite; Topspin (Blatt 20–35° geschlossen, 3–5 m/s vorwärts-aufwärts) gegen Oberschnitt → landet auf dem Tisch statt im Aus.

## 2. Linkes Menü: Aufschlag-Variante
- Kleine Tafel links neben dem Spieler in der Luft, bedient mit dem linken Controller (Strahl zeigen + Trigger). Am Desktop zusätzlich Tasten 1/2/3.
- Auswahl: Unterschnitt, Oberschnitt, Seitschnitt – je eigener Aufschlag (Spin, Tempo, Bogen).
- Erwarteter Schlag: Unterschnitt → Schupf, Oberschnitt und Seitschnitt → Topspin.
- Ergebnistext, Coach-Sätze und "perfekter Schlag" passen sich an die Variante an.

### Technik-Referenz (recherchiert, als Grundlage für Idealwerte und Texte)
- **Schupf** (gegen Unterschnitt): Blatt offen ~40–50°, kurze ruhige Bewegung nach vorn-unten, Ball unten/hinten treffen, Kontakt früh nach dem Aufspringen, Unterarm führt, wenig Handgelenk.
- **Topspin gegen Unterschnitt/Seitschnitt**: Blatt leicht geschlossen ~10–20°, Bewegung stark von unten nach oben, Ball hinten-oben bürsten.
- **Topspin gegen Oberschnitt**: Blatt stärker geschlossen ~25–40°, Bewegung mehr nach vorn als nach oben, Ball oben treffen.
- **Gegen Seitschnitt**: Blatt leicht in Drehrichtung ausgleichen (seitlich gewinkelt), sonst wie Topspin.
- Vor der Umsetzung kurze Webrecherche zur Bestätigung dieser Werte; Quellen in den Coach-Texten nicht nötig.

## 3. Nächster Ball nur auf Knopfdruck
- Kein automatischer Neustart mehr. Neuer Ball mit rechtem Trigger (Quest) bzw. Leertaste (Desktop); Hinweis "Trigger = nächster Ball".

## 4. Zweites linkes Menü: Ziel-Position
- Drei Schaltflächen Links / Mitte / Rechts, bedient wie oben, sichtbar hinter der Platte (Gegnerseite) als Tafel.
- Ziel springt auf die gewählte Position; das freie Verschieben per Stick/Pfeiltasten entfällt.

## 5. Overlay aufräumen
- Nur noch zwei Pfeile: **deine Bewegung (weiß/hellgrau)** und **perfekte Bewegung (grün)**. Spin-Pfeil bleibt klein am Ball; roter Reibungs-Pfeil, Geister-Spin und doppelte Legenden entfallen.
- Deine Schlägerfläche weiß/grau, ideale Schlägerfläche grün.
- Texte reduziert auf: Ergebnis, 1 Satz "was ändern" und eine kleine Tabelle Winkel / Tempo / Richtung (du vs. ideal).

## 6. Overlay-Animation statt Standbild
- Schlägerbahn wird dauernd aufgezeichnet; beim Treffer wird ~0,6 s vor bis ~0,4 s nach dem Balltreffpunkt gespeichert (Schläger, Ball, Spin).
- Nach dem Schlag spielt das Overlay diese Szene in Dauerschleife ab, bis der nächste Ball eingespielt wird – dann wieder Live-Ansicht.
- Am Treffpunkt pausiert die Animation 1 s, danach läuft sie weiter.
- Parallel läuft die perfekte Bewegung in Grün: ideale Schlägerbahn durch denselben Treffpunkt mit idealer Richtung, Tempo und Blattwinkel.
- Kleiner Fortschrittsbalken mit Markierung am Treffpunkt.

## Nicht jetzt
Punkte für Ziel-Treffer, weitere Spin-Arten, Gegner.

## Technische Details
- `physics.ts`: `MAX_SLOWMO_BOOST` 3 → 1.3, `MAX_WRIST_BOOST` → 1, `MAX_RACKET_SPEED` 8 → 6; tempoabhängige `RACKET_RESTITUTION` (0,5 langsam → 0,8 schnell); Rechentests mit node.
- `constants.ts`: `SERVES = { backspin, topspin, sidespin }` statt einzelnem `SERVE`; `resetServe(b, type)`.
- `lib/strokes.ts` (neu): pro Variante erwarteter Schlag, Zielbereiche für Öffnung/Tempo/Richtung, Suchraster für `idealShot.ts` (Topspin mit negativer Öffnung), Texte; `coaching.ts` nutzt Variante.
- `components/xr/LeftMenu.tsx` (neu): Tafeln als 3D-Panels mit `@react-three/xr` Pointer-Events des linken Controllers (Ray), Desktop per Klick/Tasten 1–3 und Q/W/E für Ziel; Zustand in kleinem Modul-Store.
- `Simulation.tsx`: Auto-Reset entfernen; Ringpuffer der Schlägerpose/Ballzustand (~1,5 s @ 60 Hz); beim Kontakt Clip ausschneiden; Clip-Flag bis zum nächsten Aufschlag.
- `SpinOverlay.tsx`: Replay-Modus = Clip-Player in Schleife mit 1-s-Pause am Kontakt; grüner Geister-Schläger folgt einer aus Idealwerten erzeugten Bahn (lineare Bahn durch Kontaktpunkt, Richtung/Tempo/Öffnung ideal); Farben: Spieler #e5e7eb, ideal grün; roter Pfeil und Extras entfernt.
- `Target.tsx`: feste Positionen x = −0,45 / 0 / +0,45, Stick/Pfeiltasten entfernen.
