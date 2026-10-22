# Kontext für eine neue Sitzung: Erfolg, wenn ein Lernfeld geschafft ist

Stand: 22.10.2026. Diese Datei ist der Einstieg für eine frische Sitzung im Repo `ITDavid04/Wiki-APP`.
Sie fasst die Idee, die Absprachen und die Stellen im Code zusammen, damit niemand den alten Verlauf braucht.

## Startprompt (zum Reinkopieren)

> Lies `KONTEXT_Lernfeld-Erfolg.md` im Repo `ITDavid04/Wiki-APP` und setz die Funktion „Erfolg, wenn ein Lernfeld
> geschafft ist“ um. Halte dich an die Regeln aus der README und aus dieser Datei. Erst einen kurzen Plan zeigen
> (welche Dateien, welche Anzeige wo), nach meinem OK bauen. Am Ende `npm run build` und `npm test`, beides grün.

## Woher die Idee kommt

Beim Werbespot für die App (Repo `ITDavid04/Hyperframes`, Ordner `videos/wiki-app-spot-klar/`) kam aus dem Feedback
der Vorschlag: „Einen Erfolg anzeigen, wenn man ein Lernfeld geschafft hat.“ Im Video ist das bewusst nicht drin, weil
die App es noch nicht kann (Regel: nichts zeigen, was es nicht gibt). Die Funktion soll jetzt in die App selbst.

## Was „geschafft“ heißt

- Ein Lernfeld ist geschafft, wenn es **mindestens einen Artikel** hat und **alle seine Artikel auf „Sitzt“** stehen
  (Lernstand 2).
- Lernfelder ohne Artikel (im Katalog vom 20.10.2026: LF11a und LF12a) können nicht geschafft werden und zeigen nichts.
- Kommt später ein neuer Artikel in ein geschafftes Lernfeld, ist es wieder offen. Das ist gewollt und ehrlich: Die
  Anzeige leitet sich immer aus dem aktuellen Lernstand ab und wird nicht dauerhaft „eingefroren“.

## Wie es sich anfühlen soll (Vorschlag, im Plan noch abstimmen)

1. **Im Moment des Schaffens** (der letzte Artikel des Lernfelds wird auf „Sitzt“ gesetzt, egal ob im Artikel oder im
   Prüfungsmodus): kurze Feier, zum Beispiel eine Karte „LF3 geschafft!“ mit dem Titel des Lernfelds, Häkchen und einer
   kleinen Animation. Text in Du-Ansprache, kurz, ohne Gedankenstriche.
2. **Dauerhaft sichtbar:**
   - Kachel des Lernfelds im Abschnitt „Lernfelder“ (`#lf<n>`): Abzeichen „geschafft“ statt bzw. neben der Pille.
   - Lernfeld-Würfel auf der Bühne (3D): sichtbar anders, zum Beispiel Häkchen auf dem Würfel oder ein Leuchten.
   - „Mein Stand“ (`#/stand`): eine Zeile wie „2 von 10 Lernfeldern geschafft“, eventuell Liste der geschafften.
3. **Nur einmal feiern:** Die Feier soll nicht bei jedem Laden erneut aufpoppen. Dafür merkt sich die App, welche
   Lernfelder schon gefeiert wurden (eigener `localStorage`-Schlüssel, zum Beispiel `lernwiki-erfolge-v1`). Die
   dauerhafte Anzeige hängt nicht an diesem Schlüssel, sondern immer am Lernstand.
4. **Barrierefrei:** Feier-Text zusätzlich über eine `aria-live`-Region ansagen. Bei `prefers-reduced-motion` keine
   Animation, nur Text und Häkchen. Ohne WebGL zeigt die Seite Standbilder; die Anzeige auf Kachel und in „Mein Stand“
   muss trotzdem funktionieren.

## Wo im Code (Stand dieses Commits)

