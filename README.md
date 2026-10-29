# Wiki-APP

Die **Bibliothek Lern-Wiki** als installierbare Web-App (PWA): das Team-Wiki aus der Umschulung FIAE und FISI
([ITDavid04/Lern-Wiki](https://github.com/ITDavid04/Lern-Wiki)) mit Startseite, Ranke und Prüfungs-Ampel.
Auf dem Handy lässt sie sich auf den Startbildschirm legen und läuft danach auch offline.

## Was drin ist

Ausführlich, mit allen Gimmicks, Texten und dem Änderungsprotokoll: [ReadmeUpdate.md](ReadmeUpdate.md).

- **Bühne** mit zwölf Lernfeld-Würfeln (three.js), grün = Lernfeld hat Artikel, weiß gestrichelt = noch leer
- **Die Ranke**: eine 3D-Ranke wächst beim Scrollen durch die Seite und läuft beim Hochscrollen wieder zurück, an jedem Abschnitt geht an einem kleinen Zweig eine Blüte auf; im Abschnitt „Die Ranke“ ist jedes Blatt ein Artikel, ein Klick auf einen Zweig öffnet die Kachel seiner Abteilung
- **Abteilungen, Lernfelder, Katalog mit Suche, Prüfungsblock mit Ampel und Prüfungs-Kit, Mitmachen**. Die Liste im Katalog
  erscheint erst, wenn du suchst, eine Abteilung wählst oder in einer Kachel „Im Katalog zeigen“ drückst.
- **App**: Manifest, Icons, Service Worker. Die App-Hülle wird beim ersten Besuch gespeichert, danach startet sie auch ohne Netz.
  Gibt es eine neue Version, erscheint unten „Neu laden“.
- **Lesen in der App**: Artikel öffnen als eigene Seite (`#/artikel/<pfad>`, Zurück-Taste funktioniert). Markdown kommt von
  `raw.githubusercontent.com`, wird mit marked umgewandelt und mit DOMPurify bereinigt. Ampel-Stellen (🔴 🟡 🟢) sind farbig
  markiert, „Nur ROT“ blendet Gelb und Grün aus. Formeln (`$…$`, `$$…$$`, `\(…\)`, `\[…\]`) zeichnet KaTeX, auch in Tabellen
  und offline. Einmal geöffnete Artikel bleiben offline verfügbar.
- **Lernstand**: pro Artikel „Noch nicht“, „Gelesen“, „Sitzt“; bis zum Ende gelesen setzt automatisch „Gelesen“.
  Die Blätter der Ranke zeigen den Stand (blass, grün, dunkelgrün).
- **Prüfungsmodus** (`#/pruefung`): alle Artikel mit Ampel zum Abhaken, mit Fortschritt und „Nächsten offenen öffnen“.
- **Mein Stand** (`#/stand`): Fortschritt pro Abteilung und Lernfeld, Weiterlesen, alle Artikel offline speichern, Lernstand sichern und wiederherstellen.
- **Erfolge**: Ein Lernfeld ist geschafft, wenn es Artikel hat und alle sitzen. In dem Moment gibt es einmal eine kleine Feier
  (Karte mit Blätterflug, Ansage für Screenreader, ohne Animation bei reduzierter Bewegung). Danach trägt die Kachel einen Stempel,
  der Würfel ein Häkchen, am Trieb in der Ranke blüht es, und Mein Stand zählt mit. Sind alle Lernfelder mit Artikeln geschafft,
  gibt es eine eigene Feier. Kommt ein neuer Artikel dazu, ist das Lernfeld wieder offen.
- **Bienen**: Jeder gelesene Artikel bekommt eine Biene, sie steht im Katalog, im Prüfungsmodus und in Mein Stand für „gelesen“.
  Beim ersten Gelesen oder Sitzt eines Artikels fliegt sie einmal ein (am Artikelende oder in der Zeile im Prüfungsmodus).
  In der Ranke summen Bienen um die Blüten der geschafften Lernfelder, ohne WebGL sitzt eine daneben.
- **Leseausweis** (in Mein Stand): 17 Stempel für Meilensteine, jeder mit Datum wie im Leihstempel. Bienen (1, 5, 10, 25, 75, 100
  und alle Artikel gelesen), KI-Anfänger, KI-Profi und KI-Nerd (Sammlung „Anfänger bis Nerd“ und Abteilung KI), Erstes Lernfeld,
  Prüfungsreif (alle Artikel mit Ampel sitzen), Dranbleiber und Dauerbrenner (7 und 15 Lerntage), Backup-Profi, Funkloch-sicher
  und Nachteule. Offene Stempel sind blass zu sehen, mit Bedingung und Fortschritt. Ein neuer Stempel bekommt eine kleine Karte,
  die wartet, bis keine Biene mehr fliegt und keine Lernfeld-Feier mehr offen ist. Stempel bleiben, nur Zurücksetzen löscht sie;
  die Sicherung nimmt sie mit.
- **Handy**: untere Leiste mit Start, Suchen, Prüfung, Mein Stand.
- **Fehler melden**: Fahne oben im Artikel, Link am Artikelende, im Menü, im Fuß und in Mein Stand. Ein kleines Formular fragt
  „Was stimmt nicht?“, Artikel, Abschnitt (die Überschrift, die gerade oben steht), markierte Stelle, Version und Gerät kommen
  automatisch dazu. Weiter geht es als vorausgefülltes Issue auf GitHub (braucht ein Konto) oder mit „Text kopieren“ für Teams.
- **Versionsnummer** (zum Beispiel `1.0.7`): steht im Fuß und in Mein Stand, im Hinweis „Neu laden“ und nach dem Update
  („Aktualisiert auf Version …“). Sie zählt sich beim Veröffentlichen selbst hoch, siehe unten.

## Aufbau

| Ordner | Inhalt |
|---|---|
| `src/` | Quelltext: `index.html`, `app.css`, `app.js` (Seite, Lernstand), `scene.js` (3D), `reader.js` (Lesen, Prüfungsmodus, Mein Stand), `melden.js` (Fehler melden), `sw.js` (Service Worker), Manifest, Icons |
| `data/catalog.json` | Alle Artikel des Wikis mit Abteilung, Gruppe, Titel, Ampel und Link, erzeugt mit `tools/catalog.mjs` |
| `tools/` | `catalog.mjs` (Katalog aus dem Wiki), `build.mjs` (baut nach `docs/`), `serve.mjs` (Testserver), `test.mjs` (automatischer Test), `icons.py` (Icons) |
| `.github/workflows/pages.yml` | Veröffentlichen über GitHub Actions: Katalog, Bauen, Testen, Hochladen |
| `docs/` | Die fertige App, entsteht mit `npm run build`. Liegt nicht im Repository, GitHub Actions baut sie beim Veröffentlichen selbst. |

## Bauen, testen, ansehen

```bash
npm ci            # einmalig: Bibliotheken in den festen Versionen holen
npm run build     # baut docs/
npm test          # prüft Installierbarkeit, Service Worker, Start im Flugmodus, Fehler in der Konsole
npm run serve     # http://localhost:8080
```

`npm test` nutzt das installierte Chrome (`/usr/bin/google-chrome`, sonst `CHROME=/pfad npm test`). Mit `CI=1 npm test`
läuft der Test wie auf GitHub: 3D in Software statt auf der Grafikkarte.

## Veröffentlichen (GitHub Pages über GitHub Actions)

Einmalig im Repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Danach erledigt der Workflow `.github/workflows/pages.yml` alles, bei jedem Push auf `main`, jede Nacht um 2:30 Uhr UTC
und auf Knopfdruck (**Actions → App veröffentlichen → Run workflow**):

1. Wiki frisch klonen und den Katalog erzeugen (`tools/catalog.mjs --streng`)
2. App bauen (`npm run build`), dabei die Versionsnummer bestimmen
3. Testen (`npm test`, 3D läuft dort in Software)
4. `docs/` zu GitHub Pages hochladen

Schlägt ein Schritt fehl, bleibt die bisherige Fassung online und GitHub schickt eine Mail. Was sich am Katalog geändert
hat (neu, entfallen, Titel, Ampel), steht in der Zusammenfassung des Laufs. Bei einem fehlgeschlagenen Test hängen dort
auch die Bildschirmfotos.

### Versionsnummer

Die Nummer hat drei Stellen, zum Beispiel `1.0.7`. Die ersten zwei stehen in `package.json` (`"version": "1.0.0"`),
die letzte zählt der Build selbst: Er holt `version.json` der veröffentlichten App und vergleicht die Prüfsumme. Ist alles
gleich, bleibt die Nummer, sonst geht sie eins hoch. Das passiert also genau dann, wenn die App „Neu laden“ anbietet, auch wenn
nur neue Artikel dazugekommen sind. Der nächtliche Lauf ohne Änderungen erhöht nichts.

- Größerer Schritt: in `package.json` zum Beispiel `"version": "1.1.0"` eintragen und pushen, dann geht es mit `1.1.0` weiter.
- Lokal (ohne `APP_URL`) heißt die Version `1.0.x-lokal`.
- Ist `version.json` online gerade nicht lesbar, bricht der Lauf ab, damit die Nummer nicht zurückspringt. Dann einfach
  später noch einmal **Run workflow**.

### Fehlermeldungen

„Auf GitHub melden“ öffnet ein neues Issue in diesem Repository mit Titel, Text und allen Angaben, Label `bug` (das Label
setzt GitHub nur bei Leuten mit Schreibrecht). Abgeschickt wird erst, wenn die Person auf GitHub selbst auf „Submit“ drückt.
„Text kopieren“ legt dieselben Angaben als einfachen Text in die Zwischenablage, zum Einfügen in Teams.

Die App ist unter `https://itdavid04.github.io/Wiki-APP/` erreichbar und auf dem Handy über „App installieren“ oder das
Chrome-Menü „Zum Startbildschirm hinzufügen“ installierbar. Nach jedem Update bietet sie „Neu laden“ an.

Über GitHub Pages ist die App öffentlich. Impressum und Datenschutz liegen im Wiki-Repo
([IMPRESSUM.md](https://github.com/ITDavid04/Lern-Wiki/blob/main/IMPRESSUM.md),
[DATENSCHUTZ.md](https://github.com/ITDavid04/Lern-Wiki/blob/main/DATENSCHUTZ.md)) und gelten für Wiki und App;
der Fuß der App verlinkt beide. Ändert sich, was die App lädt oder speichert, gehört die Datenschutzerklärung dort angepasst.

Für die Datenschutzerklärung relevant: Die App selbst hat keine Konten, kein Tracking und keine Cookies. „Fehler melden“
schickt nichts von selbst; erst wer auf GitHub abschickt oder den Text in Teams einfügt, gibt die Meldung weiter. Der Lernstand samt
Erfolgen, Bienen, Stempeln und Lerntagen liegt nur im Browser des Geräts (localStorage). Die App wird aber von GitHub Pages ausgeliefert und lädt Artikel von
`raw.githubusercontent.com`; dabei sieht GitHub wie bei jedem Webserver die IP-Adresse.

## Neue Artikel im Wiki

Neue oder verschobene Artikel kommen von selbst in die App: spätestens nach dem nächtlichen Lauf, sofort über
**Run workflow**. Der Workflow erzeugt den Katalog dabei jedes Mal frisch aus dem Wiki.

Nur wenn ein Artikel in einem **neuen Ordner** liegt, bricht der Lauf mit „NICHT EINSORTIERT“ ab. Dann in `tools/catalog.mjs`
eine Zeile in `GRUPPEN` ergänzen und pushen, der Push startet den Lauf neu.

Lokal ansehen, wie die App mit dem aktuellen Wiki aussieht:

```bash
git clone --depth 1 https://github.com/ITDavid04/Lern-Wiki /tmp/wiki   # frischer Klon (im eigenen Klon reicht git pull)
npm run catalog -- /tmp/wiki   # schreibt data/catalog.json und zeigt, was sich geändert hat
npm run build                  # baut docs/ mit dem neuen Katalog
npm test                       # muss grün sein
npm run serve                  # http://localhost:8080
```

`data/catalog.json` im Repository (Stand 20.10.2026, 172 Artikel) dient der lokalen Vorschau und den Tests. Online nimmt
der Workflow immer den frischen Katalog. Committen musst du ihn nur, wenn du lokal den neuen Stand als Grundlage willst.

Was das Skript dabei macht:

- **Artikel** sind alle committeten `.md`-Dateien im Klon. `README.md`, `LICENSE`, die Rechtstexte (`IMPRESSUM.md`,
  `DATENSCHUTZ.md`, `NUTZUNGSHINWEISE.md`) und ähnliche Dateien zählen nicht mit.
  Nicht committete `.md`-Dateien meldet das Skript, sie fehlen im Katalog, bis sie im Wiki committet und gepusht sind
  (die App lädt die Artikel von GitHub).
- **Titel** ist die Überschrift in den ersten drei Textzeilen, sonst die erste Textzeile. Emojis und Fettschrift fallen weg,
  Gedankenstriche werden zu Doppelpunkten. Passt das bei einer Datei nicht, kommt ihr Titel in die Tabelle `OVERRIDE`
  oben im Skript.
- **Ampel**: Die Datei enthält 🔴 oder das Wort ROT.
- **Abteilung und Gruppe** kommen aus der Tabelle `GRUPPEN` oben im Skript (Ordner oder Datei im Wiki, der längste passende
  Pfad gewinnt). Liegt ein Artikel in einem neuen Ordner, meldet das Skript ihn als **NICHT EINSORTIERT** und lässt ihn
  weg, ohne abzubrechen. Mit `--streng` (so im Workflow) endet es dann mit Fehler. Abhilfe: eine Zeile in `GRUPPEN`
  ergänzen und das Skript noch einmal laufen lassen.
- **Stand** ist das Datum des letzten Commits im Klon.
- **Vergleich**: Am Ende listet das Skript neue und entfallene Artikel sowie geänderte Titel und Ampeln. Der Lernstand in der
  App hängt am Pfad der Datei. Steht eine Datei unter „Entfallen“ und ihr neuer Name unter „Neu“, wurde sie umbenannt
  oder verschoben, und ihr Lernstand beginnt in der App wieder bei null.

Änderungen am Text bestehender Artikel brauchen keinen neuen Lauf: Die App zeigt zuerst die gespeicherte Fassung, holt im
Hintergrund die aktuelle und zeigt sie beim nächsten Öffnen. Geänderte Titel oder Ampeln kommen mit dem nächsten Lauf.

## Regeln im Projekt

- Keine Gedankenstriche in Texten (der Build bricht sonst ab), Du-Ansprache, „Moin“
- Nichts erfinden: Zahlen und Titel kommen aus `data/catalog.json`
- Neue Paketversionen erst, wenn sie mindestens zwei Wochen alt sind
- `prefers-reduced-motion` wird beachtet, ohne WebGL zeigt die Seite Standbilder

## Lizenzen

Code: MIT (siehe `LICENSE`). Mitgelieferte Bibliotheken (three.js, Lenis, marked, DOMPurify, KaTeX mit seinen Schriften) und die Schrift
Hanken Grotesk (SIL Open Font License) liegen mit ihren Lizenzen in der gebauten App unter `docs/vendor/LICENSES/`.
