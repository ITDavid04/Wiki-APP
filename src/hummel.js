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
<clipPath id="feLeibForm"><path d="M95.7 60.0 L95.5 61.0 L95.1 62.0 L94.8 63.0 L94.9 64.1 L95.1 65.1 L95.0 66.2 L94.6 67.2 L94.0 68.1 L93.6 69.0 L93.4 70.0 L93.4 71.1 L93.1 72.1 L92.5 73.0 L91.8 73.9 L91.1 74.7 L90.7 75.7 L90.5 76.7 L90.0 77.7 L89.3 78.5 L88.3 79.2 L87.5 79.9 L87.0 80.8 L86.5 81.8 L85.8 82.6 L84.9 83.3 L83.9 83.8 L82.9 84.4 L82.2 85.2 L81.5 86.1 L80.7 86.8 L79.7 87.3 L78.5 87.6 L77.5 88.1 L76.6 88.7 L75.7 89.5 L74.8 90.1 L73.7 90.4 L72.5 90.5 L71.4 90.8 L70.4 91.3 L69.4 91.9 L68.3 92.3 L67.1 92.4 L66.0 92.4 L64.8 92.4 L63.7 92.8 L62.6 93.2 L61.5 93.5 L60.3 93.4 L59.1 93.1 L58.0 93.0 L56.9 93.1 L55.7 93.4 L54.5 93.5 L53.4 93.2 L52.3 92.8 L51.2 92.4 L50.0 92.4 L48.9 92.4 L47.7 92.3 L46.6 91.9 L45.6 91.3 L44.6 90.8 L43.5 90.5 L42.3 90.4 L41.2 90.1 L40.3 89.5 L39.4 88.7 L38.5 88.1 L37.5 87.6 L36.3 87.3 L35.3 86.8 L34.5 86.1 L33.8 85.2 L33.1 84.4 L32.1 83.8 L31.1 83.3 L30.2 82.6 L29.5 81.8 L29.0 80.8 L28.5 79.9 L27.7 79.2 L26.7 78.5 L26.0 77.7 L25.5 76.7 L25.3 75.7 L24.9 74.7 L24.2 73.9 L23.5 73.0 L22.9 72.1 L22.6 71.1 L22.6 70.0 L22.4 69.0 L22.0 68.1 L21.4 67.2 L21.0 66.2 L20.9 65.1 L21.1 64.1 L21.2 63.0 L20.9 62.0 L20.5 61.0 L20.3 60.0 L20.5 59.0 L20.9 58.0 L21.2 57.0 L21.1 55.9 L20.9 54.9 L21.0 53.8 L21.4 52.8 L22.0 51.9 L22.4 51.0 L22.6 50.0 L22.6 48.9 L22.9 47.9 L23.5 47.0 L24.2 46.1 L24.9 45.3 L25.3 44.3 L25.5 43.3 L26.0 42.3 L26.7 41.5 L27.7 40.8 L28.5 40.1 L29.0 39.2 L29.5 38.2 L30.2 37.4 L31.1 36.7 L32.1 36.2 L33.1 35.6 L33.8 34.8 L34.5 33.9 L35.3 33.2 L36.3 32.7 L37.5 32.4 L38.5 31.9 L39.4 31.3 L40.3 30.5 L41.2 29.9 L42.3 29.6 L43.5 29.5 L44.6 29.2 L45.6 28.7 L46.6 28.1 L47.7 27.7 L48.9 27.6 L50.0 27.6 L51.2 27.6 L52.3 27.2 L53.4 26.8 L54.5 26.5 L55.7 26.6 L56.9 26.9 L58.0 27.0 L59.1 26.9 L60.3 26.6 L61.5 26.5 L62.6 26.8 L63.7 27.2 L64.8 27.6 L66.0 27.6 L67.1 27.6 L68.3 27.7 L69.4 28.1 L70.4 28.7 L71.4 29.2 L72.5 29.5 L73.7 29.6 L74.8 29.9 L75.7 30.5 L76.6 31.3 L77.5 31.9 L78.5 32.4 L79.7 32.7 L80.7 33.2 L81.5 33.9 L82.2 34.8 L82.9 35.6 L83.9 36.2 L84.9 36.7 L85.8 37.4 L86.5 38.2 L87.0 39.2 L87.5 40.1 L88.3 40.8 L89.3 41.5 L90.0 42.3 L90.5 43.3 L90.7 44.3 L91.1 45.3 L91.8 46.1 L92.5 47.0 L93.1 47.9 L93.4 48.9 L93.4 50.0 L93.6 51.0 L94.0 51.9 L94.6 52.8 L95.0 53.8 L95.1 54.9 L94.9 55.9 L94.8 57.0 L95.1 58.0 L95.5 59.0Z"/></clipPath>
<radialGradient id="feRosa" cx=".62" cy=".32" r=".85"><stop offset="0" stop-color="#A9C8F5"/><stop offset=".55" stop-color="#6E97E0"/><stop offset="1" stop-color="#3F62B8"/></radialGradient>
<radialGradient id="feSamt" cx=".5" cy=".5" r=".5"><stop offset=".78" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#E3EEFF" stop-opacity=".5"/></radialGradient>
<linearGradient id="feFluegel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF8EC" stop-opacity=".95"/><stop offset=".5" stop-color="#F3E6FF" stop-opacity=".8"/><stop offset="1" stop-color="#D9E8FF" stop-opacity=".75"/></linearGradient>
<radialGradient id="feAuge" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#3A5A9A"/><stop offset=".6" stop-color="#101A33"/><stop offset="1" stop-color="#070B18"/></radialGradient>
</defs>
<g class="fe-fluegel">
<path d="M52 33C46 18 40 6 28 4C17 3 14 13 22 21C29 28 41 32 52 35Z" fill="url(#feFluegel)" stroke="#FFFFFF" stroke-opacity=".95" stroke-width="1"/>
<path d="M50 34C40 26 30 22 24 13M50 34C43 27 38 18 37 8M50 34C38 31 28 27 21 20" fill="none" stroke="#D8C6A0" stroke-opacity=".85" stroke-width=".7"/>
<path d="M60 31C60 18 64 8 72 6C80 5 82 13 77 21C73 27 66 30 60 33Z" fill="url(#feFluegel)" stroke="#FFFFFF" stroke-opacity=".95" stroke-width="1"/>
<path d="M61 31C64 22 68 14 74 10M61 31C67 25 72 20 77 15" fill="none" stroke="#D8C6A0" stroke-opacity=".85" stroke-width=".7"/>
</g>
<g fill="#1E2550">
<ellipse cx="44" cy="91" rx="4.6" ry="6.5" transform="rotate(12 44 91)"/><ellipse cx="57" cy="94" rx="4.6" ry="6.5"/>
</g>
<g clip-path="url(#feLeibForm)">
<rect x="0" y="0" width="120" height="110" fill="url(#feRosa)"/>
<path d="M50 -5 Q40 60 56 120 L64 120 Q48 60 58 -5Z" fill="#1E2550"/><path d="M41 -5 Q31 60 47 120 L56 120 Q40 60 50 -5Z" fill="#F2C14E"/><path d="M32 -5 Q22 60 38 120 L47 120 Q31 60 41 -5Z" fill="#1E2550"/><path d="M17 -5 Q7 60 23 120 L29 120 Q13 60 23 -5Z" fill="#1E2550"/>
<rect x="0" y="0" width="120" height="110" fill="url(#feSamt)"/>
</g>
<path d="M95.7 60.0 L95.5 61.0 L95.1 62.0 L94.8 63.0 L94.9 64.1 L95.1 65.1 L95.0 66.2 L94.6 67.2 L94.0 68.1 L93.6 69.0 L93.4 70.0 L93.4 71.1 L93.1 72.1 L92.5 73.0 L91.8 73.9 L91.1 74.7 L90.7 75.7 L90.5 76.7 L90.0 77.7 L89.3 78.5 L88.3 79.2 L87.5 79.9 L87.0 80.8 L86.5 81.8 L85.8 82.6 L84.9 83.3 L83.9 83.8 L82.9 84.4 L82.2 85.2 L81.5 86.1 L80.7 86.8 L79.7 87.3 L78.5 87.6 L77.5 88.1 L76.6 88.7 L75.7 89.5 L74.8 90.1 L73.7 90.4 L72.5 90.5 L71.4 90.8 L70.4 91.3 L69.4 91.9 L68.3 92.3 L67.1 92.4 L66.0 92.4 L64.8 92.4 L63.7 92.8 L62.6 93.2 L61.5 93.5 L60.3 93.4 L59.1 93.1 L58.0 93.0 L56.9 93.1 L55.7 93.4 L54.5 93.5 L53.4 93.2 L52.3 92.8 L51.2 92.4 L50.0 92.4 L48.9 92.4 L47.7 92.3 L46.6 91.9 L45.6 91.3 L44.6 90.8 L43.5 90.5 L42.3 90.4 L41.2 90.1 L40.3 89.5 L39.4 88.7 L38.5 88.1 L37.5 87.6 L36.3 87.3 L35.3 86.8 L34.5 86.1 L33.8 85.2 L33.1 84.4 L32.1 83.8 L31.1 83.3 L30.2 82.6 L29.5 81.8 L29.0 80.8 L28.5 79.9 L27.7 79.2 L26.7 78.5 L26.0 77.7 L25.5 76.7 L25.3 75.7 L24.9 74.7 L24.2 73.9 L23.5 73.0 L22.9 72.1 L22.6 71.1 L22.6 70.0 L22.4 69.0 L22.0 68.1 L21.4 67.2 L21.0 66.2 L20.9 65.1 L21.1 64.1 L21.2 63.0 L20.9 62.0 L20.5 61.0 L20.3 60.0 L20.5 59.0 L20.9 58.0 L21.2 57.0 L21.1 55.9 L20.9 54.9 L21.0 53.8 L21.4 52.8 L22.0 51.9 L22.4 51.0 L22.6 50.0 L22.6 48.9 L22.9 47.9 L23.5 47.0 L24.2 46.1 L24.9 45.3 L25.3 44.3 L25.5 43.3 L26.0 42.3 L26.7 41.5 L27.7 40.8 L28.5 40.1 L29.0 39.2 L29.5 38.2 L30.2 37.4 L31.1 36.7 L32.1 36.2 L33.1 35.6 L33.8 34.8 L34.5 33.9 L35.3 33.2 L36.3 32.7 L37.5 32.4 L38.5 31.9 L39.4 31.3 L40.3 30.5 L41.2 29.9 L42.3 29.6 L43.5 29.5 L44.6 29.2 L45.6 28.7 L46.6 28.1 L47.7 27.7 L48.9 27.6 L50.0 27.6 L51.2 27.6 L52.3 27.2 L53.4 26.8 L54.5 26.5 L55.7 26.6 L56.9 26.9 L58.0 27.0 L59.1 26.9 L60.3 26.6 L61.5 26.5 L62.6 26.8 L63.7 27.2 L64.8 27.6 L66.0 27.6 L67.1 27.6 L68.3 27.7 L69.4 28.1 L70.4 28.7 L71.4 29.2 L72.5 29.5 L73.7 29.6 L74.8 29.9 L75.7 30.5 L76.6 31.3 L77.5 31.9 L78.5 32.4 L79.7 32.7 L80.7 33.2 L81.5 33.9 L82.2 34.8 L82.9 35.6 L83.9 36.2 L84.9 36.7 L85.8 37.4 L86.5 38.2 L87.0 39.2 L87.5 40.1 L88.3 40.8 L89.3 41.5 L90.0 42.3 L90.5 43.3 L90.7 44.3 L91.1 45.3 L91.8 46.1 L92.5 47.0 L93.1 47.9 L93.4 48.9 L93.4 50.0 L93.6 51.0 L94.0 51.9 L94.6 52.8 L95.0 53.8 L95.1 54.9 L94.9 55.9 L94.8 57.0 L95.1 58.0 L95.5 59.0Z" fill="none" stroke="#2F4C95" stroke-opacity=".35" stroke-width=".8"/>
<g class="fe-wink" fill="#1E2550"><ellipse cx="78" cy="90" rx="4.6" ry="6.5" transform="rotate(-12 78 90)"/></g>
<g class="fe-blume">
<path d="M79 82C79 87 78 91 77 95" fill="none" stroke="#3FA16A" stroke-width="1.6" stroke-linecap="round"/>
<ellipse cx="79" cy="74.6" rx="2.6" ry="3.8" fill="#FFD54A" transform="rotate(0 79 79)"/><ellipse cx="79" cy="74.6" rx="2.6" ry="3.8" fill="#FFD54A" transform="rotate(72 79 79)"/><ellipse cx="79" cy="74.6" rx="2.6" ry="3.8" fill="#FFD54A" transform="rotate(144 79 79)"/><ellipse cx="79" cy="74.6" rx="2.6" ry="3.8" fill="#FFD54A" transform="rotate(216 79 79)"/><ellipse cx="79" cy="74.6" rx="2.6" ry="3.8" fill="#FFD54A" transform="rotate(288 79 79)"/>
<circle cx="79" cy="79" r="2.4" fill="#F29A2E"/>
<ellipse cx="73.5" cy="83" rx="3.6" ry="3" fill="#1E2550"/><ellipse cx="83.5" cy="84" rx="3.6" ry="3" fill="#1E2550"/>
</g>
<g class="fe-kopf">
<g class="fe-fuehler" stroke="#1E2550" stroke-width="2.2" stroke-linecap="round" fill="none">
<path d="M68 32C67 24 68 17 72 11"/><path d="M80 33C84 26 89 21 95 18"/>
</g>
<circle cx="72.5" cy="10" r="4.2" fill="#F5C842"/><circle cx="95.5" cy="17.5" r="4.2" fill="#F5C842"/>
<circle cx="71.6" cy="8.7" r="1.3" fill="#FFFFFF" opacity=".7"/><circle cx="94.6" cy="16.2" r="1.3" fill="#FFFFFF" opacity=".7"/>
<ellipse cx="72" cy="55" rx="7.6" ry="8.6" fill="url(#feAuge)"/>
<ellipse cx="87.5" cy="54" rx="6" ry="7.6" fill="url(#feAuge)"/>
<circle class="fe-glanz" cx="69.6" cy="51.8" r="2.9" fill="#FFFFFF"/><circle cx="74.4" cy="58.6" r="1.2" fill="#FFFFFF" opacity=".85"/>
<circle cx="85.7" cy="51.2" r="2.3" fill="#FFFFFF"/><circle cx="89.3" cy="57.4" r="1" fill="#FFFFFF" opacity=".85"/>
<ellipse cx="67" cy="66" rx="5" ry="3" fill="#FF6FA3" opacity=".45"/><ellipse cx="91" cy="64.5" rx="3.6" ry="2.4" fill="#FF6FA3" opacity=".45"/>
<path d="M76.4 64.6q3.4 3 6.8 .2" fill="none" stroke="#1E2550" stroke-width="1.4" stroke-linecap="round"/>
</g>
<g class="fe-glitzer" fill="#F5C842">
<circle cx="14" cy="34" r="1.5"/><circle cx="112" cy="78" r="1.3" fill="#FFF3C4"/><circle cx="20" cy="12" r="1.1" fill="#E2F06A"/>
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
  '<div class="fe-knoepfe"><button type="button" class="pillbtn micro fe-ja" id="hummelJa"></button><button type="button" class="linkbtn fe-nein" id="hummelNein"></button>' +
  '<button type="button" class="fe-ton" id="hummelTon" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/>' +
  '<path class="fe-ton-an" d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
  '<path class="fe-ton-aus" d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span></span></button></div>' +
  '<audio id="hummelStimme" preload="none"></audio>';
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

