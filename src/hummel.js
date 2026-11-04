/* Klaus-Dieter Pollenberg, die Hummel und Gartenaufsicht. Sitzt unter der Bühne auf einer kleinen Blüte an der Linie,
   winkt ab und zu und fragt erst auf Klick, ob er eine kurze Führung geben soll. Dann fliegt er an der Ranke entlang von
   Station zu Station, die Seite scrollt mit, und an jeder Station erklärt eine Sprechblase einen Teil der Bibliothek.
   - Weg: die Mittellinie des Stängels aus scene.js (F.rankePfad, Seitenpixel). Ohne 3D-Ranke fliegt er im Bogen.
   - Bei "weniger Bewegung": kein Flug, kein Winken, kein Pollenstaub, er springt von Station zu Station.
   - Escape, "Beenden" oder ein geöffneter Artikel beenden die Führung; er sitzt dann wieder auf seiner Blüte.
   - Gemerkt wird nur, ob die Führung schon gelaufen oder abgelehnt ist (lernwiki-hummel-v1): dann winkt er seltener.
   - Mit WebGL zeichnet hummel3d.js ihn in 3D, sonst bleibt diese Zeichnung. */
const F = window.FIAE;
const $ = (s, r = document) => r.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const maus = matchMedia('(hover:hover) and (pointer:fine)');
const KEY = 'lernwiki-hummel-v1';
const store = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const SVG = `<svg class="fe-svg" viewBox="0 0 120 110" aria-hidden="true" focusable="false">
<defs>
<clipPath id="feLeibForm"><path d="M88.5 62.0 L87.7 64.0 L86.7 65.8 L87.0 67.9 L87.1 69.9 L85.6 71.6 L84.0 73.2 L83.6 75.2 L83.0 77.3 L81.0 78.5 L78.9 79.7 L77.9 81.5 L76.6 83.3 L74.2 84.1 L71.8 84.7 L70.2 86.2 L68.3 87.7 L65.8 87.9 L63.3 87.9 L61.2 89.0 L58.9 89.9 L56.4 89.5 L54.0 89.0 L51.6 89.5 L49.1 89.9 L46.8 89.0 L44.7 87.9 L42.2 87.9 L39.7 87.7 L37.8 86.2 L36.2 84.7 L33.8 84.1 L31.4 83.3 L30.1 81.5 L29.1 79.7 L27.0 78.5 L25.0 77.3 L24.4 75.2 L24.0 73.2 L22.4 71.6 L20.9 69.9 L21.0 67.9 L21.3 65.8 L20.3 64.0 L19.5 62.0 L20.3 60.0 L21.3 58.2 L21.0 56.1 L20.9 54.1 L22.4 52.4 L24.0 50.8 L24.4 48.8 L25.0 46.7 L27.0 45.5 L29.1 44.3 L30.1 42.5 L31.4 40.7 L33.8 39.9 L36.2 39.3 L37.8 37.8 L39.7 36.3 L42.2 36.1 L44.7 36.1 L46.8 35.0 L49.1 34.1 L51.6 34.5 L54.0 35.0 L56.4 34.5 L58.9 34.1 L61.2 35.0 L63.3 36.1 L65.8 36.1 L68.3 36.3 L70.2 37.8 L71.8 39.3 L74.2 39.9 L76.6 40.7 L77.9 42.5 L78.9 44.3 L81.0 45.5 L83.0 46.7 L83.6 48.8 L84.0 50.8 L85.6 52.4 L87.1 54.1 L87.0 56.1 L86.7 58.2 L87.7 60.0Z"/></clipPath>
<radialGradient id="feRund" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".45"/><stop offset=".55" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#1A1420" stop-opacity=".28"/></radialGradient>
<linearGradient id="feFluegel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4FBFF" stop-opacity=".95"/><stop offset="1" stop-color="#BFE0F5" stop-opacity=".75"/></linearGradient>
</defs>
<g class="fe-fluegel">
<ellipse cx="44" cy="24" rx="21" ry="10.5" transform="rotate(-28 44 24)" fill="url(#feFluegel)" stroke="#FFFFFF" stroke-opacity=".9" stroke-width="1"/>
<ellipse cx="38" cy="38" rx="14" ry="7.5" transform="rotate(-12 38 38)" fill="url(#feFluegel)" stroke="#FFFFFF" stroke-opacity=".9" stroke-width="1"/>
<path d="M58 40C50 30 42 22 30 16M56 42C48 40 40 38 28 36" fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width=".7"/>
</g>
<g stroke="#2A2433" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">
<path d="M42 84L38 93L41 97"/><path d="M54 87L53 96L57 99"/><path d="M64 86L66 95L70 97"/>
</g>
<g clip-path="url(#feLeibForm)">
<rect x="0" y="0" width="120" height="110" fill="#2A2433"/>
<path d="M74 0H104V22Q112 62 104 102V110H74V102Q82 62 74 22Z" fill="#F5C842"/><path d="M44 0H61V22Q69 62 61 102V110H44V102Q52 62 44 22Z" fill="#F5C842"/><path d="M-10 0H33V22Q41 62 33 102V110H-10V102Q-2 62 -10 22Z" fill="#FFF6E6"/><path d="M33 22Q41 62 33 102M44 22Q52 62 44 102M61 22Q69 62 61 102M74 22Q82 62 74 102" fill="none" stroke="#1A1420" stroke-opacity=".14" stroke-width="2"/><rect x="0" y="0" width="120" height="110" fill="url(#feRund)"/>
</g>
<path d="M88.5 62.0 L87.7 64.0 L86.7 65.8 L87.0 67.9 L87.1 69.9 L85.6 71.6 L84.0 73.2 L83.6 75.2 L83.0 77.3 L81.0 78.5 L78.9 79.7 L77.9 81.5 L76.6 83.3 L74.2 84.1 L71.8 84.7 L70.2 86.2 L68.3 87.7 L65.8 87.9 L63.3 87.9 L61.2 89.0 L58.9 89.9 L56.4 89.5 L54.0 89.0 L51.6 89.5 L49.1 89.9 L46.8 89.0 L44.7 87.9 L42.2 87.9 L39.7 87.7 L37.8 86.2 L36.2 84.7 L33.8 84.1 L31.4 83.3 L30.1 81.5 L29.1 79.7 L27.0 78.5 L25.0 77.3 L24.4 75.2 L24.0 73.2 L22.4 71.6 L20.9 69.9 L21.0 67.9 L21.3 65.8 L20.3 64.0 L19.5 62.0 L20.3 60.0 L21.3 58.2 L21.0 56.1 L20.9 54.1 L22.4 52.4 L24.0 50.8 L24.4 48.8 L25.0 46.7 L27.0 45.5 L29.1 44.3 L30.1 42.5 L31.4 40.7 L33.8 39.9 L36.2 39.3 L37.8 37.8 L39.7 36.3 L42.2 36.1 L44.7 36.1 L46.8 35.0 L49.1 34.1 L51.6 34.5 L54.0 35.0 L56.4 34.5 L58.9 34.1 L61.2 35.0 L63.3 36.1 L65.8 36.1 L68.3 36.3 L70.2 37.8 L71.8 39.3 L74.2 39.9 L76.6 40.7 L77.9 42.5 L78.9 44.3 L81.0 45.5 L83.0 46.7 L83.6 48.8 L84.0 50.8 L85.6 52.4 L87.1 54.1 L87.0 56.1 L86.7 58.2 L87.7 60.0Z" fill="none" stroke="#2A2433" stroke-opacity=".35" stroke-width="1"/>
<g class="fe-wink" stroke="#2A2433" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">
<path d="M76 82L80 91L77 96"/>
</g>
<g class="fe-kopf">
<g class="fe-fuehler" stroke="#2A2433" stroke-width="1.8" stroke-linecap="round" fill="none">
<path d="M88 42C88 34 92 28 98 25"/><path d="M95 43C98 36 104 32 110 31"/>
</g>
<circle cx="98" cy="25" r="2.4" fill="#2A2433"/><circle cx="110" cy="31" r="2.4" fill="#2A2433"/>
<path d="M107.3 55.0 L106.8 56.7 L106.1 58.3 L106.0 60.1 L105.7 61.8 L104.5 63.2 L103.1 64.4 L102.2 65.9 L101.1 67.3 L99.5 68.0 L97.7 68.5 L96.2 69.5 L94.6 70.4 L92.8 70.3 L91.0 70.0 L89.2 70.3 L87.4 70.4 L85.8 69.5 L84.3 68.5 L82.5 68.0 L80.9 67.3 L79.8 65.9 L78.9 64.4 L77.5 63.2 L76.3 61.8 L76.0 60.1 L75.9 58.3 L75.2 56.7 L74.7 55.0 L75.2 53.3 L75.9 51.7 L76.0 49.9 L76.3 48.2 L77.5 46.8 L78.9 45.6 L79.8 44.1 L80.9 42.7 L82.5 42.0 L84.3 41.5 L85.8 40.5 L87.4 39.6 L89.2 39.7 L91.0 40.0 L92.8 39.7 L94.6 39.6 L96.2 40.5 L97.7 41.5 L99.5 42.0 L101.1 42.7 L102.2 44.1 L103.1 45.6 L104.5 46.8 L105.7 48.2 L106.0 49.9 L106.1 51.7 L106.8 53.3Z" fill="#2A2433"/>
<ellipse cx="88" cy="50" rx="7" ry="5" fill="#FFFFFF" opacity=".12"/>
<circle cx="96.5" cy="53" r="4.3" fill="#FFFFFF"/><circle cx="97.6" cy="53.2" r="2.5" fill="#1A1420"/><circle cx="98.4" cy="52.2" r=".9" fill="#FFFFFF"/>
<circle cx="105.6" cy="54" r="3.4" fill="#FFFFFF"/><circle cx="106.5" cy="54.2" r="2" fill="#1A1420"/><circle cx="107.1" cy="53.4" r=".7" fill="#FFFFFF"/>
<ellipse cx="100" cy="61.5" rx="3" ry="1.8" fill="#FF9ECF" opacity=".55"/>
<path d="M98.5 64.2q3.5 2.6 7.2 .2" fill="none" stroke="#FFC2E3" stroke-width="1.3" stroke-linecap="round"/>
<g class="fe-brille" fill="none" stroke="#D9A93F" stroke-width="1.7">
<circle cx="96.5" cy="53" r="6.4" fill="#FFFFFF" fill-opacity=".14"/>
<circle cx="106" cy="54" r="5.2" fill="#FFFFFF" fill-opacity=".14"/>
<path d="M102.9 53.4q.9-1 1.9-.6M90.2 52.4L82.8 50.4"/>
</g>
<path class="fe-glanz" d="M93.4 50.2q1.4-1.7 3.4-1.9" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>
</g>
<g class="fe-glitzer" fill="#F5C842">
<circle cx="18" cy="30" r="1.6"/><circle cx="112" cy="80" r="1.3" fill="#FFF3C4"/><circle cx="26" cy="14" r="1.1" fill="#E2F06A"/>
</g>
</svg>`;

