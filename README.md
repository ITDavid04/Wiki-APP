# Wiki-APP

Die **Bibliothek Lern-Wiki** als installierbare Web-App (PWA): das Team-Wiki aus der Umschulung FIAE und FISI
([ITDavid04/Bibliothek-Lern-Wiki](https://github.com/ITDavid04/Bibliothek-Lern-Wiki)) mit Startseite, Ranke und Prüfungs-Ampel.
Auf dem Handy lässt sie sich auf den Startbildschirm legen und läuft danach auch offline.

## Was drin ist

- **Bühne** mit zwölf Lernfeld-Würfeln (three.js), grün = Lernfeld hat Artikel, weiß gestrichelt = noch leer
- **Die Ranke**: eine 3D-Ranke wächst beim Scrollen durch die Seite und läuft beim Hochscrollen wieder zurück, an jedem Abschnitt geht eine Blüte auf; im Abschnitt „Die Ranke“ ist jedes Blatt ein Artikel, ein Klick auf einen Zweig öffnet die Kachel seiner Abteilung
- **Abteilungen, Lernfelder, Katalog mit Suche, Prüfungsblock mit Ampel und Prüfungs-Kit, Mitmachen**. Die Liste im Katalog
  erscheint erst, wenn du suchst, eine Abteilung wählst oder in einer Kachel „Im Katalog zeigen“ drückst.
- **App**: Manifest, Icons, Service Worker. Die App-Hülle wird beim ersten Besuch gespeichert, danach startet sie auch ohne Netz.
  Gibt es eine neue Version, erscheint unten „Neu laden“.
- **Lesen in der App**: Artikel öffnen als eigene Seite (`#/artikel/<pfad>`, Zurück-Taste funktioniert). Markdown kommt von
  `raw.githubusercontent.com`, wird mit marked umgewandelt und mit DOMPurify bereinigt. Ampel-Stellen (🔴 🟡 🟢) sind farbig
  markiert, „Nur ROT“ blendet Gelb und Grün aus. Einmal geöffnete Artikel bleiben offline verfügbar.
- **Lernstand**: pro Artikel „Noch nicht“, „Gelesen“, „Sitzt“; bis zum Ende gelesen setzt automatisch „Gelesen“.
  Die Blätter der Ranke zeigen den Stand (blass, grün, dunkelgrün).
- **Prüfungsmodus** (`#/pruefung`): alle Artikel mit Ampel zum Abhaken, mit Fortschritt und „Nächsten offenen öffnen“.
- **Mein Stand** (`#/stand`): Fortschritt pro Abteilung, Weiterlesen, alle Artikel offline speichern, Lernstand sichern und wiederherstellen.
- **Handy**: untere Leiste mit Start, Suchen, Prüfung, Mein Stand.

## Aufbau

| Ordner | Inhalt |
|---|---|
| `src/` | Quelltext: `index.html`, `app.css`, `app.js` (Seite, Lernstand), `scene.js` (3D), `reader.js` (Lesen, Prüfungsmodus, Mein Stand), `sw.js` (Service Worker), Manifest, Icons |
| `data/catalog.json` | Alle Artikel des Wikis mit Abteilung, Gruppe, Titel, Ampel und Link, erzeugt mit `tools/catalog.mjs` |
| `tools/` | `catalog.mjs` (Katalog aus dem Wiki), `build.mjs` (baut nach `docs/`), `serve.mjs` (Testserver), `test.mjs` (automatischer Test), `icons.py` (Icons) |
| `docs/` | Die fertige App. Wird gebaut, nicht von Hand bearbeiten. GitHub Pages veröffentlicht von hier. |

## Bauen, testen, ansehen

```bash
npm ci            # einmalig: Bibliotheken in den festen Versionen holen
npm run build     # baut docs/
npm test          # prüft Installierbarkeit, Service Worker, Start im Flugmodus, Fehler in der Konsole
npm run serve     # http://localhost:8080
```

`npm test` nutzt das installierte Chrome (`/usr/bin/google-chrome`, sonst `CHROME=/pfad npm test`).

## Veröffentlichen (GitHub Pages)

Einmalig im Repository: **Settings → Pages → Build and deployment → Deploy from a branch**, Branch `main`, Ordner `/docs`.
Danach ist die App unter `https://itdavid04.github.io/Wiki-APP/` erreichbar und auf dem Handy über „App installieren“
oder das Chrome-Menü „Zum Startbildschirm hinzufügen“ installierbar. Jeder Push mit neuem `docs/` ist ein Update.

Wichtig: Über GitHub Pages ist die App öffentlich. Impressum und Datenschutz sind noch Platzhalter und gehören vor dem
breiten Teilen ausgefüllt.

Für die Datenschutzerklärung relevant: Die App selbst hat keine Konten, kein Tracking und keine Cookies. Der Lernstand liegt
nur im Browser des Geräts (localStorage). Die App wird aber von GitHub Pages ausgeliefert und lädt Artikel von
`raw.githubusercontent.com`; dabei sieht GitHub wie bei jedem Webserver die IP-Adresse.

## Neue Artikel im Wiki

`data/catalog.json` wird mit `tools/catalog.mjs` aus einem Klon des Wikis erzeugt (im Repository: Stand 20.10.2026,
172 Artikel). Kommen Artikel dazu oder werden Dateien verschoben, bringst du sie so in die App:

```bash
git clone --depth 1 https://github.com/ITDavid04/Bibliothek-Lern-Wiki /tmp/wiki   # frischer Klon (im eigenen Klon reicht git pull)
npm run catalog -- /tmp/wiki   # schreibt data/catalog.json und zeigt, was sich geändert hat
npm run build                  # baut docs/ mit dem neuen Katalog
npm test                       # muss grün sein
git add data/catalog.json docs
git commit -m "Katalog: Stand des Wikis aktualisiert"
git push                       # GitHub Pages veröffentlicht, die App bietet „Neu laden“ an
```

Was das Skript dabei macht:

- **Artikel** sind alle committeten `.md`-Dateien im Klon. `README.md`, `LICENSE` und ähnliche Dateien zählen nicht mit.
  Nicht committete `.md`-Dateien meldet das Skript, sie fehlen im Katalog, bis sie im Wiki committet und gepusht sind
  (die App lädt die Artikel von GitHub).
- **Titel** ist die Überschrift in den ersten drei Textzeilen, sonst die erste Textzeile. Emojis und Fettschrift fallen weg,
  Gedankenstriche werden zu Doppelpunkten. Passt das bei einer Datei nicht, kommt ihr Titel in die Tabelle `OVERRIDE`
  oben im Skript.
- **Ampel**: Die Datei enthält 🔴 oder das Wort ROT.
- **Abteilung und Gruppe** kommen aus der Tabelle `GRUPPEN` oben im Skript (Ordner oder Datei im Wiki, der längste passende
  Pfad gewinnt). Liegt ein Artikel in einem neuen Ordner, meldet das Skript ihn als **NICHT EINSORTIERT** und lässt ihn
  weg, ohne abzubrechen. Dann eine Zeile in `GRUPPEN` ergänzen und das Skript noch einmal laufen lassen.
- **Stand** ist das Datum des letzten Commits im Klon.
- **Vergleich**: Am Ende listet das Skript neue und entfallene Artikel sowie geänderte Titel und Ampeln. Der Lernstand in der
  App hängt am Pfad der Datei. Steht eine Datei unter „Entfallen“ und ihr neuer Name unter „Neu“, wurde sie umbenannt
  oder verschoben, und ihr Lernstand beginnt in der App wieder bei null.

Änderungen am Text bestehender Artikel brauchen keinen neuen Build: Die App zeigt zuerst die gespeicherte Fassung, holt im
Hintergrund die aktuelle und zeigt sie beim nächsten Öffnen. Nur wenn sich Titel oder Ampel ändern, lohnt ein neuer Katalog.

## Regeln im Projekt

- Keine Gedankenstriche in Texten (der Build bricht sonst ab), Du-Ansprache, „Moin“
- Nichts erfinden: Zahlen und Titel kommen aus `data/catalog.json`
- Neue Paketversionen erst, wenn sie mindestens zwei Wochen alt sind
- `prefers-reduced-motion` wird beachtet, ohne WebGL zeigt die Seite Standbilder

## Lizenzen

Code: MIT (siehe `LICENSE`). Mitgelieferte Bibliotheken (three.js, Lenis, marked, DOMPurify) und die Schrift
Hanken Grotesk (SIL Open Font License) liegen mit ihren Lizenzen in `docs/vendor/LICENSES/`.
