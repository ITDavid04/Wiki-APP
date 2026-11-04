/* Funkel, das Einhorn aus dem Feenwald. Steht unter der Bühne auf der Linie, winkt ab und zu und fragt erst auf Klick,
   ob es eine kurze Führung geben soll. Dann fliegt es an der Ranke entlang von Station zu Station, die Seite scrollt mit,
   und an jeder Station erklärt eine Sprechblase einen Teil der Bibliothek.
   - Weg: die Mittellinie des Stängels aus scene.js (F.rankePfad, Seitenpixel). Ohne 3D fliegt Funkel im Bogen.
   - Bei "weniger Bewegung": kein Flug, kein Winken, keine Funken, Funkel springt von Station zu Station.
   - Escape, "Beenden" oder ein geöffneter Artikel beenden die Führung; Funkel steht dann wieder auf seinem Platz.
   - Gemerkt wird nur, ob die Führung schon gelaufen oder abgelehnt ist (lernwiki-einhorn-v1): dann winkt Funkel seltener. */
const F = window.FIAE;
const $ = (s, r = document) => r.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const maus = matchMedia('(hover:hover) and (pointer:fine)');
const KEY = 'lernwiki-einhorn-v1';
const store = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const SVG = `<svg class="fe-svg" viewBox="0 0 120 110" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="feMaehne" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF9ECF"/><stop offset=".5" stop-color="#C9A8FF"/><stop offset="1" stop-color="#8FE6CB"/></linearGradient>
<linearGradient id="feMaehne2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FE6CB"/><stop offset=".55" stop-color="#FFB3D9"/><stop offset="1" stop-color="#C9A8FF"/></linearGradient>
<linearGradient id="feHorn" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFD27A"/><stop offset=".55" stop-color="#FFF3C4"/><stop offset="1" stop-color="#FFB3D9"/></linearGradient>
<radialGradient id="feLeib" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".65" stop-color="#F7F0FF"/><stop offset="1" stop-color="#E4D6F6"/></radialGradient>
<linearGradient id="feFluegel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC2E3" stop-opacity=".75"/><stop offset=".5" stop-color="#D9C2FF" stop-opacity=".65"/><stop offset="1" stop-color="#A8F0DA" stop-opacity=".8"/></linearGradient>
<radialGradient id="feGlanz"><stop offset="0" stop-color="#FFF6D6" stop-opacity=".95"/><stop offset="1" stop-color="#FFF6D6" stop-opacity="0"/></radialGradient>
</defs>
<g class="fe-fluegel">
<path d="M52 50C46 30 30 14 18 17C9 20 14 38 30 46C38 50 46 52 52 52Z" fill="url(#feFluegel)" stroke="#FFFFFF" stroke-opacity=".9" stroke-width=".9"/>
<path d="M51 54C40 54 24 60 23 70C22 78 34 76 42 66C46 61 49 57 51 55Z" fill="url(#feFluegel)" stroke="#FFFFFF" stroke-opacity=".9" stroke-width=".9"/>
<path d="M50 50C40 40 30 30 22 24M50 51C42 47 34 44 26 40M50 55C42 60 34 66 28 71" fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width=".6"/>
<circle cx="25" cy="25" r="1.3" fill="#FFFFFF" opacity=".9"/><circle cx="31" cy="66" r="1" fill="#FFFFFF" opacity=".9"/>
</g>
<g class="fe-schweif">
<path d="M27 60C15 54 5 62 9 74C11 81 4 87 8 95C17 91 23 83 21 75C26 71 29 66 28 61Z" fill="url(#feMaehne)"/>
<path d="M27 63C20 64 15 71 17 79C18 85 14 90 16 96C22 91 25 84 23 77C26 72 28 68 28 64Z" fill="url(#feMaehne2)" opacity=".9"/>
</g>
<g fill="#F1E8FB" stroke="#CFC0E6" stroke-width="1">
<rect x="31" y="72" width="8.5" height="24" rx="4.2"/><rect x="44" y="74" width="8.5" height="22" rx="4.2"/>
</g>
<path d="M31.5 92h7.5v2.4a3.7 3.7 0 0 1-7.5 0ZM44.5 92h7.5v2.4a3.7 3.7 0 0 1-7.5 0Z" fill="#CDB8F5"/>
<ellipse cx="50" cy="66" rx="27" ry="17" fill="url(#feLeib)" stroke="#CFC0E6" stroke-width="1.1"/>
<rect x="58" y="74" width="8.5" height="22" rx="4.2" fill="#FBF7FF" stroke="#CFC0E6" stroke-width="1"/>
<path d="M58.5 92h7.5v2.4a3.7 3.7 0 0 1-7.5 0Z" fill="#CDB8F5"/>
<g class="fe-wink">
<rect x="68" y="72" width="8.5" height="24" rx="4.2" fill="#FBF7FF" stroke="#CFC0E6" stroke-width="1"/>
<path d="M68.5 92h7.5v2.4a3.7 3.7 0 0 1-7.5 0Z" fill="#CDB8F5"/>
</g>
<path d="M60 62C64 50 68 42 75 36L89 44C83 52 78 62 74 72C70 70 64 67 60 62Z" fill="url(#feLeib)"/>
<path d="M75 36C68 42 64 50 60.5 61" fill="none" stroke="#CFC0E6" stroke-width="1"/>
<path d="M89 44C83 52 78 62 74.5 71" fill="none" stroke="#CFC0E6" stroke-width="1"/>
<g class="fe-kopf">
<path d="M73.5 27L69 11L80.5 22Z" fill="#FBF7FF" stroke="#CFC0E6" stroke-width="1" stroke-linejoin="round"/>
<path d="M73.8 24L71.4 15L77.6 21Z" fill="#FFC2E3"/>
<ellipse cx="82" cy="38" rx="17" ry="15" fill="url(#feLeib)" stroke="#CFC0E6" stroke-width="1.1"/>
<ellipse cx="95" cy="45.5" rx="11" ry="8.6" fill="#FFF1F7" stroke="#CFC0E6" stroke-width="1.1"/>
<ellipse cx="100.6" cy="44" rx="1.3" ry="1" fill="#D79AB8"/>
<path d="M94 50.5q3.2 2.2 6.4 0" fill="none" stroke="#C2849F" stroke-width="1.1" stroke-linecap="round"/>
<ellipse cx="92" cy="43.5" rx="3.6" ry="2.2" fill="#FF9ECF" opacity=".5"/>
<ellipse cx="87.6" cy="36" rx="3.4" ry="4.3" fill="#2B1D3D"/>
<circle cx="88.9" cy="34.4" r="1.3" fill="#FFFFFF"/><circle cx="86.6" cy="38.2" r=".6" fill="#FFFFFF" opacity=".8"/>
<path d="M84.6 33.4l-2.2-1.4M85 31.7l-1.5-2.1M86.3 30.8l-.6-2.3" stroke="#2B1D3D" stroke-width=".9" stroke-linecap="round"/>
<circle cx="90.5" cy="4" r="6" fill="url(#feGlanz)" class="fe-glanz"/>
<path d="M84.2 25L90.5 3.5L94.4 26.5Z" fill="url(#feHorn)" stroke="#E8B866" stroke-width=".6" stroke-linejoin="round"/>
<path d="M85.6 19.6L93.2 17.4M87.2 13.8L92.2 12.4M88.8 8.4L91.3 7.7" stroke="#F2A7C9" stroke-width="1.1" stroke-linecap="round"/>
<path d="M77 22C66 20 59 30 61.5 40C58 46 55.5 54 59.5 61C63 53 66 47 70 42.5C70 36 72.5 30 79 28.5Z" fill="url(#feMaehne)"/>
<path d="M70 28C60 32 57 44 53 51C61 47 65.5 41 71.5 36Z" fill="#FF9ECF" opacity=".85"/>
<path d="M81 23.5C76.5 25.5 74.5 31.5 77.5 36.5C79 31.5 82 28.5 86.5 27.5Z" fill="#C9A8FF"/>
<g class="fe-kranz">
<ellipse cx="74.6" cy="25.6" rx="3.2" ry="1.4" transform="rotate(-35 74.6 25.6)" fill="#3FA16A"/>
<ellipse cx="96.6" cy="27.4" rx="3" ry="1.3" transform="rotate(30 96.6 27.4)" fill="#3FA16A"/>
<g transform="translate(79 22.6)"><circle r="1.9" cy="-2" fill="#E2F06A"/><circle r="1.9" cx="1.9" cy="-.6" fill="#E2F06A"/><circle r="1.9" cx="1.2" cy="1.6" fill="#E2F06A"/><circle r="1.9" cx="-1.2" cy="1.6" fill="#E2F06A"/><circle r="1.9" cx="-1.9" cy="-.6" fill="#E2F06A"/><circle r="1.3" fill="#FF9F5A"/></g>
<g transform="translate(97.2 29.6) scale(.8)"><circle r="1.9" cy="-2" fill="#FFB3D9"/><circle r="1.9" cx="1.9" cy="-.6" fill="#FFB3D9"/><circle r="1.9" cx="1.2" cy="1.6" fill="#FFB3D9"/><circle r="1.9" cx="-1.2" cy="1.6" fill="#FFB3D9"/><circle r="1.9" cx="-1.9" cy="-.6" fill="#FFB3D9"/><circle r="1.3" fill="#FFF3C4"/></g>
<g transform="translate(72.4 29.4) scale(.7)"><circle r="1.9" cy="-2" fill="#A8F0DA"/><circle r="1.9" cx="1.9" cy="-.6" fill="#A8F0DA"/><circle r="1.9" cx="1.2" cy="1.6" fill="#A8F0DA"/><circle r="1.9" cx="-1.2" cy="1.6" fill="#A8F0DA"/><circle r="1.9" cx="-1.9" cy="-.6" fill="#A8F0DA"/><circle r="1.3" fill="#FFFFFF"/></g>
</g>
</g>
<g class="fe-glitzer" fill="#FFF3C4">
<path d="M107 14q.6 3.4 4 4q-3.4.6-4 4q-.6-3.4-4-4q3.4-.6 4-4Z"/>
<path d="M14 6q.4 2.2 2.6 2.6q-2.2.4-2.6 2.6q-.4-2.2-2.6-2.6q2.2-.4 2.6-2.6Z" fill="#FFC2E3"/>
<path d="M110 70q.4 2.2 2.6 2.6q-2.2.4-2.6 2.6q-.4-2.2-2.6-2.6q2.2-.4 2.6-2.6Z" fill="#A8F0DA"/>
</g>
</svg>`;