/* ---------- Bausteine ---------- */
/* Eigene Ebene für Klaus-Dieter und seine Funken: so breit wie das Fenster und seitlich abgeschnitten,
   damit Funken am Rand die Seite nicht breiter machen (am Handy würde sonst alles verrutschen) */
const ebene = document.createElement('div');
ebene.className = 'fe-ebene';
const fe = document.createElement('button');
fe.type = 'button'; fe.className = 'fe'; fe.id = 'hummel';
fe.setAttribute('aria-label', 'Klaus-Dieter Pollenberg, die Hummel: kurze Führung durch die Bibliothek');
fe.innerHTML = `<span class="fe-hub">${SVG}</span><span class="fe-hallo" aria-hidden="true">Moin! Klick mich</span>`;
const blase = document.createElement('div');
blase.className = 'fe-blase'; blase.id = 'hummelBlase'; blase.hidden = true;
blase.setAttribute('role', 'dialog'); blase.setAttribute('aria-labelledby', 'hummelKopf'); blase.setAttribute('aria-describedby', 'hummelText');
blase.innerHTML = '<p class="fe-zeile micro" id="hummelKopf"></p><p class="fe-text" id="hummelText"></p>' +
  '<div class="fe-knoepfe"><button type="button" class="pillbtn micro fe-ja" id="hummelJa"></button><button type="button" class="linkbtn fe-nein" id="hummelNein"></button></div>';
