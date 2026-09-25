# Ballfarbe stufenlos an die Zeitlupe koppeln

- Bei normaler Geschwindigkeit bleibt der Ball weiß. Je langsamer die Zeit läuft, desto stärker wird sein Orange; bei der langsamsten Zeitlupe erreicht es das kräftige Orange.
- Wenn die Zeitlupe endet, geht die Farbe mit derselben Geschwindigkeitsänderung stufenlos zurück zu Weiß – ohne einen festen Umschaltpunkt oder Einfluss des Reviews.
- Die dunkelroten und blauen Rotationsmuster bleiben jederzeit gut sichtbar. Flugverhalten, Spin und Replay-Ablauf bleiben unverändert.

## Technische Umsetzung

`BallModel` erhält statt des bisherigen Ja/Nein-Werts den tatsächlichen Zeitfaktor der Simulation. Die Grundfarbe wird direkt zwischen Weiß bei 1× und Orange beim minimalen Zeitfaktor interpoliert; Zwischenwerte ergeben entsprechende Zwischenfarben. Die bisherige zeitverzögerte Farbglättung entfällt, damit die Farbe jederzeit proportional zum tatsächlichen Zeitfaktor bleibt. Anschließend den Anflug und die Rückkehr zur Normalgeschwindigkeit in der Vorschau prüfen.