/* ---------- Bausteine ---------- */
/* Eigene Ebene für Funkel und seine Funken: so breit wie das Fenster und seitlich abgeschnitten,
   damit Funken am Rand die Seite nicht breiter machen (am Handy würde sonst alles verrutschen) */
const ebene = document.createElement('div');
ebene.className = 'fe-ebene';
const fe = document.createElement('button');
fe.type = 'button'; fe.className = 'fe'; fe.id = 'funkel';
fe.setAttribute('aria-label', 'Funkel, das Einhorn: kurze Führung durch die Bibliothek');
fe.innerHTML = `<span class="fe-hub">${SVG}</span><span class="fe-hallo" aria-hidden="true">Hallo! Klick mich</span>`;
const blase = document.createElement('div');
blase.className = 'fe-blase'; blase.id = 'funkelBlase'; blase.hidden = true;
blase.setAttribute('role', 'dialog'); blase.setAttribute('aria-labelledby', 'funkelKopf'); blase.setAttribute('aria-describedby', 'funkelText');
blase.innerHTML = '<p class="fe-zeile micro" id="funkelKopf"></p><p class="fe-text" id="funkelText"></p>' +
  '<div class="fe-knoepfe"><button type="button" class="pillbtn micro fe-ja" id="funkelJa"></button><button type="button" class="linkbtn fe-nein" id="funkelNein"></button></div>';