/* Blüte an der Linie unter der Bühne: sein Sitzplatz, bleibt stehen, wenn er losfliegt */
const bluete = document.createElement('div');
bluete.className = 'fe-bluete'; bluete.setAttribute('aria-hidden', 'true');
bluete.innerHTML = '<svg viewBox="0 0 34 40" focusable="false"><path d="M17 40C17 33 15 27 17 17" fill="none" stroke="#3FA16A" stroke-width="2.4" stroke-linecap="round"/>' +
  '<path d="M16.4 31C10.5 29 7.5 25.5 6.5 21.5C11.5 22.5 14.5 25.5 16.4 29Z" fill="#4BAF73"/>' +
  [0, 1, 2, 3, 4].map(k => `<ellipse cx="17" cy="5.4" rx="3.6" ry="5.2" fill="#E2F06A" transform="rotate(${k * 72} 17 11)"/>`).join('') +
  '<circle cx="17" cy="11" r="3.8" fill="#F2B33D"/></svg>';
ebene.append(bluete, fe);
document.body.append(ebene, blase);
const kopf = $('#hummelKopf'), text = $('#hummelText'), ja = $('#hummelJa'), nein = $('#hummelNein');

/* ---------- Maße und Orte (Seitenpixel, Mitte von Klaus-Dieter) ---------- */
const eng = () => innerWidth < 860;
const box = el => { const r = (typeof el === 'string' ? $(el) : el).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top + scrollY, b: r.bottom + scrollY, w: r.width, h: r.height }; };
let pos = { x: -200, y: -200 }, links = false;
/* Größe von Klaus-Dieter merken, damit der Flug nicht in jedem Bild das Layout abfragt (das bremst) */
let fw = 92, fh = 84;
function messen(){ fw = fe.offsetWidth || fw; fh = fe.offsetHeight || fh; }
function setze(p){
  pos = { x: p.x, y: p.y };
  fe.style.transform = `translate(${pos.x - fw / 2}px,${pos.y - fh / 2}px)`;
}
/* Blickrichtung: blick läuft weich von 1 (nach rechts) nach -1 (nach links), dazwischen wird Klaus-Dieter kurz schmal, wie beim Umdrehen.
   kipp neigt ihn beim Steigen und Sinken. Beides geht als CSS-Variable an die Zeichnung. */
