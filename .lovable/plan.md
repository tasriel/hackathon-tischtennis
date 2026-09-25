# Overlay- und UI-Optimierungen für XR-Tischtennis

## Zielbild
Die Trainingsszene wirkt wie eine klare Turnhalle statt wie ein leerer Raum. Menüs liegen links und etwas hinter dem Spieler, stören nicht die Sicht auf Ball, Tisch und Review-Fenster und bleiben stabil im Raum. Das Review-Fenster ist größer, lesbarer und lenkt während der Bewegungs-Wiederholung mit einem leicht pulsierenden Rahmen den Blick auf den Vergleich.

## Gewählte Gestaltung
- **Palette:** Schwarz als Basis, Dunkelblau für Flächen, Violett als Akzent, Weiß/Grau für Spielerbewegung und Text. Grün bleibt ausschließlich für die perfekte Bewegung.
- **Schrift:** klar und sportlich mit Outfit für Titel und Figtree für Werte/Text.
- **Review-Aufbau:** Split-Screen: links die Bewegungsanimation, rechts der Vergleich „du“ gegen „perfekt“ und der konkrete Korrekturhinweis.

## Umsetzung

### 1. Menüs neu positionieren und gestalten
- Menü „Einspielen“ wird zu **„Schnitt-Variante“**.
- Beide Einstellungsfenster kommen links vom Spieler und etwas weiter nach hinten, gerade ausgerichtet und nicht mehr schräg in den Blick gedreht.
- Ziel-Menü wird ebenfalls links positioniert, mit größeren Auswahlflächen für Links / Mitte / Rechts.
- Beide Menüs bekommen ein hochwertigeres Sporthallen-UI: dunkle Flächen, violette Akzente, klare aktive Zustände, größere Titel.
- Beim Wechsel der Schnitt-Variante wird **kein neuer Ball** gestartet; der nächste Ball kommt weiterhin erst per rechtem Trigger oder Leertaste.

### 2. Ballfeedback aus der Hauptszene entfernen
- Die großen Feedback-Texte in der Spielansicht entfallen.
- Die kleine Ball-Spin-Beschriftung wird entfernt, damit das Feedback nur noch im Review-Fenster stattfindet.
- Die Review-Informationen bleiben erhalten und werden dort größer und anschaulicher dargestellt.

### 3. Review-Fenster lesbarer machen
- Review-Fenster auf Split-Screen umbauen: Animation links, Wertevergleich rechts.
- Texte größer setzen: Titel, Winkel, Tempo, Richtung und Korrekturhinweis klar voneinander trennen.
- Rahmen während der Wiederholungsanimation leicht pulsieren lassen.
- Spielerbewegung bleibt weiß/grau, perfekte Bewegung bleibt grün.

### 4. Target-Treffer feiern
- Wenn das Target getroffen wird:
  - kurzer zelebrierender Signal-Sound,
  - Target leuchtet kurz auf,
  - Konfetti-Partikel steigen aus dem Target-Bereich auf.
- Der Effekt wird nur einmal pro Treffer ausgelöst, nicht dauerhaft pro Bild.

### 5. Turnhalle aufbauen
- Boden: sauber, grau, wenig Textur.
- Wände: helle, feine Stoff-/Vorhangstruktur als zurückhaltende Hallenbegrenzung.
- Decke: Balken und Lichtleisten über dem Tisch.
- Beleuchtung anpassen, damit Tisch, Ball, Schläger und Review gut sichtbar bleiben.

## Technische Details
- `LeftMenu.tsx`: Menü-Layout, Positionen, Titel, aktive Zustände und Entkopplung von Schnittwechsel und Ballstart.
- `Simulation.tsx`: Hauptszenen-Feedback entfernen, Target-Trefferereignis an neue Effekte weitergeben.
- `Target.tsx`: Treffer-Puls, Leuchten, Konfetti und Sound-Trigger ergänzen.
- Neue Raum-Komponente: Turnhallenboden, Wände, Deckenbalken und Lichtleisten.
- `SpinOverlay.tsx`: Split-Screen-Komposition, größere Textlabels, pulsierender Rahmen und neue Farbpalette.
- `XRScene.tsx`: Hinweise anpassen, weil Feedbacktexte entfallen und die Menüs umbenannt werden.

## Prüfung
- Desktop-Ansicht laden und prüfen: Menüs links/hinten, Schnittwechsel startet keinen Ball, Review lesbar, keine sichtbaren Ballfeedback-Texte.
- Target-Treffer simulieren: Sound, Leuchten und Konfetti auslösen.
- Sichtprüfung in der Preview: Turnhalle, Tisch, Schläger, Target und Review-Fenster ohne Überlappungen.
- Quest-3-Test bleibt offen, weil dafür das Headset benötigt wird.
