(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const store = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

/* Daten: aus dem Repository erzeugt (catalog.py), nichts von Hand */
const D = JSON.parse($('#catalog').textContent);
const REG = D.regale;
const share = r => r.n ? r.rot / r.n : 0;
window.FIAE = { D, REG, scrollTo: null, openTile: null, loadStep: null, tree: null, relayoutTree: null, hoverBlock: false, tip: null, sheetOpen: false, closeSheet: null, lenis: null };

/* Lernstand: bleibt nur auf diesem Gerät (localStorage). Schlüssel ist der Pfad der Datei im Wiki,
   damit der Stand auch nach einem neuen Katalog stimmt. 0 = noch nicht, 1 = gelesen, 2 = sitzt */
const pathOf = a => decodeURIComponent(a.u.split('/blob/main/')[1] || a.u);
const idxByPath = new Map(D.artikel.map((a, i) => [pathOf(a), i]));
const STAND_KEY = 'lernwiki-stand-v1', LAST_KEY = 'lernwiki-zuletzt-v1';
let standData = {};
try { standData = JSON.parse(store.get(STAND_KEY) || '{}') || {}; } catch (e) { standData = {}; }
const Stand = {
  get(p){ return (standData[p] && standData[p].s) || 0; },
  set(p, s){
    if (s) standData[p] = { s, t: Date.now() }; else delete standData[p];
    store.set(STAND_KEY, JSON.stringify(standData));
    window.dispatchEvent(new CustomEvent('fiae-stand', { detail: { p, s } }));
  },
  all(){ return standData; },
  replace(obj){
    standData = obj && typeof obj === 'object' ? obj : {};
    store.set(STAND_KEY, JSON.stringify(standData));
    window.dispatchEvent(new CustomEvent('fiae-stand', { detail: {} }));
  },
  count(filter){
    let g = 0, s = 0;
    D.artikel.forEach(a => { if (filter && !filter(a)) return; const v = this.get(pathOf(a)); if (v >= 1) g++; if (v === 2) s++; });
    return { gelesen: g, sitzt: s };
  },
  recent(){ try { return (JSON.parse(store.get(LAST_KEY) || '[]') || []).filter(p => idxByPath.has(p)); } catch (e) { return []; } },
  touch(p){ const r = this.recent().filter(x => x !== p); r.unshift(p); store.set(LAST_KEY, JSON.stringify(r.slice(0, 6))); }
};
const artUrl = a => '#/artikel/' + encodeURIComponent(pathOf(a));
/* Blattfarben der Ranke nach Lernstand: blass = noch nicht, grün = gelesen, dunkelgrün = sitzt */
const LEAF = ['#A8D9B9', '#3FA16A', '#1F6E4E'];
Object.assign(window.FIAE, { stand: Stand, pathOf, artUrl, LEAF, byPath: p => D.artikel[idxByPath.get(p)], indexOfPath: p => idxByPath.get(p) });

/* Zahlen */
const lfMit = D.lf.filter(l => l.a).length;
const rotAll = D.artikel.filter(a => a.rot).length;
const setStat = (k, v) => $$(`[data-stat="${k}"]`).forEach(el => { el.textContent = v; });
setStat('artikel', D.artikel.length);
setStat('regale', REG.length);
setStat('lf', `${lfMit} von ${D.lf.length}`);
setStat('rot', rotAll);
setStat('pruef', (REG.find(r => r.id === 'ap') || { n: 0 }).n);
const [sy, sm, sd] = (D.stand || '').split('-');
if (sd) $('#footStand').textContent = `Bibliothek Lern-Wiki für Umschüler, letzter Eintrag im Repository am ${sd}.${sm}.${sy}`;
$('#mdLink').href = D.links.markdown;
$('#ghLink').href = D.repo;
const EXT = '<svg class="ext" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const NEWTAB = '<span class="sr"> (öffnet GitHub in neuem Tab)</span>';
$('#kit').innerHTML = [
  ['Spickzettel: Übersicht', D.links.spick], ['Spickzettel AP1', D.links.ap1], ['Spickzettel AP2', D.links.ap2],
  ['WiSo Multiple Choice', D.links.wiso], ['Übungsblätter mit Lösungen', D.links.uebung]
].map(([t, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${t}${EXT}${NEWTAB}</a></li>`).join('');

/* Standbild der Bühne, falls kein 3D: zwölf Würfel, grün mit Artikeln, weiß gestrichelt noch leer */
const POS = [[50,12,-12],[63,6,18],[77,13,8],[88,18,-6],[57,32,14],[71,27,-20],[85,34,24],[66,50,-8],[80,56,16],[91,64,10],[72,76,-16],[86,82,6]];
$('#posterStage').innerHTML = D.lf.map((l, i) => {
  const p = POS[i % POS.length];
  return `<i${l.a ? '' : ' class="wip"'} style="left:calc(${p[0]}% - 48px);top:${p[1]}%;transform:rotate(${p[2]}deg)"></i>`;
}).join('');

/* Legende der Regale neben der Ranke */
$('#legend').innerHTML = REG.map((r, i) =>
  `<li><button type="button" data-tile="r-${r.id}"><span class="no">${String(i + 1).padStart(2, '0')}</span><span class="nm">${esc(r.name)}</span>` +
  `<span class="ct">${r.n} ${r.rot ? `<span class="dot" aria-hidden="true"></span>${r.rot}<span class="sr"> mit Ampel</span>` : ''}</span></button></li>`
).join('');
if (matchMedia('(hover:none) and (pointer:coarse)').matches) $('#touchNote').hidden = false;

/* Theme */
const saved = store.get('fiae-theme');
if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
const effective = () => root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
$('#themeBtn').addEventListener('click', () => {
  const t = effective() === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', t);
  store.set('fiae-theme', t);
  window.dispatchEvent(new Event('fiae-theme'));
});

/* Menü */
const menu = $('#menu'), menuBtn = $('#menuBtn');
function setMenu(open){
  menu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  if (open) $('a', menu).focus();
}
menuBtn.addEventListener('click', e => { e.stopPropagation(); setMenu(menu.hidden); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('#menu')) setMenu(false); });
menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

/* Ladebildschirm: 6 Felder für die Ladeschritte */
const loader = $('#loader'), cells = [...$('#loaderRow').children];
let loaded = 0, loaderDone = false;
const t0 = performance.now();
function finishLoader(){
  if (loaderDone) return; loaderDone = true;
  if (!root.classList.contains('is-loading')) return;
  const wait = Math.max(0, 700 - (performance.now() - t0));
  setTimeout(() => {
    cells.forEach(c => c.classList.add('on'));
    loader.classList.add('leaving');
    root.classList.remove('is-loading');
    setTimeout(() => loader.classList.remove('leaving'), 900);
  }, wait);
}
window.FIAE.loadStep = (done) => {
  loaded = Math.min(cells.length, loaded + 1);
  cells.slice(0, loaded).forEach(c => c.classList.add('on'));
  if (done) finishLoader();
};
document.fonts && document.fonts.ready.then(() => window.FIAE.loadStep());
setTimeout(finishLoader, 2600);

/* Tooltip, gemeinsam für Würfel und Blätter */
const tip = $('#tip');
window.FIAE.tip = {
  show(html, x, y){ tip.innerHTML = html; tip.classList.add('on'); this.move(x, y); },
  move(x, y){ tip.classList.toggle('below', y < 190); tip.style.left = Math.min(Math.max(160, x), innerWidth - 160) + 'px'; tip.style.top = y + 'px'; },
  hide(){ tip.classList.remove('on'); }
};

/* Die Ranke: Baum aus Stamm, sechs Zweigen (Regale), Trieben (Gruppen) und Blättern (Artikel).
   Koordinaten in Pixeln, bezogen auf #a-ranke. Wird für 3D und für das Standbild (SVG) benutzt. */
function rng(seed){
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function layoutTree(w, h){
  const R = rng(20261020);
  const narrow = w < 560;
  const trunkX = y => w * 0.5 + Math.sin(y / h * Math.PI * 2.1 + 0.5) * w * (narrow ? 0.07 : 0.1);
  const trunkZ = y => Math.sin(y / h * Math.PI * 3.2) * 26;
  const trunk = [];
  for (let y = -60; y <= h + 60; y += 16) trunk.push([trunkX(y), y, trunkZ(y)]);
  const wts = REG.map(r => 0.55 + r.n / 34);
  const sum = wts.reduce((a, b) => a + b, 0);
  const leafBase = Math.max(12, Math.min(22, w * 0.03));
  let acc = h * 0.03;
  const twigs = REG.map((r, i) => {
    const zh = h * 0.94 * wts[i] / sum;
    const yc = acc + zh * 0.55; acc += zh;
    const side = i % 2 ? 1 : -1;
    const ax = trunkX(yc), az = trunkZ(yc);
    const room = side > 0 ? w - ax - 30 : ax - 30;
    const L = Math.max(60, room * (0.6 + 0.3 * Math.min(1, r.n / 30)));
    const lift = zh * 0.14;
    const N = 24, pts = [];
    for (let k = 0; k <= N; k++) {
      const s = k / N;
      pts.push([ax + side * L * s, yc - Math.sin(s * Math.PI * 0.85) * lift - s * zh * 0.05, az + s * 28 * side]);
    }
    /* Spirale an der Spitze, wie eine Ranke */
    const [tx, ty, tz] = pts[N], cr = Math.max(8, leafBase * 0.62);
    for (let k = 1; k <= 12; k++) {
      const a = k / 12 * Math.PI * 1.7, rr = cr * (1 - k / 17);
      pts.push([tx + side * Math.sin(a) * rr, ty - cr + Math.cos(a) * rr, tz]);
    }
    const label = { x: tx + side * cr * 0.4, y: ty - cr * 2 - 20, side };
    const at = s => {
      const f = s * N, k0 = Math.min(N - 1, Math.floor(f)), u = f - k0, a = pts[k0], b = pts[k0 + 1];
      return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, z: a[2] + (b[2] - a[2]) * u, th: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    };
    const m = r.gruppen.length;
    const sprigs = r.gruppen.map(([g, n], j) => {
      const s0 = 0.16 + 0.76 * (j + 0.5) / m;
      const b = at(s0);
      const upDown = j % 2 ? 1 : -1;
      const ang = b.th + upDown * side * (narrow ? 1.2 : 0.95 + R() * 0.25);
      const Ls = Math.max(30, Math.min(zh * 0.46, 16 + Math.sqrt(n) * leafBase * 1.55));
      const sp = [], M = 10;
      let x = b.x, y = b.y, z = b.z;
      sp.push([x, y, z]);
      for (let k = 1; k <= M; k++) {
        const t = k / M, a = ang + (b.th - ang) * 0.3 * t;
        x += Math.cos(a) * Ls / M; y += Math.sin(a) * Ls / M; z += (R() - 0.5) * 3;
        sp.push([x, y, z]);
      }
      const arts = D.artikel.map((a, ai) => ({ a, ai })).filter(o => o.a.r === r.id && o.a.g === g);
      const leaves = arts.map((o, k) => {
        const s = arts.length === 1 ? 0.92 : 0.2 + 0.8 * k / (arts.length - 1);
        const f = s * M, k0 = Math.min(M - 1, Math.floor(f)), u = f - k0, p = sp[k0], q = sp[k0 + 1];
        const dir = Math.atan2(q[1] - p[1], q[0] - p[0]);
        const last = k === arts.length - 1;
        return {
          x: p[0] + (q[0] - p[0]) * u, y: p[1] + (q[1] - p[1]) * u, z: p[2] + (q[2] - p[2]) * u + (R() - 0.5) * 8,
          ang: dir + (last ? 0 : (k % 2 ? 1 : -1) * (0.7 + R() * 0.35)),
          size: leafBase * (0.82 + R() * 0.32) * (last ? 1.12 : 1),
          tilt: (R() - 0.5) * 1.3, s, ai: o.ai, rot: !!o.a.rot
        };
      });
      return { g, s0, pts: sp, len: Ls, leaves };
    });
    return { r, i, side, yc, len: L, pts, label, sprigs };
  });
  return { w, h, trunk, twigs, leafBase };
}

const NS = 'http://www.w3.org/2000/svg';
function drawTreeSvg(T){
  const svg = $('#treeSvg');
  svg.setAttribute('viewBox', `0 0 ${T.w} ${T.h}`);
  const line = (pts, wd, col) => `<polyline points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${col}" stroke-width="${wd}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const leafD = s => `M0 0C${.25 * s} ${.32 * s} ${.7 * s} ${.3 * s} ${s} 0C${.7 * s} ${-.3 * s} ${.25 * s} ${-.32 * s} 0 0Z`;
  let out = line(T.trunk, 7, '#2C7A50');
  T.twigs.forEach(t => {
    out += line(t.pts, 3.2, '#2C7A50');
    t.sprigs.forEach(sp => {
      out += line(sp.pts, 1.6, '#2C7A50');
      sp.leaves.forEach((l, k) => {
        out += `<path d="${leafD(l.size)}" fill="${LEAF[Stand.get(pathOf(D.artikel[l.ai]))]}" transform="translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${(l.ang * 180 / Math.PI).toFixed(1)})"/>`;
        if (l.rot) out += `<circle cx="${l.x.toFixed(1)}" cy="${l.y.toFixed(1)}" r="${(l.size * 0.16).toFixed(1)}" fill="#E5483A"/>`;
      });
    });
  });
  svg.innerHTML = out;
}
const labelsEl = $('#twigLabels');
function relayoutTree(){
  const A = $('#a-ranke');
  const w = A.clientWidth, h = A.clientHeight;
  if (window.FIAE.tree && window.FIAE.tree.w === w && window.FIAE.tree.h === h) return window.FIAE.tree;
  const T = layoutTree(w, h);
  window.FIAE.tree = T;
  labelsEl.innerHTML = T.twigs.map(t =>
    `<span class="twig-lab micro${t.label.side > 0 ? ' l' : ''}" style="left:${t.label.x.toFixed(1)}px;top:${t.label.y.toFixed(1)}px">${esc(t.r.kurz)} <b>${t.r.n}</b></span>`
  ).join('');
  T.labels = [...labelsEl.children];
  drawTreeSvg(T);
  return T;
}
window.FIAE.relayoutTree = relayoutTree;
relayoutTree();
let rt = 0;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const before = window.FIAE.tree; relayoutTree(); if (window.FIAE.tree !== before) window.dispatchEvent(new Event('fiae-tree')); }, 160); });

