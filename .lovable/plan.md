# Anpassungen #8: Griffwinkel-Regler und Desktop-Steuerung

## 1. Schlägergriff korrekt nach oben ausrichten
- Die zuletzt vorgenommene Kipprichtung wird korrigiert: Der Griff zeigt weiter nach unten, während sich das Schlägerblatt nach oben dreht.
- Der korrigierte Winkel wird der neue Ausgangswert.
- Schlägermodell, Blattnormale und physische Trefferfläche verwenden weiterhin exakt dieselbe Ausrichtung.

## 2. Fein justierbarer Winkelregler
- Im Reiter **Anzeige** des Einstellungsmenüs kommt ein kompakter Winkelregler für den Schlägergriff hinzu.
- Der Regler erlaubt eine feine Abstimmung in Grad mit klarer aktueller Wertanzeige und kleinen Minus-/Plus-Schritten, damit er mit XR-Controllern zuverlässig bedienbar bleibt.
- Der Einstellbereich wird auf eine praxisgerechte Spanne um den korrigierten Ausgangswert begrenzt.
- Änderungen wirken sofort auf Darstellung und Trefferfläche des Spielerschlägers; der Gegnerschläger bleibt unverändert.

## 3. Griffwinkel und Tischhöhe dauerhaft speichern
- Der gewählte Griffwinkel und die eingestellte Tischhöhe werden lokal im Browser beziehungsweise Headset gespeichert und beim nächsten Start wiederhergestellt.
- Wenn noch kein Wert gespeichert ist oder ein ungültiger Wert vorliegt, werden sicher der korrigierte Standardwinkel beziehungsweise die normale Tischhöhe verwendet.
- Nur diese persönlichen Kalibrierungen werden gespeichert; Ballserien und Auswertungen bleiben weiterhin sitzungslokal.

## 4. Einklappbare Desktop-Steuerung
- Außerhalb des XR-Modus erscheint am Bildrand eine kurze, gut lesbare Steuerungsübersicht.
- Sie nennt nur die tatsächlich verfügbaren Desktop-Eingaben: Maus für den Schläger, Mausrad oder W/S für die Neigung, Leertaste für den Ball, Tab für Einstellungen sowie die vorhandenen Auswahl-Tasten.
- Die Hilfe lässt sich einklappen und über ein kleines Hilfe-Symbol wieder öffnen.
- In VR wird diese Desktop-Hilfe nicht angezeigt.

## Technische Details
- `settings.ts`: Griffwinkel und Tischhöhe mit Begrenzung, Standardwerten und gezielter Speicherung/Hydrierung ergänzen; SSR-sicher erst im Browser auf gespeicherte Werte zugreifen.
- `Simulation.tsx`: die feste `GRIP_ROT` durch eine aus dem gespeicherten Winkel berechnete Quaternion ersetzen; Offset weiterhin in der resultierenden Griffausrichtung anwenden.
- `LeftMenu.tsx`: Regler-/Stepper-Zeile in **Anzeige** ergänzen und das Layout so verdichten, dass alle Optionen im vorhandenen Panel bleiben.
- `XRScene.tsx`: einklappbare Desktop-Hilfe über der 3D-Ansicht ergänzen und anhand des XR-Status ausblenden.
- Kleine Tests für Standardwerte, zulässigen Winkelbereich und gespeicherte Kalibrierungen ergänzen; bestehende Physiktests weiter ausführen.
