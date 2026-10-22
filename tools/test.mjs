/* Automatischer Test der gebauten App in docs/ mit dem installierten Chrome (puppeteer-core).
   npm test                     -> alle Prüfungen, Bildschirmfotos nach tools/shots/
   CHROME=/pfad/zu/chrome npm test, falls Chrome woanders liegt
   CI=1 npm test               -> wie auf GitHub: 3D in Software statt auf der Grafikkarte
   Prüft: Installierbarkeit laut Chrome, Service Worker übernimmt, Start im Flugmodus, keine Fehler in der Konsole. */
import puppeteer from 'puppeteer-core';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { start } from './serve.mjs';

const SHOTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'shots');
/* Zahlen aus dem Katalog, damit der Test nach einem neuen Katalog nicht angepasst werden muss */
const CAT = JSON.parse(await readFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'catalog.json'), 'utf8'));
const N = CAT.artikel.length, NROT = CAT.artikel.filter(a => a.rot).length;
const PORT = 8091, BASE = `http://localhost:${PORT}/`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, pass, info = '') => { results.push({ name, pass: !!pass, info }); };

await mkdir(SHOTS, { recursive: true });
const server = await start(PORT);
/* Auf GitHub (CI=true) gibt es keine Grafikkarte: 3D dann in Software (SwiftShader), ohne Sandbox in der Wegwerf-VM */
const GPU = process.env.CI
  ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox']
  : ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=vulkan', '--enable-features=Vulkan', '--use-gl=angle'];
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  headless: 'new',
  args: GPU
});

