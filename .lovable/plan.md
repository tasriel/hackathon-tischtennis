# Gegner mit vier Belägen

## Ablauf eines Ballwechsels
```text
Trigger -> Einspielen (Schnitt-Variante) -> du schlägst (Schlag 1)
        -> Gegner-Schläger spielt Beispielball (Belag) -> du schlägst (Schlag 2) -> Ende bis Trigger
```
- Landet dein Schlag 1 nicht auf der Gegnerseite, endet der Ballwechsel wie bisher.
- Der Gegner spielt keinen "Siegball", sondern einen typischen Lehrball für seinen Belag: mittig-tief, sicher übers Netz.
- Beim Anflug auf dich läuft die gewohnte Zeitlupe, der Spin-Text steht über dem Ball, Farbwechsel orange bleibt.

## Belag-Verhalten (recherchiert, vor Umsetzung kurz per Websuche bestätigt)
| Belag | Interaktion mit Ball | Typische Gegnerbewegung | Spin des Rückballs |
|---|---|---|---|
| Glatt | hohe Reibung, erzeugt viel eigenen Spin | Topspin gegen Unterschnitt / Schupf gegen Unterschnitt | eigener, starker Spin (meist Oberschnitt) |
| Lange Noppe ohne Schwamm | sehr wenig Reibung, Noppen knicken um, kaum eigener Spin | Blocken / Schupfen | Spin-Umkehr: dein Oberschnitt kommt als Unterschnitt zurück, dein Unterschnitt als leichter Oberschnitt/"leer"; langsam, flach |
| Kurze Noppe | mittlere Reibung, wenig spinanfällig | schneller flacher Schlag / Konter | wenig Spin, schnell, flache Kurve |
| Anti | fast keine Reibung, schluckt Tempo und Spin | passives Blocken | kaum Spin, leichte Umkehr, sehr langsam, kurz |

- Der Rückball wird aus dem echten Ball nach deinem Schlag berechnet (ankommender Spin zählt), nicht fest vorgegeben – so funktioniert z.B. die Spin-Umkehr der langen Noppe ehrlich.
- Der Belag beeinflusst zusätzlich leicht das erste Einspielen (Tempo/Bogen; z.B. Anti langsamer, kurze Noppe flacher). Der Spin des ersten Balls kommt weiterhin aus "Schnitt-Variante".

## Neues Fenster "Belag Gegner"
- Optionen untereinander: Glatt, lange Noppe, kurze Noppe, Anti. Desktop zusätzlich Tasten 5/6/7/8.
- Platz: ganz links neben den bestehenden Fenstern, leicht hinter dem Spieler, gleiche Optik und Ausrichtung.
- Wechsel startet keinen Ball.

## Gegner-Schläger
- Schwebender Schläger auf der Gegenseite (gleiches austauschbares Modell, Belagfarbe je Typ als Platzhalter bis zu den echten Texturen).
- Er fährt zum Treffpunkt und zeigt die Belag-typische Bewegung (Blattwinkel + Schwungrichtung) kurz vor und nach dem Treffer.

## Review mit zwei Aufnahmen
- Beide deiner Schläge werden gespeichert, angezeigt wird immer der neueste.
- Kleine Pfeile links und rechts am Review-Fenster (Laserzeiger/Trigger, Desktop Klick bzw. Tasten , und .) wechseln zwischen Schlag 1 und 2; Anzeige "Schlag 1/2".
- Perfekter Schlag und Coaching für Schlag 2 richten sich nach Spin und Tempo des Gegnerballs.

## Nicht jetzt
Punkte, längere Ballwechsel, echte Belag-Texturen (folgen später).

## Technische Details
- `constants.ts`: `RubberType = "smooth" | "longPips" | "shortPips" | "anti"`, `RUBBERS` mit grip, restitution, spinReversal (0–1), speedFactor, Ziel-Schwungrichtung/Blattwinkel; Serve-Modifikator pro Belag.
- `physics.ts`: `collideRacket` bekommt optionale Belag-Parameter (Grip/Restitution); lange Noppe/Anti: geringer Grip + Anteil des eingehenden Spins wird gespiegelt erhalten.
- `lib/opponent.ts` (neu): sucht mit derselben Physik (wie `idealShot.ts`) Gegner-Blattwinkel/Tempo innerhalb der Belag-Bandbreite, Ziel = Mitte/tief auf Spielerseite, sicherer Netzabstand.
- `settings.ts`: `rubber` ergänzen; `LeftMenu.tsx`: dritte Tafel vertikal.
- `components/xr/OpponentRacket.tsx` (neu, SceneModel-Hülle) animiert Pose aus `opponent.ts`.
- `Simulation.tsx`: Phasen `serve -> player1 -> opponent -> player2 -> done`; Zeitlupe/Ideal/Coaching pro Spielerschlag; Clips in Array (max. 2).
- `SpinOverlay.tsx`: Clip-Index, Pfeil-Buttons am Panel, Label "Schlag n/2"; `strokes.ts`/`coaching.ts` für Schlag 2 nach ankommendem Spin.
- `AGENTS.md`: Regel für Belag-Parameter als Physik-Konstanten, getrennt vom Gegner-Visual.