let blick = 1, blickZiel = 1, kipp = 0;
function malen(){ fe.style.setProperty('--blick', blick.toFixed(3)); fe.style.setProperty('--kipp', kipp.toFixed(2) + 'deg'); }
function schau(nachLinks, weich){
  links = nachLinks; fe.classList.toggle('links', links); blickZiel = links ? -1 : 1;
  if (!weich) { blick = blickZiel; kipp = 0; malen(); }
}
/* Zuhause: auf der Blüte an der Linie unter der Bühne, links. Die Blüte steht mit dem Stiel auf dem Strich,
   Klaus-Dieter sitzt mit den Füßen oben auf ihrem Kopf */
function heim(){
  const r = box('.hero .rule'), bw = bluete.offsetWidth || 34, bh = bluete.offsetHeight || 40;
  const x = r.l + clamp(r.w * 0.14, fw * 0.6, 170), linie = r.t + r.h / 2;
  bluete.style.transform = `translate(${x - bw / 2}px,${linie - bh}px)`;
  return { x, y: linie - bh + bh * 0.12 - fh * 0.39 };
}
/* Punkt auf der Ranke auf Höhe y (erster Punkt des Wegs, der so tief liegt) */
function rankeBei(y){
  const P = F.rankePfad;
  if (!P || !P.length) return null;
  return P.find(p => p[1] >= y) || P[P.length - 1];
}
/* Neben der Ranke schweben, zur Seitenmitte hin versetzt; ohne Ranke am rechten Rand */
function nebenRanke(y){
  const W = innerWidth, p = rankeBei(y);
  if (!p) return { x: eng() ? W - 56 : W * 0.86, y };
  const dir = p[0] > W / 2 ? -1 : 1;
  return { x: clamp(p[0] + dir * (eng() ? 46 : 74), 50, W - 50), y: p[1] - (eng() ? 34 : 48) };
}