/* Kacheln */
const CHECK = '<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const RING = '<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-dasharray="3.4 3.4"/></svg>';
const UP = '<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARR = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const nArt = n => n === 1 ? '1 Artikel' : `${n} Artikel`;
const ampelText = (rot, n) => !n ? 'noch keine Artikel' : rot ? `${rot} von ${n} mit Prüfungs-Ampel` : 'ohne Ampel, zum Stöbern und Vertiefen';

function cover(id, nr, title, label, pill){
  return `<button class="cover" type="button" aria-expanded="false" aria-controls="d-${id}" aria-label="${esc(label)}. Kachel aufdecken">` +
    `<span class="c-nr" aria-hidden="true">${nr}</span>` +
    `<span class="c-title" aria-hidden="true">${esc(title)}</span>` +
    `<span class="c-foot" aria-hidden="true">${pill}<span class="c-hint">${UP}aufdecken</span></span>` +
  `</button>`;
}

const tilesReg = $('#tilesReg');
REG.forEach((r, i) => {
  const li = document.createElement('li');
  const full = share(r) >= 0.5;
  li.className = 'tile reveal' + (full ? ' full' : '');
  li.id = 'r-' + r.id;
  const pill = `<span class="pill ok">${nArt(r.n)}</span>`;
  li.innerHTML =
    cover(li.id, String(i + 1).padStart(2, '0'), r.name, `Regal ${r.name}, ${nArt(r.n)}`, pill) +
    `<div class="detail" id="d-${li.id}">` +
      `<div class="d-top"><span class="d-nr">Regal ${String(i + 1).padStart(2, '0')}</span>${pill}</div>` +
      `<h3>${esc(r.name)}</h3>` +
      `<p class="sub">${esc(r.sub)}</p>` +
      `<div class="meter"><div class="bar"><i style="--w:${Math.round(share(r) * 100)}%"></i></div><span>${ampelText(r.rot, r.n)}</span></div>` +
      `<ul class="gchips">${r.gruppen.map(([g, n]) => `<li>${esc(g)}<b>${n}</b></li>`).join('')}</ul>` +
      `<button class="tlink" type="button" data-cat="r:${r.id}">Im Katalog zeigen ${ARR}</button>` +
    `</div>`;
  tilesReg.appendChild(li);
});

