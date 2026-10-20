/* Erzeugt data/catalog.json aus einem lokalen Klon des Wikis (ohne Abhängigkeiten).
   Aufruf: npm run catalog -- /pfad/zum/wiki-klon
           node tools/catalog.mjs /pfad/zum/wiki-klon [ziel.json]   (ohne ziel.json: data/catalog.json)
   Regeln:
   - Artikel = jede committete .md-Datei im Klon, außer README, LICENSE und Co. (WEG)
   - Titel = Überschrift in den ersten drei Textzeilen, sonst die erste Textzeile. Rauten, Fettschrift und Emojis am
     Anfang und Ende fliegen raus, Gedankenstriche mit Leerzeichen werden zu Doppelpunkten, ohne Leerzeichen zu Bindestrichen.
     Dateien mit seltsamem oder fehlendem Titel stehen in OVERRIDE.
   - Ampel (rot) = Datei enthält 🔴 oder das Wort ROT
   - Regal und Gruppe über GRUPPEN, der längste passende Pfad gewinnt. Dateien, die nirgends passen, meldet das Skript
     als NICHT EINSORTIERT und lässt sie weg, ohne abzubrechen.
   - stand = Datum des letzten Commits im Klon
   Der Lernstand in der App hängt am Pfad der Datei (u). Umbenannte oder verschobene Dateien meldet das Skript deshalb. */
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'https://github.com/ITDavid04/Bibliothek-Lern-Wiki';
const BRANCH = 'main';

/* Regale in der Reihenfolge der App; n, rot und gruppen rechnet das Skript aus */
const REGALE = [
  { id: 'lf', name: 'Lernfelder', kurz: 'Lernfelder', sub: 'Artikel zu den Lernfeldern, so sortiert wie der Rahmenlehrplan.' },
  { id: 'ap', name: 'Prüfung', kurz: 'Prüfung', sub: 'Spickzettel für AP1 und AP2, Übungsblätter mit Lösungen und WISO.' },
  { id: 'gr', name: 'Grundlagen', kurz: 'Grundlagen', sub: 'Mathe, SQL und SQLite, Programmiersprachen und Software-Testing.' },
  { id: 'sy', name: 'Systeme und Werkzeuge', kurz: 'Systeme', sub: 'Netzwerk, Git und GitHub, Docker, Ubuntu, Bash und virtuelle Maschinen.' },
  { id: 'ki', name: 'KI', kurz: 'KI', sub: 'Vom ersten Prompt bis zu Tokens und Transformern, dazu lokale Modelle.' },
  { id: 'um', name: 'Umschulung und Mitmachen', kurz: 'Umschulung', sub: 'Hilfe rund ums Praktikum und wie du selbst Artikel schreibst.' }
];

/* Lernfelder nach Rahmenlehrplan: [Nummer, Kürzel, Titel]; a und rot rechnet das Skript aus */
const LERNFELDER = [
  [1, 'LF1', 'Das Unternehmen und die eigene Rolle im Betrieb beschreiben'],
  [2, 'LF2', 'Arbeitsplätze nach Kundenwunsch ausstatten'],
  [3, 'LF3', 'Clients in Netzwerke einbinden'],
  [4, 'LF4', 'Schutzbedarfsanalyse im eigenen Arbeitsbereich durchführen'],
  [5, 'LF5', 'Software zur Verwaltung von Daten anpassen'],
  [6, 'LF6', 'Serviceanfragen bearbeiten'],
  [7, 'LF7', 'Cyber-physische Systeme ergänzen'],
  [8, 'LF8', 'Daten systemübergreifend bereitstellen'],
  [9, 'LF9', 'Netzwerke und Dienste bereitstellen'],
  [10, 'LF10a', 'Benutzerschnittstellen gestalten und entwickeln'],
  [11, 'LF11a', 'Funktionalität in Anwendungen realisieren'],
  [12, 'LF12a', 'Kundenspezifische Anwendungsentwicklung durchführen']
];

/* Ordner oder Datei im Wiki -> [Regal, Gruppe, Lernfeld]. Ein Ordner zählt mit allen Unterordnern,
   der längste passende Pfad gewinnt. Die Reihenfolge hier ist die Reihenfolge der Gruppen in der App.
   Neuer Ordner im Wiki: eine Zeile ergänzen (neue Gruppe an der passenden Stelle, sonst eine vorhandene Gruppe nennen). */
