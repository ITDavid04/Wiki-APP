/* Fehler melden: ein kleines Formular über allem, was gerade offen ist. Jeder Knopf mit data-melden öffnet es.
   Die App hat keinen Server. Die Meldung geht deshalb als vorausgefülltes Issue an GitHub (ITDavid04/Wiki-APP)
   oder als Text in die Zwischenablage, zum Einfügen in Teams. Wo der Fehler steckt (Artikel, Abschnitt, markierte Stelle),
   die Version der App und das Gerät kommen automatisch dazu. Abgeschickt wird erst auf GitHub, von dir selbst. */
const F = window.FIAE;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const ISSUE_NEU = 'https://github.com/ITDavid04/Wiki-APP/issues/new';

const dlg = $('#melden'), txt = $('#meldenText'), wo = $('#meldenWo'), info = $('#meldenInfo'), status = $('#meldenStatus');
let ort = null, markiert = '';

/* Betriebssystem und Browser grob aus der Kennung; Edge und Opera nennen sich auch Chrome, deshalb zuerst */
const BROWSER = [['Edg', 'Edge'], ['OPR', 'Opera'], ['SamsungBrowser', 'Samsung Internet'], ['FxiOS', 'Firefox'], ['Firefox', 'Firefox'], ['CriOS', 'Chrome'], ['Chrome', 'Chrome'], ['Version', 'Safari']];
function geraet(){
  const ua = navigator.userAgent;
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'iOS' :
    /Windows/.test(ua) ? 'Windows' : /CrOS/.test(ua) ? 'ChromeOS' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'unbekannt';
  const b = BROWSER.map(([k, n]) => [n, ua.match(new RegExp(k + '/(\\d+)'))]).find(x => x[1]);
  const app = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const dunkel = getComputedStyle(document.documentElement).colorScheme === 'dark' || document.documentElement.dataset.theme === 'dark';
  return [os, b ? `${b[0]} ${b[1][1]}` : 'Browser unbekannt', app ? 'als App installiert' : 'im Browser',
    `${innerWidth} × ${innerHeight}`, dunkel ? 'dunkel' : 'hell', document.documentElement.classList.contains('gl-vine') ? '3D an' : '3D aus'].join(', ');
}

function daten(){
  const z = [];
  if (ort && ort.artikel) {
    z.push(['Artikel', ort.artikel]);
    z.push(['Abschnitt', ort.abschnitt || (ort.ende ? 'Ende des Artikels' : 'Anfang des Artikels')]);
    z.push(['Datei im Wiki', ort.pfad]);
  } else z.push(['Seite', (ort && ort.seite) || 'Startseite']);
  if (markiert) z.push(['Markierte Stelle', `„${markiert}“`]);
  z.push(['App-Version', F.version], ['Gerät', geraet()], ['Gemeldet', new Date().toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })]);
  return z;
}
const appLink = () => location.origin + location.pathname + (ort && ort.pfad ? '#/artikel/' + encodeURIComponent(ort.pfad) : '');
const kurz = (s, n) => s.length > n ? s.slice(0, n).trimEnd() + ' …' : s;

function oeffnen(trigger){
  ort = F.meldeOrt ? F.meldeOrt(trigger.dataset.melden === 'ende') : null;
  markiert = kurz(String(getSelection() || '').replace(/\s+/g, ' ').trim(), 300);
  wo.innerHTML = ort && ort.artikel
    ? `Im Artikel <b>${esc(ort.artikel)}</b>` + (ort.abschnitt ? `, Abschnitt <b>${esc(ort.abschnitt)}</b>` : '') + '.'
    : ort ? `Auf der Seite <b>${esc(ort.seite)}</b>.` : 'Auf der Startseite.';
  info.innerHTML = daten().map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
  status.textContent = ''; status.classList.remove('warn');
  if (F.lenis && !F.sheetOpen) F.lenis.stop();
  dlg.showModal();
  txt.focus();
}
dlg.addEventListener('close', () => { if (F.lenis && !F.sheetOpen) F.lenis.start(); });
/* Klick neben das Formular schließt es */
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-melden]');
  if (b) { e.preventDefault(); oeffnen(b); }
});

function sag(t, warn){ status.textContent = t; status.classList.toggle('warn', !!warn); }
function beschreibung(){
  const t = txt.value.trim();
  if (t.length < 3) { sag('Schreib kurz, was nicht stimmt.', true); txt.focus(); return null; }
  return t;
}

/* Issue auf GitHub: Titel und Text sind vorausgefüllt, ein Bildschirmfoto lässt sich dort einfügen */
$('#meldenGh').addEventListener('click', () => {
  const t = beschreibung();
  if (!t) return;
  if (!navigator.onLine) { sag('Ohne Netz geht GitHub nicht. Kopier den Text und schick ihn, sobald du wieder online bist.', true); return; }
  const z = daten();
  const zeile = ([k, v]) => k === 'Datei im Wiki' && ort.wiki ? `- **${k}:** [${v}](${ort.wiki})` : `- **${k}:** ${v}`;
  const umgebung = ['App-Version', 'Gerät', 'Gemeldet'];
  const body = `### Was stimmt nicht?\n\n${t}\n\n### Wo\n\n${z.filter(x => !umgebung.includes(x[0])).map(zeile).join('\n')}\n- **In der App:** ${appLink()}\n\n` +
    `### Umgebung\n\n${z.filter(x => umgebung.includes(x[0])).map(zeile).join('\n')}\n\n` +
    `<!-- Bildschirmfoto: einfach hier hineinziehen oder einfügen. -->\n`;
  const titel = 'Fehler: ' + (ort && ort.artikel ? `${ort.artikel}, ` : '') + kurz(t.replace(/\s+/g, ' '), 70);
  window.open(`${ISSUE_NEU}?labels=bug&title=${encodeURIComponent(titel)}&body=${encodeURIComponent(body)}`, '_blank', 'noopener');
  txt.value = '';
  dlg.close();
  F.toast && F.toast('Danke! Auf GitHub nur noch abschicken.', null, null, 4000);
});

/* Als Text für Teams: dieselben Angaben ohne Markdown */
$('#meldenCopy').addEventListener('click', async () => {
  const t = beschreibung();
  if (!t) return;
  const text = `Fehler in der Lern-Wiki-App\n\nWas stimmt nicht: ${t}\n\n${daten().map(([k, v]) => `${k}: ${v}`).join('\n')}\nLink: ${appLink()}\n`;
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
    /* älterer Browser oder keine Erlaubnis: über ein unsichtbares Textfeld im Formular kopieren */
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.className = 'sr';
    dlg.appendChild(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    ta.remove();
  }
  sag(ok ? 'Kopiert. Jetzt in Teams einfügen, gern mit Bildschirmfoto.' : 'Kopieren ging nicht. Mach am besten ein Bildschirmfoto von diesem Fenster.', !ok);
});