const tilesLf = $('#tilesLf');
D.lf.forEach(l => {
  const li = document.createElement('li');
  li.className = 'tile reveal' + (l.a ? ' full' : '');
  li.id = 'lf' + l.n;
  const arts = D.artikel.filter(a => a.lf === l.n);
  const pill = l.a ? `<span class="pill ok">${CHECK}${nArt(l.a)}</span>` : `<span class="pill wip">${RING}noch leer</span>`;
  const body = l.a
    ? `<ul class="alist">${arts.slice(0, 4).map(a => `<li><a href="${artUrl(a)}" title="${esc(a.t)}">${esc(a.t)}</a></li>`).join('')}</ul>` +
      `<button class="tlink" type="button" data-cat="lf:${l.n}">${l.a > 4 ? `Alle ${l.a} im Katalog` : 'Im Katalog zeigen'} ${ARR}</button>`
    : `<p class="empty-note">Hier liegt noch nichts. Magst du den ersten Artikel schreiben?</p>` +
      `<a class="tlink" href="#mitmachen">So machst du mit ${ARR}</a>`;
  li.innerHTML =
    cover(li.id, String(l.n).padStart(2, '0'), l.titel, `${l.k} ${l.titel}, ${l.a ? nArt(l.a) : 'noch leer'}`, pill) +
    `<div class="detail" id="d-${li.id}">` +
      `<div class="d-top"><span class="d-nr">${l.k}</span>${pill}</div>` +
      `<h3>${esc(l.titel)}</h3>` +
      (l.a ? `<div class="meter"><div class="bar"><i style="--w:${Math.round(l.rot / l.a * 100)}%"></i></div><span>${ampelText(l.rot, l.a)}</span></div>` : '') +
      body +
    `</div>`;
  tilesLf.appendChild(li);
});