const GRUPPEN = [
  ['Lernmaterial_Lernfelder/Lernfeld_1', 'lf', 'LF1', 1],
  ['Lernmaterial_Lernfelder/Lernfeld_2', 'lf', 'LF2', 2],
  ['Lernmaterial_Lernfelder/Lernfeld_3', 'lf', 'LF3', 3],
  ['Lernmaterial_Lernfelder/Lernfeld_4', 'lf', 'LF4', 4],
  ['Lernmaterial_Lernfelder/Lernfeld_5', 'lf', 'LF5', 5],
  ['Lernmaterial_Lernfelder/Lernfeld_6_Service_Desk', 'lf', 'LF6', 6],
  ['Lernmaterial_Lernfelder/Lernfeld_7', 'lf', 'LF7', 7],
  ['Lernmaterial_Lernfelder/Lernfeld_8_Providing_Data_Across_Systems.md', 'lf', 'LF8', 8],
  ['Lernmaterial_Lernfelder/Lernfeld_9', 'lf', 'LF9', 9],
  ['Lernmaterial_Lernfelder/Lernfeld_10', 'lf', 'LF10', 10],
  ['Lernmaterial_Lernfelder/Pruefungs-Spickzettel/Übungsblätter_AP1_AP2_WISO', 'ap', 'Übungsblätter AP1, AP2, WISO'],
  ['Lernmaterial_Lernfelder/Pruefungs-Spickzettel', 'ap', 'Spickzettel'],
  ['Lernmaterial_Lernfelder/WISO', 'ap', 'WISO'],
  ['Lernmaterial_Lernfelder/Mathe_Was_Notwendig_ist', 'gr', 'Mathe, was nötig ist'],
  ['Mathe', 'gr', 'Mathe zum Vertiefen'],
  ['Lernmaterial_Lernfelder/SQL', 'gr', 'SQL'],
  ['Lernmaterial_Lernfelder/SQLITE', 'gr', 'SQLite'],
  ['Programmier_Sprachen_Übersicht', 'gr', 'Programmiersprachen'],
  ['TypeScript', 'gr', 'TypeScript'],
  ['Software_Testing_2026', 'gr', 'Software-Testing'],
  ['Network', 'sy', 'Netzwerk'],
  ['Github', 'sy', 'Git und GitHub'],
  ['Docker', 'sy', 'Docker und Container'],
  ['Ubuntu', 'sy', 'Ubuntu'],
  ['Autoinstall', 'sy', 'Autoinstall'],
  ['Bash_Scripting', 'sy', 'Bash'],
  ['KVM_Qemu_Stuff', 'sy', 'KVM und QEMU'],
  ['KI-Anfänger_bis_Nerd_Die_Sammlung/0.1_Was ist KI', 'ki', 'Einstieg: Was ist KI'],
  ['KI-Anfänger_bis_Nerd_Die_Sammlung/0.2_Aufbau_Track_KI_in_Lernen_Arbeiten_einbauen', 'ki', 'Aufbau: KI beim Lernen und Arbeiten'],
  ['KI-Anfänger_bis_Nerd_Die_Sammlung/0.3_Das_Dahinter', 'ki', 'Das Dahinter'],
  ['LLM_Stuff', 'ki', 'LLMs lokal und im Alltag'],
  ['Recherche_Agent', 'ki', 'Recherche-Agent'],
  ['Umschulung_Praktika_Hilfe.md', 'um', 'Praktikum und Bewerbung'],
  ['Markdown_Cheet_Cheat.md', 'um', 'Mitmachen']
];

/* Titel von Hand, wenn die Datei keinen brauchbaren hat (Pfad im Wiki -> Titel) */
const OVERRIDE = {
  'Lernmaterial_Lernfelder/SQLITE/Anleitung_SQLLite_Wuerfelspiel.md': 'Anleitung: SQLite-Würfelspiel',
  'Lernmaterial_Lernfelder/SQLITE/SQLite_fuer_Dummies.md': 'SQLite fuer Dummies',
  'Software_Testing_2026/1.Hilfreiches_Lernamterial_Analogien_zum_einfachen_Lesen.md': 'Software Testing: Erklärt für Handwerker',
  'Ubuntu/Research/Autoinstall/Ubuntu24.04LTSAutoinstall.md': 'Automatische Ubuntu-Installation (Autoinstall)',
  'Ubuntu/Research/Dokumentationen/UsefullLinksUbuntu26.04.md': 'Nützliche Links zu Ubuntu 26.04',
  'KVM_Qemu_Stuff/Erst_Installation_und_Windows11.md': 'Windows 11 in der KVM-Box: Der Profi-Guide'
};

/* Feste Links der Startseite (Pfad im Wiki; Ordner werden als tree verlinkt) */
const LINKS = {
  markdown: 'Markdown_Cheet_Cheat.md',
  spick: 'Lernmaterial_Lernfelder/Pruefungs-Spickzettel/Prüfungs_Spickzettel_Übersicht.md',
  ap1: 'Lernmaterial_Lernfelder/Pruefungs-Spickzettel/Spickzettel_Teil1AP1_Einzelthemen.md',
  ap2: 'Lernmaterial_Lernfelder/Pruefungs-Spickzettel/Spickzettel_Teil2_AP2-Einzelthemen.md',
  wiso: 'Lernmaterial_Lernfelder/Pruefungs-Spickzettel/Wiso_multiple_Choice.md',
  uebung: 'Lernmaterial_Lernfelder/Pruefungs-Spickzettel/Übungsblätter_AP1_AP2_WISO'
};