/* ---------- Stationen ---------- */
const abteilungen = () => { const k = F.REG.map(r => r.kurz); return k.slice(0, -1).join(', ') + ' und ' + k[k.length - 1]; };
const STATIONEN = [
  { ranke: false, seite: 'links', ziel(){ const S = box('#stage'); return eng() ? { x: S.l + S.w * 0.8, y: S.t + S.h * 0.5 } : { x: S.l + S.w * 0.44, y: S.t + S.h * 0.34 }; },
    text: () => `Die zwölf Würfel da oben sind die Lernfelder deiner Umschulung. Grüne haben schon Artikel, gestrichelte warten noch auf Futter. ${maus.matches ? 'Fahr mal mit der Maus drüber, die weichen dir aus. Ich hab es aufgegeben, mich draufzusetzen.' : 'Schaffst du ein Lernfeld, dreht sich sein Würfel einmal vor Freude.'}` },
  { ranke: true, ziel(){ const A = box('#a-ranke'); return nebenRanke(A.t + A.h * (eng() ? 0.3 : 0.18)); },
    text: () => `Das ist die Ranke, mein Revier. Jedes Blatt ist ein Artikel, ${F.D.artikel.length} sind es schon. Blass heißt noch nicht gelesen, grün gelesen, dunkelgrün: sitzt. Rote Knospen sind Prüfungsstoff, da flieg ich immer extra langsam vorbei.` },
  { ranke: true, seite: 'links', ziel(){
      const lab = [...document.querySelectorAll('#twigLabels .twig-lab')].find(l => l.getBoundingClientRect().width);
      if (!lab) { const A = box('#a-ranke'); return nebenRanke(A.t + A.h * 0.5); }
      const r = box(lab), W = innerWidth, w = fe.offsetWidth;
      const x = r.l > w + 30 ? r.l - w * 0.6 : r.r + w * 0.6;
      return { x: clamp(x, 50, W - 50), y: r.t - 26 };
    },
    text: () => `Sechs Zweige, sechs Abteilungen: ${abteilungen()}. ${maus.matches ? 'Klick' : 'Tipp'} auf einen Zweig, dann springt die passende Kachel auf. Ordnung muss sein, ich bin hier schließlich die Aufsicht.` },
  { ranke: true, ziel(){ return nebenRanke(box('#regale').t + 70); },
    text: () => 'Hier blühen die Kacheln, erst die Abteilungen, darunter die Lernfelder. Deck eine auf und such dir einen Artikel aus. Schaffst du ein Lernfeld, gibt es einen Stempel.' },
  { ranke: true, ziel(){ return nebenRanke(box('#katalog').t + 70); },
    text: () => `Du suchst was Bestimmtes? Hier findest du alle ${F.D.artikel.length} Artikel, mit Suche und Filter nach Abteilung. Ein roter Punkt heißt: Prüfungsstoff drin.` },
  { ranke: true, ziel(){ return nebenRanke(box('#pruefung').t + 60); },
    text: () => 'Jetzt wird es ernst: ROT zuerst. Das ist sicherer Prüfungsstoff, im Prüfungsmodus hakst du ab, was sitzt. Übrigens: Nach einer alten Rechnung dürften Hummeln gar nicht fliegen können. Ich flieg trotzdem. Und du schaffst die Prüfung trotzdem.' },
  { ranke: true, ziel(){ const E = box('#a-end'); return { x: clamp(E.l + E.w / 2 + (eng() ? -60 : -110), 50, innerWidth - 50), y: E.t - (eng() ? 60 : 80) }; },
    text: () => 'Ganz unten blüht die Ranke. Für jeden Artikel, den du liest, fliegt dir eine Biene zu. Die verdienst du dir, ich wohn hier nur. Dein Stand bleibt auf deinem Gerät, ganz ohne Konto, und unter „Mein Stand“ wartet dein Leseausweis. So, ich brumm zurück auf meine Blüte unter den Würfeln. Im Menü findest du mich auch.' },
];

/* ---------- Funken ---------- */
const FARBEN = ['#F5C842', '#E2F06A', '#FFD86B', '#FFF3C4', '#F2B33D'];   /* Pollenstaub */
let funkenZahl = 0;
function funke(x, y, dx, dy){
  if (reduce.matches || funkenZahl > 46) return;
  const s = document.createElement('i');
  s.className = 'fe-funke';
  s.style.left = x + 'px'; s.style.top = y + 'px';
  s.style.setProperty('--dx', dx + 'px'); s.style.setProperty('--dy', dy + 'px');
  s.style.setProperty('--c', FARBEN[Math.floor(Math.random() * FARBEN.length)]);
  s.style.setProperty('--s', (0.6 + Math.random() * 0.8).toFixed(2));
  funkenZahl++;
  s.addEventListener('animationend', () => { s.remove(); funkenZahl--; });
  ebene.append(s);
}
function puff(p){
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; funke(p.x, p.y, Math.cos(a) * (30 + Math.random() * 26), Math.sin(a) * (30 + Math.random() * 26)); }
}

