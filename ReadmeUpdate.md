# Wiki-APP: Funktionen und Gimmicks

> **Stand:** 23.10.2026
> **App-Stand:** Commit `5b005ca` (Fehler melden, Versionsnummer, Formeln), ab hier Version 1.0.0
> **Katalog:** 172 Artikel in 6 Abteilungen, 75 davon mit Prüfungs-Ampel, Wiki-Stand 20.10.2026
> **Live:** https://itdavid04.github.io/Wiki-APP/
> **Pflege:** Wie diese Seite aktuell bleibt, steht in [Abschnitt 10](#10-so-bleibt-diese-seite-aktuell)

Diese Seite beschreibt, **was die App kann**: jede Funktion, jedes Gimmick und wo es zu finden ist.
Wie man die App baut, testet und veröffentlicht, steht in der [README](README.md). Kommt eine Funktion dazu oder fällt
eine weg, wird diese Seite mitgepflegt.

> **Grundidee:** Die Bibliothek ist ein Garten. Jeder Artikel ist ein Blatt an der Ranke, jede Abteilung ein Zweig.
> Wer liest, bekommt Bienen, wer ein Lernfeld schafft, lässt eine Blüte aufgehen, und Meilensteine landen als Stempel
> im Leseausweis.

---

## Inhalt

| **Nr.** | **Abschnitt** | **Worum es geht** |
|---|---|---|
| 1 | [Überblick](#1-überblick) | Alle Funktionen auf einen Blick |
| 2 | [Startseite](#2-startseite) | Ladebildschirm, Würfel, Ranke, Kacheln, Katalog, Prüfung, Mitmachen |
| 3 | [Lesen und Lernen](#3-lesen-und-lernen) | Artikelseite, Lernstand, Prüfungsmodus, Mein Stand |
| 4 | [Belohnungen](#4-belohnungen) | Bienen, Lernfeld geschafft, Leseausweis mit Stempeln |
| 5 | [App auf dem Gerät](#5-app-auf-dem-gerät) | Installieren, offline, Updates, Versionsnummer, Fehler melden, Handy-Leiste, hell und dunkel |
| 6 | [Barrierefreiheit](#6-barrierefreiheit) | Tastatur, Screenreader, reduzierte Bewegung, ohne 3D |
| 7 | [Daten und Speicher](#7-daten-und-speicher) | Was die App auf dem Gerät speichert |
| 8 | [Technik in Kürze](#8-technik-in-kürze) | Dateien, Bibliotheken, Veröffentlichen, Tests |
| 9 | [Änderungsprotokoll](#9-änderungsprotokoll) | Was wann dazukam oder wegfiel |
| 10 | [So bleibt diese Seite aktuell](#10-so-bleibt-diese-seite-aktuell) | Anleitung zum Pflegen |

---

## 1. Überblick

| **Bereich** | **Funktion** | **Wo** |
|---|---|---|
| Start | Ladebildschirm „Moin. Die Ranke wird gegossen.“ | beim Öffnen |
| Start | 12 Lernfeld-Würfel in 3D | Bühne ganz oben |
| Start | Wegweiser und Zahlen zur Bibliothek | Intro |
| Start | Die Ranke: jedes Blatt ein Artikel, wächst beim Scrollen | Abschnitt 01 und die ganze Seite |
| Start | Kacheln der 6 Abteilungen und 12 Lernfelder | Abschnitte 02 und 03 |
| Start | Katalog mit Suche und Filtern | Abschnitt 04 |
| Start | Prüfungs-Ampel, Prüfungs-Kit, Einstieg in den Prüfungsmodus | Abschnitt 05 |
| Start | Mitmachen | Abschnitt 06 |
| Lesen | Artikel in der App lesen, mit Ampel und „Nur ROT“ | `#/artikel/<pfad>` |
| Lernen | Lernstand je Artikel: Noch nicht, Gelesen, Sitzt | Artikelende, Prüfungsmodus |
| Lernen | Prüfungsmodus: alle Artikel mit Ampel zum Abhaken | `#/pruefung` |
| Lernen | Mein Stand: Fortschritt, Lernfelder, Leseausweis, Sichern | `#/stand` |
| Belohnung | Biene je gelesenem Artikel, fliegt einmal ein | Artikelende, Prüfungsmodus, Katalog |
| Belohnung | Lernfeld geschafft: Feier, Stempel auf der Kachel, Häkchen am Würfel, Blüte mit Bienen | überall, wo Lernfelder vorkommen |
| Belohnung | Gesamtfeier, wenn alle Lernfelder mit Artikeln geschafft sind | Feier-Karte, Mein Stand |
| Belohnung | Leseausweis mit 17 Stempeln | Mein Stand |
| Gerät | Installierbar, offline, „Neu laden“ bei Updates | ganze App |
| Gerät | Versionsnummer, zählt bei jedem Update selbst hoch | Fuß, Mein Stand, Hinweis „Neu laden“ |
| Hilfe | Fehler melden: Formular mit Artikel, Abschnitt, Version und Gerät, weiter zu GitHub oder als Text für Teams | Fahne im Artikel, Artikelende, Menü, Fuß, Mein Stand |
| Gerät | Untere Leiste am Handy | Handy |
| Gerät | Hell und dunkel | Knopf oben rechts |

---

## 2. Startseite

### 2.1 Ladebildschirm und Kopfleiste

| **Teil** | **Was es tut** |
|---|---|
| Ladebildschirm | „Moin. Die Ranke wird gegossen.“ mit sechs Feldern, die sich beim Laden füllen. Höchstens 3,5 Sekunden, bei reduzierter Bewegung gar nicht. |
| Kopfleiste | Theme-Knopf, „Mein Stand“, „Suchen“ und das Menü. Bleibt oben stehen und bekommt beim Scrollen einen Hintergrund. |
| Menü | Springt zu allen Abschnitten (01 bis 06), zu Prüfungsmodus, Mein Stand, GitHub und „App installieren“. Escape schließt es. |
| Mauszeiger-Ring | Am Desktop folgt ein Ring der Maus und wird über Klickbarem größer. |
| Sanftes Scrollen | Scrollen gleitet nach (Lenis), bei reduzierter Bewegung nicht. |

### 2.2 Bühne mit den Lernfeld-Würfeln

- **12 Würfel**, einer je Lernfeld (LF1 bis LF12a), in 3D (three.js).
- **Grün** heißt: Das Lernfeld hat Artikel. **Weiß gestrichelt** heißt: noch leer (zurzeit LF11a und LF12a).
- Die Würfel schweben und **weichen der Maus aus**. Darüber zeigt ein Hinweis Titel, Artikelzahl und Ampel-Anzahl,
  ein Klick deckt die Kachel des Lernfelds auf.
- **Geschafftes Lernfeld:** gelbes Häkchen auf dem Würfel, ein leichter Schimmer, und wer das Lernfeld gerade geschafft hat,
  sieht den Würfel beim nächsten Besuch der Startseite einmal drehen.
- Wird das Gerät langsam, senkt die Bühne von selbst die Auflösung.

### 2.3 Intro

- Kurzer Text, worum es geht, und ein **Wegweiser**: „Neu hier: Start mit LF1“, „Prüfung naht“, „Thema suchen“, „Stöbern“,
  „Weiterlesen“ (zuletzt geöffneter Artikel) und „App installieren“.
- Drei **Zahlen** aus dem Katalog: Artikel im Repository, Abteilungen, Lernfelder mit Artikeln.

### 2.4 Die Ranke

> **Merksatz:** Stängel = die Seite, Zweig = Abteilung, Trieb = Gruppe, Blatt = Artikel.

| **Teil** | **Bedeutung** |
|---|---|
| Stängel | Wächst beim Runterscrollen von der Bühne bis zum Seitenende und läuft beim Hochscrollen im selben Tempo zurück. |
| 6 Zweige | Einer je Abteilung, mit Beschriftung und Artikelzahl. Ein Klick auf einen Zweig deckt die Kachel der Abteilung auf. |
| Triebe | Eine Gruppe innerhalb der Abteilung (beim Zweig „Lernfelder“: ein Trieb je Lernfeld). |
| Blätter | Je Artikel ein Blatt. Farbe nach Lernstand: blass = noch nicht, grün = gelesen, dunkelgrün = sitzt. |
| Rote Knospe | Der Artikel hat eine Prüfungs-Ampel. |
| Blüten an den Abschnitten | An jedem Abschnitt (01 bis 06) geht an einem kleinen Zweig eine Blüte auf, dazu eine große am Seitenende. |
| Blüte am Trieb | Ist ein Lernfeld geschafft, blüht sein Trieb gelb (siehe [4.2](#42-lernfeld-geschafft)). |
| Bienen | Um jede Blüte eines geschafften Lernfelds fliegen zwei Bienen in Achten, mal vor, mal hinter den Blättern. |
| Deko | Kleine Blätter und Spiralranken am Stängel. |

- **Blatt anfassen:** Am Desktop zeigt ein Hinweis Titel, Abteilung, Ampel und Lernstand, ein Klick öffnet den Artikel.
  Am Handy zeigt einmal Tippen den Titel, ein zweites Tippen öffnet ihn (dieser Hinweis steht auch auf der Seite).
- Neben der Ranke: **„Dein Stand“** mit Biene („🐝 17 von 172 gelesen, 17 sitzen“), Blattfarben-Legende,
  Knopf „Mein Stand ansehen“ und die **Legende der Abteilungen**, die per Tastatur zu denselben Kacheln führt.
- Link „Was der rote Punkt heißt“ springt zur Erklärung der Ampel.

### 2.5 Kacheln: Abteilungen und Lernfelder

| **Kachel** | **Deckblatt** | **Aufgedeckt** |
|---|---|---|
| Abteilung (6) | Nummer, Name, Artikelzahl | Beschreibung, Balken mit Anteil der Ampel-Artikel, Gruppen mit Zahlen, „Im Katalog zeigen“ |
| Lernfeld mit Artikeln (10) | Nummer, Titel, Artikelzahl; geschafft: gelber Stempel „geschafft“ | Ampel-Balken, die ersten vier Artikel, „Alle im Katalog“; oben die Pille mit Lernstand: „4 Artikel“, „3 von 8 sitzen“ oder gelb „alle 4 sitzen“ |
| Lernfeld ohne Artikel (2) | gestrichelt, „noch leer“ | „Hier liegt noch nichts. Magst du den ersten Artikel schreiben?“ mit Link zu Mitmachen |

Aufdecken geht am Desktop per Maus, sonst per Tippen. Escape deckt wieder zu.

### 2.6 Katalog

- **Suche** über Titel, Gruppe und Abteilung. Groß und klein, Akzente und ß sind egal, Treffer werden markiert.
- **Filter:** „Alle“, je Abteilung ein Chip und „nur mit Ampel“.
- Die **Liste erscheint erst**, wenn jemand sucht, filtert oder in einer Kachel „Im Katalog zeigen“ drückt.
- Gruppen lassen sich auf- und zuklappen und zeigen ihre Zahl. Roter Punkt = Artikel mit Ampel.
- Rechts am Artikel steht der Lernstand: **Biene** = gelesen, **Biene mit „SITZT“** = sitzt.

### 2.7 Prüfung

- Erklärung der **Ampel**: ROT = Prüfungsstoff (AP1, Fachgespräch), GELB = Kontextwissen, GRÜN = nice to know.
- Zahlen: Artikel mit Ampel, Artikel in der Abteilung Prüfung, Lernfelder mit Artikeln.
- Knopf **„Prüfungsmodus starten“**.
- **Prüfungs-Kit:** Spickzettel Übersicht, Spickzettel AP1, Spickzettel AP2, WiSo Multiple Choice, Übungsblätter mit Lösungen
  (öffnen auf GitHub).

### 2.8 Mitmachen und Fuß

- Drei Schritte, wie man Artikel ergänzt, und der Link zum Wiki auf GitHub.
- Fuß: „Viel Erfolg bei der Prüfung.“ (hier endet die Ranke mit ihrer großen Blüte), Datum des letzten Wiki-Eintrags,
  „Fehler melden“, „Version 1.0.…“, Platzhalter für Impressum und Datenschutz.
- Im Menü steht „Fehler melden“ unter GitHub.

---

## 3. Lesen und Lernen

### 3.1 Artikelseite (`#/artikel/<pfad>`)

| **Funktion** | **Details** |
|---|---|
| Laden | Markdown von `raw.githubusercontent.com`, umgewandelt mit marked, bereinigt mit DOMPurify |
| Kopf | Abteilung und Gruppe, Titel, Hinweis „Mit Prüfungs-Ampel“, Lernstand-Chip, Fahne „Fehler melden“, „Auf GitHub öffnen“ |
| Ampel | Stellen mit 🔴 🟡 🟢 sind farbig markiert, auch Tabellenzeilen |
| Nur ROT | Blendet Gelb und Grün aus (nur bei Artikeln mit roten Stellen) |
| Inhalt | Sprungmarken an Überschriften, Links zu anderen Wiki-Artikeln öffnen in der App, Bilder kommen aus dem Wiki, breite Tabellen scrollen |
| Formeln | `$…$` und `\(…\)` im Text, `$$…$$` im Text oder als Block, `\[ … \]` auf eigenen Zeilen; KaTeX zeichnet sie, auch in Tabellen. KaTeX lädt nur bei Artikeln mit Formeln, liegt aber in der App-Hülle und geht offline. Breite Formeln scrollen für sich. Kein Fehlgriff bei „5 $“, `\$`, Shell wie `$HOME/bin:$PATH`, Code und `\[Bedingung\]` |
| Diagramme | Mermaid wird noch nicht gezeichnet: Hinweis, Link zu GitHub und der Quelltext zum Aufklappen |
| Fortschritt | Balken oben zeigt, wie weit gelesen ist |
| Zu Ende gelesen | Ab etwa 92 Prozent gilt der Artikel als gelesen. Beim ersten Mal fliegt dafür eine Biene ein, sonst kommt „Als gelesen markiert.“ mit „Rückgängig“ |
| Ende | „Wie sitzt das Thema?“ mit Noch nicht, Gelesen, Sitzt; daneben landet die Biene. „Weiter in der Abteilung“, die Quelle und „Etwas falsch oder kaputt? Fehler melden“ |
| Offline | Einmal geöffnete Artikel gehen ohne Netz. Ein ungelesener zeigt offline einen verständlichen Hinweis |
| Aktualität | Erst die gespeicherte Fassung, im Hintergrund die neue; die kommt beim nächsten Öffnen |

### 3.2 Lernstand

| **Stufe** | **Bedeutung** | **Blatt** | **Zeichen** |
|---|---|---|---|
| Noch nicht | nicht gelesen | blass | keins |
| Gelesen | zu Ende gelesen oder gesetzt | grün | Biene |
| Sitzt | kann ich | dunkelgrün | Biene und „sitzt“ |

Der Lernstand hängt am **Pfad der Datei** im Wiki. Wird eine Datei umbenannt oder verschoben, beginnt ihr Lernstand bei null.

### 3.3 Prüfungsmodus (`#/pruefung`)

- Alle **75 Artikel mit Ampel** als Liste, gruppiert nach Abteilung, mit Fortschritt „x von 75 sitzen“.
- **„Nächsten offenen öffnen“**, Filter **Offen, Sitzt, Alle** und Chips je Abteilung.
- Das **Häkchen** setzt „Sitzt“, die Biene der Zeile fliegt beim ersten Mal ein.
- Alles abgehakt: „Alles abgehakt. Stark! Viel Erfolg bei der Prüfung.“
- **Achtung:** LF5, LF7, LF9 und LF10a haben auch Artikel ohne Ampel. Die fehlen hier und lassen sich nur auf der
  Artikelseite auf „Sitzt“ setzen.

### 3.4 Mein Stand (`#/stand`)

| **Block** | **Inhalt** |
|---|---|
| Überschrift | „Deine Ranke wartet.“, „Deine Ranke wächst.“ oder „Alle Lernfelder geschafft.“ |
| Zahlen | gelesen (mit Biene), sitzen, Ampel-Artikel die sitzen, geschaffte Lernfelder |
| Abteilungen | Balken je Abteilung: sitzt, gelesen, offen |
| Lernfelder | Ein Chip je Lernfeld mit Artikeln: gelb mit Häkchen = geschafft, sonst „LF3 4/6“. Ein Klick führt zur Kachel |
| Leseausweis | 17 Stempel (siehe [4.4](#44-leseausweis-mit-stempeln)) |
| Weiterlesen | die fünf zuletzt geöffneten Artikel |
| Offline lesen | wie viele Artikel auf dem Gerät liegen, Knopf „Alle Artikel offline speichern“ |
| Lernstand sichern | Sichern (Datei), Wiederherstellen, Zurücksetzen |
| Über die App | Versionsnummer, Katalogstand, Link zu den Lizenzen, Knopf „Fehler melden“ |

---

## 4. Belohnungen

> **Merksatz:** Drei Stufen, jede seltener als die davor: die Biene für einen Artikel, die Blüte für ein Lernfeld,
> der Stempel für einen Meilenstein.

| **Stufe** | **Wofür** | **Der Moment** | **Dauerhaft sichtbar** |
|---|---|---|---|
| Biene | einen Artikel gelesen oder auf Sitzt | fliegt einmal je Artikel ein | Katalog, Prüfungsmodus, Mein Stand, „Dein Stand“ |
| Blüte | ein Lernfeld geschafft | Feier-Karte mit Blätterflug | Kachel, Würfel, Ranke, Lernfeld-Chips |
| Stempel | ein Meilenstein | Karte, der Stempel drückt sich auf | Leseausweis in Mein Stand |

Die Feier selbst ist eine **Überraschung**: Die App kündigt sie nirgends an. Das Ziel ist aber sichtbar
(Lernfeld-Chips, „x von y sitzen“, offene Stempel mit Bedingung).

### 4.1 Bienen

- Jeder Artikel, der gelesen ist oder sitzt, hat **eine Biene** (gelber Körper, schwarze Streifen, Flügel).
- **Einflug:** Beim ersten „Gelesen“ oder „Sitzt“ eines Artikels fliegt sie vom rechten Rand in Schleifen zu ihrem Platz:
  am Artikelende neben „Wie sitzt das Thema?“, im Prüfungsmodus zur Zeile. Liegt der Platz gerade außerhalb des Bildes,
  wartet sie, bis man hinscrollt.
- **Nur einmal je Artikel.** Wer einen Artikel später wieder zu Ende liest, bekommt den gewohnten Hinweis „Als gelesen markiert.“
- Screenreader hören „Eine Biene für diesen Artikel.“ Bei reduzierter Bewegung sitzt die Biene einfach da.
- Wer vor dem Update schon gelesen hatte, sieht seine Bienen sofort; ihr Einflug kommt, wenn man so einen Artikel das
  nächste Mal auf „Sitzt“ setzt.

### 4.2 Lernfeld geschafft

- **Geschafft** heißt: Das Lernfeld hat mindestens einen Artikel, und **alle sitzen**. Das wird immer aus dem Lernstand
  berechnet. Kommt ein neuer Artikel dazu, ist das Lernfeld wieder offen.
- **Feier:** Wird der letzte Artikel auf „Sitzt“ gesetzt, kommt eine Karte: Häkchen zeichnet sich, „LF3 geschafft!“,
  Titel und „alle 6 Artikel sitzen. Stark!“, dazu fliegen Blätter in den Farben der Ranke und gelbe Blütenblätter.
  Knöpfe „Weiter“ und „Mein Stand“, Escape schließt nur die Karte.
- **Nur einmal:** Abwählen und wieder abhaken feiert nicht nochmal. Kam ein neuer Artikel dazu und wird das Lernfeld wieder
  geschafft, gibt es eine neue Feier. Laden und Wiederherstellen feiern nie.
- **Dauerhaft:** gelber Stempel „geschafft“ auf der Kachel, gelbe Pille „alle 4 sitzen“, Häkchen und Schimmer am Würfel,
  Blüte am Trieb mit zwei Bienen, gelber Chip in Mein Stand. Ohne 3D: Häkchen am Würfel im Standbild, Blüte und Biene in der
  gezeichneten Ranke.
- **Gesamtfeier:** Sind alle Lernfelder mit Artikeln geschafft, heißt die Karte „Alle Lernfelder geschafft!“ (mit mehr Blättern),
  und Mein Stand titelt „Alle Lernfelder geschafft.“

### 4.3 Reihenfolge der Momente

Alle Momente teilen sich **eine Karte** unten in der Mitte (am Handy über der Leiste):

1. Die **Biene** fliegt sofort zu ihrem Platz, sie braucht die Karte nicht.
2. Eine **Lernfeld-Feier** kommt ebenfalls sofort; eine neue ersetzt eine offene.
3. **Stempel** warten, bis keine Biene mehr fliegt und keine Lernfeld-Karte mehr offen ist. Kommen mehrere zugleich,
   stehen sie zusammen auf einer Karte („2 neue Stempel im Leseausweis“).
4. Die **Ansage** für Screenreader fasst zusammen, was im selben Moment passiert (erst die Biene, dann das Lernfeld).

### 4.4 Leseausweis mit Stempeln

Der Leseausweis steht in **Mein Stand**. Jeder verdiente Stempel trägt oben „LERN-WIKI“ und unten das **Datum**,
wie ein Leihstempel, sitzt etwas schief und sieht gestempelt aus. Offene Stempel sind blass und gestrichelt, darunter stehen
Bedingung und Fortschritt („10 von 25“).

| **Stempel** | **Bedingung** | **Tinte** | **Aus dem Text** |
|---|---|---|---|
| Erste Biene | 1 Artikel gelesen | Honig | „Jede Bibliothek fängt mit einer einzigen Seite an.“ |
| Kleiner Schwarm | 5 Artikel gelesen | Honig | „Da summt schon was.“ |
| Bienenstock | 10 Artikel gelesen | Honig | „Du baust dir gerade einen ganzen Stock voller Wissen.“ |
| Fleißige Biene | 25 Artikel gelesen | Honig | „Fleißig ist hier keine Floskel, das ist Statistik.“ |
| Ganzes Volk | 75 Artikel gelesen | Honig | „Ein ganzes Bienenvolk arbeitet jetzt für dich.“ |
| Honigernte | 100 Artikel gelesen | Honig | „Dreistellig! Zeit, den Honig zu ernten.“ |
| Bücherwurm mit Flügeln | alle Artikel gelesen (zurzeit 172) | Honig | „Aus dem Bücherwurm ist eine Biene geworden…“ |
| KI-Anfänger | Teil 1 der KI-Sammlung „Anfänger bis Nerd“ gelesen | Grün | „…was KI ist, was sie kann und wo sie flunkert.“ |
| KI-Profi | alle 3 Teile der KI-Sammlung gelesen | Grün | „…du weißt, was unter der Haube passiert.“ |
| KI-Nerd | alle Artikel der Abteilung KI gelesen (zurzeit 29) | Grün | „Von Anfänger bis Nerd, genau wie versprochen.“ |
| Erstes Lernfeld | ein Lernfeld geschafft | Grün | „An deiner Ranke ist die erste Blüte aufgegangen…“ |
| Prüfungsreif | alle Artikel mit Ampel sitzen (zurzeit 75) | Rot | „Rot ist jetzt offiziell deine Lieblingsfarbe. Die IHK kann kommen.“ |
| Dranbleiber | an 7 verschiedenen Tagen gelernt | Grün | „Steter Tropfen höhlt den Stein und füllt den Kopf.“ |
| Dauerbrenner | an 15 verschiedenen Tagen gelernt | Grün | „Das ist keine Phase mehr, das ist eine Gewohnheit.“ |
| Backup-Profi | Lernstand gesichert | Blau | „Kein Backup, kein Mitleid. Du brauchst zum Glück keins.“ |
| Funkloch-sicher | alle Artikel offline gespeichert | Blau | „Funkloch im Zug? Dann lernst du eben weiter.“ |
| Nachteule | nach 22 Uhr (bis 5 Uhr) gelernt | Blau | „Aber Schlaf ist kein Luxus… Also ab ins Bett, die Ranke wartet auch morgen noch.“ |

**Regeln der Stempel:**

| **Regel** | **Warum** |
|---|---|
| Ein verdienter Stempel bleibt, auch wenn man später etwas auf „Noch nicht“ setzt | Stempel sind Meilensteine, kein Spiegel des Lernstands |
| „Gelernt“ an einem Tag heißt: an dem Tag einen Artikel auf Gelesen oder Sitzt gesetzt | so braucht es keine Tagesserie, die Druck macht |
| Beim Öffnen und beim Wiederherstellen kommen Stempel still dazu | keine Flut von Karten für alte Erfolge |
| Lerntage und Nachteule werden aus den Zeiten im Lernstand nachgetragen | wer schon gelernt hat, bekommt seine Stempel |
| Nur „Zurücksetzen“ löscht Stempel und Lerntage | wer neu anfängt, darf alles neu verdienen |
| Die Sicherung nimmt Stempel und Lerntage mit | Handywechsel ohne Verlust |
| Kein Vergleich mit anderen, keine Rangliste | es gibt keine Konten, und das bleibt so |

---

## 5. App auf dem Gerät

| **Funktion** | **Details** |
|---|---|
| Installieren | Manifest und Icons; Chrome bietet „App installieren“ an, die App zeigt dann die Knöpfe im Intro und im Menü |
| Offline | Die App-Hülle liegt nach dem ersten Besuch auf dem Gerät, danach startet die App auch im Flugmodus |
| Updates | Gibt es eine neue Version, erscheint unten „Es gibt eine neue Version der App (1.0.8).“ mit „Neu laden“. Danach einmal „Aktualisiert auf Version 1.0.8.“ (nicht beim ersten Besuch) |
| Versionsnummer | drei Stellen, zum Beispiel 1.0.7. Die letzte zählt der Build beim Veröffentlichen hoch, sobald sich die App ändert (auch bei neuen Artikeln). Größere Schritte über `package.json`, Einzelheiten in der [README](README.md#versionsnummer) |
| Fehler melden | Formular „Fehler melden“ mit „Was stimmt nicht?“. Automatisch dabei: Artikel, Abschnitt (die Überschrift im oberen Drittel; vom Artikelende aus keiner), markierte Stelle (bis 300 Zeichen), App-Version, Gerät (System, Browser, App oder Browser, Fenstergröße, hell oder dunkel, 3D an oder aus), Zeit und Link in die App. Unter „Das kommt automatisch mit“ aufklappbar. „Auf GitHub melden“ öffnet ein vorausgefülltes Issue in Wiki-APP, „Text kopieren“ legt alles für Teams in die Zwischenablage. Ohne Text: „Schreib kurz, was nicht stimmt.“, ohne Netz ein Hinweis statt GitHub |
| Netz-Hinweise | „Du bist offline. Die App läuft weiter…“ und „Wieder online.“ |
| Adressen | `#/artikel/<pfad>`, `#/pruefung`, `#/stand` als eigene Seiten; die Zurück-Taste funktioniert, direkte Links auch |
| Handy-Leiste | Start, Suchen, Prüfung, Mein Stand (unter 860 Pixel Breite) |
| Hell und dunkel | folgt dem System, der Knopf oben merkt sich die eigene Wahl |
| Datenschutz | keine Konten, kein Tracking, keine Cookies; alles bleibt im Browser des Geräts |

---

## 6. Barrierefreiheit

| **Bereich** | **Was die App tut** |
|---|---|
| Tastatur | Sprunglink „Zum Inhalt“, Kacheln per Tastatur aufdecken, Escape schließt Menü, Kachel, Feier-Karte und Seite; ist „Fehler melden“ offen, schließt Escape nur das Formular |
| Screenreader | Beschriftungen an Kacheln, Knöpfen und Bienen („gelesen“); Feier, Biene und Stempel werden über `aria-live` angesagt |
| Fokus | Beim Öffnen einer Seite springt der Fokus auf ihren Titel, beim Schließen zurück |
| Reduzierte Bewegung | keine Animationen: Ranke sofort voll, Würfel ohne Schweben, kein Blätterflug, keine fliegenden Bienen, Bienen in der Ranke sitzen still, Stempel ohne Aufdrücken |
| Ohne WebGL | Standbild der Würfel (mit Häkchen für geschaffte Lernfelder) und gezeichnete Ranke (mit Blüten und Bienen); alles andere funktioniert gleich |

---

## 7. Daten und Speicher

Alles liegt nur im **Browser des Geräts**. Nichts geht an einen Server.

| **Schlüssel** | **Inhalt** | **Zurücksetzen löscht** |
|---|---|---|
| `lernwiki-stand-v1` | Lernstand je Artikel: Pfad, Stufe (1 gelesen, 2 sitzt), Zeit | ja |
| `lernwiki-zuletzt-v1` | die zuletzt geöffneten Artikel (höchstens 6) für „Weiterlesen“ | nein |
| `lernwiki-erfolge-v1` | welche Lernfelder schon gefeiert wurden (mit Artikelzahl beim Feiern), dazu die Gesamtfeier | ja |
| `lernwiki-bienen-v1` | bei welchen Artikeln die Biene schon eingeflogen ist | ja |
| `lernwiki-stempel-v1` | verdiente Stempel mit Datum | ja |
| `lernwiki-tage-v1` | Lerntage als Datum | ja |
| `fiae-theme` | hell oder dunkel, wenn selbst gewählt | nein |
| `lernwiki-version` | zuletzt gesehene Versionsnummer, für „Aktualisiert auf Version …“ | nein |

| **Speicher** | **Inhalt** |
|---|---|
| `lernwiki-shell-<Version>` | die App-Hülle; wird bei jedem Update ersetzt |
| `lernwiki-artikel-v1` | geöffnete oder offline gespeicherte Artikel; überlebt Updates |

**Sicherungsdatei** (`lernstand-JJJJ-MM-TT.json`): `app`, `version` (1), `gesichert`, `stand`, `stempel`, `tage`.
Beim Wiederherstellen wird zusammengeführt: Der höhere Lernstand gewinnt, bei Stempeln das frühere Datum, Lerntage kommen dazu.
Ältere Sicherungen ohne Stempel funktionieren weiter.

---

## 8. Technik in Kürze

| **Datei** | **Aufgabe** |
|---|---|
| `src/index.html` | Seite; der Katalog wird beim Bauen eingesetzt |
| `src/app.css` | Gestaltung, hell und dunkel, Handy |
| `src/app.js` | Startseite, Lernstand, Erfolge, Bienen, Stempel, Feier-Karte, Ansagen |
| `src/reader.js` | Artikelseite, Prüfungsmodus, Mein Stand mit Leseausweis, Sichern |
| `src/melden.js` | Fehler melden: Formular, GitHub-Issue, Text für Teams |
| `src/scene.js` | 3D: Würfel, Ranke, Blüten, Bienen |
| `src/sw.js` | Service Worker: App-Hülle und Artikel offline |
| `data/catalog.json` | Katalog aller Artikel, erzeugt mit `tools/catalog.mjs` |
| `tools/build.mjs` | baut `docs/`, bestimmt die Versionsnummer und schreibt `version.json`, bricht bei Gedankenstrichen ab |
| `tools/test.mjs` | automatischer Test mit Chrome |
| `.github/workflows/pages.yml` | veröffentlicht bei Push auf `main`, jede Nacht um 2:30 Uhr UTC und auf Knopfdruck |

**Bibliotheken:** three.js 0.186.1, Lenis 1.3.26, marked 15.0.12, DOMPurify 3.2.7, KaTeX 0.19.0 (nur woff2-Schriften), Schrift Hanken Grotesk.

**Ereignisse zwischen den Dateien:** `fiae-stand` (Lernstand geändert), `fiae-stempel` (Stempel geändert),
`fiae-theme`, `fiae-tree`. Gemeinsame Werkzeuge liegen in `window.FIAE` (zum Beispiel `stand`, `erfolg`, `biene`, `stempel`).

**Tests** (`npm test`, zurzeit 59 Prüfungen):

| **Teil** | **Prüft** |
|---|---|
| 1 und 2 | Laden, Katalog, Suche, 3D, Installierbarkeit, Service Worker, Start im Flugmodus |
| 3 | Handy im Dunkelmodus |
| 4 und 5 | Artikel lesen, Ampel, Nur ROT, Lernstand, offline, Prüfungsmodus, Mein Stand, direkter Link |
| 6 | Handy-Leiste, Klick auf Blatt und Zweig der Ranke |
| 7 | Lernfeld geschafft: Kachel, Mein Stand, Feier genau einmal, Wiederherstellen, Gesamtfeier |
| 8 | Bienen: Einflug, nur einmal je Artikel, Katalog und Stand |
| 9 | Leseausweis: Stempel still beim Laden, Karte, Sprung zum Ausweis, Backup-Profi, Nachteule, Zurücksetzen, Wiederherstellen |
| 10 | Versionsnummer im Fuß und in `version.json`; Fehler melden: Artikel und Abschnitt, ohne Text nichts, Kopieren, Escape, GitHub-Link, Startseite |
| 11 | Formeln im USV-Artikel: alle gezeichnet, auch in Tabellen und als Block, kein Dollarzeichen übrig, auch im Flugmodus |

Tests mit Uhrzeit laufen mit fester Zeitzone, damit der nächtliche Lauf nicht zufällig die Nachteule auslöst.

---

## 9. Änderungsprotokoll

### Dazugekommen

| **Datum** | **Commit** | **Was** |
|---|---|---|
| 20.10.2026 | `4c3800f` | Stufe 1: Lern-Wiki als installierbare Web-App (PWA) mit Bühne, Ranke, Kacheln, Katalog, offline |
| 20.10.2026 | `c5f460d` | Stufe 2: Lesen in der App, Lernstand, Prüfungsmodus, Mein Stand |
| 20.10.2026 | `4bf5e51` | Katalog-Generator `tools/catalog.mjs` |
| 20.10.2026 | `aa1d530` | Zweige führen zu den Kacheln, Katalog öffnet erst bei Bedarf |
| 20.10.2026 | `adb1ca5`, `122f277` | Link zur Erklärung der Ampel, Wegweiser im Intro |
| 20.10.2026 | `1a3159c` | Ranke läuft beim Hochscrollen zurück |
| 20.10.2026 | `b825113`, `9b6f6b8` | Blüte je Abschnitt an eigenem Zweig |
| 21.10.2026 | `619b856` | Veröffentlichen über GitHub Actions |
| 22.10.2026 | `2c53d84` | Lernfeld geschafft: Feier, Stempel auf der Kachel, Häkchen am Würfel, Blüte am Trieb, Gesamtfeier |
| 22.10.2026 | `d2347c4` | Test wartet auf Suchtreffer (lief auf GitHub sonst manchmal zu früh) |
| 22.10.2026 | `7370346` | Bienen: je gelesenem Artikel, Einflug, Bienen um die Blüten |
| 22.10.2026 | `06d2457` | Leseausweis mit 17 Stempeln |
| 23.10.2026 | `138cd4b` | Fehler melden (GitHub-Issue oder Text für Teams) und Versionsnummer ab 1.0.0, die bei Updates selbst hochzählt |
| 23.10.2026 | `5b005ca` | Formeln mit KaTeX (gemeldet über Teams: Formeln in der USV-Tabelle standen als Text mit Dollarzeichen da) |

### Entfernt oder ersetzt

| **Datum** | **Commit** | **Was** | **Warum** |
|---|---|---|---|
| 20.10.2026 | `aa1d530` | Katalogliste immer sichtbar | doppelte Liste, die Seite wurde zu lang |
| 20.10.2026 | `122f277` | eigener Wegweiser-Abschnitt | ins Intro gewandert |
| 20.10.2026 | `df4743d` | „Regale“ | heißen jetzt „Abteilungen“ (Bibliothek); im Katalog bleibt der Schlüssel `regale` |
| 21.10.2026 | `619b856` | `docs/` im Repository | GitHub Actions baut die App selbst |
| 22.10.2026 | `7370346` | Wort „GELESEN“ im Katalog | die Biene steht jetzt dafür |

### Bewusst nicht gebaut

| **Idee** | **Warum nicht** |
|---|---|
| Eigene Seite mit allen Artikeln für die Bienen | wäre eine dritte Liste neben Katalog und Prüfungsmodus |
| Tagesserien („7 Tage am Stück“) | machen Druck; „an 7 verschiedenen Tagen“ belohnt dasselbe ohne Strafe |
| Ranglisten oder Vergleiche | keine Konten, der Lernstand bleibt privat |

---

## 10. So bleibt diese Seite aktuell

**Neue Funktion:**

1. Zeile in [1. Überblick](#1-überblick) ergänzen.
2. Im passenden Abschnitt (2 bis 6) beschreiben: was sie tut, wo sie ist, wie sie sich bei reduzierter Bewegung und ohne 3D verhält.
3. Neuer Speicher-Schlüssel? In [7. Daten und Speicher](#7-daten-und-speicher) eintragen, mit „Zurücksetzen löscht“.
4. Neue Tests? Die Zahl der Prüfungen und die Tabelle in [8. Technik](#8-technik-in-kürze) anpassen.
5. Zeile unter „Dazugekommen“ in [9. Änderungsprotokoll](#9-änderungsprotokoll) mit Datum und Commit.
6. Oben **Stand** und **App-Stand** und unten die Metadaten anpassen.

**Funktion entfernt:**

1. Aus Überblick und Abschnitt streichen.
2. Unter „Entfernt oder ersetzt“ eintragen, mit Grund. Nicht einfach löschen, damit nachvollziehbar bleibt, warum.

**Regeln:**

- Zahlen (Artikel, Ampel, Lernfelder) kommen aus `data/catalog.json`, nicht schätzen.
- Keine Gedankenstriche, wie im Rest des Projekts.
- Texte aus der App wörtlich zitieren, damit man sie wiederfindet.

```yaml
seite: ReadmeUpdate.md
inhalt: Funktionen und Gimmicks der Wiki-APP
stand: 2026-10-23
app_commit: 5b005ca
app_version: ab 1.0.0, zählt selbst hoch
katalog: 172 Artikel, 75 mit Ampel, 10 von 12 Lernfeldern mit Artikeln, Wiki-Stand 2026-10-20
stempel: 17
tests: 59 Prüfungen
gepflegt_von: Lernteam FIAE/FISI
```