function setOpen(li, open){
  li.classList.toggle('open', open);
  $('.cover', li).setAttribute('aria-expanded', String(open));
}
$$('.tiles').forEach(list => {
  list.addEventListener('click', e => {
    const c = e.target.closest('.cover');
    if (c) { setOpen(c.parentElement, true); return; }
    if (e.target.closest('a,button')) return;
    const tile = e.target.closest('.tile.open');
    if (tile) setOpen(tile, false);
  });
  list.addEventListener('focusin', e => {
    if (e.target.closest('.detail')) setOpen(e.target.closest('.tile'), true);
  });
  list.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const t = e.target.closest('.tile');
    if (t) { setOpen(t, false); $('.cover', t).focus(); }
  });
});

/* Katalog */
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
const catList = $('#catList'), chipsEl = $('#chips'), qIn = $('#q');
const state = { regal: 'all', rot: false, q: '', group: null };
const CHEV = '<svg class="chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
chipsEl.innerHTML =
  `<button class="chip" type="button" data-r="all" aria-pressed="true">Alle</button>` +
  REG.map(r => `<button class="chip" type="button" data-r="${r.id}" aria-pressed="false">${esc(r.kurz)}</button>`).join('') +
  `<button class="chip" type="button" data-rot aria-pressed="false"><span class="dot" aria-hidden="true"></span>nur mit Ampel</button>`;
