# Wiki-APP

Die **Bibliothek Lern-Wiki** als installierbare Web-App (PWA): das Team-Wiki aus der Umschulung FIAE und FISI
([ITDavid04/Bibliothek-Lern-Wiki](https://github.com/ITDavid04/Bibliothek-Lern-Wiki)) mit Startseite, Ranke und Prüfungs-Ampel.
Auf dem Handy lässt sie sich auf den Startbildschirm legen und läuft danach auch offline.

## Was drin ist

- **Bühne** mit zwölf Lernfeld-Würfeln (three.js), grün = Lernfeld hat Artikel, weiß gestrichelt = noch leer
- **Die Ranke**: eine 3D-Ranke wächst beim Scrollen durch die Seite; im Abschnitt „Die Ranke“ ist jedes Blatt ein Artikel
- **Regale, Lernfelder, Katalog mit Suche, Prüfungsblock mit Ampel und Prüfungs-Kit, Mitmachen**
- **App**: Manifest, Icons, Service Worker. Die App-Hülle wird beim ersten Besuch gespeichert, danach startet sie auch ohne Netz.
  Gibt es eine neue Version, erscheint unten „Neu laden“.
- **Lesen in der App**: Artikel öffnen als eigene Seite (`#/artikel/<pfad>`, Zurück-Taste funktioniert). Markdown kommt von
  `raw.githubusercontent.com`, wird mit marked umgewandelt und mit DOMPurify bereinigt. Ampel-Stellen (🔴 🟡 🟢) sind farbig
  markiert, „Nur ROT“ blendet Gelb und Grün aus. Einmal geöffnete Artikel bleiben offline verfügbar.
- **Lernstand**: pro Artikel „Noch nicht“, „Gelesen“, „Sitzt“; bis zum Ende gelesen setzt automatisch „Gelesen“.
  Die Blätter der Ranke zeigen den Stand (blass, grün, dunkelgrün).
- **Prüfungsmodus** (`#/pruefung`): alle Artikel mit Ampel zum Abhaken, mit Fortschritt und „Nächsten offenen öffnen“.
- **Mein Stand** (`#/stand`): Fortschritt pro Regal, Weiterlesen, alle Artikel offline speichern, Lernstand sichern und wiederherstellen.
- **Handy**: untere Leiste mit Start, Suchen, Prüfung, Mein Stand.

## Aufbau

| Ordner | Inhalt |
|---|---|
| `src/` | Quelltext: `index.html`, `app.css`, `app.js` (Seite, Lernstand), `scene.js` (3D), `reader.js` (Lesen, Prüfungsmodus, Mein Stand), `sw.js` (Service Worker), Manifest, Icons |
| `data/catalog.json` | Alle Artikel des Wikis mit Regal, Gruppe, Titel, Ampel und Link |
| `tools/` | `build.mjs` (baut nach `docs/`), `serve.mjs` (Testserver), `test.mjs` (automatischer Test), `icons.py` (Icons) |
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

`data/catalog.json` ist der Katalog vom Stand des Wikis (14.10.2026, 172 Artikel). Kommen Artikel dazu oder werden Dateien
verschoben, muss er neu erzeugt und die App neu gebaut werden. Ein Skript dafür liegt hier noch nicht im Repository.
Änderungen an bestehenden Artikeln brauchen keinen neuen Build: Die App zeigt zuerst die gespeicherte Fassung, holt im
Hintergrund die aktuelle und zeigt sie beim nächsten Öffnen.

## Regeln im Projekt

- Keine Gedankenstriche in Texten (der Build bricht sonst ab), Du-Ansprache, „Moin“
- Nichts erfinden: Zahlen und Titel kommen aus `data/catalog.json`
- Neue Paketversionen erst, wenn sie mindestens zwei Wochen alt sind
- `prefers-reduced-motion` wird beachtet, ohne WebGL zeigt die Seite Standbilder

## Lizenzen

Code: MIT (siehe `LICENSE`). Mitgelieferte Bibliotheken (three.js, Lenis, marked, DOMPurify) und die Schrift
Hanken Grotesk (SIL Open Font License) liegen mit ihren Lizenzen in `docs/vendor/LICENSES/`.
