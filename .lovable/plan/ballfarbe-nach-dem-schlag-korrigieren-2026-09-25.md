# Ballfarbe nach dem Schlag korrigieren

- Der Ball wird nur während der tatsächlichen Zeitlupe orange dargestellt. Sobald der Zeitfaktor wieder normal ist, blendet er zurück zur weißen Standardfarbe – auch wenn das Review weiterhin läuft.
- Das Zeitlupen-Orange wird kräftiger und klarer von Weiß unterscheidbar. Die dunkelroten und blauen Rotationsmuster bleiben sichtbar.
- Anflug, Schlag und Rückkehr zur Normalgeschwindigkeit in der Vorschau prüfen; die Ballphysik und das Review-Verhalten bleiben unverändert.

## Technische Umsetzung

Der aktuelle Farbauslöser berücksichtigt neben dem Zeitfaktor auch den dauerhaft aktiven Review-Status. Diese Kopplung wird entfernt: Die Ballfarbe hängt ausschließlich am aktuellen Zeitfaktor. Die bestehende weiche Farbüberblendung bleibt erhalten; nur der orange Farbwert wird angepasst.
