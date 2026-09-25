# Netz optisch an den Tisch anpassen

- Die vorhandene leichte Netzfläche beibehalten und ihre Maschen schwarz darstellen.
- Das Netz genau über die **Tischbreite** spannen (1,525 m statt derzeit 1,83 m); seine bisherige Höhe und die knappe Lage über der Platte bleiben erhalten.
- Entlang der oberen Netzkante einen schmalen, weißen, waagerechten Rechteckstreifen anbringen.
- An beiden Enden schmale schwarze, senkrechte Rechteckpfosten ergänzen, die sichtbar bis an die Tischkante reichen und wie Befestigungen wirken.
- In der Vorschau aus Spielerperspektive und seitlich prüfen, dass Netz, Streifen und Pfosten richtig ausgerichtet sind und die Durchsicht durch die Maschen erhalten bleibt.

## Technische Umsetzung

Die Änderung betrifft die Darstellung in `Table.tsx`: die bestehende Alpha-Texturfläche bleibt erhalten, erhält eine schwarze Materialfärbung und die Breite `TABLE.width`. Weißer Oberstreifen und zwei schwarze Pfosten werden als einfache, wenige Geometrien ergänzt. Ballkollision, Spin, Tischmodell und Review bleiben unverändert.
