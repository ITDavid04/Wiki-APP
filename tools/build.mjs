/* Baut die App nach docs/ (von dort veröffentlicht GitHub Pages).
   Aufruf: npm run build
   - setzt den Katalog (data/catalog.json) in index.html ein
   - kopiert Bibliotheken aus node_modules nach docs/vendor, verkleinert die großen mit terser, legt Lizenzen bei
   - erzeugt den Service Worker mit Prüfsumme und Liste aller Dateien
   - bricht ab, wenn in den Texten Gedankenstriche stehen */
import { readFile, writeFile, mkdir, rm, copyFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { minify } from 'terser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'docs');
const NM = path.join(ROOT, 'node_modules');

const read = p => readFile(p, 'utf8');
async function put(rel, data){
  const p = path.join(OUT, rel);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, data);
}
async function copy(from, rel){
  const p = path.join(OUT, rel);
  await mkdir(path.dirname(p), { recursive: true });
  await copyFile(from, p);
}
async function mini(code, module){
  const r = await minify(code, { module, compress: { passes: 2 }, mangle: true, format: { comments: /@license|@preserve|^!/ } });
  return r.code;
}
async function walk(dir, base = dir){
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p, base));
    else out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out.sort();
}

/* Texte ohne Gedankenstriche (Regel des Projekts); der Katalog wird extra geprüft */
function noDashes(name, text){
  const hits = [...text.matchAll(/[–—]/g)];
  if (hits.length) throw new Error(`${name}: ${hits.length} Gedankenstrich(e), zum Beispiel bei Zeichen ${hits[0].index}`);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

/* Katalog */
const catalog = JSON.parse(await read(path.join(ROOT, 'data', 'catalog.json')));
const catJs = JSON.stringify(catalog).replace(/</g, '\\u003c');
noDashes('data/catalog.json', catJs);

/* Seite */
let html = await read(path.join(SRC, 'index.html'));
noDashes('src/index.html', html);
if (!html.includes('/*CATALOG*/')) throw new Error('Platzhalter /*CATALOG*/ fehlt');
html = html.replace('/*CATALOG*/', () => catJs);
await put('index.html', html);
for (const f of ['app.css', 'app.js', 'scene.js', 'reader.js']) {
  const code = await read(path.join(SRC, f));
  noDashes('src/' + f, code);
  if (f === 'app.css') await put(f, code);
  else await put(f, await mini(code, f !== 'app.js'));
}
await copy(path.join(SRC, 'manifest.webmanifest'), 'manifest.webmanifest');
for (const f of await readdir(path.join(SRC, 'icons'))) await copy(path.join(SRC, 'icons', f), 'icons/' + f);
await put('.nojekyll', '');

/* Schrift */
const FONT = path.join(NM, '@fontsource-variable', 'hanken-grotesk');
await copy(path.join(FONT, 'files', 'hanken-grotesk-latin-wght-normal.woff2'), 'fonts/hanken-grotesk-latin-wght-normal.woff2');

/* Bibliotheken */
const THREE = path.join(NM, 'three');
await put('vendor/three.module.js', await mini(await read(path.join(THREE, 'build', 'three.module.js')), true));
await put('vendor/three.core.js', await mini(await read(path.join(THREE, 'build', 'three.core.js')), true));
for (const a of ['geometries/RoundedBoxGeometry.js', 'environments/RoomEnvironment.js']) {
  await put('vendor/addons/' + a, await mini(await read(path.join(THREE, 'examples', 'jsm', a)), true));
}
await copy(path.join(NM, 'lenis', 'dist', 'lenis.min.js'), 'vendor/lenis.min.js');
await copy(path.join(NM, 'marked', 'lib', 'marked.esm.js'), 'vendor/marked.esm.js');
await copy(path.join(NM, 'dompurify', 'dist', 'purify.es.mjs'), 'vendor/purify.es.mjs');

/* Lizenzen der mitgelieferten Bibliotheken und der Schrift */
const pkgs = JSON.parse(await read(path.join(ROOT, 'package.json'))).dependencies;
await copy(path.join(THREE, 'LICENSE'), 'vendor/LICENSES/three.txt');
await copy(path.join(NM, 'lenis', 'LICENSE'), 'vendor/LICENSES/lenis.txt');
await copy(path.join(NM, 'marked', 'LICENSE.md'), 'vendor/LICENSES/marked.md');
await copy(path.join(NM, 'dompurify', 'LICENSE'), 'vendor/LICENSES/dompurify.txt');
await copy(path.join(FONT, 'LICENSE'), 'vendor/LICENSES/hanken-grotesk-OFL.txt');
await put('vendor/LICENSES/README.txt', 'Mitgelieferte Bibliotheken und Schrift:\n' +
  Object.entries(pkgs).map(([k, v]) => `- ${k} ${v}`).join('\n') + '\n');

/* Service Worker: Prüfsumme über alle Dateien, Liste zum Vorladen */
const files = (await walk(OUT)).filter(f => f !== '.nojekyll' && !f.startsWith('vendor/LICENSES/'));
const hash = createHash('sha256');
for (const f of files) { hash.update(f); hash.update(await readFile(path.join(OUT, f))); }
const version = hash.digest('hex').slice(0, 12);
let sw = await read(path.join(SRC, 'sw.js'));
noDashes('src/sw.js', sw);
sw = sw.replace("'/*VERSION*/'", `'${version}'`).replace('/*PRECACHE*/[]', JSON.stringify(['./', ...files]));
await put('sw.js', await mini(sw, false));

let total = 0;
for (const f of await walk(OUT)) total += (await readFile(path.join(OUT, f))).length;
console.log(`docs/ gebaut: ${files.length + 1} Dateien vorgeladen, ${(total / 1024).toFixed(0)} KB gesamt, Version ${version}, ${catalog.artikel.length} Artikel (Stand ${catalog.stand})`);