/* ---------- Stimme ---------- */
/* Klaus-Dieter spricht seine Sprechblasen (ton/kd-hallo.mp3, ton/kd-1.mp3 bis kd-7.mp3). Der Lautsprecher in der Blase
   schaltet ihn stumm, gemerkt in lernwiki-hummel-ton. Handys spielen Ton nur nach einem Tipp ab: Darum lädt jeder Klick
   die nächste Datei schon stumm an (das gibt sie frei), und nach der Landung spricht er sie. Offline bleibt er still. */
const TON_KEY = 'lernwiki-hummel-ton';
/* Fingerabdruck je Datei, setzt tools/build.mjs ein: Neue Aufnahme heißt neue Adresse, kein Browser spielt dann noch die alte */
const TON = /*TON*/{};
const tonUrl = datei => 'ton/' + datei + (TON[datei] ? '?v=' + TON[datei] : '');
const stimme = $('#hummelStimme'), tonKnopf = $('#hummelTon');
let tonAn = store.get(TON_KEY) !== '0', tonSoll = false, tonDatei = '';
function tonZeigen(){
  tonKnopf.setAttribute('aria-pressed', String(tonAn));
  tonKnopf.classList.toggle('aus', !tonAn);
  tonKnopf.lastChild.textContent = tonAn ? 'Ton an' : 'Ton aus';
  tonKnopf.title = tonAn ? 'Klaus-Dieter stumm schalten' : 'Klaus-Dieter sprechen lassen';
}
function verstumme(){ tonSoll = false; stimme.pause(); fe.classList.remove('spricht'); }
/* Im Klick: Datei laden und stumm anspielen, damit das Handy sie später ohne Tipp abspielen darf */
function vorbereiten(datei){
  verstumme(); tonDatei = datei;
  if (!tonAn) return;
  if (!stimme.src.endsWith(tonUrl(datei))) stimme.src = tonUrl(datei);
  stimme.muted = true;
  const p = stimme.play();
  if (p) p.then(() => { if (!tonSoll) stimme.pause(); }, () => {});
}
function sprich(datei){
  if (datei !== tonDatei || !stimme.src.endsWith(tonUrl(datei))) vorbereiten(datei);
  if (!tonAn) return;
  tonSoll = true; stimme.muted = false;
  try { stimme.currentTime = 0; } catch (e) {}
  const p = stimme.play();
  if (p) p.catch(() => fe.classList.remove('spricht'));
}
stimme.addEventListener('playing', () => { if (tonSoll) fe.classList.add('spricht'); });
['pause', 'ended', 'error'].forEach(ev => stimme.addEventListener(ev, () => fe.classList.remove('spricht')));
tonKnopf.addEventListener('click', () => {
  tonAn = !tonAn; store.set(TON_KEY, tonAn ? '1' : '0'); tonZeigen();
  if (!tonAn) verstumme();
  else if (tonDatei && !blase.hidden) sprich(tonDatei);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) verstumme(); });
