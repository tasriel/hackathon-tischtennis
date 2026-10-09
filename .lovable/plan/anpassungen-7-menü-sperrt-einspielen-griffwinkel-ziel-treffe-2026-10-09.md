# Anpassungen #7: Menü sperrt Einspielen, Griffwinkel, Ziel-Treffer zuverlässig

## 1. Kein Ball einspielen bei offenem Menü
- Solange das Einstellungsfenster (X / Tab) offen ist, startet der rechte Trigger (bzw. Leertaste) keinen Ball.
- Beim Schließen wird ein noch gedrückter Trigger erst nach dem Loslassen wieder gewertet, damit nicht sofort ein Ball kommt.
- Der Hinweis „Rechter Trigger: Ball einspielen“ wird bei offenem Menü ausgeblendet.

## 2. Schläger richtig in der Hand
- Der Schläger wird etwas weiter nach unten gekippt, damit das Holz des Griffs in Linie mit dem Controller-Griff liegt (statt schräg nach oben).
- Die Trefferfläche dreht sich exakt mit, Physik und Optik bleiben deckungsgleich.

## 3. Zielscheibe reagiert immer
- Ursache gefunden: Sobald Rückschläge des Gegners aktiv sind, wird dein Ball direkt nach dem Treffen schon als „Gegner ist dran“ behandelt. Sein Aufprall auf der Gegnerseite löst dann die Zielscheibe nicht aus. Ohne Gegner funktioniert es, mit Gegner fast nie.
- Zusätzlich vergleicht die Zielscheibe den Aufprall mit ihrer noch gleitenden Position; direkt nach einem Ziel-Wechsel kann ein Treffer daneben gewertet werden.
- Lösung: Jeder regelkonforme Aufprall deines Balls auf der Gegnerseite löst die Treffer-Prüfung aus, egal ob danach der Gegner zurückschlägt – also auch bei deinem 2., 3. und 4. Ball im Ballwechsel. Geprüft wird gegen die endgültige Zielposition.
- Die Serienstatistik zählt Zieltreffer nach derselben Regel.

## Technische Details
- `Simulation.tsx`: in `restart()`-Aufrufen (Trigger Z. ~396, Space Z. ~276) `settings.menuOpen` prüfen; `trigWasPressed` auch bei offenem Menü weiterführen; `serveHint` mit `!menuOpen` verknüpfen.
- `GRIP_ROT` von Euler(-0.5,0,0) auf ca. (-0.85,0,0) anpassen (Griff zeigt +Z, Kippung um X); `GRIP_OFFSET` ggf. leicht nachziehen, damit die Griffmitte im Grip-Space-Ursprung bleibt.
- Phase `opp`, Ereignis `table-far` (Z. ~547): beim ersten Aufprall `targetImpact` erhöhen und Serien-Zielwertung setzen (gemeinsame Hilfsfunktion mit Z. ~561).
- `Target.tsx`: Trefferprüfung gegen `TARGET_X/TARGET_Z` der aktuellen Einstellung statt gegen geglättete Anzeigeposition.
- Test in `physics.test.ts`: reine Funktion „Aufprall innerhalb Zielradius inkl. äußerer Ringe = Treffer“.
