# Anpassungen #6: Einstellungen per X-Knopf, Review schaltbar, Ziel kurz/lang, Spin-Wert, Ballserie

## 1. Tischhöhe erweitern
- Stufen: −5 / 0 / +5 / +10 / +15 / +20 cm.

## 2. Einstellungen aufgeräumt und per X-Knopf
- Alle Einstellungsfenster verschwinden standardmäßig.
- Knopf **X** am linken Controller öffnet und schließt die Einstellungen (am Rechner Taste **Tab**).
- Beim Öffnen erscheint ein einziges, aufgeräumtes Fenster vor dem Spieler (leicht links, auf Blickhöhe), sodass man sich nicht mehr drehen muss.
- Oben im Fenster Reiter: **Ball** (Schnitt-Variante, Ziel, Serie), **Gegner** (Belag, Rückschläge), **Zeitlupe** (An/Aus, Stärke, Dauer, Rotation in Echtzeit), **Anzeige** (Schnitt-Text, Tempo, Spin-Wert, Review, Tischhöhe).
- Beim Öffnen pausiert kein Ball; Klicks im Menü spielen keinen Ball ein.

## 3. Review an/aus
- Schalter „Review“ im Reiter Anzeige.
- Das Review-Fenster bleibt das einzige dauerhaft sichtbare Fenster (an seiner Position links neben der Platte), unabhängig vom X-Knopf.
- Bei „Aus“ ist es komplett ausgeblendet, der dezente Review-Hinweis nach drei Fehlrückschlägen entfällt dann ebenfalls.

## 4. Zielscheibe kurz / lang
- Zusätzlich zu Links / Mitte / Rechts: **Kurz** (ca. 40 cm hinter dem Netz) oder **Lang** (ca. 25 cm vor der Grundlinie).
- Treffer-Feier und Trefferzählung funktionieren für beide Positionen.

## 5. Spin-Wert (provisorisch)
- Neuer Schalter „Spin-Wert“ im Reiter Anzeige.
- Bei „An“ steht unter dem Ball die Drehzahl in Umdrehungen pro Sekunde (z. B. „24 U/s“), berechnet aus der simulierten Rotation. Nicht wettkampfgenau, aber vergleichbar.
- Im Review-Fenster neue Zeile „Spin“ mit dem Wert vor und nach deinem Treffer sowie dem Wert des perfekten Schlags.

## 6. Ballserie mit Auswertung
- Im Reiter Ball: **Serie** mit 5 / 10 / 20 Bällen (Standard 10).
- Start per Knopf „Serie starten“; danach spielt der Trigger die Bälle nacheinander ein, ein kleiner Zähler „Ball 4 / 10“ steht über dem Ballstart.
- Nach dem letzten Ball erscheint die Auswertung im Review-Fenster (falls Review aus: kurz am Ballstart):
  - Durchschnittstempo deiner Schläge (km/h)
  - Durchschnittlicher Spin (U/s) und Anteil richtiger Schnittart (z. B. Unterschnitt gegen Unterschnitt beim Schupf)
  - Trefferquote: Ball getroffen, Platte regelkonform getroffen, Ziel getroffen
  - Bewertung je gewählter Schnitt-Variante: „Sehr gut / Solide / Üben“ anhand der Abweichung von der empfohlenen Technik.
- Die Serie läuft nur in dieser Sitzung, nichts wird gespeichert.

## Technische Details
- `settings.ts`: `TABLE_OFFSETS` um 0.15 / 0.2; neue Werte `menuOpen`, `showReview`, `showSpinValue`, `targetDepth: "short" | "long"`, `seriesLength`, Serienzustand.
- `LeftMenu.tsx` → ein Panel mit Reitern, Position relativ zur Kopfposition beim Öffnen (einmalig gesetzt, nicht kopfgebunden). X-Button über `useXRInputSourceState("controller","left")` `x-button`.
- `SpinOverlay.tsx`: Sichtbarkeit über `showReview`; zusätzliche Tabellenzeile Spin; Serien-Auswertungsansicht.
- `Target.tsx`/`Simulation.tsx`: Ziel-z aus `targetDepth`; Serienstatistik in `Simulation.tsx` sammeln (Ausgangstempo, Spin nach Treffer, `table-far`, Zieltreffer, Coaching-Abweichung).
- Spin-Anzeige: `|ω| / 2π` gerundet, Label unter dem Ball.
- Tests in `physics.test.ts`: Serien-Durchschnitt/Trefferquote als reine Funktion, Ziel-z für kurz/lang.
