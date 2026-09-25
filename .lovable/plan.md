# Ball im Review von der Hauptansicht trennen

- Der Ball in der Hauptansicht behält seinen bisherigen Farbverlauf: Weiß bei Normaltempo, Orange je nach tatsächlicher Zeitlupe.
- Das Review bekommt eine eigene Ball-Darstellung mit demselben sichtbaren Rotationsmuster, aber dauerhaft kräftig orange – unabhängig vom Tempo und der Farbe in der Hauptansicht.
- Während des Review-Bildes wird nur der aufgezeichnete Ball gezeigt. Der aktuelle Live-Ball wird dort ausgeblendet, insbesondere während der einsekündigen Pause am Balltreffpunkt. In der Hauptansicht bleibt er unverändert sichtbar.
- Anflug, Replay-Schleife, Pause und Neustart in der Vorschau prüfen; Ballphysik und Schlagbewertung nicht verändern.

## Technische Umsetzung

Eine zweite `BallModel`-Instanz wird auf den exklusiven Review-Layer gelegt und erhält eine feste Review-Farbe. Das Review setzt ihre Position anhand der aufgezeichneten Ballbahn. Beim Rendern des Review-Bildes wird die Live-Ballgruppe nur temporär verborgen und anschließend wiederhergestellt; die beiden Ballfarben und Texturen bleiben voneinander unabhängig. Die derzeit ungenutzte einfache Review-Ballkugel wird durch diese Darstellung ersetzt.