| Was | Wo | Hinweis |
|---|---|---|
| Lernstand speichern/lesen | `src/app.js` ab Zeile ~19 (`Stand`, `STAND_KEY = 'lernwiki-stand-v1'`) | Werte: 0 noch nicht, 1 gelesen, 2 sitzt. Schlüssel ist der Pfad der Datei im Wiki (`pathOf`). `Stand.set` feuert das Event `fiae-stand` mit `detail: { p, s }`; `Stand.replace` (Wiederherstellen) feuert es mit leerem `detail`. |
| Zählhilfe | `Stand.count(filter)` in `src/app.js` | Liefert `{ gelesen, sitzt }` für einen Filter über `D.artikel`. |
| Zugriff aus anderen Modulen | `window.FIAE` (`F.stand`, `F.pathOf`, `F.D`, `F.toast`, `F.LEAF`) | `src/reader.js` holt sich `Stand = F.stand`. |
| Lernfelder und Artikel | `data/catalog.json`: `lf[]` mit `n` (Nummer), `k` (z. B. `LF10a`), `titel`, `a` (Anzahl Artikel), `rot`; `artikel[]` mit `lf` (Nummer), `r` (Abteilung, `lf` für Lernfelder) | Artikel eines Lernfelds: `D.artikel.filter(a => a.lf === l.n)` (so schon in `src/app.js` bei den Kacheln). |
| Kacheln der Lernfelder | `src/app.js` ab Zeile ~339 (`tilesLf`, `li.id = 'lf' + l.n`) | Pille `ok`/`wip`, Detailbereich mit Ampel-Meter. |
| Lernstand neu malen | `paintStand` in `src/app.js` (hört auf `fiae-stand`, Zeile ~534) | Guter Ort, um Kachel-Abzeichen aktuell zu halten. |
| Würfel auf der Bühne | `src/scene.js`, `bootStage` ab Zeile ~61, `labelTex(l)` malt die Würfel-Beschriftung | Würfel: grün = hat Artikel, weiß gestrichelt = leer. `recolor` (Zeile ~516) zeigt, wie Szene-Teile auf `fiae-stand` reagieren. |
| Artikel auf „Sitzt“ setzen | `src/reader.js` Zeile ~132 (Knöpfe im Artikel) und ~306 (Häkchen im Prüfungsmodus) | Beide laufen über `Stand.set`, also reicht es, auf `fiae-stand` zu hören. |
| Mein Stand | `renderStand` in `src/reader.js` ab Zeile ~328 | Zahlenkacheln `.stand-nums`, Balken pro Abteilung. |
| Toast | `F.toast(text, knopfText, aktion, ms)` | Für eine kleine Variante der Feier nutzbar, eine eigene Feier-Karte ist aber schöner. |
| Sichern/Wiederherstellen | `src/reader.js` ab Zeile ~396 | Lernstand wird gesichert; die Erfolge leiten sich daraus ab. Beim Wiederherstellen keine Feier-Lawine auslösen (z. B. Feier nur bei `detail.p`, nicht bei `Stand.replace`). |
| Automatischer Test | `tools/test.mjs` (puppeteer, Chrome) | Neue Prüfung ergänzen, z. B.: alle Artikel von LF1 per `localStorage` auf 2 setzen, neu laden, Kachel `#lf1` zeigt „geschafft“, „Mein Stand“ zählt 1 Lernfeld. Und: letzten Artikel per Prüfungsmodus abhaken, Feier erscheint genau einmal. |

Zeilennummern sind ungefähre Angaben vom 22.10.2026, im Zweifel per `grep` suchen.

## Regeln aus dem Projekt (README), die hier zählen

- Keine Gedankenstriche in Texten in `src/` (der Build bricht sonst ab), Du-Ansprache, „Moin“ ist willkommen.
- Nichts erfinden: Zahlen und Titel kommen aus `data/catalog.json`.
- Neue Paketversionen erst, wenn sie mindestens zwei Wochen alt sind. Für diese Funktion sollte kein neues Paket nötig sein.
- `prefers-reduced-motion` beachten, ohne WebGL zeigt die Seite Standbilder.
- Lernstand bleibt nur auf dem Gerät (kein Konto, kein Tracking); das gilt auch für die neuen Erfolge.

## Prüfen, bevor es fertig ist

```bash
npm ci
npm run build     # muss ohne Gedankenstrich-Fehler durchlaufen
npm test          # alle Prüfungen grün (lokal: CHROME=/pfad npm test, wie auf GitHub: CI=1 npm test)
npm run serve     # http://localhost:8080, auch am Handy-Format ansehen
```

Hinweis: Am 21.10.2026 schlugen in einer Cloud-Umgebung 2 von 27 Prüfungen fehl (unter anderem „Ungelesener Artikel
offline: verständlicher Hinweis“). Das sah nach Umgebung aus, wurde aber nicht untersucht. Vor dem Bauen einmal
`npm test` auf dem unveränderten Stand laufen lassen, damit klar ist, welche Fehler schon vorher da waren.

## Offene Fragen für den Plan

- Wie groß soll die Feier sein: kleine Karte unten, oder ein kurzer Vollbild-Moment mit Konfetti in App-Farben?
- Soll ein geschafftes Lernfeld auch in der Ranke (Abschnitt „Die Ranke“) auffallen, zum Beispiel mit einer Blüte am Zweig?
- Gibt es zusätzlich einen Gesamterfolg, wenn alle Lernfelder mit Artikeln geschafft sind?