const items = [];
catList.innerHTML = REG.map(r => {
  const groups = r.gruppen.map(([g]) => {
    const arts = D.artikel.filter(a => a.r === r.id && a.g === g);
    const lfo = D.lf.find(l => 'LF' + l.n === g) || {};
    const label = r.id === 'lf' ? lfo.k + ' ' + (lfo.titel || '') : g;
    return `<details class="cat-group" data-g="${esc(g)}"><summary><span>${esc(label)}</span><span class="n"><span class="cnt">${arts.length}</span>${CHEV}</span></summary><ul>` +
      arts.map(a => `<li data-i="${D.artikel.indexOf(a)}"><a href="${artUrl(a)}">${a.rot ? '<span class="dot" aria-label="mit Ampel" role="img"></span>' : '<span class="nodot"></span>'}<span class="t">${esc(a.t)}</span><span class="st" data-p="${esc(pathOf(a))}"></span></a></li>`).join('') +
      `</ul></details>`;
  }).join('');
  return `<div class="cat-regal" data-r="${r.id}"><h3>${esc(r.name)} <small class="rc"></small></h3><div class="cat-groups">${groups}</div></div>`;
}).join('');
$$('li[data-i]', catList).forEach(li => {
  const a = D.artikel[+li.dataset.i];
  const grp = li.closest('details').querySelector('summary span').textContent;
  items.push({ li, a, t: $('.t', li), hay: norm(a.t + ' ' + grp + ' ' + REG.find(r => r.id === a.r).name) });
});
function hl(text, words){
  if (!words.length) return esc(text);
  const n = norm(text);
  const marks = new Array(text.length).fill(false);
  words.forEach(w => { let i = n.indexOf(w); while (i > -1) { for (let k = i; k < i + w.length && k < marks.length; k++) marks[k] = true; i = n.indexOf(w, i + w.length); } });
  let out = '', open = false;
  for (let i = 0; i < text.length; i++) {
    if (marks[i] && !open) { out += '<mark>'; open = true; }
    if (!marks[i] && open) { out += '</mark>'; open = false; }
    out += esc(text[i]);
  }
  return out + (open ? '</mark>' : '');
}
function applyFilter(){
  const words = norm(state.q).split(/\s+/).filter(Boolean);
  let shown = 0;
  items.forEach(it => {
    const ok = (state.regal === 'all' || it.a.r === state.regal) && (!state.rot || it.a.rot) && words.every(w => it.hay.includes(w));
    it.li.hidden = !ok;
    if (ok) shown++;
    it.t.innerHTML = hl(it.a.t, words);
  });
  $$('.cat-group', catList).forEach(d => {
    const vis = $$('li[data-i]:not([hidden])', d).length;
    d.hidden = !vis;
    $('.cnt', d).textContent = vis;
    if (state.group) d.open = d.dataset.g === state.group;
    else d.open = !!(words.length || state.rot) && vis > 0;
  });
  $$('.cat-regal', catList).forEach(s => {
    const vis = $$('li[data-i]:not([hidden])', s).length;
    s.hidden = !vis;
    $('.rc', s).textContent = nArt(vis);
  });
  $$('.chip[data-r]', chipsEl).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.r === state.regal)));
  $('.chip[data-rot]', chipsEl).setAttribute('aria-pressed', String(state.rot));
  $('#catCount').textContent = shown === D.artikel.length ? `Alle ${shown} Artikel` : `${nArt(shown)} von ${D.artikel.length}`;
  $('#catEmpty').hidden = shown > 0;
}
chipsEl.addEventListener('click', e => {
  const c = e.target.closest('.chip');
  if (!c) return;
  state.group = null;
  if ('rot' in c.dataset) state.rot = !state.rot;
  else state.regal = c.dataset.r;
  applyFilter();
});
let qt = 0;
qIn.addEventListener('input', () => { clearTimeout(qt); qt = setTimeout(() => { state.q = qIn.value; state.group = null; applyFilter(); }, 90); });
applyFilter();

