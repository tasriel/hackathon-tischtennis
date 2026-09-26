# README für den XR-Tischtennis-Lernprototyp

## Ergebnis
Die README beginnt mit dem Projektnamen und dem angehängten Demo-Video als direkt abspielbarem Element. Danach erklärt sie auf Deutsch den Lernmoment, sämtliche tatsächlich vorhandenen Funktionen, die Bedienung auf Quest 3 und Desktop sowie den lokalen Start. Alte Platzhalter- und Lovable-Werbetexte entfallen.

## Inhalt
1. Kurzbeschreibung: Spin durch Beobachten, Ausprobieren und Vergleichen verstehen; Schwerpunkt Unterschnitt zurückspielen.
2. Funktionsübersicht: drei Schnitt-Varianten und passende Schlagziele (Schupf/Topspin), manueller Ballstart, Controller-Schläger mit begrenzter Reichweite, sichtbare Rotation und Spin-Label, positionsabhängige Zeitlupe samt Ballfarbe, Flugbahn-Vorschau, Ball-/Schlägerkontakt und Tisch-/Netzphysik, Treffer-Rückmeldung, verschiebbares Target mit Leuchten/Konfetti/Ton, Turnhallenszene und leichtes Netz, seitliches Live-Bild und Replay mit Bewegungsvergleich, Winkel-/Tempo-/Richtungs-/Spin-Werten und kurzen regelbasierten Korrekturhinweisen.
3. Klar getrennte Bedienungsanleitungen für Quest 3 und Desktop mit den im Projekt verwendeten Tasten und Menüs.
4. Technische Grundlagen und lokaler Start anhand der tatsächlich vorhandenen Projektbefehle; Grenzen des Prototyps und offener Test auf der echten Quest 3.

## Technische Umsetzung
- Das hochgeladene Video wird außerhalb des Repositories als Medien-Asset bereitgestellt und per absoluter URL in einem HTML-`<video controls>`-Element unmittelbar oben in der README referenziert. Da die Vorlage HEVC-kodiert ist, wird sie für bessere Browser-Kompatibilität zuvor in H.264/MP4 konvertiert; temporäre Konvertierungsdateien bleiben außerhalb des Projekts.
- **Im Projekt wird ausschließlich `README.md` verändert.** Kein Anwendungscode, keine zusätzlichen Projektdateien und keine Funktionsänderungen.
- Abschließend Video-Link und README-Inhalt prüfen, insbesondere dass die beschriebenen Funktionen mit der vorhandenen Implementierung übereinstimmen.
