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

## Aufbau

| Ordner | Inhalt |
|---|---|
| `src/` | Quelltext: `index.html`, `app.css`, `app.js` (Seite), `scene.js` (3D), `sw.js` (Service Worker), Manifest, Icons |
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

## Regeln im Projekt

- Keine Gedankenstriche in Texten (der Build bricht sonst ab), Du-Ansprache, „Moin“
- Nichts erfinden: Zahlen und Titel kommen aus `data/catalog.json`
- Neue Paketversionen erst, wenn sie mindestens zwei Wochen alt sind
- `prefers-reduced-motion` wird beachtet, ohne WebGL zeigt die Seite Standbilder

## Lizenzen

Code: MIT (siehe `LICENSE`). Mitgelieferte Bibliotheken (three.js, Lenis, marked, DOMPurify) und die Schrift
Hanken Grotesk (SIL Open Font License) liegen mit ihren Lizenzen in `docs/vendor/LICENSES/`.