/* Sanftes Scrollen */
let lenis = null;
if (window.Lenis && !reduce.matches) {
  const coarse = matchMedia('(pointer:coarse)').matches;
  try { lenis = window.FIAE.lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, autoResize: true, syncTouch: coarse, syncTouchLerp: 0.09, touchInertiaExponent: 1.7, allowNestedScroll: true }); } catch(e) { lenis = null; }
}
function scrollToEl(el, center){
  if (!el) return;
  const off = center ? -(innerHeight - el.offsetHeight) / 2 : -88;
  if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.4 });
  else el.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: center ? 'center' : 'start' });
}
window.FIAE.scrollTo = scrollToEl;
window.FIAE.openTile = id => {
  const li = document.getElementById(id);
  if (!li) return;
  setOpen(li, true);
  scrollToEl(li, true);
  li.classList.remove('flash'); void li.offsetWidth; li.classList.add('flash');
};
$('#legend').addEventListener('click', e => {
  const b = e.target.closest('[data-tile]');
  if (b) window.FIAE.openTile(b.dataset.tile);
});
function showInCatalog(spec){
  const [kind, val] = spec.split(':');
  clearTimeout(qt); state.q = ''; qIn.value = ''; state.rot = false;
  if (kind === 'r') { state.regal = val; state.group = null; }
  else { state.regal = 'lf'; state.group = 'LF' + val; }
  applyFilter();
  if (!state.group) { requestAnimationFrame(() => scrollToEl($('#katalog'), false)); return; }
  const target = $(`.cat-group[data-g="${state.group}"]`, catList);
  const tools = $('.cat-tools');
  requestAnimationFrame(() => {
    const sticky = getComputedStyle(tools).position === 'sticky';
    const off = -(sticky ? tools.offsetHeight + 80 : 88);
    if (lenis) lenis.scrollTo(target, { offset: off, duration: 1.4 });
    else window.scrollTo({ top: target.getBoundingClientRect().top + scrollY + off, behavior: reduce.matches ? 'auto' : 'smooth' });
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cat]');
  if (b) { e.preventDefault(); showInCatalog(b.dataset.cat); return; }
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').startsWith('#/')) return;
  if (window.FIAE.sheetOpen && window.FIAE.closeSheet) window.FIAE.closeSheet();
  const id = a.getAttribute('href').slice(1);
  if (a.dataset.open) { e.preventDefault(); window.FIAE.openTile(a.dataset.open); return; }
  const el = id === 'main' ? document.body : document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  if (id === 'main') { lenis ? lenis.scrollTo(0, { duration: 1.4 }) : scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' }); }
  else scrollToEl(el, false);
  if (a.dataset.focus) setTimeout(() => $('#' + a.dataset.focus).focus({ preventScroll: true }), reduce.matches ? 0 : 1100);
  if (id !== 'main') history.replaceState(null, '', '#' + id);
});

/* Lernstand sichtbar machen: Katalog, Ranke-Text, Weiterlesen */
const ST_TXT = ['', 'gelesen', 'sitzt'];
function paintStand(){
  $$('#catList .st').forEach(el => { const v = Stand.get(el.dataset.p); el.textContent = ST_TXT[v]; el.className = 'st s' + v; });
  const c = Stand.count();
  $('#standLine').innerHTML = `Dein Stand: <b>${c.gelesen}</b> von ${D.artikel.length} gelesen, <b>${c.sitzt}</b> sitzen.`;
  const last = Stand.recent()[0], la = last && window.FIAE.byPath(last);
  const res = $('#resume');
  if (la) { res.hidden = false; res.href = artUrl(la); $('#resumeT').textContent = la.t; } else res.hidden = true;
  if (window.FIAE.tree) drawTreeSvg(window.FIAE.tree);
}
paintStand();
addEventListener('fiae-stand', paintStand);

/* Hinweisfeld */
const toast = $('#toast'), toastText = $('#toastText'), toastBtn = $('#toastBtn');
let toastTimer = 0;
function showToast(text, action, onAction, ms){
  clearTimeout(toastTimer);
  toastText.textContent = text;
  toastBtn.hidden = !action;
  toastBtn.textContent = action || '';
  toastBtn.onclick = onAction ? () => { hideToast(); onAction(); } : null;
  toast.hidden = false;
  if (ms) toastTimer = setTimeout(hideToast, ms);
}
function hideToast(){ toast.hidden = true; }
$('#toastX').addEventListener('click', hideToast);
window.FIAE.toast = showToast;

/* App: Service Worker (offline und Updates), Installieren, Hinweis bei fehlendem Netz */
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  const hadController = !!navigator.serviceWorker.controller;
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      const offer = w => showToast('Es gibt eine neue Version der App.', 'Neu laden', () => w.postMessage('skipWaiting'));
      if (reg.waiting && hadController) offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); });
      });
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(e => console.warn('Service Worker nicht angemeldet:', e));
  });
  /* Erst nach "Neu laden" wechselt der Service Worker; beim allerersten Besuch nicht neu laden */
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true; location.reload();
  });
}
let installEvt = null;
const installBtns = $$('[data-install]');
addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installEvt = e;
  installBtns.forEach(b => { b.hidden = standalone; });
});
installBtns.forEach(b => b.addEventListener('click', async () => {
  if (!installEvt) return;
  installEvt.prompt();
  try { await installEvt.userChoice; } catch (e) {}
  installEvt = null;
  installBtns.forEach(x => { x.hidden = true; });
}));
addEventListener('appinstalled', () => {
  installBtns.forEach(b => { b.hidden = true; });
  showToast('Die App liegt jetzt auf deinem Startbildschirm.', null, null, 5000);
});
addEventListener('offline', () => showToast('Du bist offline. Die App läuft weiter, Links zu GitHub gehen erst wieder mit Netz.', null, null, 7000));
addEventListener('online', () => showToast('Wieder online.', null, null, 2500));