/* ---------- Scrollen ---------- */
/* Wo Klaus-Dieter im Fenster steht: am Handy weiter oben, weil die Sprechblase dort unten sitzt */
const hoehe = () => innerWidth < 560 ? 0.3 : 0.42;
let scrollMax = 0;
function scrollAuf(v){
  v = clamp(v, 0, scrollMax || document.documentElement.scrollHeight - innerHeight);
  if (F.lenis) F.lenis.scrollTo(v, { immediate: true, force: true });
  else scrollTo(0, v);
}

/* ---------- Flug ---------- */
/* Weg von a nach b: an der Ranke entlang, knapp über dem Stängel (immer gleich versetzt, damit nichts springt), sonst im Bogen */
function weg(a, b, anRanke){
  const P = F.rankePfad, W = innerWidth;
  let pts = [];
  if (anRanke && P && P.length > 2) {
    const naechst = q => { let bi = 0, bd = Infinity; P.forEach((p, i) => { const d = (p[0] - q.x) ** 2 + (p[1] - q.y) ** 2; if (d < bd) { bd = d; bi = i; } }); return bi; };
    const i0 = naechst(a), i1 = naechst(b);
    const dy = eng() ? 40 : 52;
    const stueck = i0 <= i1 ? P.slice(i0, i1 + 1) : P.slice(i1, i0 + 1).reverse();
    pts = stueck.map(p => [clamp(p[0], 50, W - 50), p[1] - dy]);
  }
  if (pts.length < 3) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, h = Math.min(220, Math.hypot(b.x - a.x, b.y - a.y) * 0.3);
    pts = [];
    for (let k = 1; k < 30; k++) {
      const t = k / 30, u = 1 - t;
      pts.push([u * u * a.x + 2 * u * t * mx + t * t * b.x, u * u * a.y + 2 * u * t * (my - h) + t * t * b.y]);
    }
  }
  pts = [[a.x, a.y], ...pts, [b.x, b.y]];
  /* Ecken rund schleifen (Chaikin, dreimal), damit An- und Abflug zur Ranke weich werden */
  for (let r = 0; r < 3; r++) {
    const n = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      n.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]);
    }
    n.push(pts[pts.length - 1]);
    pts = n;
  }
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  /* Punkt nach s Pixeln Weg (Halbierungssuche) */
  const at = s => {
    s = clamp(s, 0, L[L.length - 1]);
    let lo = 1, hi = L.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (L[m] < s) lo = m + 1; else hi = m; }
    const k = (s - L[lo - 1]) / ((L[lo] - L[lo - 1]) || 1);
    return { x: pts[lo - 1][0] + (pts[lo][0] - pts[lo - 1][0]) * k, y: pts[lo - 1][1] + (pts[lo][1] - pts[lo - 1][1]) * k };
  };
  return { len: L[L.length - 1], at };
}
/* Reisetempo: sanft anfahren (20 %), gleichmäßig fliegen, sanft landen (20 %). Spitze nur 1,25 mal so schnell wie der Schnitt. */
function reise(t){
  const r = 0.2, v = 1 / (1 - r);
  if (t < r) return v * t * t / (2 * r);
  if (t > 1 - r) return 1 - v * (1 - t) * (1 - t) / (2 * r);
  return v * (t - r / 2);
}
/* Im Takt der App: die gemeinsame Schleife (app.js, F.jeBild) läuft vor Lenis und vor dem 3D. So sehen Ranke und Seite
   dieselbe Scrollposition wie Klaus-Dieter, nichts hinkt ein Bild hinterher. */