function watch(page, label){
  const errs = [];
  /* 504 (offline) liefert der Service Worker absichtlich, wenn ein Artikel offline fehlt; Chrome meldet das selbst */
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('504 (offline)')) errs.push(`${label} Konsole: ${m.text()}`); });
  page.on('pageerror', e => errs.push(`${label} Skriptfehler: ${e.message}`));
  page.on('requestfailed', r => { if (r.url().startsWith(BASE)) errs.push(`${label} Anfrage fehlgeschlagen: ${r.url()} ${r.failure() && r.failure().errorText}`); });
  return errs;
}
/* Flugmodus für Seite UND Service Worker (die Einstellung der Seite gilt nicht für den Service Worker) */
const swSessions = new Map();
async function setOffline(page, on){
  await page.setOfflineMode(on);
  for (const t of browser.targets()) {
    if (t.type() !== 'service_worker') continue;
    let ses = swSessions.get(t);
    if (!ses) { ses = await t.createCDPSession(); await ses.send('Network.enable'); swSessions.set(t, ses); }
    await ses.send('Network.emulateNetworkConditions', { offline: on, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  }
}
const ready = page => page.waitForFunction(() => !document.documentElement.classList.contains('is-loading'), { timeout: 8000 }).catch(() => {});
/* Katalog: alle Einträge da, Liste zu, bis jemand sucht oder filtert */
const catalogOk = page => page.evaluate(n => document.querySelectorAll('#catList li[data-i]').length === n && document.getElementById('catList').hidden && document.getElementById('catCount').textContent.startsWith(n + ' Artikel'), N);
const glLive = page => page.waitForFunction(() => document.documentElement.classList.contains('gl-vine') && document.documentElement.classList.contains('gl-stage'), { timeout: 15000 }).then(() => true, () => false);

try {
  /* 1. Erster Besuch am Desktop */
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errs = watch(page, 'Desktop');
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  check('Seite lädt, Katalog vollständig', await catalogOk(page));
  /* Die Suche wartet kurz nach dem Tippen; auf dem langsamen GitHub-Rechner reichen feste 300 ms nicht immer */
  const listOpen = open => page.waitForFunction(o => document.getElementById('catList').hidden !== o, { timeout: 10000 }, open).catch(() => {});
  await page.type('#q', 'subnetting');
  await listOpen(true);
  const hit = await page.evaluate(() => ({ open: !document.getElementById('catList').hidden, shown: document.querySelectorAll('#catList li[data-i]:not([hidden])').length, count: document.getElementById('catCount').textContent }));
  await page.$eval('#q', e => { e.value = ''; e.dispatchEvent(new Event('input')); });
  await listOpen(false);
  const shut = await page.evaluate(() => document.getElementById('catList').hidden);
  await page.$eval('#chips [data-r="all"]', b => b.click());
  const all = await page.evaluate(() => ({ open: !document.getElementById('catList').hidden, count: document.getElementById('catCount').textContent }));
  await page.$eval('#chips [data-r="all"]', b => b.click());
  check('Katalog öffnet beim Suchen und Filtern', hit.open && hit.shown > 0 && shut && all.open && all.count === `Alle ${N} Artikel` && await catalogOk(page), `${hit.count}, ${all.count}`);
  check('3D läuft (Bühne und Ranke)', await glLive(page));
  const cdp = await page.createCDPSession();
  const man = await cdp.send('Page.getAppManifest');
  check('Manifest ohne Fehler', man.errors.length === 0, man.errors.map(e => e.message).join('; '));
  await page.evaluate(() => navigator.serviceWorker.ready);
  const inst = await cdp.send('Page.getInstallabilityErrors');
  check('Chrome hält die App für installierbar', inst.installabilityErrors.length === 0, inst.installabilityErrors.map(e => e.errorId).join(', '));
  await page.reload({ waitUntil: 'networkidle0' });
  check('Service Worker übernimmt nach dem Neuladen', await page.evaluate(() => !!navigator.serviceWorker.controller));
  const cached = await page.evaluate(async () => { const keys = await caches.keys(); const c = await caches.open(keys.find(k => k.startsWith('lernwiki-shell-'))); return (await c.keys()).length; });
  check('App-Hülle gespeichert', cached >= 19, `${cached} Dateien`);

  /* 2. Flugmodus: App muss komplett aus dem Speicher starten */
  await setOffline(page, true);
  await page.reload({ waitUntil: 'load' });
  check('Start im Flugmodus', await catalogOk(page));
  check('3D im Flugmodus', await glLive(page));
  await sleep(1500);
  await page.screenshot({ path: path.join(SHOTS, 'offline-desktop.png') });
  await setOffline(page, false);
  check('Keine Fehler am Desktop', errs.length === 0, errs.slice(0, 5).join(' | '));

  /* 3. Handy, dunkel */
  var m = await browser.newPage();
  const merrs = watch(m, 'Handy');
  await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await m.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await m.goto(BASE, { waitUntil: 'networkidle0' });
  check('3D auf dem Handy', await glLive(m));
  await sleep(1500);
  await m.screenshot({ path: path.join(SHOTS, 'handy-dunkel.png') });
  check('Keine Fehler auf dem Handy', merrs.length === 0, merrs.slice(0, 5).join(' | '));

  /* 4. Stufe 2: Lesen in der App, Lernstand, Prüfungsmodus, Mein Stand */
  const LF31 = 'Lernmaterial_Lernfelder/Lernfeld_3/LF3.1_Das_Fundament_des_Netzwerks.md';
  const r = await browser.newPage();
  const rerrs = watch(r, 'Leser');
  await r.setViewport({ width: 1280, height: 860 });
  await r.goto(BASE, { waitUntil: 'networkidle0' });
  await r.evaluate(() => navigator.serviceWorker.ready);
  await r.reload({ waitUntil: 'networkidle0' });
  await ready(r);
  await r.type('#q', 'Fundament des Netzwerks');
  /* warten, bis der Treffer sichtbar ist; auf dem langsamen GitHub-Rechner reichen feste 300 ms nicht immer */
  const link = await r.waitForFunction(p => { const s = document.querySelector(`#catList .st[data-p="${p}"]`), a = s && s.closest('a'); return a && a.offsetParent ? a : null; }, { timeout: 10000 }, LF31).catch(() => null);
  if (link) await link.evaluate(a => a.click());
  await r.waitForFunction(() => document.querySelectorAll('#prose table').length > 2, { timeout: 15000 }).catch(() => {});
  const art = await r.evaluate(() => ({
    open: !document.getElementById('sheet').hidden, hash: location.hash, title: (document.getElementById('sheetTitle') || {}).textContent,
    tables: document.querySelectorAll('#prose table').length, rot: document.querySelectorAll('#prose [data-ampel="rot"]').length,
    gelb: document.querySelectorAll('#prose [data-ampel="gelb"]').length, anchors: document.querySelectorAll('#prose h2[id], #prose h3[id]').length
  }));
  check('Artikel öffnet in der App', art.open && art.hash.startsWith('#/artikel/') && art.tables > 2, `${art.title}: ${art.tables} Tabellen, ${art.anchors} Sprungmarken`);
  check('Ampel im Artikel erkannt', art.rot > 5 && art.gelb > 0, `${art.rot} rot, ${art.gelb} gelb`);
  await r.click('#onlyRot');
  const nr = await r.evaluate(() => { const g = [...document.querySelectorAll('#prose [data-ampel="gelb"]')]; return { pressed: document.getElementById('onlyRot').getAttribute('aria-pressed'), cls: document.getElementById('prose').className, visible: g.filter(e => getComputedStyle(e).display !== 'none').length, total: g.length }; });
  check('Nur ROT blendet Gelb und Grün aus', nr.visible === 0 && nr.pressed === 'true', JSON.stringify(nr));
  await r.screenshot({ path: path.join(SHOTS, 'artikel-nur-rot.png') });
  await r.click('#onlyRot');
  await r.evaluate(() => document.querySelector('.art-end .seg [data-st="2"]').click());
  const st = await r.evaluate(p => JSON.parse(localStorage.getItem('lernwiki-stand-v1'))[p], LF31);
  check('Lernstand "sitzt" gespeichert', st && st.s === 2);
  await r.evaluate(() => document.getElementById('sheetScroll').scrollTo(0, 1e6));
  await sleep(600);
  await r.screenshot({ path: path.join(SHOTS, 'artikel-ende.png') });
  await r.click('#sheetBack');
  await sleep(500);
  const back = await r.evaluate(p => ({ open: !document.getElementById('sheet').hidden, hash: location.hash, badge: document.querySelector(`#catList .st[data-p="${p}"]`).textContent }), LF31);
  check('Zurück schließt den Artikel', !back.open && !back.hash.startsWith('#/'), back.hash);
  check('Katalog zeigt den Lernstand', back.badge === 'sitzt');

  await setOffline(r, true);
  await r.evaluate(p => window.FIAE.go('#/artikel/' + encodeURIComponent(p)), LF31);
  await r.waitForFunction(() => document.querySelectorAll('#prose table').length > 2, { timeout: 8000 }).then(() => check('Gelesener Artikel geht offline', true), () => check('Gelesener Artikel geht offline', false));
  await r.evaluate(() => window.FIAE.go('#/artikel/' + encodeURIComponent('KI-Anfänger_bis_Nerd_Die_Sammlung/0.3_Das_Dahinter/D2_Embeddings.md')));
  await r.waitForSelector('#prose .callout', { timeout: 8000 }).then(() => check('Ungelesener Artikel offline: verständlicher Hinweis', true), () => check('Ungelesener Artikel offline: verständlicher Hinweis', false));
  await setOffline(r, false);

  await r.evaluate(() => window.FIAE.go('#/pruefung'));
  await sleep(400);
  const ex = await r.evaluate(() => ({ num: document.querySelector('.mb-num').textContent, rows: document.querySelectorAll('.exam-list li').length }));
  check('Prüfungsmodus zählt richtig', ex.num.replace(/\s+/g, '') === `1von${NROT}sitzen` || ex.num.includes('1') && ex.num.includes(String(NROT)), `${ex.num.trim()}, ${ex.rows} offene Einträge`);
  await r.screenshot({ path: path.join(SHOTS, 'pruefungsmodus.png') });
  await r.evaluate(() => window.FIAE.go('#/stand'));
  await sleep(800);
  const sd = await r.evaluate(() => ({ nums: [...document.querySelectorAll('.stand-nums b')].map(b => b.textContent), off: document.getElementById('offInfo').textContent }));
  check('Mein Stand zeigt Zahlen und Offline-Speicher', sd.nums[0] === '1' && sd.nums[1] === '1' && new RegExp(`\\d+ von ${N}`).test(sd.off), `${sd.nums.join('/')}, ${sd.off}`);
  await r.screenshot({ path: path.join(SHOTS, 'mein-stand.png') });
  check('Keine Fehler im Leser', rerrs.length === 0, rerrs.slice(0, 5).join(' | '));

  /* 5. Direkt geöffneter Link und Zurück-Taste */
  const dl = await browser.newPage();
  await dl.setViewport({ width: 1280, height: 860 });
  await dl.goto(BASE + '#/artikel/' + encodeURIComponent(LF31), { waitUntil: 'networkidle0' });
  await ready(dl);
  const dlo = await dl.evaluate(() => !document.getElementById('sheet').hidden);
  await dl.click('#sheetBack'); await sleep(400);
  const dlc = await dl.evaluate(() => ({ open: !document.getElementById('sheet').hidden, url: location.href }));
  check('Direkter Link öffnet, Zurück führt zur Startseite', dlo && !dlc.open && dlc.url === BASE, dlc.url);

  /* 6. Handy: untere Leiste, Klick auf ein Blatt der Ranke */
  await m.bringToFront();
  await m.evaluate(() => document.querySelector('#tabbar a[data-tab="pruefung"]').click());
  await sleep(600);
  check('Handy: Leiste öffnet den Prüfungsmodus', await m.evaluate(() => !document.getElementById('sheet').hidden && document.querySelector('#tabbar a.on').dataset.tab === 'pruefung'));
  await m.screenshot({ path: path.join(SHOTS, 'handy-pruefung.png') });
  await m.evaluate(() => window.FIAE.closeSheet());
  await r.bringToFront();
  await r.evaluate(() => window.FIAE.closeSheet());
  await r.evaluate(() => { const el = document.querySelector('#ranke'); window.scrollTo(0, el.getBoundingClientRect().top + scrollY + 40); });
  await sleep(5000);
  const box = await r.evaluate(() => { const b = document.querySelector('#a-ranke').getBoundingClientRect(); return { l: b.left, t: Math.max(80, b.top), r: b.right, b: Math.min(innerHeight, b.bottom) }; });
  let leaf = null;
  for (let y = box.t + 10; y < box.b && !leaf; y += 16) for (let x = box.l + 10; x < box.r && !leaf; x += 16) {
    await r.mouse.move(x, y); await sleep(30);
    if (await r.evaluate(() => document.getElementById('tip').classList.contains('on'))) leaf = { x, y };
  }
  if (leaf) { await r.mouse.click(leaf.x, leaf.y); await sleep(800); }
  check('Klick auf ein Blatt öffnet den Artikel', leaf && await r.evaluate(() => !document.getElementById('sheet').hidden && location.hash.startsWith('#/artikel/')));

  /* Klick auf einen Zweig (nicht auf ein Blatt) öffnet die Kachel seiner Abteilung */
  await r.evaluate(() => window.FIAE.closeSheet());
  await sleep(600);
  let twig = null;
  const cand = await r.evaluate(() => {
    const A = document.getElementById('a-ranke').getBoundingClientRect(), T = window.FIAE.tree, out = [];
    T.twigs.forEach((t, i) => { if (T.labels[i].classList.contains('on')) for (let k = 2; k < 24; k += 2) out.push({ x: A.left + t.pts[k][0], y: A.top + t.pts[k][1], id: t.r.id }); });
    return out.filter(p => p.y > 90 && p.y < innerHeight - 10 && p.x > 0 && p.x < innerWidth);
  });
  for (const p of cand) {
    await r.mouse.move(p.x, p.y); await sleep(60);
    const st = await r.evaluate(() => ({ tip: document.getElementById('tip').classList.contains('on'), hot: document.getElementById('a-ranke').classList.contains('twig-hot') }));
    if (st.hot && !st.tip) { twig = p; break; }
  }
  if (twig) { await r.mouse.click(twig.x, twig.y); await sleep(1800); }
  check('Klick auf einen Zweig öffnet die Kachel der Abteilung', twig && await r.evaluate(id => document.getElementById('r-' + id).classList.contains('open') && document.getElementById('sheet').hidden, twig.id), twig ? twig.id : 'kein Zweig gefunden');

  /* 7. Erfolg, wenn ein Lernfeld geschafft ist. Eigener Browser-Kontext, damit der Lernstand von oben unberührt bleibt. */
  const pathOf = a => decodeURIComponent(a.u.split('/blob/main/')[1] || a.u);
  const LF1 = CAT.artikel.filter(a => a.lf === 1).map(pathOf);
  const ZIEL = CAT.lf.filter(l => CAT.artikel.some(a => a.lf === l.n)).length;
  const ctx = await browser.createBrowserContext();
  const ep = await ctx.newPage();
  const eerrs = watch(ep, 'Erfolg');
  await ep.setViewport({ width: 1280, height: 860 });
  /* zählt, wie oft die Feier aufgeht */
  await ep.evaluateOnNewDocument(() => addEventListener('DOMContentLoaded', () => {
    window.__feiern = 0;
    const el = document.getElementById('erfolg');
    new MutationObserver(() => { if (!el.hidden) window.__feiern++; }).observe(el, { attributes: true, attributeFilter: ['hidden'] });
  }));
  await ep.goto(BASE, { waitUntil: 'networkidle0' });
  const setStand = (page, paths) => page.evaluate(ps => localStorage.setItem('lernwiki-stand-v1', JSON.stringify(Object.fromEntries(ps.map(p => [p, { s: 2, t: 1 }])))), paths);
  await setStand(ep, LF1);
  await ep.reload({ waitUntil: 'networkidle0' });
  await ready(ep);
  const t1 = await ep.evaluate(() => ({ done: document.getElementById('lf1').classList.contains('done'), n: document.querySelectorAll('#tilesLf .tile.done').length, st: document.querySelector('#lf1 .lf-st').textContent, feiern: window.__feiern }));
  check('Geschafftes Lernfeld: Kachel zeigt es, keine Feier beim Laden', t1.done && t1.n === 1 && t1.feiern === 0, `${t1.st}, ${t1.feiern} Feiern`);
  await ep.evaluate(() => window.FIAE.go('#/stand'));
  await sleep(500);
  const s1 = await ep.evaluate(() => ({ num: document.getElementById('lfDone').textContent, chip: document.querySelector('.lf-chip[data-open="lf1"]').classList.contains('done') }));
  check('Mein Stand zählt geschaffte Lernfelder', s1.num.replace(/\s+/g, '') === `1von${ZIEL}Lernfelderngeschafft` && s1.chip, s1.num);

  /* letzten Artikel von LF1 im Prüfungsmodus abhaken: genau eine Feier, auch nach Abwählen und erneutem Abhaken */
  await setStand(ep, LF1.slice(0, -1));
  await ep.reload({ waitUntil: 'networkidle0' });
  await ready(ep);
  await ep.evaluate(() => window.FIAE.go('#/pruefung'));
  await sleep(400);
  await ep.evaluate(() => document.querySelector('.exam-chips [data-f="alle"]').click());
  const tick = () => ep.evaluate(p => document.querySelector(`input[data-p="${p}"]`).click(), LF1[LF1.length - 1]);
  await tick();
  await sleep(1600);
  const f1 = await ep.evaluate(() => ({ open: !document.getElementById('erfolg').hidden, title: document.getElementById('erfolgTitle').textContent, live: document.getElementById('sheetLive').textContent, feiern: window.__feiern, merk: localStorage.getItem('lernwiki-erfolge-v1') }));
  await ep.screenshot({ path: path.join(SHOTS, 'erfolg-feier.png') });
  await ep.keyboard.press('Escape');
  const f2 = await ep.evaluate(() => ({ zu: document.getElementById('erfolg').hidden, sheet: !document.getElementById('sheet').hidden }));
  await tick(); await sleep(200); await tick(); await sleep(400);
  const f3 = await ep.evaluate(() => ({ zu: document.getElementById('erfolg').hidden, feiern: window.__feiern }));
  check('Letzten Artikel abhaken: Feier mit Ansage', f1.open && f1.title === 'LF1 geschafft!' && f1.live.includes('LF1 geschafft!') && JSON.parse(f1.merk)['1'] === LF1.length, `${f1.title} ${f1.merk}`);
  check('Escape schließt die Feier, Prüfungsmodus bleibt offen', f2.zu && f2.sheet);
  check('Feier kommt nur einmal', f3.zu && f3.feiern === 1, `${f3.feiern} Feiern`);

  /* Wiederherstellen einer Sicherung mit geschafftem Lernfeld: keine Feier */
  const LF2 = CAT.artikel.filter(a => a.lf === 2).map(pathOf);
  await ep.evaluate(ps => { const all = { ...window.FIAE.stand.all() }; ps.forEach(p => { all[p] = { s: 2, t: 1 }; }); window.FIAE.stand.replace(all); }, LF2);
  await sleep(300);
  const w1 = await ep.evaluate(() => ({ feiern: window.__feiern, lf2: document.getElementById('lf2').classList.contains('done') }));
  check('Wiederherstellen feiert nicht', w1.feiern === 1 && w1.lf2, `${w1.feiern} Feiern`);

  /* Alle Lernfelder geschafft: eigene Feier */
  const rest = CAT.artikel.filter(a => a.lf).map(pathOf).filter(p => !LF1.includes(p) && !LF2.includes(p));
  await ep.evaluate(ps => ps.forEach(p => window.FIAE.stand.set(p, 2)), rest);
  await sleep(1600);
  const g1 = await ep.evaluate(() => ({ open: !document.getElementById('erfolg').hidden, title: document.getElementById('erfolgTitle').textContent, gesamt: document.getElementById('erfolg').classList.contains('gesamt') }));
  check('Alle Lernfelder geschafft: eigene Feier', g1.open && g1.gesamt && g1.title === 'Alle Lernfelder geschafft!', g1.title);
  await ep.screenshot({ path: path.join(SHOTS, 'erfolg-gesamt.png') });
  await ep.click('#erfolgOk');
  await ep.evaluate(() => window.FIAE.closeSheet());
  await sleep(600);
  const nDone = await ep.evaluate(() => document.querySelectorAll('#tilesLf .tile.done').length);
  check('Alle Kacheln mit Artikeln zeigen geschafft', nDone === ZIEL, `${nDone} von ${ZIEL}`);
  await ep.evaluate(() => { const el = document.getElementById('lernfelder'); window.scrollTo(0, el.getBoundingClientRect().top + scrollY); });
  await sleep(1800);
  await ep.screenshot({ path: path.join(SHOTS, 'erfolg-kacheln.png') });
  check('Keine Fehler beim Erfolg', eerrs.length === 0, eerrs.slice(0, 5).join(' | '));
  await ctx.close();
} catch (e) {
  check('Test lief durch', false, e.message);
} finally {
  await browser.close();
  server.close();
}

const w = Math.max(...results.map(r => r.name.length));
for (const r of results) console.log(`${r.pass ? 'OK  ' : 'FEHL'}  ${r.name.padEnd(w)}  ${r.info}`);
const bad = results.filter(r => !r.pass).length;
console.log(bad ? `\n${bad} von ${results.length} Prüfungen fehlgeschlagen` : `\nAlle ${results.length} Prüfungen bestanden`);
process.exit(bad ? 1 : 0);