/* Keine Artikel: Dateien rund ums Repository selbst, egal in welchem Ordner */
const WEG = /^(readme|license|licence|changelog|contributing|code_of_conduct|security)(\.md)?$/i;

const [wiki, ziel = path.join(ROOT, 'data', 'catalog.json')] = process.argv.slice(2);
if (!wiki) {
  console.error('Aufruf: npm run catalog -- /pfad/zum/wiki-klon');
  process.exit(1);
}
const git = (...args) => execFileSync('git', ['-C', wiki, ...args], { encoding: 'utf8', maxBuffer: 64 << 20 });
const nfc = s => s.normalize('NFC');

/* Pfad wie in den Links der App: jedes Stück einzeln kodiert, auch ! ' ( ) * */
const enc = p => p.split('/').map(s => encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())).join('/');
const blob = p => `${REPO}/blob/${BRANCH}/${enc(p)}`;

const EMOJI = '[\\s\\p{Extended_Pictographic}\\p{Emoji_Modifier}\\p{Regional_Indicator}\\uFE0F\\u200D\\u20E3]+';
const RAND = new RegExp(`^${EMOJI}|${EMOJI}$`, 'gu');
function sauber(z){
  return z.replace(/^\s{0,3}#{1,6}\s+/, '').replace(/\s+#+\s*$/, '')
    .replace(/\*\*|__/g, '')
    .replace(RAND, '')
    .replace(/\s+[\u2013\u2014]\s+/g, ': ').replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ').trim();
}

/* Überschrift in den ersten drei Textzeilen, sonst die erste Textzeile. Nicht mitgezählt: Frontmatter,
   Codeblöcke, Leerzeilen, Trennlinien und HTML-Kommentare */
function titel(text){
  text = text.replace(/^\uFEFF/, '').replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/, '');
  const zeilen = [];
  let code = false;
  for (const z of text.split(/\r?\n/)) {
    if (/^\s{0,3}(```|~~~)/.test(z)) { code = !code; continue; }
    if (code || !z.trim() || /^\s*([-*_]\s*){3,}$/.test(z) || /^\s*<!--.*-->\s*$/.test(z)) continue;
    zeilen.push(z);
    if (zeilen.length === 3) break;
  }
  return sauber(zeilen.find(z => /^\s{0,3}#{1,6}\s/.test(z)) || zeilen[0] || '');
}

const ROT = /🔴|(?<![\p{L}\p{N}_])ROT(?![\p{L}\p{N}_])/u;

/* Sortierung wie bisher: Pfad in Kleinbuchstaben, Zeichen für Zeichen (über UTF-8 gleich der Codepunkt-Reihenfolge) */
const nachPfad = (a, b) => Buffer.compare(Buffer.from(a.toLowerCase()), Buffer.from(b.toLowerCase()));

function gruppeVon(p){
  let best = null;
  for (const g of GRUPPEN) {
    const e = nfc(g[0]);
    if ((p === e || p.startsWith(e + '/')) && (!best || e.length > nfc(best[0]).length)) best = g;
  }
  return best;
}

/* Dateien: nur was im Klon committet ist (so wie es auch auf GitHub liegt) */
const stand = git('log', '-1', '--date=short', '--format=%cd').trim();
const dateien = git('ls-files', '-z').split('\0').filter(Boolean);
const md = dateien.filter(f => /\.md$/i.test(f));
const weg = md.filter(f => WEG.test(path.posix.basename(f)));
const ohne = [], artikel = [];
for (const p of md) {
  if (weg.includes(p)) continue;
  const g = gruppeVon(nfc(p));
  if (!g) { ohne.push(p); continue; }
  let text;
  try { text = await readFile(path.join(wiki, p), 'utf8'); }
  catch (e) { console.warn(`Fehlt auf der Platte, übersprungen: ${p}`); continue; }
  let t = OVERRIDE[nfc(p)] || titel(text);
  if (!t) {
    t = path.posix.basename(p).replace(/\.md$/i, '').replace(/_+/g, ' ').trim();
    console.warn(`Kein Titel gefunden, nehme den Dateinamen: ${p} -> ${t} (besser in OVERRIDE eintragen)`);
  }
  artikel.push({ t, r: g[1], g: g[2], lf: g[3] ?? null, rot: ROT.test(text), u: blob(p), p });
}

/* Reihenfolge: Regal, dann Gruppe wie in GRUPPEN, dann Pfad */
const ri = id => REGALE.findIndex(r => r.id === id);
const gruppenReihe = [];
for (const g of GRUPPEN) if (!gruppenReihe.some(x => x[0] === g[1] && x[1] === g[2])) gruppenReihe.push([g[1], g[2]]);
const gx = a => gruppenReihe.findIndex(x => x[0] === a.r && x[1] === a.g);
artikel.sort((a, b) => ri(a.r) - ri(b.r) || gx(a) - gx(b) || nachPfad(a.p, b.p));

const regale = REGALE.map(r => {
  const arts = artikel.filter(a => a.r === r.id);
  const gruppen = gruppenReihe.filter(x => x[0] === r.id)
    .map(([, g]) => [g, arts.filter(a => a.g === g).length]).filter(([, n]) => n);
  return { ...r, n: arts.length, rot: arts.filter(a => a.rot).length, gruppen };
});
const lf = LERNFELDER.map(([n, k, t]) => {
  const arts = artikel.filter(a => a.lf === n);
  return { n, titel: t, k, a: arts.length, rot: arts.filter(a => a.rot).length };
});

const vorhanden = new Set(dateien.map(nfc));
const links = {};
for (const [k, p] of Object.entries(LINKS)) {
  const ordner = !vorhanden.has(nfc(p));
  if (ordner && !dateien.some(f => nfc(f).startsWith(nfc(p) + '/'))) console.warn(`Link "${k}" zeigt ins Leere: ${p}`);
  links[k] = ordner ? `${REPO}/tree/${BRANCH}/${enc(p)}` : blob(p);
}

const catalog = {
  repo: REPO, stand, regale, lf,
  artikel: artikel.map(({ t, r, g, lf, rot, u }) => ({ t, r, g, lf, rot, u })),
  links
};

/* Vergleich mit dem bisherigen Katalog, damit Umbenennungen auffallen (Lernstand hängt am Pfad) */
const pathOf = u => decodeURIComponent(u.split(`/blob/${BRANCH}/`)[1] || u);
let alt = null;
try { alt = JSON.parse(await readFile(ziel, 'utf8')); } catch (e) { /* noch kein Katalog */ }
const json = JSON.stringify(catalog, null, 1) + '\n';
await writeFile(ziel, json);

const liste = (kopf, xs) => { if (xs.length) console.log(`${kopf} (${xs.length}):\n` + xs.map(x => '  ' + x).join('\n')); };
const rel = path.relative(process.cwd(), ziel);
console.log(`${rel && !rel.startsWith('..') ? rel : ziel}: ${artikel.length} Artikel, Stand ${stand}, ${artikel.filter(a => a.rot).length} mit Ampel`);
for (const r of regale) console.log(`  ${r.kurz}: ${r.n} (${r.gruppen.map(([g, n]) => `${g} ${n}`).join(', ')})`);
liste('Nicht im Katalog, weil keine Artikel', weg);
liste('NICHT EINSORTIERT, fehlen im Katalog (Zeile in GRUPPEN ergänzen)', ohne);
for (const p of Object.keys(OVERRIDE)) if (!vorhanden.has(nfc(p))) console.warn(`OVERRIDE ohne Datei (umbenannt oder gelöscht?): ${p}`);

/* git status -z: "XY pfad", bei Umbenennungen folgt der alte Pfad als eigener Eintrag */
const neu = [], geaendert = [];
const st = git('status', '--porcelain', '-z', '--untracked-files=all').split('\0');
for (let i = 0; i < st.length; i++) {
  const z = st[i];
  if (!z) continue;
  if (z.startsWith('??')) { if (/\.md$/i.test(z)) neu.push(z.slice(3)); }
  else geaendert.push(z.slice(3));
  if (/^[RC]/.test(z)) i++;
}
liste('Nicht committet, fehlen im Katalog (erst committen und pushen)', neu);
liste('Lokal geändert, Katalog nutzt die Fassung auf der Platte', geaendert);

if (alt && Array.isArray(alt.artikel)) {
  const vorher = new Map(alt.artikel.map(a => [pathOf(a.u), a]));
  const jetzt = new Map(catalog.artikel.map(a => [pathOf(a.u), a]));
  liste('Neu', [...jetzt.keys()].filter(p => !vorher.has(p)));
  liste('Entfallen (bei Umbenennung geht der Lernstand dieser Datei verloren)', [...vorher.keys()].filter(p => !jetzt.has(p)));
  liste('Titel geändert', [...jetzt].filter(([p, a]) => vorher.has(p) && vorher.get(p).t !== a.t).map(([p, a]) => `${vorher.get(p).t} -> ${a.t}`));
  liste('Ampel geändert', [...jetzt].filter(([p, a]) => vorher.has(p) && vorher.get(p).rot !== a.rot).map(([p, a]) => `${a.t}: ${a.rot ? 'jetzt mit Ampel' : 'jetzt ohne Ampel'}`));
}