function imTakt(fn){
  const liste = F.jeBild;
  if (liste) { liste.push(fn); return () => { const k = liste.indexOf(fn); if (k >= 0) liste.splice(k, 1); }; }
  let id = 0, an = true;
  const r = t => { if (!an) return; fn(t); if (an) id = requestAnimationFrame(r); };
  id = requestAnimationFrame(r);
  return () => { an = false; cancelAnimationFrame(id); };
}
let stopFlug = null;
function flugAus(){ if (stopFlug) { stopFlug(); stopFlug = null; } fe.classList.remove('fliegt'); }
function flieg(b, anRanke, fertig){
  flugAus();
  if (reduce.matches) {
    setze(b); scrollAuf(b.y - innerHeight * hoehe()); fertig(); return;
  }
  messen(); scrollMax = document.documentElement.scrollHeight - innerHeight;
  const w = weg(pos, b, anRanke);
  const dauer = clamp(w.len / 0.7, 1100, 6500);
  let t0 = null, letzterFunke = 0, gelandet = false;
  fe.classList.add('fliegt');
  stopFlug = imTakt(now => {
    if (t0 === null) t0 = now;
    /* Nach der Landung laufen Wende und Neigung noch weich aus, dann ist der Takt frei */
    if (gelandet) {
      kipp *= 0.85; blick += (blickZiel - blick) * 0.2; malen();
      if (Math.abs(kipp) < 0.05 && Math.abs(blick - blickZiel) < 0.01) { blick = blickZiel; kipp = 0; malen(); flugAus(); }
      return;
    }
    const t = clamp((now - t0) / dauer, 0, 1), s = reise(t) * w.len;
    const p = w.at(s), vor = w.at(s + 70), q = w.at(s + 36);
    /* Umdrehen erst, wenn es wirklich in die andere Richtung geht (70 Pixel voraus mindestens 28 zur Seite) */
    if (vor.x - p.x < -28 && !links) schau(true, true);
    else if (vor.x - p.x > 28 && links) schau(false, true);
    const zielKipp = clamp(Math.atan2(q.y - p.y, Math.abs(q.x - p.x) + 24) * 20, -12, 12) * (links ? -1 : 1);
    kipp += (zielKipp - kipp) * 0.08;
    blick += (blickZiel - blick) * 0.14;
    malen();
    setze(p);
    scrollAuf(p.y - innerHeight * hoehe());
    if (now - letzterFunke > 60) {
      letzterFunke = now;
      const hx = p.x + (links ? 1 : -1) * fw * 0.36;
      funke(hx, p.y + fh * 0.05, (links ? 1 : -1) * (6 + Math.random() * 14), 8 + Math.random() * 16);
    }
    if (t >= 1) { gelandet = true; scrollMax = 0; fe.classList.remove('fliegt'); fertig(); }
  });
}

/* ---------- Sprechblase ---------- */
function blaseSetzen(){
  if (blase.hidden) return;
  if (innerWidth < 560) { blase.style.left = blase.style.top = ''; return; }
  const bw = blase.offsetWidth, bh = blase.offsetHeight, w = fe.offsetWidth, W = innerWidth;
  /* rechts neben Klaus-Dieter, außer die Station will links (dort liegt sonst, was erklärt wird) oder rechts ist kein Platz */
  const rechts = pos.x + w * 0.6, linksX = pos.x - w * 0.6 - bw;
  const willLinks = zustand === 'station' && STATIONEN[nr].seite === 'links';
  let x = willLinks && linksX >= 16 ? linksX : rechts;
  if (x + bw > W - 16) x = linksX;
  x = clamp(x, 16, W - 16 - bw);
  const y = Math.max(scrollY + 84, pos.y - bh * 0.55);
  blase.style.left = x + 'px'; blase.style.top = y + 'px';
}
function zeige(zeile, satz, jaText, neinText){
  kopf.textContent = zeile; text.textContent = satz;
  ja.textContent = jaText; nein.textContent = neinText; nein.hidden = !neinText;
  blase.hidden = false; blase.classList.remove('auf');
  blaseSetzen();
  requestAnimationFrame(() => blase.classList.add('auf'));
  ja.focus({ preventScroll: true });
}
function verstecke(){ blase.hidden = true; blase.classList.remove('auf'); }

