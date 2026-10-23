/* Automatischer Test der gebauten App in docs/ mit dem installierten Chrome (puppeteer-core).
   npm test                     -> alle Prüfungen, Bildschirmfotos nach tools/shots/
   CHROME=/pfad/zu/chrome npm test, falls Chrome woanders liegt
   CI=1 npm test               -> wie auf GitHub: 3D in Software statt auf der Grafikkarte
   Prüft: Installierbarkeit laut Chrome, Service Worker übernimmt, Start im Flugmodus, keine Fehler in der Konsole,
   Lesen, Lernstand, Belohnungen, Fehler melden und Versionsnummer. */
import puppeteer from 'puppeteer-core';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
  /* die Stempel-Karte vom ersten Artikel zur Seite legen, sie liegt sonst über der Ranke */
  await r.evaluate(() => { if (!document.getElementById('erfolg').hidden) document.getElementById('erfolgOk').click(); });
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
  /* zählt, wie oft die Lernfeld-Feier aufgeht (Stempel-Karten zählen nicht) */
  await ep.evaluateOnNewDocument(() => addEventListener('DOMContentLoaded', () => {
    window.__feiern = 0;
    const el = document.getElementById('erfolg');
    new MutationObserver(() => { if (!el.hidden && el.dataset.art !== 'stempel') window.__feiern++; }).observe(el, { attributes: true, attributeFilter: ['hidden'] });
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
  /* zu heißt hier: keine Lernfeld-Karte mehr offen (eine Stempel-Karte darf danach kommen) */
  const f2 = await ep.evaluate(() => ({ zu: (f => f.hidden || f.dataset.art === 'stempel')(document.getElementById('erfolg')), sheet: !document.getElementById('sheet').hidden }));
  await tick(); await sleep(200); await tick(); await sleep(400);
  const f3 = await ep.evaluate(() => ({ zu: (f => f.hidden || f.dataset.art === 'stempel')(document.getElementById('erfolg')), feiern: window.__feiern }));
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

  /* 8. Bienen: zu Ende gelesen, einmal je Artikel fliegt eine Biene ein. Eigener Browser-Kontext. */
  const ctx2 = await browser.createBrowserContext();
  const bp = await ctx2.newPage();
  const berrs = watch(bp, 'Bienen');
  await bp.setViewport({ width: 1280, height: 860 });
  /* zählt, wie oft eine Biene losfliegt */
  await bp.evaluateOnNewDocument(() => addEventListener('DOMContentLoaded', () => {
    window.__bienen = 0;
    new MutationObserver(ms => ms.forEach(mu => mu.addedNodes.forEach(n => { if (n.classList && n.classList.contains('bee-fly')) window.__bienen++; }))).observe(document.body, { childList: true });
  }));
  await bp.goto(BASE, { waitUntil: 'networkidle0' });
  await ready(bp);
  const readToEnd = async () => {
    await bp.evaluate(p => window.FIAE.go('#/artikel/' + encodeURIComponent(p)), LF31);
    await bp.waitForSelector('.art-end', { timeout: 15000 });
    await bp.evaluate(() => document.getElementById('sheetScroll').scrollTo(0, 1e6));
    await bp.waitForFunction(p => (JSON.parse(localStorage.getItem('lernwiki-stand-v1') || '{}')[p] || {}).s === 1, { timeout: 8000 }, LF31).catch(() => {});
  };
  await readToEnd();
  await bp.waitForFunction(() => window.__bienen > 0, { timeout: 5000 }).catch(() => {});
  await sleep(500);
  await bp.screenshot({ path: path.join(SHOTS, 'biene-flug.png') });
  await bp.waitForFunction(() => !document.querySelector('.bee-fly'), { timeout: 5000 }).catch(() => {});
  const b1 = await bp.evaluate(p => {
    const b = document.querySelector('.art-end [data-bee] .bee');
    return { fly: window.__bienen, landed: !!b && getComputedStyle(b).visibility === 'visible', merk: !!JSON.parse(localStorage.getItem('lernwiki-bienen-v1') || '{}')[p],
      toast: !document.getElementById('toast').hidden, live: document.getElementById('sheetLive').textContent };
  }, LF31);
  await bp.screenshot({ path: path.join(SHOTS, 'biene-gelandet.png') });
  check('Zu Ende gelesen: Biene fliegt ein und landet', b1.fly === 1 && b1.landed && b1.merk && !b1.toast && b1.live.includes('Biene'), JSON.stringify(b1));
  /* auf "Noch nicht" und noch einmal zu Ende lesen: keine zweite Biene, dafür der gewohnte Hinweis */
  await bp.evaluate(() => document.querySelector('.art-end .seg [data-st="0"]').click());
  await bp.evaluate(() => window.FIAE.closeSheet());
  await readToEnd();
  await sleep(600);
  const b2 = await bp.evaluate(() => ({ fly: window.__bienen, toast: document.getElementById('toastText').textContent }));
  check('Biene nur einmal je Artikel', b2.fly === 1 && b2.toast === 'Als gelesen markiert.', JSON.stringify(b2));
  await bp.evaluate(() => window.FIAE.closeSheet());
  const b3 = await bp.evaluate(p => ({ cat: !!document.querySelector(`#catList .st[data-p="${p}"] svg.bee`), line: !!document.querySelector('#standLine svg.bee') }), LF31);
  check('Katalog und Stand zeigen die Biene', b3.cat && b3.line, JSON.stringify(b3));
  check('Keine Fehler bei den Bienen', berrs.length === 0, berrs.slice(0, 5).join(' | '));
  await ctx2.close();

  /* 9. Leseausweis: Stempel. Eigener Browser-Kontext. Die Zeitzone wird fest auf Tag gestellt (für die Nachteule später auf Nacht),
     damit der Test zu jeder Uhrzeit gleich läuft, auch beim nächtlichen Lauf auf GitHub. */
  const zone = ok => { const h = new Date().getUTCHours(); for (let o = -12; o <= 14; o++) if (ok((h + o + 24) % 24)) return o >= 0 ? `Etc/GMT-${o}` : `Etc/GMT+${-o}`; };
  const TAG = zone(l => l >= 11 && l < 16), NACHT = zone(l => l === 23 || l < 2);
  const ctx3 = await browser.createBrowserContext();
  const sp = await ctx3.newPage();
  const serrs = watch(sp, 'Stempel');
  await sp.setViewport({ width: 1280, height: 860 });
  await sp.emulateTimezone(TAG);
  /* Sichern lädt eine Datei herunter; im Test nicht */
  await (await browser.target().createCDPSession()).send('Browser.setDownloadBehavior', { behavior: 'deny', browserContextId: ctx3.id }).catch(() => {});
  await sp.goto(BASE, { waitUntil: 'networkidle0' });
  await ready(sp);
  const N_ST = await sp.evaluate(() => window.FIAE.stempel.liste.length);
  await sp.evaluate(() => window.FIAE.go('#/stand'));
  await sleep(500);
  const k0 = await sp.evaluate(() => ({ alle: document.querySelectorAll('#ausweis .stempel').length, on: document.querySelectorAll('#ausweis .stempel.on').length }));
  check('Leseausweis zeigt alle Stempel, noch keiner verdient', k0.alle === N_ST && N_ST >= 17 && k0.on === 0, `${k0.alle} Stempel`);
  /* neun Artikel an neun verschiedenen Tagen gelesen, jeweils mittags: Stempel kommen beim Laden still dazu */
  const P10 = CAT.artikel.slice(0, 10).map(pathOf);
  await sp.evaluate(ps => { const o = {}; ps.slice(0, 9).forEach((p, i) => { o[p] = { s: 1, t: new Date(2026, 8, 1 + i, 12).getTime() }; }); localStorage.setItem('lernwiki-stand-v1', JSON.stringify(o)); }, P10);
  await sp.reload({ waitUntil: 'networkidle0' });
  await ready(sp);
  await sleep(600);
  const k1 = await sp.evaluate(() => ({ hat: Object.keys(window.FIAE.stempel.alle()).sort().join(','), card: !document.getElementById('erfolg').hidden, tage: window.FIAE.stempel.tage().length }));
  check('Stempel aus dem Lernstand kommen still dazu', k1.hat === 'b1,b5,t7' && !k1.card && k1.tage === 9, JSON.stringify(k1));
  /* der zehnte Artikel per Klick: Karte mit dem Stempel Bienenstock */
  await sp.evaluate(p => window.FIAE.stand.set(p, 1), P10[9]);
  await sp.waitForFunction(() => !document.getElementById('erfolg').hidden, { timeout: 5000 }).catch(() => {});
  await sleep(500);
  const k2 = await sp.evaluate(() => ({ art: document.getElementById('erfolg').dataset.art, title: document.getElementById('erfolgTitle').textContent, stp: !!document.querySelector('#erfolgStempel svg'),
    on: !!document.querySelector('#ausweis .stempel.on[data-id="b10"]'), live: document.getElementById('sheetLive').textContent }));
  await sp.screenshot({ path: path.join(SHOTS, 'stempel-karte.png') });
  check('Neuer Stempel: Karte mit Stempel und Ansage', k2.art === 'stempel' && k2.title === 'Bienenstock' && k2.stp && k2.on && k2.live.includes('Bienenstock'), JSON.stringify(k2));
  await sp.click('#erfolgStand');
  await sleep(1000);
  const k3 = await sp.evaluate(() => ({ zu: document.getElementById('erfolg').hidden, top: Math.round(document.getElementById('ausweis').getBoundingClientRect().top) }));
  await sp.screenshot({ path: path.join(SHOTS, 'leseausweis.png') });
  check('Zum Leseausweis springt dorthin', k3.zu && k3.top >= 0 && k3.top < 400, JSON.stringify(k3));
  /* Sichern gibt Backup-Profi */
  await sp.evaluate(() => document.getElementById('exp').click());
  await sp.waitForFunction(() => !document.getElementById('erfolg').hidden, { timeout: 5000 }).catch(() => {});
  const k4 = await sp.evaluate(() => ({ title: document.getElementById('erfolgTitle').textContent, hat: !!window.FIAE.stempel.alle().backup }));
  check('Sichern gibt den Stempel Backup-Profi', k4.hat && k4.title === 'Backup-Profi', JSON.stringify(k4));
  await sp.evaluate(() => document.getElementById('erfolgOk').click());
  /* nach 22 Uhr: Nachteule, mit dem Hinweis auf Schlaf */
  await sp.emulateTimezone(NACHT);
  await sp.evaluate(p => window.FIAE.stand.set(p, 2), P10[0]);
  await sp.waitForFunction(() => !document.getElementById('erfolg').hidden && document.getElementById('erfolgTitle').textContent.includes('Nachteule'), { timeout: 5000 }).catch(() => {});
  const k5 = await sp.evaluate(() => ({ title: document.getElementById('erfolgTitle').textContent, sub: document.getElementById('erfolgSub').textContent }));
  check('Nach 22 Uhr: Nachteule mit Hinweis auf Schlaf', k5.title.includes('Nachteule') && k5.sub.includes('Schlaf'), k5.title);
  await sp.evaluate(() => document.getElementById('erfolgOk').click());
  await sp.emulateTimezone(TAG);
  /* Zurücksetzen löscht Stempel und Lerntage */
  await sp.evaluate(() => { window.confirm = () => true; document.getElementById('reset').click(); });
  await sleep(400);
  const k6 = await sp.evaluate(() => ({ n: Object.keys(window.FIAE.stempel.alle()).length, tage: window.FIAE.stempel.tage().length }));
  check('Zurücksetzen löscht Stempel und Lerntage', k6.n === 0 && k6.tage === 0, JSON.stringify(k6));
  /* Wiederherstellen einer Sicherung bringt Stempel und Lerntage mit, ohne Feier; Unbekanntes bleibt draußen */
  const tMittag = await sp.evaluate(() => new Date(2026, 8, 1, 12).getTime());
  const SICH = path.join(SHOTS, 'sicherung-test.json');
  await writeFile(SICH, JSON.stringify({ app: 'lernwiki', version: 1, stand: { [P10[0]]: { s: 1, t: tMittag } }, stempel: { backup: tMittag, quatsch: 5 }, tage: ['2026-09-01', '2026-09-02'] }));
  await (await sp.$('#imp')).uploadFile(SICH);
  await sleep(1000);
  const k7 = await sp.evaluate(() => ({ hat: Object.keys(window.FIAE.stempel.alle()).sort().join(','), tage: window.FIAE.stempel.tage().length, card: !document.getElementById('erfolg').hidden }));
  check('Wiederherstellen bringt Stempel mit, ohne Feier', k7.hat === 'b1,backup' && k7.tage === 2 && !k7.card, JSON.stringify(k7));
  check('Keine Fehler beim Leseausweis', serrs.length === 0, serrs.slice(0, 5).join(' | '));
  await ctx3.close();

  /* 10. Fehler melden und Versionsnummer */
  const fp = await browser.newPage();
  const ferrs = watch(fp, 'Melden');
  await fp.setViewport({ width: 1280, height: 860 });
  await fp.goto(BASE, { waitUntil: 'networkidle0' });
  await ready(fp);
  const ver = await fp.evaluate(async () => ({ html: document.documentElement.dataset.version, foot: document.getElementById('footVersion').textContent, json: (await (await fetch('version.json', { cache: 'no-store' })).json()).version }));
  check('Versionsnummer im Fuß und in version.json', /^\d+\.\d+\.(\d+|x-lokal)$/.test(ver.html) && ver.foot === 'Version ' + ver.html && ver.json === ver.html, JSON.stringify(ver));
  await fp.evaluate(p => window.FIAE.go('#/artikel/' + encodeURIComponent(p)), LF31);
  await fp.waitForFunction(() => document.querySelectorAll('#prose h2').length > 2, { timeout: 15000 }).catch(() => {});
  /* zur dritten Überschrift scrollen: sie ist dann der Abschnitt der Meldung */
  const h3 = await fp.evaluate(() => { const h = document.querySelectorAll('#prose h2')[2], s = document.getElementById('sheetScroll'); s.scrollTop += h.getBoundingClientRect().top - s.getBoundingClientRect().top - 40; return h.textContent.trim(); });
  await sleep(300);
  await fp.click('#sheetTools [data-melden]');
  await sleep(300);
  const dl1 = await fp.evaluate(() => ({ open: document.getElementById('melden').open, wo: document.getElementById('meldenWo').textContent, info: document.getElementById('meldenInfo').textContent, fokus: document.activeElement.id }));
  check('Fehler melden: Formular kennt Artikel und Abschnitt', dl1.open && dl1.wo.includes('Fundament') && dl1.wo.includes(h3) && dl1.info.includes('App-Version') && dl1.fokus === 'meldenText', `${dl1.wo}`);
  await fp.click('#meldenGh');
  const leer = await fp.evaluate(() => ({ open: document.getElementById('melden').open, st: document.getElementById('meldenStatus').textContent }));
  await fp.type('#meldenText', 'Formeln in der Tabelle stehen als Text da.');
  await fp.evaluate(() => { window.__kopie = null; navigator.clipboard.writeText = t => { window.__kopie = t; return Promise.resolve(); }; });
  await fp.click('#meldenCopy');
  await sleep(200);
  const kopie = await fp.evaluate(() => ({ t: window.__kopie, st: document.getElementById('meldenStatus').textContent }));
  check('Ohne Text geht nichts raus, Kopieren für Teams', leer.open && leer.st.includes('Schreib') && kopie.t && kopie.t.includes('Formeln in der Tabelle') && kopie.t.includes(h3) && kopie.t.includes('App-Version: ' + ver.html) && kopie.st.startsWith('Kopiert'), kopie.st);
  await fp.keyboard.press('Escape');
  await sleep(200);
  const esc1 = await fp.evaluate(() => ({ dlg: document.getElementById('melden').open, sheet: !document.getElementById('sheet').hidden }));
  check('Escape schließt nur das Formular, der Artikel bleibt offen', !esc1.dlg && esc1.sheet, JSON.stringify(esc1));
  await fp.click('#sheetTools [data-melden]');
  await fp.evaluate(() => { window.__auf = null; window.open = u => { window.__auf = u; return null; }; });
  await fp.click('#meldenGh');
  await sleep(200);
  const gh = await fp.evaluate(() => ({ u: window.__auf, open: document.getElementById('melden').open }));
  const ghu = gh.u ? new URL(gh.u) : null;
  check('Auf GitHub melden: Issue mit Titel, Text und Version', ghu && ghu.pathname === '/ITDavid04/Wiki-APP/issues/new' && !gh.open &&
    ghu.searchParams.get('title').startsWith('Fehler: ') && ghu.searchParams.get('body').includes('Formeln in der Tabelle') &&
    ghu.searchParams.get('body').includes(h3) && ghu.searchParams.get('body').includes(ver.html), gh.u && ghu.searchParams.get('title'));
  await fp.evaluate(() => window.FIAE.closeSheet());
  await fp.evaluate(() => document.querySelector('.foot [data-melden]').click());
  await sleep(200);
  const start = await fp.evaluate(() => ({ open: document.getElementById('melden').open, wo: document.getElementById('meldenWo').textContent }));
  check('Fehler melden auch von der Startseite', start.open && start.wo.includes('Startseite'), start.wo);
  await fp.screenshot({ path: path.join(SHOTS, 'fehler-melden.png') });
  check('Keine Fehler beim Melden', ferrs.length === 0, ferrs.slice(0, 5).join(' | '));
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
