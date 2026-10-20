/* Automatischer Test der gebauten App in docs/ mit dem installierten Chrome (puppeteer-core).
   npm test                     -> alle Prüfungen, Bildschirmfotos nach tools/shots/
   CHROME=/pfad/zu/chrome npm test, falls Chrome woanders liegt
   Prüft: Installierbarkeit laut Chrome, Service Worker übernimmt, Start im Flugmodus, keine Fehler in der Konsole. */
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { start } from './serve.mjs';

const SHOTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'shots');
const PORT = 8091, BASE = `http://localhost:${PORT}/`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, pass, info = '') => { results.push({ name, pass: !!pass, info }); };

await mkdir(SHOTS, { recursive: true });
const server = await start(PORT);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=vulkan', '--enable-features=Vulkan', '--use-gl=angle']
});

function watch(page, label){
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(`${label} Konsole: ${m.text()}`); });
  page.on('pageerror', e => errs.push(`${label} Skriptfehler: ${e.message}`));
  page.on('requestfailed', r => { if (r.url().startsWith(BASE)) errs.push(`${label} Anfrage fehlgeschlagen: ${r.url()} ${r.failure() && r.failure().errorText}`); });
  return errs;
}
const glLive = page => page.waitForFunction(() => document.documentElement.classList.contains('gl-vine') && document.documentElement.classList.contains('gl-stage'), { timeout: 15000 }).then(() => true, () => false);

try {
  /* 1. Erster Besuch am Desktop */
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errs = watch(page, 'Desktop');
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  check('Seite lädt, Katalog vollständig', (await page.$eval('#catCount', e => e.textContent)) === 'Alle 172 Artikel');
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
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'load' });
  check('Start im Flugmodus', (await page.$eval('#catCount', e => e.textContent)) === 'Alle 172 Artikel');
  check('3D im Flugmodus', await glLive(page));
  await sleep(1500);
  await page.screenshot({ path: path.join(SHOTS, 'offline-desktop.png') });
  await page.setOfflineMode(false);
  check('Keine Fehler am Desktop', errs.length === 0, errs.slice(0, 5).join(' | '));

  /* 3. Handy, dunkel */
  const m = await browser.newPage();
  const merrs = watch(m, 'Handy');
  await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await m.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await m.goto(BASE, { waitUntil: 'networkidle0' });
  check('3D auf dem Handy', await glLive(m));
  await sleep(1500);
  await m.screenshot({ path: path.join(SHOTS, 'handy-dunkel.png') });
  check('Keine Fehler auf dem Handy', merrs.length === 0, merrs.slice(0, 5).join(' | '));
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
