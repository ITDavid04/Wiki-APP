/* Kleiner Webserver für docs/, ohne Abhängigkeiten.
   npm run serve            -> http://localhost:8080 (nur dieser Rechner)
   npm run serve -- --lan   -> auch im WLAN erreichbar (zum Testen auf dem Handy; Firewall-Port 8080 muss offen sein)
   Service Worker laufen nur über https oder localhost. Über die WLAN-Adresse lädt die App deshalb normal,
   installieren und offline gehen erst über GitHub Pages. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import path from 'node:path';

const DOCS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};

export function start(port = 8080, host = '127.0.0.1'){
  const server = createServer(async (req, res) => {
    try {
      let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (rel.endsWith('/')) rel += 'index.html';
      const file = path.join(DOCS, rel);
      if (!file.startsWith(DOCS + path.sep)) { res.writeHead(403).end(); return; }
      const st = await stat(file).catch(() => null);
      if (!st || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(await readFile(file));
    } catch (e) { res.writeHead(500).end(String(e)); }
  });
  return new Promise(ok => server.listen(port, host, () => ok(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const lan = process.argv.includes('--lan');
  const port = Number(process.env.PORT || 8080);
  await start(port, lan ? '0.0.0.0' : '127.0.0.1');
  console.log(`docs/ läuft auf http://localhost:${port}`);
  if (lan) for (const list of Object.values(networkInterfaces())) for (const a of list || []) {
    if (a.family === 'IPv4' && !a.internal) console.log(`im WLAN: http://${a.address}:${port}`);
  }
}
