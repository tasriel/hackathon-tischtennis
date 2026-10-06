# Anpassungen #3: Zeitlupe, Balltempo und Gegnerbewegung

## Zeitlupe ein- und ausschalten
- Ein neues Einstellungsfenster **„Slow-Motion“** in den bestehenden Fensterbogen einfügen, mit den gut erreichbaren Optionen **„An“** und **„Aus“** sowie einer Desktop-Taste.
- Die Einstellung wirkt nur auf den live gespielten Ball. Bei **„Aus“** läuft der Ball durchgehend in Echtzeit und bleibt weiß; Spinmuster und Spin-/Tempo-Text bleiben erhalten.
- Der Ball im Review bleibt unabhängig von der Einstellung orange und die dortige verlangsamte Wiederholung samt Pause am Balltreffpunkt bleibt unverändert.
- Bei aktivierter Zeitlupe beginnt die Verlangsamung nicht mehr anhand der Tischkante. Nach dem ersten Aufprall auf der Spielerseite wird der höchste Punkt der Flugkurve vorausberechnet; kurz davor fährt die Zeit weich herunter.
- Dieser Ablauf gilt für das erste Einspielen und jeden Gegner-Rückball. Pro Anflug wird der relevante erste Aufprall gezählt und der Zeitlupenstart nur einmal ausgelöst.

## Kontrolliertes Tempo bei Topspin gegen Topspin
- Schlägerkontakt und Idealschlag-Suche gemeinsam neu abstimmen, damit ein Topspin auf ankommenden Topspin zwar Rotation erzeugt, aber die Vorwärtsgeschwindigkeit nicht unrealistisch aufsummiert.
- Tangentiale Beschleunigung und Rückprallenergie begrenzen, ohne Unterschnitt, Noppen-Umkehr oder Anti-Verhalten pauschal abzuschwächen.
- Die Topspin-Empfehlung so auslegen, dass auch eine echte Topspinbewegung sicher auf der Gegenseite landet; Kontern bleibt möglich, ist aber nicht mehr die einzige funktionierende Bewegung.
- Mit reproduzierbaren Physiktests prüfen: Topspin auf Topspin bei mehreren realistischen Blattwinkeln und Schwunggeschwindigkeiten, jeweils mit Netzfreiheit, Landepunkt, Balltempo und Spin nach dem Treffer.

## Gegner antizipiert und schlägt vor dem zweiten Aufprall
- Direkt nach dem Spielerkontakt die Flugbahn bis zum ersten Aufprall auf der Gegnerseite und den anschließenden Treffpunkt vorhersagen. Dadurch kennt der Gegner frühzeitig Ziel, Blattwinkel und Bewegung.
- Der Gegner-Schläger startet bereits während des Ballflugs zur Gegenseite: flüssige Anfahrt zum Ausholpunkt, frühzeitiges Eindrehen des Blatts, zusammenhängender Schlag durch den Ball, Ausschwung und Rückkehr.
- Der eigentliche Kontakt liegt immer **nach dem ersten Aufprall und vor einem möglichen zweiten Aufprall**. Die bisherige Möglichkeit, erst nach dem zweiten Aufprall zurückzuspielen, wird ausgeschlossen.
- Falls die echte Belag-Suche keinen sicheren Ball findet, bleibt die garantierte Lehrball-Notlösung erhalten, verwendet aber denselben rechtzeitigen Treffpunkt und verursacht keinen sichtbaren Sprung des Schlägers.
- Die Bewegungsform nach Schlagart unterscheiden:
  - **Topspin:** Schläger startet vorne/tiefer, zieht in einer flüssigen Bahn nach hinten in Spielrichtung und leicht nach oben durch den Ball; der Blattwinkel ist vor dem Kontakt eingestellt und bleibt am Treffpunkt stabil.
  - **Schupf:** kompakter, frontaler Weg leicht von oben nach unten beziehungsweise nach vorn-unten.
  - **Konter/Block:** kurze, kontrollierte Vorwärtsbewegung mit wenig zusätzlicher Beschleunigung.
  - **Noppe/Anti:** ruhiger, weicher Kontakt mit passender geringerer Geschwindigkeit.

## Kurze Noppe gegen Unterschnitt
- Beim ersten und bei weiteren Kontakten bleibt der vorhandene Unterschnitt zunächst erhalten und wird abhängig von der Eindringtiefe nur schrittweise reduziert; er darf nicht direkt zu Oberschnitt kippen.
- Nur ein sehr tiefer/harter Kontakt hebt den Schnitt vollständig auf. Die Belagphysik darf dabei keinen künstlichen Richtungswechsel der Rotation erzeugen.
- Die Gegnerbewegung bleibt ein frontaler Schupf, jetzt sichtbar etwas stärker von oben nach unten geführt.
- Das Review erhält für genau diesen Fall eine eigene Idealbewegung und einen konkreten Hinweis: frontaler treffen und etwas steiler von oben nach unten schupfen. Die grüne Vergleichslinie, Winkel-, Tempo- und Richtungswerte verwenden diese belagsabhängige Empfehlung statt des allgemeinen Unterschnitt-Schupfs.

## Technische Umsetzung
- `settings.ts` und `LeftMenu.tsx`: boolesche Live-Zeitlupe, neues An/Aus-Fenster und Tastatursteuerung; Standard bleibt **An**.
- `timescale.ts` und `Simulation.tsx`: zustandsbasierter Zeitlupen-Trigger aus erstem Aufprall plus vorausberechnetem Scheitelpunkt statt fester Z-Position; deaktivierter Modus liefert immer Faktor 1.
- `BallModel.tsx`: Live-Farbe folgt weiterhin ausschließlich dem tatsächlichen Zeitfaktor; der separate Review-Ball bleibt fest orange.
- `opponent.ts`: Planung schon nach dem Spielerkontakt, gültiges Kontaktfenster strikt zwischen erstem und zweitem Tischkontakt, getrennte Bewegungsprofile für Topspin, Schupf, Block und passive Beläge.
- `Simulation.tsx`: früh berechneten Plan für die Gegneranimation verwenden und beim realen ersten Aufprall synchronisieren; kein spätes Neuansetzen oder Teleportieren.
- `physics.ts`, `constants.ts` und `idealShot.ts`: kontrollierte Energie-/Tangentialübertragung für Topspin sowie monotone Spin-Dämpfung der kurzen Noppe.
- `SpinOverlay.tsx`/Schlagreferenzen: belag- und spinspezifische Idealwerte für kurze Noppe gegen Unterschnitt speichern und anzeigen.

## Prüfung
- Automatisierter Sweep für Topspin gegen Topspin mit mehreren Winkeln und Tempi: realistische Geschwindigkeit, ausreichend Topspin, sichere Tischlandung.
- Mehrfacher Ballwechsel mit kurzer Noppe: Unterschnitt wird Kontakt für Kontakt schwächer, kippt aber nicht frühzeitig in Oberschnitt; tiefer Kontakt kann ihn vollständig neutralisieren.
- Für alle vier Beläge prüfen, dass der Gegner nach dem ersten und vor dem zweiten Aufprall trifft, früh losfährt und jeden gültigen Ball auf seiner Tischhälfte zurückspielt.
- Browserprüfung für Zeitlupe An/Aus, weiße Live-Ballfarbe bei Aus, unverändert oranges Review und fehlerfreie Fensterbedienung.
- Abschließender Sichttest der Gegnerbahnen am Desktop; die natürliche Wirkung in der Quest 3 bleibt als Headset-Test offen.