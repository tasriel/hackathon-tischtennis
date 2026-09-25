# Hallenlinien, Review-Fenster und Target-Treffer

## Ergebnis

- Die roten Hallenmarkierungen werden etwas blasser, bleiben aber gut erkennbar.
- Das Review-Fenster ist blickdicht: Bodenlinien und andere Elemente der Hauptansicht erscheinen nicht über seiner Fläche. Die Hallentexturen **innerhalb** der Replay-Aufnahme sollen nicht sichtbar sein. Dort sollen sie ausgeblendet sein. Im Hauptfenster hingegen sind sie immer dauerhaft sichtbar.
- Ein Ball auf einem der äußeren Ringe zählt ebenso als Target-Treffer wie ein Ball im Bullseye; Leuchten, Konfetti und Signalton werden zuverlässig ausgelöst.

## Umsetzung

1. Die rote Linienfarbe bzw. Deckkraft der Boden-Textur in der Halle dezent reduzieren, ohne die Bodenfarbe oder das Linienmuster zu ändern.
2. Die Zeichenreihenfolge des Review-Fensters so absichern, dass die transparente Bodenlinien-Fläche es nicht nachträglich übermalt; die Review-Bildfläche selbst bleibt vollständig deckend. Live- und Replay-Ansicht bleiben ansonsten unverändert.
3. Die tatsächliche sichtbare Größe des Target-Modells samt Außenringen prüfen und die Trefferfläche darauf abstimmen. Treffer beim Auftreffen auf die Tischfläche über die Ballbahn bzw. das Tisch-Aufprallereignis erfassen statt ausschließlich über die momentane Ballposition in einem Bild. Pro Ball nur einmal auslösen; die bestehende Trefferanimation und den Sound beibehalten.
4. In der Vorschau von vorne und seitlich prüfen, dass die Linien blasser sind, nicht über dem Fenster liegen und Treffer am äußeren Ring den Effekt auslösen. Den Quest-3-Test als noch offen kennzeichnen, falls kein Headset verfügbar ist.

## Technische Hinweise

Die Änderungen betreffen die Hallen-Textur, die Zeichenreihenfolge des Review-Panels und die Target-Kollision. Die Ballflugphysik und das Coaching werden nicht verändert.