ebene.append(fe);
document.body.append(ebene, blase);
const kopf = $('#funkelKopf'), text = $('#funkelText'), ja = $('#funkelJa'), nein = $('#funkelNein');

/* ---------- Maße und Orte (Seitenpixel, Mitte von Funkel) ---------- */
const eng = () => innerWidth < 860;
const box = el => { const r = (typeof el === 'string' ? $(el) : el).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top + scrollY, b: r.bottom + scrollY, w: r.width, h: r.height }; };
let pos = { x: -200, y: -200 }, links = false;
function setze(p){
  pos = { x: p.x, y: p.y };
  fe.style.transform = `translate(${pos.x - fe.offsetWidth / 2}px,${pos.y - fe.offsetHeight / 2}px)`;
}
function schau(nachLinks){ if (nachLinks !== links) { links = nachLinks; fe.classList.toggle('links', links); } }
/* Zuhause: auf der Linie unter der Bühne, links; die Hufe stehen auf dem Strich */
function heim(){
  const r = box('.hero .rule'), w = fe.offsetWidth, h = fe.offsetHeight;
  return { x: r.l + clamp(r.w * 0.14, w * 0.6, 170), y: r.t + r.h / 2 - h * 0.39 };
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
    text: () => `Die zwölf Würfel da oben sind die Lernfelder deiner Umschulung. Grüne haben schon Artikel, gestrichelte warten noch auf Futter. ${maus.matches ? 'Fahr mal mit der Maus drüber, sie weichen dir aus.' : 'Sie drehen sich, wenn du ein Lernfeld geschafft hast.'}` },
  { ranke: true, ziel(){ const A = box('#a-ranke'); return nebenRanke(A.t + A.h * (eng() ? 0.3 : 0.18)); },
    text: () => `Das ist die Ranke. Jedes Blatt ist ein Artikel, ${F.D.artikel.length} sind es schon. Blass heißt noch nicht gelesen, grün gelesen, dunkelgrün: sitzt. Rote Knospen sind Prüfungsstoff.` },
  { ranke: true, seite: 'links', ziel(){
      const lab = [...document.querySelectorAll('#twigLabels .twig-lab')].find(l => l.getBoundingClientRect().width);
      if (!lab) { const A = box('#a-ranke'); return nebenRanke(A.t + A.h * 0.5); }
      const r = box(lab), W = innerWidth, w = fe.offsetWidth;
      const x = r.l > w + 30 ? r.l - w * 0.6 : r.r + w * 0.6;
      return { x: clamp(x, 50, W - 50), y: r.t - 26 };
    },
    text: () => `Sechs Zweige, sechs Abteilungen: ${abteilungen()}. ${maus.matches ? 'Klick' : 'Tipp'} auf einen Zweig, dann springt die passende Kachel auf.` },
  { ranke: true, ziel(){ return nebenRanke(box('#regale').t + 70); },
    text: () => 'Hier blühen die Kacheln, erst die Abteilungen, darunter die Lernfelder. Deck eine auf und such dir einen Artikel aus. Ist ein Lernfeld geschafft, bekommt es einen Stempel.' },
  { ranke: true, ziel(){ return nebenRanke(box('#katalog').t + 70); },
    text: () => `Du suchst etwas Bestimmtes? Hier findest du alle ${F.D.artikel.length} Artikel, mit Suche und Filter nach Abteilung. Ein roter Punkt heißt: Prüfungsstoff drin.` },
  { ranke: true, ziel(){ return nebenRanke(box('#pruefung').t + 60); },
    text: () => 'Wenn es ernst wird: ROT zuerst. Das ist sicherer Prüfungsstoff. Im Prüfungsmodus hakst du ab, was sitzt, und der Rest bleibt oben stehen.' },
  { ranke: true, ziel(){ const E = box('#a-end'); return { x: clamp(E.l + E.w / 2 + (eng() ? -60 : -110), 50, innerWidth - 50), y: E.t - (eng() ? 60 : 80) }; },
    text: () => 'Ganz unten blüht die Ranke. Für jeden Artikel, den du liest, fliegt dir eine Biene zu. Dein Stand bleibt nur auf deinem Gerät, ganz ohne Konto, und unter „Mein Stand“ wartet dein Leseausweis. Das war der Garten! Ich flieg zurück in den Feenwald. Du findest mich oben unter den Würfeln und im Menü.' }
];

