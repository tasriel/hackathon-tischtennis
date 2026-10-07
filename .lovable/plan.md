# Situatives Intro und automatisierte Physiktests

## Umfang

Der vorgeschlagene VR-Testmodus mit gespeicherten Testläufen wird vorerst **nicht umgesetzt**. Er war als Werkzeug gedacht, um dieselbe Schlagaufgabe nacheinander mit und ohne Zeitlupe zu spielen und subjektives Spielgefühl mit Messwerten zu vergleichen. Die automatisierten Physiktests bleiben dagegen Teil dieser Umsetzung.

## 1. Startansicht und Einspielen

- Den kaum lesbaren schwarzen/grauen Erklärungstext am oberen Bildschirmrand entfernen; die Überschrift ebenfalls ausblenden, damit die Halle frei bleibt.
- Beim ersten Öffnen keinen Ball automatisch losschicken. Stattdessen erscheint am normalen Ballstart ein gut lesbarer, kurzer Hinweis: **„Trigger: Ball einspielen“**; am Rechner wird ergänzend die Leertaste genannt.
- Beim ersten Trigger-/Leertastendruck startet der Ball und der Hinweis verschwindet sofort.
- Nach Ende eines Ballwechsels startet ein 7-Sekunden-Timer. Wird bis dahin kein neuer Ball angefordert, erscheint derselbe Hinweis erneut direkt am Ballstart. Beim nächsten Start verschwindet er wieder.
- Einstellungsänderungen starten weiterhin keinen Ball.

## 2. Zeitlupe im richtigen Moment erklären

- Nur bei aktivierter Live-Zeitlupe und höchstens während der ersten drei noch nicht getroffenen Anflüge erscheint kurz vor dem Balltreffpunkt ein kompakter Hinweis nahe am Ball statt als großer Bildschirmtext.
- Der Hinweis verbindet die sichtbare orange Ballfarbe mit der Aussage: **„Ball in Zeitlupe – du schlägst normal schnell.“**
- Er wird erst eingeblendet, wenn die Zeitlupe tatsächlich beginnt, und verschwindet unmittelbar beim Schlägerkontakt oder wenn der Ball vorbeifliegt.
- Sobald der Spieler bei einem dieser frühen Versuche den Ball einmal berührt hat, gilt die Erklärung als verstanden und erscheint in dieser Sitzung nicht erneut. Nach spätestens drei Versuchen endet sie ebenfalls.
- Die Zeitlupe und der orange Review-Ball bleiben technisch unverändert und voneinander getrennt.

## 3. Dezenter Hinweis auf das Review

- Pro vollständigem Ballwechsel erfassen, ob überhaupt ein Schlägerkontakt stattgefunden hat.
- Nach drei Ballwechseln in Folge ohne Kontakt wird das vorhandene Review-Fenster für wenige Sekunden dezent hervorgehoben: stärkerer Rahmenpuls plus kleiner Richtungspfeil an seiner tatsächlichen VR-Position.
- Kein großer Text in der Mitte und keine dauerhafte Animation.
- Ein Ballkontakt setzt die Fehlschlagserie zurück. Derselbe Hinweis wird erst nach einer neuen Serie von drei komplett verfehlten Bällen erneut ausgelöst.
- Die vorhandene blickdichte Darstellung und Vordergrund-Reihenfolge des Review-Fensters bleiben erhalten.

## 4. Automatisierte Physik-Regressionstests

- Tests mit Buns eingebautem Testsystem ergänzen, ohne neue Testbibliothek oder Backend.
- Reproduzierbare Szenarien für:
  - typischen Unterschnitt-Schupf,
  - frontalen Block/Konter,
  - Topspin/Konter mit kontrolliertem Ausgangstempo,
  - jeweils mit Live-Zeitfaktor 1 und einem repräsentativen Slow-Motion-Zeitfaktor.
- Pro Szenario prüfen:
  - Slow-Motion verändert nur den zeitlichen Ablauf, nicht die physikalische Flugbahn bei derselben wirksamen Schlägerbewegung,
  - Ausgangstempo bleibt in realistischen Grenzen,
  - Netzüberquerung und erster Aufsprung liegen im erwarteten Bereich,
  - Spinrichtung und Spinabbau bleiben korrekt,
  - Luftwiderstand reduziert das Tempo entlang der Flugbahn.
- Grenzwerte bewusst als realistische Bereiche statt als fragile Einzelwerte formulieren, damit echte Regressionen auffallen, ohne Rundungsrauschen als Fehler zu melden.
- Einen klaren Test-Befehl im Projekt ergänzen und die bestehenden Berechnungen nur so weit herauslösen, wie es für deterministische Tests nötig ist.

## Prüfung

- Automatisierte Physiktests ausführen und Typprüfung bestehen lassen.
- Im Browser prüfen: kein alter Kopftext, initial kein automatischer Ball, Trigger-/Leertastenhinweis, erneuter Hinweis nach 7 Sekunden, Zeitlupenhinweis nur bis zum ersten Kontakt bzw. maximal drei Versuche, Review-Hinweis erst nach drei vollständigen Verfehlungen.
- Zusätzlich schmale und breite Ansicht auf Überlagerungen prüfen.
- Der abschließende Meta-Quest-3-Test bleibt als manueller Prüfschritt offen.
