# Schwarzes Netz und rote Hallenmarkierungen

- Das Netz bleibt bei Fehlschlägen und Netztreffern dauerhaft schwarz. Die bestehende rote Aufleucht-Reaktion des Netzes entfernen; die weiße Oberkante und die schwarzen Pfosten bleiben unverändert.
- Auf dem hellgrünen Hallenboden eine klar sichtbare, dünne rote rechteckige Umrandung mit Abstand zu allen vier Wänden ergänzen.
- Innerhalb der Umrandung wenige rote Sporthallenlinien im Stil eines Basketballfelds ergänzen: Mittellinie mit Kreis sowie symmetrische rechteckige Zonen und Halbkreisbögen an beiden Enden. Die Linien liegen flach knapp über dem Boden und verdecken weder Tisch noch Spielball.
- In Desktop- und schmaler Vorschau prüfen, dass die Linien nicht flackern und Netzmaschen, Oberkante und Pfosten richtig aussehen.

## Technische Umsetzung

Die bestehende Farb-Rückmeldung für das Netz in `Simulation.tsx` entfällt; `Table.tsx` verliert die dazu benötigte veränderbare Netzmaterial-Referenz. Die Netzphysik und die übrige Treffer-Rückmeldung bleiben unangetastet. Die Markierungen werden in `GymRoom.tsx` als wenige flache rote Linien auf der vorhandenen Bodenfläche gezeichnet; Raummaße und Wandpositionen bestimmen ihren Abstand zur Wand.
