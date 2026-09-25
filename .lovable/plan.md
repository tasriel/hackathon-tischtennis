# Review-Fenster immer im Vordergrund

- Das Netz bleibt in der Hallenszene schwarz und ist **innerhalb** der Replay-Aufnahme weiterhin als Teil der Umgebung sichtbar.
- Außerhalb der Aufnahme dürfen weder Netzmaschen noch Netzkante, Pfosten oder andere Hallenelemente über dem Review-Fenster liegen.
- Das Review-Fenster samt Rahmen bleibt blickdicht und wird als letzte sichtbare Ebene gezeichnet, auch in der Quest-3-Ansicht. Andere Anzeigen und die Netzphysik bleiben unverändert.
- Die Darstellung in der Desktop-Vorschau prüfen; sofern möglich, auch die Darstellung während eines Replays und die unterschiedlichen Blickrichtungen kontrollieren. Die tatsächliche Quest-3-Prüfung bleibt ein separater Gerätetest.

## Technische Umsetzung

In `SpinOverlay.tsx` werden Fenster und Rahmen in die zuletzt gezeichnete transparente Render-Gruppe gelegt: Material mit voller Deckkraft, ohne Tiefentest und ohne Schreiben in den Tiefenpuffer; der Rahmen bekommt unmittelbar vor der Fensterfläche liegende Zeichenreihenfolge. Dadurch wird die Netzfläche, die wegen ihrer transparenten Maschen derzeit nach der deckenden Fensterfläche gezeichnet werden kann, vom Fenster zuverlässig überdeckt. Die vorhandene Offscreen-Replay-Aufnahme und ihre Umgebungstexturen bleiben unangetastet.