tonZeigen();

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
    text: () => 'Jetzt wird es ernst: ROT zuerst. Das ist sicherer Prüfungsstoff, im Prüfungsmodus hakst du ab, was sitzt. Übrigens: Nach einer alten Rechnung dürften Hummeln gar nicht fliegen können. Ich flieg trotzdem! Und genauso packst du die Prüfung, egal was die Rechnung sagt!' },
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
function verstecke(){ blase.hidden = true; blase.classList.remove('auf'); verstumme(); }

/* ---------- Ablauf ---------- */
let zustand = 'ruhe', nr = -1;   /* ruhe, frage, fliegt, station */
const gesehen = () => store.get(KEY) === '1';
function frage(){
  zustand = 'frage'; ruftNicht();
  zeige('Klaus-Dieter Pollenberg, Gartenaufsicht', 'Moin, Klaus-Dieter Pollenberg, Gartenaufsicht. Sag ruhig Klaus-Dieter. Soll ich dir in einer Minute zeigen, wie dieser Garten aufgebaut ist?', 'Ja, zeig mal', 'Lieber später');
  sprich('kd-hallo.mp3');
}
function station(i){
  nr = i; zustand = 'fliegt'; verstecke(); ruftNicht();
  const st = STATIONEN[i], datei = `kd-${i + 1}.mp3`;
  vorbereiten(datei);
  flieg(st.ziel(), st.ranke, () => {
    if (zustand !== 'fliegt') return;
    zustand = 'station';
    const letzte = i === STATIONEN.length - 1;
    zeige(`Klaus-Dieter · ${i + 1} von ${STATIONEN.length}`, st.text(), letzte ? 'Danke, Klaus-Dieter!' : 'Weiter', letzte ? '' : 'Beenden');
    sprich(datei);
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
  vorbereiten('kd-1.mp3');
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
