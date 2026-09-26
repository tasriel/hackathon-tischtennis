# Demo direkt in der GitHub-README sichtbar machen

## Ergebnis
Oben in der README läuft die Demo als animierte Vorschau direkt im Markdown. Ein Link darunter öffnet weiterhin das vollständige MP4 mit Ton.

## Umsetzung
1. Aus dem angehängten Video eine für GitHub geeignete, komprimierte GIF-Vorschau erstellen. Sie zeigt die Demo als bewegtes Bild; GIF selbst hat keinen Ton.
2. Das GIF außerhalb des Repositories als dauerhaft erreichbares Medien-Asset hochladen und die öffentliche Adresse prüfen.
3. Nur den Video-Abschnitt am Anfang der `README.md` ersetzen: Markdown-Bildsyntax (`![Demo](...)`) statt des HTML-Video-Players; den Link zum vollständigen Video und zur Anwendung beibehalten. Alle übrigen Beschreibungen unverändert lassen.
4. Den neuen Link und den README-Änderungsumfang prüfen. GitHub rendert keine eingebetteten HTML-Video-Player in READMEs; deshalb dient das GIF als direkt sichtbare Vorschau.

## Technische Hinweise
Die Quelldatei ist ein 44-sekündiges MP4. Die GIF-Datei wird in Auflösung und Bildrate reduziert, damit die README nicht unnötig groß geladen werden muss. Im Projekt wird ausschließlich `README.md` geändert; temporäre Umwandlungsdateien bleiben außerhalb des Projekts.