/* ---------- Funken ---------- */
const FARBEN = ['#FF9ECF', '#C9A8FF', '#8FE6CB', '#FFF3C4', '#FFFFFF'];
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
/* Wo Funkel im Fenster steht: am Handy weiter oben, weil die Sprechblase dort unten sitzt */
const blick = () => innerWidth < 560 ? 0.3 : 0.42;
function scrollAuf(v){
  v = clamp(v, 0, document.documentElement.scrollHeight - innerHeight);
  if (F.lenis) F.lenis.scrollTo(v, { immediate: true, force: true });
  else scrollTo(0, v);
}

/* ---------- Flug ---------- */
/* Weg von a nach b: an der Ranke entlang (versetzt wie nebenRanke), sonst im Bogen */
function weg(a, b, anRanke){
  const P = F.rankePfad, W = innerWidth;
  let pts = [];
  if (anRanke && P && P.length > 2) {
    const naechst = q => { let bi = 0, bd = Infinity; P.forEach((p, i) => { const d = (p[0] - q.x) ** 2 + (p[1] - q.y) ** 2; if (d < bd) { bd = d; bi = i; } }); return bi; };
    const i0 = naechst(a), i1 = naechst(b);
    const dx = eng() ? 46 : 74, dy = eng() ? 34 : 48;
    const stueck = i0 <= i1 ? P.slice(i0, i1 + 1) : P.slice(i1, i0 + 1).reverse();
    pts = stueck.map(p => [clamp(p[0] + (p[0] > W / 2 ? -dx : dx), 50, W - 50), p[1] - dy]);
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
  /* Ecken rund schleifen (Chaikin, zweimal) */
  for (let r = 0; r < 2; r++) {
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
  const at = s => {
    s = clamp(s, 0, L[L.length - 1]);
    let i = 1; while (i < L.length - 1 && L[i] < s) i++;
    const k = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
    return { x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, y: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k };
  };
  return { len: L[L.length - 1], at };
}
let flug = 0;
function flieg(b, anRanke, fertig){
  cancelAnimationFrame(flug);
  if (reduce.matches) {
    setze(b); scrollAuf(b.y - innerHeight * blick()); fertig(); return;
  }
  const w = weg(pos, b, anRanke);
  const dauer = clamp(w.len / 0.8, 900, 5200), t0 = performance.now();
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  let letzterFunke = 0;
  fe.classList.add('fliegt');
  const schritt = now => {
    const t = clamp((now - t0) / dauer, 0, 1), s = ease(t) * w.len;
    const p = w.at(s), q = w.at(s + 24);
    if (Math.abs(q.x - p.x) > 2) schau(q.x < p.x);
    const kipp = clamp(Math.atan2(q.y - p.y, Math.abs(q.x - p.x) + 12) * 18, -14, 14);
    fe.style.setProperty('--kipp', (links ? -kipp : kipp).toFixed(1) + 'deg');
    setze(p);
    scrollAuf(p.y - innerHeight * blick());
    if (now - letzterFunke > 55) {
      letzterFunke = now;
      const hx = p.x + (links ? 1 : -1) * fe.offsetWidth * 0.36;
      funke(hx, p.y + fe.offsetHeight * 0.05, (links ? 1 : -1) * (6 + Math.random() * 14), 8 + Math.random() * 16);
    }
    if (t < 1) flug = requestAnimationFrame(schritt);
    else { fe.classList.remove('fliegt'); fe.style.setProperty('--kipp', '0deg'); fertig(); }
  };
  flug = requestAnimationFrame(schritt);
}

/* ---------- Sprechblase ---------- */
function blaseSetzen(){
  if (blase.hidden) return;
  if (innerWidth < 560) { blase.style.left = blase.style.top = ''; return; }
  const bw = blase.offsetWidth, bh = blase.offsetHeight, w = fe.offsetWidth, W = innerWidth;
  /* rechts neben Funkel, außer die Station will links (dort liegt sonst, was erklärt wird) oder rechts ist kein Platz */
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
  zeige('Funkel aus dem Feenwald', 'Hallo, ich bin Funkel! Ich wohne im Feenwald gleich hinter der Ranke. Soll ich dir in einer Minute zeigen, wie dieser Garten aufgebaut ist?', 'Ja, zeig mal', 'Lieber später');
}
function station(i){
  nr = i; zustand = 'fliegt'; verstecke(); ruftNicht();
  const st = STATIONEN[i];
  flieg(st.ziel(), st.ranke, () => {
    if (zustand !== 'fliegt') return;
    zustand = 'station';
    const letzte = i === STATIONEN.length - 1;
    zeige(`Funkel · ${i + 1} von ${STATIONEN.length}`, st.text(), letzte ? 'Danke, Funkel!' : 'Weiter', letzte ? '' : 'Beenden');
  });
}
function ende(){
  cancelAnimationFrame(flug);
  const warAktiv = zustand !== 'ruhe';
  zustand = 'ruhe'; nr = -1; store.set(KEY, '1');
  verstecke(); fe.classList.remove('fliegt'); fe.style.setProperty('--kipp', '0deg');
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
/* Aus dem Menü: erst nach oben zu Funkel, dann geht es los */
document.addEventListener('click', e => {
  if (!e.target.closest('[data-einhorn]')) return;
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
  if (zustand === 'station') setze(STATIONEN[nr].ziel()); else setze(heim());
  blaseSetzen();
}
const spaeter = () => { clearTimeout(neuT); neuT = setTimeout(neuSetzen, 120); };
addEventListener('resize', spaeter);
addEventListener('fiae-tree', spaeter);
if ('ResizeObserver' in window) new ResizeObserver(spaeter).observe(document.body);
setze(heim());

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