/* Kopfleiste */
const top = $('#top');
function updateTop(){ top.classList.toggle('solid', scrollY > 40); }

/* Mauszeiger-Ring */
const cur = $('#cursor');
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce.matches;
let cx = -100, cy = -100, rx = -100, ry = -100;
if (fine) {
  addEventListener('pointermove', e => {
    cx = e.clientX; cy = e.clientY; cur.classList.add('on');
    const hot = e.target.closest && e.target.closest('a,button,summary,.cover');
    cur.classList.toggle('big', !!hot || !!window.FIAE.hoverBlock);
  }, { passive: true });
  document.addEventListener('pointerleave', () => cur.classList.remove('on'));
}

/* Eine gemeinsame Schleife für Scrollen, Kopf und Ring. Läuft vor den 3D-Schleifen, damit beide dieselbe Scrollposition sehen. */
function loop(t){
  if (lenis) lenis.raf(t);
  updateTop();
  if (fine) {
    rx += (cx - rx) * 0.2; ry += (cy - ry) * 0.2;
    cur.style.transform = `translate(${rx}px,${ry}px)`;
    if (window.FIAE.hoverBlock) cur.classList.add('big');
  }
  requestAnimationFrame(loop);
}
updateTop();
requestAnimationFrame(loop);
})();