/* ---------- Ablauf ---------- */
let zustand = 'ruhe', nr = -1;   /* ruhe, frage, fliegt, station */
const gesehen = () => store.get(KEY) === '1';
function frage(){
  zustand = 'frage'; ruftNicht();
  zeige('Klaus-Dieter Pollenberg, Gartenaufsicht', 'Moin, Klaus-Dieter Pollenberg, Gartenaufsicht. Sag ruhig Klaus-Dieter. Soll ich dir in einer Minute zeigen, wie dieser Garten aufgebaut ist?', 'Ja, zeig mal', 'Lieber später');
}
function station(i){
  nr = i; zustand = 'fliegt'; verstecke(); ruftNicht();
  const st = STATIONEN[i];
  flieg(st.ziel(), st.ranke, () => {
    if (zustand !== 'fliegt') return;
    zustand = 'station';
    const letzte = i === STATIONEN.length - 1;
    zeige(`Klaus-Dieter · ${i + 1} von ${STATIONEN.length}`, st.text(), letzte ? 'Danke, Klaus-Dieter!' : 'Weiter', letzte ? '' : 'Beenden');
  });
}
function ende(){
  flugAus();
  const warAktiv = zustand !== 'ruhe';
  zustand = 'ruhe'; nr = -1; store.set(KEY, '1');
  verstecke(); kipp = 0; malen();
  if (!warAktiv) return;
  puff({ x: pos.x, y: pos.y });
  fe.classList.add('weg');
  setTimeout(() => { schau(false); setze(heim()); fe.classList.remove('weg'); }, reduce.matches ? 0 : 380);
}
ja.addEventListener('click', () => {
  if (zustand === 'frage') station(0);
  else if (zustand === 'station') { if (nr < STATIONEN.length - 1) station(nr + 1); else { ende(); fe.focus({ preventScroll: true }); } }
});
nein.addEventListener('click', () => {
  if (zustand === 'frage') { zustand = 'ruhe'; store.set(KEY, '1'); verstecke(); fe.focus({ preventScroll: true }); }
  else ende();
});
fe.addEventListener('click', () => {
  if (zustand === 'ruhe') frage();
  else if (zustand === 'frage') { zustand = 'ruhe'; verstecke(); }
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || zustand === 'ruhe' || $('dialog[open]')) return;
  const war = zustand;
  if (war === 'frage') { zustand = 'ruhe'; verstecke(); } else ende();
  fe.focus({ preventScroll: true });
});
/* Ein Artikel oder eine App-Seite geht auf: Führung beenden */
addEventListener('hashchange', () => { if (location.hash.startsWith('#/') && zustand !== 'ruhe') ende(); });
/* Aus dem Menü: erst nach oben zu Klaus-Dieter, dann geht es los */
document.addEventListener('click', e => {
  if (!e.target.closest('[data-hummel]')) return;
  if (zustand === 'fliegt' || zustand === 'station') return;
  verstecke(); zustand = 'ruhe'; schau(false); setze(heim());
  const ziel = clamp(pos.y - innerHeight * 0.55, 0, 1e9);
  if (F.lenis && !reduce.matches) F.lenis.scrollTo(ziel, { duration: 1.2, onComplete: () => station(0) });
  else { scrollAuf(ziel); station(0); }
});

/* ---------- Platz halten, wenn sich die Seite verschiebt ---------- */
let neuT = 0;
function neuSetzen(){
  if (zustand === 'fliegt') return;
  messen();
  if (zustand === 'station') setze(STATIONEN[nr].ziel()); else setze(heim());
  blaseSetzen();
}
const spaeter = () => { clearTimeout(neuT); neuT = setTimeout(neuSetzen, 120); };
addEventListener('resize', spaeter);
addEventListener('fiae-tree', spaeter);
if ('ResizeObserver' in window) new ResizeObserver(spaeter).observe(document.body);
messen(); setze(heim());

/* ---------- Winken ---------- */
let sichtbar = false, gewunken = 0, winkT = 0;
if ('IntersectionObserver' in window) new IntersectionObserver(es => { sichtbar = es[0].isIntersecting; }).observe(fe);
function ruftNicht(){ fe.classList.remove('ruft', 'winkt'); }
function winken(){
  clearTimeout(winkT);
  const pause = gesehen() ? 22000 : 7000;
  winkT = setTimeout(winken, pause);
  if (reduce.matches || zustand !== 'ruhe' || !sichtbar || document.hidden) return;
  gewunken++;
  fe.classList.remove('winkt'); void fe.offsetWidth; fe.classList.add('winkt');
  if (!gesehen() && gewunken <= 4) fe.classList.add('ruft');
  const p = { x: pos.x + fe.offsetWidth * 0.2, y: pos.y };
  for (let k = 0; k < 5; k++) funke(p.x, p.y - 10, (Math.random() - 0.3) * 40, -20 - Math.random() * 30);
  setTimeout(() => fe.classList.remove('winkt', 'ruft'), 2600);
}
winkT = setTimeout(winken, 2600);

/* ---------- 3D ---------- */
/* Klaus-Dieter in 3D (hummel3d.js), sobald three.js da ist; auf schwachen Geräten oder ohne WebGL bleibt die Zeichnung */
const sparsam = (navigator.connection && navigator.connection.saveData) || (navigator.deviceMemory && navigator.deviceMemory < 2);
if (!sparsam) {
  import('./hummel3d.js')
    .then(m => m.baue({ fe, stand: () => ({ blick, kipp }) }))
    .then(ok => { if (ok) { messen(); if (zustand === 'ruhe') setze(heim()); } })
    .catch(e => console.warn('Klaus-Dieter ohne 3D:', e));
}
