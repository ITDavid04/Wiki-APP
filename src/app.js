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

/* Daten: aus dem Wiki erzeugt (tools/catalog.mjs), nichts von Hand */
const D = JSON.parse($('#catalog').textContent);
const REG = D.regale;
const share = r => r.n ? r.rot / r.n : 0;
window.FIAE = { D, REG, version: root.dataset.version, scrollTo: null, openTile: null, loadStep: null, tree: null, relayoutTree: null, hoverBlock: false, tip: null, sheetOpen: false, closeSheet: null, lenis: null };

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
/* Biene: Zeichen für "gelesen", schaut nach links. In einem Feld von 24 mal 24, Flügel mit Klasse w (flattern beim Einflug) */
const BEE_G = '<g class="w"><ellipse cx="11" cy="7.2" rx="3.2" ry="4.3" transform="rotate(-18 11 7.2)" fill="#F4FBFF" fill-opacity=".9" stroke="#0F1A15" stroke-width="1.1"/></g>' +
  '<g class="w"><ellipse cx="14.8" cy="7.6" rx="2.8" ry="3.8" transform="rotate(16 14.8 7.6)" fill="#F4FBFF" fill-opacity=".9" stroke="#0F1A15" stroke-width="1.1"/></g>' +
  '<path d="M19.6 14l2.6-.9-.9 2.2z" fill="#0F1A15"/>' +
  '<ellipse cx="13" cy="14.5" rx="7" ry="5" fill="#E2F06A"/>' +
  '<path d="M12.4 9.7v9.6M15.9 10.1v8.8" stroke="#0F1A15" stroke-width="2"/>' +
  '<ellipse cx="13" cy="14.5" rx="7" ry="5" fill="none" stroke="#0F1A15" stroke-width="1.3"/>' +
  '<circle cx="5.4" cy="13.6" r="2.9" fill="#0F1A15"/>';
const BEE = `<svg class="bee" viewBox="0 0 24 24" aria-hidden="true">${BEE_G}</svg>`;
/* Lernstand im Text: Biene ab gelesen, bei sitzt mit Wort */
const stMark = v => v ? BEE + (v === 2 ? 'sitzt' : '<span class="sr">gelesen</span>') : '';
Object.assign(window.FIAE, { stand: Stand, pathOf, artUrl, LEAF, BEE, BEE_G, stMark, byPath: p => D.artikel[idxByPath.get(p)], indexOfPath: p => idxByPath.get(p) });

/* Erfolge: ein Lernfeld ist geschafft, wenn es Artikel hat und alle sitzen. Das wird immer aus dem Lernstand berechnet.
   Gemerkt wird nur, was schon gefeiert wurde (Lernfeld: Zahl seiner Artikel beim Feiern). So kommt die Feier nicht bei jedem
   Laden, aber wieder, wenn ein neuer Artikel dazukam und das Lernfeld erneut geschafft ist. Bleibt auch nur auf dem Gerät. */
const ERFOLG_KEY = 'lernwiki-erfolge-v1';
const lfArts = new Map(D.lf.map(l => [l.n, D.artikel.filter(a => a.lf === l.n)]));
const lfZiel = D.lf.filter(l => lfArts.get(l.n).length);
let gefeiert = {};
try { gefeiert = JSON.parse(store.get(ERFOLG_KEY) || '{}') || {}; } catch (e) { gefeiert = {}; }
const Erfolg = {
  ziel: lfZiel,
  of(n){ const arts = lfArts.get(n) || []; return { sitzt: arts.filter(a => Stand.get(pathOf(a)) === 2).length, n: arts.length }; },
  done(n){ const k = this.of(n); return k.n > 0 && k.sitzt === k.n; },
  list(){ return lfZiel.filter(l => this.done(l.n)); }
};
window.FIAE.erfolg = Erfolg;

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
$('#footVersion').textContent = 'Version ' + root.dataset.version;
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
const posterI = $$('#posterStage i');

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
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden && !$('dialog[open]')) { setMenu(false); menuBtn.focus(); } });
document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('#menu')) setMenu(false); });
menu.addEventListener('click', e => { if (e.target.closest('a,[data-melden]')) setMenu(false); });

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
      const lfo = r.id === 'lf' ? D.lf.find(l => 'LF' + l.n === g) : null;
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
      return { g, s0, pts: sp, len: Ls, leaves, lf: lfo ? lfo.n : null };
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
  /* Blüte an der Triebspitze eines geschafften Lernfelds */
  const bloom = ([x, y], s, n) => {
    let o = '';
    for (let k = 0; k < 5; k++) o += `<path d="${leafD(s)}" fill="#E2F06A" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(k * 72 + n * 57) % 360})"/>`;
    /* daneben sitzt eine Biene */
    return o + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(s * 0.3).toFixed(1)}" fill="#F2C14E"/>` +
      `<g transform="translate(${(x + s * 0.75).toFixed(1)} ${(y - s * 1.35).toFixed(1)}) scale(${(s * 0.8 / 24).toFixed(3)})">${BEE_G}</g>`;
  };
  let out = line(T.trunk, 7, '#2C7A50');
  T.twigs.forEach(t => {
    out += line(t.pts, 3.2, '#2C7A50');
    t.sprigs.forEach(sp => {
      out += line(sp.pts, 1.6, '#2C7A50');
      sp.leaves.forEach((l, k) => {
        out += `<path d="${leafD(l.size)}" fill="${LEAF[Stand.get(pathOf(D.artikel[l.ai]))]}" transform="translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${(l.ang * 180 / Math.PI).toFixed(1)})"/>`;
        if (l.rot) out += `<circle cx="${l.x.toFixed(1)}" cy="${l.y.toFixed(1)}" r="${(l.size * 0.16).toFixed(1)}" fill="#E5483A"/>`;
      });
      if (sp.lf && Erfolg.done(sp.lf)) out += bloom(sp.pts[sp.pts.length - 1], T.leafBase * 1.3, sp.lf);
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
  /* tabindex -1: per Tastatur führt die Legende zu denselben Kacheln */
  labelsEl.innerHTML = T.twigs.map(t =>
    `<button type="button" tabindex="-1" data-tile="r-${t.r.id}" class="twig-lab micro${t.label.side > 0 ? ' l' : ''}" style="left:${t.label.x.toFixed(1)}px;top:${t.label.y.toFixed(1)}px">${esc(t.r.kurz)} <b>${t.r.n}</b></button>`
  ).join('');
  T.labels = [...labelsEl.children];
  drawTreeSvg(T);
  return T;
}
window.FIAE.relayoutTree = relayoutTree;
relayoutTree();

/* Zweig unter dem Zeiger (Bildschirmkoordinaten): Regal-id oder null. Zählt Zweig und Triebe, nicht den Stamm.
   Mit 3D nur Zweige, die schon gewachsen sind (ihre Beschriftung ist dann sichtbar). */
function twigAt(px, py, tol = 14){
  const T = window.FIAE.tree;
  if (!T) return null;
  const A = $('#a-ranke').getBoundingClientRect();
  const x = px - A.left, y = py - A.top;
  if (x < -tol || y < -tol || x > A.width + tol || y > A.height + tol) return null;
  const gl = root.classList.contains('gl-vine');
  let best = null, bd = tol * tol;
  T.twigs.forEach((t, i) => {
    if (gl && !T.labels[i].classList.contains('on')) return;
    for (const pts of [t.pts, ...t.sprigs.map(s => s.pts)]) {
      for (let k = 1; k < pts.length; k++) {
        const [ax, ay] = pts[k - 1], [bx, by] = pts[k];
        const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
        const u = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
        const d = (ax + u * dx - x) ** 2 + (ay + u * dy - y) ** 2;
        if (d < bd) { bd = d; best = t.r.id; }
      }
    }
  });
  return best;
}
window.FIAE.twigAt = twigAt;
/* Zweig hervorheben (Beschriftung und Mauszeiger), wird auch von der 3D-Ranke benutzt */
let twigHot = null;
window.FIAE.hotTwig = id => {
  if (id === twigHot) return;
  twigHot = id;
  (window.FIAE.tree.labels || []).forEach(l => l.classList.toggle('hot', l.dataset.tile === 'r-' + id));
  $('#a-ranke').classList.toggle('twig-hot', !!id);
};
labelsEl.addEventListener('click', e => {
  const b = e.target.closest('[data-tile]');
  if (b) window.FIAE.openTile(b.dataset.tile);
});
/* Ohne 3D (Standbild) übernimmt die Seite Klick und Hervorheben selbst */
$('#a-ranke').addEventListener('click', e => {
  if (root.classList.contains('gl-vine') || e.target.closest('button')) return;
  const id = twigAt(e.clientX, e.clientY, e.pointerType === 'touch' ? 22 : 14);
  if (id) window.FIAE.openTile('r-' + id);
});
$('#a-ranke').addEventListener('pointermove', e => {
  if (!root.classList.contains('gl-vine')) window.FIAE.hotTwig(e.pointerType === 'touch' ? null : twigAt(e.clientX, e.clientY));
}, { passive: true });
$('#a-ranke').addEventListener('pointerleave', () => { if (!root.classList.contains('gl-vine')) window.FIAE.hotTwig(null); });
let rt = 0;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const before = window.FIAE.tree; relayoutTree(); if (window.FIAE.tree !== before) window.dispatchEvent(new Event('fiae-tree')); }, 160); });

/* Kacheln */
const CHECK = '<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const RING = '<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-dasharray="3.4 3.4"/></svg>';
const UP = '<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARR = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const nArt = n => n === 1 ? '1 Artikel' : `${n} Artikel`;
const ampelText = (rot, n) => !n ? 'noch keine Artikel' : rot ? `${rot} von ${n} mit Prüfungs-Ampel` : 'ohne Ampel, zum Stöbern und Vertiefen';

function cover(id, nr, title, label, pill, extra = ''){
  return `<button class="cover" type="button" aria-expanded="false" aria-controls="d-${id}" aria-label="${esc(label)}. Kachel aufdecken">` +
    `<span class="c-nr" aria-hidden="true">${nr}</span>${extra}` +
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
    cover(li.id, String(i + 1).padStart(2, '0'), r.name, `Abteilung ${r.name}, ${nArt(r.n)}`, pill) +
    `<div class="detail" id="d-${li.id}">` +
      `<div class="d-top"><span class="d-nr">Abteilung ${String(i + 1).padStart(2, '0')}</span>${pill}</div>` +
      `<h3>${esc(r.name)}</h3>` +
      `<p class="sub">${esc(r.sub)}</p>` +
      `<div class="meter"><div class="bar"><i style="--w:${Math.round(share(r) * 100)}%"></i></div><span>${ampelText(r.rot, r.n)}</span></div>` +
      `<ul class="gchips">${r.gruppen.map(([g, n]) => `<li>${esc(g)}<b>${n}</b></li>`).join('')}</ul>` +
      `<button class="tlink" type="button" data-cat="r:${r.id}">Im Katalog zeigen ${ARR}</button>` +
    `</div>`;
  tilesReg.appendChild(li);
});

const tilesLf = $('#tilesLf');
const lfPill = n => `<span class="pill ok">${CHECK}${nArt(n)}</span>`;
D.lf.forEach(l => {
  const li = document.createElement('li');
  li.className = 'tile reveal' + (l.a ? ' full' : '');
  li.id = 'lf' + l.n;
  const arts = D.artikel.filter(a => a.lf === l.n);
  const pill = l.a ? lfPill(l.a) : `<span class="pill wip">${RING}noch leer</span>`;
  const body = l.a
    ? `<ul class="alist">${arts.slice(0, 4).map(a => `<li><a href="${artUrl(a)}" title="${esc(a.t)}">${esc(a.t)}</a></li>`).join('')}</ul>` +
      `<button class="tlink" type="button" data-cat="lf:${l.n}">${l.a > 4 ? `Alle ${l.a} im Katalog` : 'Im Katalog zeigen'} ${ARR}</button>`
    : `<p class="empty-note">Hier liegt noch nichts. Magst du den ersten Artikel schreiben?</p>` +
      `<a class="tlink" href="#mitmachen">So machst du mit ${ARR}</a>`;
  li.innerHTML =
    cover(li.id, String(l.n).padStart(2, '0'), l.titel, `${l.k} ${l.titel}, ${l.a ? nArt(l.a) : 'noch leer'}`, pill,
      l.a ? `<span class="c-done" aria-hidden="true">${CHECK}<span>geschafft</span></span>` : '') +
    `<div class="detail" id="d-${li.id}">` +
      `<div class="d-top"><span class="d-nr">${l.k}</span>${l.a ? `<span class="lf-st">${pill}</span>` : pill}</div>` +
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
/* regal: null = nichts gewählt, dann bleibt die Liste zu, bis jemand sucht oder filtert */
const state = { regal: null, rot: false, q: '', group: null };
const CHEV = '<svg class="chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
chipsEl.innerHTML =
  `<button class="chip" type="button" data-r="all" aria-pressed="false">Alle</button>` +
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
  const active = state.regal !== null || state.rot || words.length > 0;
  let shown = 0;
  items.forEach(it => {
    const ok = (!state.regal || state.regal === 'all' || it.a.r === state.regal) && (!state.rot || it.a.rot) && words.every(w => it.hay.includes(w));
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
  catList.hidden = !active;
  $('#catCount').textContent = !active ? `${D.artikel.length} Artikel. Tipp ein Stichwort oder wähl eine Abteilung.`
    : shown === D.artikel.length ? `Alle ${shown} Artikel` : `${nArt(shown)} von ${D.artikel.length}`;
  $('#catEmpty').hidden = !active || shown > 0;
}
chipsEl.addEventListener('click', e => {
  const c = e.target.closest('.chip');
  if (!c) return;
  state.group = null;
  if ('rot' in c.dataset) state.rot = !state.rot;
  else state.regal = state.regal === c.dataset.r ? null : c.dataset.r;
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
$('.stand-box .tlink').insertAdjacentHTML('afterbegin', BEE);
function paintStand(){
  $$('#catList .st').forEach(el => { const v = Stand.get(el.dataset.p); if (el.className !== 'st s' + v) { el.innerHTML = stMark(v); el.className = 'st s' + v; } });
  const c = Stand.count();
  $('#standLine').innerHTML = `Dein Stand: ${BEE}<b>${c.gelesen}</b> von ${D.artikel.length} gelesen, <b>${c.sitzt}</b> sitzen.`;
  const last = Stand.recent()[0], la = last && window.FIAE.byPath(last);
  const res = $('#resume');
  if (la) { res.hidden = false; res.href = artUrl(la); $('#resumeT').textContent = la.t; } else res.hidden = true;
  if (window.FIAE.tree) drawTreeSvg(window.FIAE.tree);
  paintErfolg();
}
/* Geschaffte Lernfelder: Stempel auf der Kachel, Stand oben im Detail, Häkchen am Würfel im Standbild */
function paintErfolg(){
  D.lf.forEach((l, i) => {
    const k = Erfolg.of(l.n), li = document.getElementById('lf' + l.n);
    if (!k.n || !li) return;
    const done = k.sitzt === k.n;
    li.classList.toggle('done', done);
    $('.cover', li).setAttribute('aria-label', `${l.k} ${l.titel}, ${nArt(k.n)}${done ? ', geschafft' : ''}. Kachel aufdecken`);
    $('.lf-st', li).innerHTML = done ? `<span class="pill done">${CHECK}${k.n === 1 ? 'sitzt' : `alle ${k.n} sitzen`}</span>`
      : k.sitzt ? `<span class="pill part">${k.sitzt} von ${k.n} sitzen</span>` : lfPill(k.n);
    if (posterI[i]) posterI[i].classList.toggle('done', done);
  });
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

/* Ansage für Screenreader: in der offenen Seite über deren Region, sonst über die auf der Startseite.
   Was im selben Moment kommt (Biene und Lernfeld), wird zu einer Ansage zusammengefasst. */
let sayBuf = [], sayT = 0;
function say(text){
  sayBuf.push(text);
  clearTimeout(sayT);
  sayT = setTimeout(() => {
    const live = window.FIAE.sheetOpen ? $('#sheetLive') : $('#erfolgLive'), t = sayBuf.join(' ');
    sayBuf = []; live.textContent = '';
    setTimeout(() => { live.textContent = t; }, 40);
  }, 80);
}

/* Bienen: Jeder Artikel, der gelesen ist oder sitzt, hat eine Biene (aus dem Lernstand). Herbeifliegen tut sie nur einmal
   je Artikel, beim ersten Gelesen oder Sitzt; gemerkt in lernwiki-bienen-v1. Wiederherstellen fliegt nicht, Zurücksetzen vergisst. */
const BIENEN_KEY = 'lernwiki-bienen-v1';
let bienen = {};
try { bienen = JSON.parse(store.get(BIENEN_KEY) || '{}') || {}; } catch (e) { bienen = {}; }
window.FIAE.biene = { neu: p => !bienen[p] };
addEventListener('fiae-stand', e => {
  const p = e.detail && e.detail.p;
  if (!p) {
    const all = Object.keys(Stand.all());
    if (!all.length) bienen = {}; else all.forEach(q => { bienen[q] = bienen[q] || 1; });
    store.set(BIENEN_KEY, JSON.stringify(bienen));
    return;
  }
  if (!(e.detail.s >= 1) || bienen[p]) return;
  bienen[p] = Date.now();
  store.set(BIENEN_KEY, JSON.stringify(bienen));
  say('Eine Biene für diesen Artikel.');
  /* erst nach dem Neuzeichnen der offenen Seite: dort steht die Biene, zu der sie fliegt */
  requestAnimationFrame(() => beeFly(document.querySelector(`#sheet [data-bee="${CSS.escape(p)}"] .bee`)));
});
/* Biene fliegt vom rechten Rand in Schleifen zu ihrem Platz. Liegt der gerade außerhalb, wartet sie, bis er ins Bild kommt.
   Bei reduzierter Bewegung sitzt sie einfach da. */
function beeFly(target){
  if (!target || reduce.matches) return;
  const fly = () => {
    const r = target.getBoundingClientRect();
    if (!r.width) { target.style.visibility = ''; return; }
    const el = document.createElement('div');
    el.className = 'bee-fly';
    el.innerHTML = BEE;
    el.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
    document.body.appendChild(el);
    const x0 = innerWidth + 40 - r.left, y0 = -90 - Math.random() * 90;
    const anim = el.animate([
      { transform: `translate(${x0}px,${y0}px) rotate(-8deg) scale(1.9)` },
      { transform: `translate(${x0 * 0.62}px,${y0 * 0.15 + 34}px) rotate(10deg) scale(1.9)`, offset: 0.3 },
      { transform: `translate(${x0 * 0.3}px,${y0 * 0.75}px) rotate(-14deg) scale(1.8)`, offset: 0.58 },
      { transform: 'translate(-26px,-30px) rotate(8deg) scale(1.5)', offset: 0.8 },
      { transform: 'translate(0,0) rotate(0) scale(1)' }
    ], { duration: 1400, easing: 'cubic-bezier(.35,.1,.3,1)' });
    anim.onfinish = anim.oncancel = () => { target.style.visibility = ''; el.remove(); };
  };
  target.style.visibility = 'hidden';
  const r = target.getBoundingClientRect();
  if (r.top >= 0 && r.bottom <= innerHeight) { fly(); return; }
  const io = new IntersectionObserver(es => { if (es[0].intersectionRatio >= 0.99) { io.disconnect(); fly(); } }, { threshold: 1 });
  io.observe(target);
}

/* Feier, wenn ein Lernfeld geschafft ist: nur beim Wechsel von offen auf geschafft durch einen Klick (Stand.set mit p).
   Laden, Wiederherstellen und Zurücksetzen (Stand.replace, ohne p) feiern nicht; Zurücksetzen vergisst auch die Feiern.
   Hört nach den Bienen zu, damit die Ansage mit der Biene beginnt. */
const fest = $('#erfolg'), festBurst = $('#erfolgBurst');
const FEST_COL = [LEAF[1], LEAF[2], '#4BAF73', '#E2F06A', '#E2F06A'];
let doneNow = new Set(Erfolg.list().map(l => l.n));
const merk = (key, n) => { gefeiert[key] = n; store.set(ERFOLG_KEY, JSON.stringify(gefeiert)); };
addEventListener('fiae-stand', e => {
  const before = doneNow;
  doneNow = new Set(Erfolg.list().map(l => l.n));
  const alle = doneNow.size === lfZiel.length;
  const p = e.detail && e.detail.p;
  if (!p) {
    if (!Object.keys(Stand.all()).length) { gefeiert = {}; store.set(ERFOLG_KEY, '{}'); return; }
    doneNow.forEach(n => { const k = Erfolg.of(n).n; if ((gefeiert[n] || 0) < k) merk(n, k); });
    if (alle) merk('alle', lfZiel.length);
    return;
  }
  const a = window.FIAE.byPath(p), n = a && a.lf;
  if (e.detail.s !== 2 || !doneNow.has(n) || before.has(n)) return;
  const k = Erfolg.of(n).n;
  if ((gefeiert[n] || 0) >= k) return;
  merk(n, k);
  const gesamt = alle && (gefeiert.alle || 0) < lfZiel.length;
  if (gesamt) merk('alle', lfZiel.length);
  feiern(D.lf.find(l => l.n === n), k, gesamt);
});
function feiern(l, k, gesamt){
  festZeigen({
    art: gesamt ? 'gesamt' : 'lf', kicker: gesamt ? `${l.k} war das letzte` : 'Lernfeld geschafft',
    titel: gesamt ? 'Alle Lernfelder geschafft!' : `${l.k} geschafft!`,
    sub: gesamt ? `In allen ${lfZiel.length} Lernfeldern mit Artikeln sitzt jeder Artikel. Viel Erfolg bei der Prüfung!`
      : `${l.titel}: ${k === 1 ? 'der Artikel sitzt' : `alle ${k} Artikel sitzen`}. Stark!`
  });
}
/* Eine Karte für alles. Lernfeld-Feiern kommen sofort (eine neue ersetzt die alte, ein offener Stempel wartet dann wieder).
   Stempel warten, bis die Karte frei ist und keine Biene mehr fliegt; was dann wartet, kommt zusammen auf eine Karte. */
const festQ = [];
let festNow = null, festT = 0;
function festZeigen(item){
  if (item.art !== 'stempel') { festOeffnen(item); return; }
  festQ.push(item.s);
  festWeiter();
}
function festWeiter(){
  clearTimeout(festT);
  if (festNow || !festQ.length) return;
  festT = setTimeout(() => {
    if (festNow || !festQ.length) return;
    if (document.querySelector('.bee-fly')) { festWeiter(); return; }
    festOeffnen({ art: 'stempel', liste: festQ.splice(0) });
  }, document.querySelector('.bee-fly') ? 1500 : 400);
}
const undList = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1];
function festOeffnen(item){
  if (festNow && festNow.art === 'stempel' && item.art !== 'stempel') festQ.unshift(...festNow.liste);
  festNow = item;
  hideToast();
  const st = item.art === 'stempel', gesamt = item.art === 'gesamt', L = item.liste || [];
  const kicker = st ? (L.length === 1 ? 'Neuer Stempel im Leseausweis' : `${L.length} neue Stempel im Leseausweis`) : item.kicker;
  const titel = st ? undList(L.map(s => s.name)) + (L.length === 1 ? '' : '!') : item.titel;
  const sub = st ? L.slice(0, 2).map(s => s.text).join(' ') : item.sub;
  fest.dataset.art = item.art;
  $('#erfolgKicker').textContent = kicker;
  $('#erfolgTitle').textContent = titel;
  $('#erfolgSub').textContent = sub;
  $('#erfolgStand').textContent = st ? 'Zum Leseausweis' : 'Mein Stand';
  const stp = $('#erfolgStempel');
  stp.innerHTML = st ? stempelSvg(L[0], Date.now()) : '';
  if (st) stp.style.cssText = `--c:${stempelFarbe(L[0])};--r:${stempelDreh(L[0])}deg`;
  fest.classList.toggle('gesamt', gesamt);
  fest.classList.toggle('stempelkarte', st);
  fest.hidden = false;
  fest.classList.remove('in'); void fest.offsetWidth; fest.classList.add('in');
  /* Blätter in den Farben der Ranke und gelbe Blütenblätter fliegen aus dem Häkchen, bei reduzierter Bewegung nicht */
  let leaves = '';
  if (!st && !reduce.matches) for (let i = 0, n = gesamt ? 26 : 14; i < n; i++) {
    const w = -Math.PI / 2 + (i / (n - 1) - 0.5) * Math.PI * 0.95 + (Math.random() - 0.5) * 0.25, d = 70 + Math.random() * (gesamt ? 150 : 90);
    leaves += `<i style="--x:${(Math.cos(w) * d).toFixed(0)}px;--y:${(Math.sin(w) * d).toFixed(0)}px;--r:${(Math.random() * 540 - 270).toFixed(0)}deg;--d:${(120 + Math.random() * 160).toFixed(0)}ms;--c:${FEST_COL[i % FEST_COL.length]}"></i>`;
  }
  festBurst.innerHTML = leaves;
  say(`${st ? kicker + ': ' : ''}${titel} ${sub}`);
}
function festZu(){ fest.hidden = true; festBurst.innerHTML = ''; festNow = null; festWeiter(); }
$('#erfolgOk').addEventListener('click', festZu);
/* Bei einem Stempel führt der Knopf zum Leseausweis in Mein Stand (reader.js liest standZiel) */
$('#erfolgStand').addEventListener('click', () => {
  if (festNow && festNow.art === 'stempel') {
    window.FIAE.standZiel = 'ausweis';
    if (location.hash === '#/stand') {
      window.FIAE.standZiel = null;
      const el = document.getElementById('ausweis');
      if (el) el.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    }
  }
  festZu();
});
/* Escape schließt zuerst die Feier, die offene Seite bleibt */
addEventListener('keydown', e => { if (e.key === 'Escape' && !fest.hidden && !$('dialog[open]')) { e.stopImmediatePropagation(); festZu(); } }, true);

/* Leseausweis: Stempel für Meilensteine. Einmal verdient, bleiben sie, mit Datum wie im Leihstempel (lernwiki-stempel-v1);
   nur Zurücksetzen löscht sie. Die meisten werden aus dem Lernstand berechnet, die Lerntage merkt sich lernwiki-tage-v1.
   Neue Stempel durch einen Klick bekommen eine Karte, beim Laden und Wiederherstellen kommen sie still dazu. */
const STEMPEL_KEY = 'lernwiki-stempel-v1', TAGE_KEY = 'lernwiki-tage-v1';
let stempel = {}, tage = [];
try { stempel = JSON.parse(store.get(STEMPEL_KEY) || '{}') || {}; } catch (e) { stempel = {}; }
try { tage = JSON.parse(store.get(TAGE_KEY) || '[]') || []; } catch (e) { tage = []; }
if (!Array.isArray(tage)) tage = [];
const tagOf = t => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const nachts = t => { const h = new Date(t).getHours(); return h >= 22 || h < 5; };
const liest = arts => arts.filter(a => Stand.get(pathOf(a)) >= 1).length;
/* KI: die Sammlung "Anfänger bis Nerd" hat drei Teile (Gruppen), dazu kommen weitere Artikel in der Abteilung */
const kiAlle = D.artikel.filter(a => a.r === 'ki');
const kiTeile = ((REG.find(r => r.id === 'ki') || {}).gruppen || []).map(([g]) => kiAlle.filter(a => a.g === g))
  .filter(arts => arts.length && pathOf(arts[0]).startsWith('KI-Anfänger_bis_Nerd_Die_Sammlung/'));
const nRot = rotAll, nAlle = D.artikel.length;

/* Bilder in der Mitte des Stempels, gezeichnet um den Mittelpunkt, Farbe über currentColor */
const BEE_LINE = '<ellipse cx="13" cy="14.5" rx="6.5" ry="4.6"/><path d="M11.6 10.2v8.6M15.1 10.5v8"/><circle cx="5.6" cy="13.8" r="2.3"/><ellipse cx="11" cy="7.6" rx="2.8" ry="3.6"/><ellipse cx="14.8" cy="8" rx="2.4" ry="3.1"/>';
const bildZahl = n => `<g class="ico" transform="translate(-8 -30) scale(.66)">${BEE_LINE}</g><text class="num${String(n).length > 2 ? ' n3' : ''}" y="13">${n}</text>`;
const bildKi = lv => `<g class="ico"><rect x="-13" y="-19" width="26" height="26" rx="4"/><path d="M-6 -23v4M0 -23v4M6 -23v4M-6 7v4M0 7v4M6 7v4M-17 -12h4M-17 -6h4M-17 0h4M13 -12h4M13 -6h4M13 0h4"/></g>` +
  `<text class="ki" y="-2">KI</text>` + [...Array(lv)].map((_, i) => `<circle class="dot" cx="${(i - (lv - 1) / 2) * 7}" cy="20" r="2.3"/>`).join('');
const bildBluete = `<g class="ico">${[0, 72, 144, 216, 288].map(a => `<ellipse cy="-11" rx="6" ry="9.5" transform="rotate(${a})"/>`).join('')}<circle r="4.5" class="f"/></g>`;
const bildAmpel = '<g class="ico"><rect x="-9" y="-22" width="18" height="44" rx="6"/><circle cy="-11" r="4.4" class="f"/><circle r="4.4"/><circle cy="11" r="4.4"/></g>';
const bildTage = n => `<g class="ico"><rect x="-17" y="-16" width="34" height="32" rx="4"/><path d="M-17 -6h34M-9 -21v8M9 -21v8"/></g><text class="num2" y="11">${n}</text>`;
const bildDiskette = '<g class="ico"><path d="M-16 -16h24l8 8v24h-32z"/><path d="M-9 -16v10h14v-10"/><rect x="-10" y="4" width="20" height="12"/></g>';
const bildOffline = '<g class="ico"><path d="M-18 -4a26 26 0 0 1 36 0M-12 3a17 17 0 0 1 24 0M-6 10a8 8 0 0 1 12 0"/><circle cy="16" r="1.8" class="f"/><path d="M-17 -16L17 20"/></g>';
const bildEule = '<g class="ico"><path d="M-14 -9l-3-11 9 5h16l9-5-3 11v11a14 14 0 0 1-28 0z"/><circle cx="-6" cy="-3" r="5"/><circle cx="6" cy="-3" r="5"/><circle cx="-6" cy="-3" r="1.7" class="f"/><circle cx="6" cy="-3" r="1.7" class="f"/><path d="M-2 4l2 3 2-3"/></g>';

/* Die Stempel. wert liefert [geschafft, nötig] für den Fortschritt; ohne wert vergibt die App sie bei einer Handlung */
const ST = (id, name, farbe, bild, text, offen, wert) => ({ id, name, farbe, bild, text, offen, wert });
const STEMPEL = [
  ...[[1, 'Erste Biene', 'Der erste Artikel ist durch, die erste Biene summt. Jede Bibliothek fängt mit einer einzigen Seite an.'],
    [5, 'Kleiner Schwarm', 'Fünf Artikel gelesen. Da summt schon was.'],
    [10, 'Bienenstock', 'Zehn Artikel. Du baust dir gerade einen ganzen Stock voller Wissen.'],
    [25, 'Fleißige Biene', '25 Artikel gelesen. Fleißig ist hier keine Floskel, das ist Statistik.'],
    [75, 'Ganzes Volk', '75 Artikel. Ein ganzes Bienenvolk arbeitet jetzt für dich.'],
    [100, 'Honigernte', 'Dreistellig! 100 Artikel gelesen. Zeit, den Honig zu ernten.'],
    [nAlle, 'Bücherwurm mit Flügeln', `Alle ${nAlle} Artikel gelesen. Aus dem Bücherwurm ist eine Biene geworden, und die ganze Bibliothek verneigt sich.`]
  ].map(([n, name, text], i, all) => ST(i === all.length - 1 ? 'balle' : 'b' + n, name, 'honig', bildZahl(n), text,
    n === 1 ? 'Lies deinen ersten Artikel bis zum Ende.' : `Lies ${n} Artikel.`, () => [Stand.count().gelesen, n])),
  ST('ki1', 'KI-Anfänger', 'gruen', bildKi(1), 'Teil 1 der KI-Sammlung ist durch. Du weißt jetzt, was KI ist, was sie kann und wo sie flunkert.',
    'Lies Teil 1 der KI-Sammlung „Anfänger bis Nerd“.', () => [liest(kiTeile[0] || []), (kiTeile[0] || [0]).length]),
  ST('ki3', 'KI-Profi', 'gruen', bildKi(2), `Alle ${kiTeile.length} Teile der KI-Sammlung sind durch. Du redest nicht mehr nur über KI, du weißt, was unter der Haube passiert.`,
    `Lies alle ${kiTeile.length} Teile der KI-Sammlung.`, () => [kiTeile.filter(arts => liest(arts) === arts.length).length, kiTeile.length]),
  ST('kinerd', 'KI-Nerd', 'gruen', bildKi(3), `Die ganze Abteilung KI, alle ${kiAlle.length} Artikel, bis zum eigenen Recherche-Agent. Von Anfänger bis Nerd, genau wie versprochen.`,
    `Lies alle ${kiAlle.length} Artikel der Abteilung KI.`, () => [liest(kiAlle), kiAlle.length]),
  ST('lf', 'Erstes Lernfeld', 'gruen', bildBluete, 'Ein ganzes Lernfeld sitzt. An deiner Ranke ist die erste Blüte aufgegangen, und die Bienen haben es schon gemerkt.',
    'Bring alle Artikel eines Lernfelds auf Sitzt.', () => [Erfolg.list().length, 1]),
  ST('pruef', 'Prüfungsreif', 'rot', bildAmpel, `Alle ${nRot} Artikel mit Ampel sitzen. Rot ist jetzt offiziell deine Lieblingsfarbe. Die IHK kann kommen.`,
    `Bring alle ${nRot} Artikel mit Ampel auf Sitzt.`, () => [Stand.count(a => a.rot).sitzt, nRot]),
  ST('t7', 'Dranbleiber', 'gruen', bildTage(7), 'An 7 verschiedenen Tagen gelernt. Steter Tropfen höhlt den Stein und füllt den Kopf.',
    'Lerne an 7 verschiedenen Tagen.', () => [tage.length, 7]),
  ST('t15', 'Dauerbrenner', 'gruen', bildTage(15), '15 Lerntage. Das ist keine Phase mehr, das ist eine Gewohnheit.',
    'Lerne an 15 verschiedenen Tagen.', () => [tage.length, 15]),
  ST('backup', 'Backup-Profi', 'blau', bildDiskette, 'Lernstand gesichert. Unter Admins gilt: Kein Backup, kein Mitleid. Du brauchst zum Glück keins.',
    'Sichere deinen Lernstand in Mein Stand.'),
  ST('offline', 'Funkloch-sicher', 'blau', bildOffline, 'Alle Artikel liegen offline auf deinem Gerät. Funkloch im Zug? Dann lernst du eben weiter.',
    'Speichere alle Artikel offline.'),
  ST('eule', 'Nachteule', 'blau', bildEule, 'Nach 22 Uhr noch gelernt, Respekt! Aber Schlaf ist kein Luxus: Nachts sortiert dein Gehirn, was du tagsüber gelernt hast. Also ab ins Bett, die Ranke wartet auch morgen noch.',
    'Lerne nach 22 Uhr. Aber bitte nicht zu oft.')
];
const FARBE = { honig: 'var(--ink-honig)', gruen: 'var(--accent)', rot: 'var(--rot)', blau: 'var(--ink-blau)' };
const stempelFarbe = s => FARBE[s.farbe];
/* jeder Stempel sitzt etwas schief, aber immer gleich schief */
const stempelDreh = s => ([...s.id].reduce((h, c) => h * 31 + c.charCodeAt(0), 7) % 19) - 9;
/* Stempel: zwei Ringe, oben LERN-WIKI, unten das Datum, in der Mitte das Bild. Verdiente bekommen die Tinte (Filter #tinte). */
function stempelSvg(s, t){
  const k = 'sp' + s.id + (t ? 'x' : 'o');
  const datum = t ? new Date(t).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  return `<svg class="stempel-svg" viewBox="-50 -50 100 100" aria-hidden="true"><defs><path id="${k}a" d="M-37 0A37 37 0 0 1 37 0"/><path id="${k}b" d="M-43 0A43 43 0 0 0 43 0"/></defs>` +
    `<g${t ? ' filter="url(#tinte)"' : ''}><circle r="46" class="r1"/><circle r="31" class="r2"/>` +
    `<text class="arc"><textPath href="#${k}a" startOffset="50%">LERN-WIKI</textPath></text>` +
    (t ? `<text class="arc"><textPath href="#${k}b" startOffset="50%">${datum}</textPath></text>` : '') + s.bild + '</g></svg>';
}
function stempelGeben(liste, still){
  store.set(STEMPEL_KEY, JSON.stringify(stempel));
  window.dispatchEvent(new Event('fiae-stempel'));
  if (!still) liste.forEach(s => festZeigen({ art: 'stempel', s }));
}
function stempelPruefen(still){
  const neu = STEMPEL.filter(s => !stempel[s.id] && s.wert && (w => w[0] >= w[1])(s.wert()));
  if (!neu.length) return;
  neu.forEach(s => { stempel[s.id] = Date.now(); });
  stempelGeben(neu, still);
}
function gib(id, still){
  if (stempel[id]) return;
  stempel[id] = Date.now();
  stempelGeben(STEMPEL.filter(s => s.id === id), still);
}
function tagMerk(t){
  const d = tagOf(t);
  if (tage.includes(d)) return;
  tage.push(d); tage.sort();
  store.set(TAGE_KEY, JSON.stringify(tage));
}
/* Lerntage und Nachteule aus dem vorhandenen Lernstand nachtragen (beim Start und nach dem Wiederherstellen), still */
function nachtragen(){
  Object.values(Stand.all()).forEach(v => { if (v && v.t > 0) { tagMerk(v.t); if (nachts(v.t)) gib('eule', true); } });
  stempelPruefen(true);
}
nachtragen();
addEventListener('fiae-stand', e => {
  const p = e.detail && e.detail.p;
  if (!p) {
    if (!Object.keys(Stand.all()).length) {
      stempel = {}; tage = [];
      store.set(STEMPEL_KEY, '{}'); store.set(TAGE_KEY, '[]');
      window.dispatchEvent(new Event('fiae-stempel'));
      return;
    }
    nachtragen();
    return;
  }
  if (e.detail.s >= 1) { const now = Date.now(); tagMerk(now); if (nachts(now)) gib('eule'); }
  stempelPruefen(false);
});
window.FIAE.stempel = {
  liste: STEMPEL, farbe: stempelFarbe, dreh: stempelDreh, svg: stempelSvg, gib,
  alle: () => ({ ...stempel }), tage: () => tage.slice(),
  /* aus einer Sicherung: Stempel (frühestes Datum gewinnt) und Lerntage übernehmen */
  merge(st, tg){
    if (st && typeof st === 'object') for (const [k, v] of Object.entries(st)) {
      if (STEMPEL.some(s => s.id === k) && Number(v) > 0 && (!stempel[k] || stempel[k] > Number(v))) stempel[k] = Number(v);
    }
    if (Array.isArray(tg)) tg.forEach(d => { if (/^\d{4}-\d\d-\d\d$/.test(d) && !tage.includes(d)) tage.push(d); });
    tage.sort();
    store.set(TAGE_KEY, JSON.stringify(tage));
    stempelGeben([], true);
  }
};

/* Nach einem Update einmal sagen, welche Version jetzt läuft (nicht beim ersten Besuch) */
const VERSION_KEY = 'lernwiki-version';
const vorher = store.get(VERSION_KEY);
if (vorher && vorher !== root.dataset.version) {
  const zeig = () => root.classList.contains('is-loading') ? setTimeout(zeig, 300) : showToast(`Aktualisiert auf Version ${root.dataset.version}.`, null, null, 4000);
  zeig();
}
store.set(VERSION_KEY, root.dataset.version);

/* App: Service Worker (offline und Updates), Installieren, Hinweis bei fehlendem Netz */
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  const hadController = !!navigator.serviceWorker.controller;
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      /* mit Nummer, wenn version.json der neuen Fassung zu holen ist */
      const offer = w => {
        const zeig = v => showToast(`Es gibt eine neue Version der App${v ? ` (${v})` : ''}.`, 'Neu laden', () => w.postMessage('skipWaiting'));
        fetch('version.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null)
          .then(j => zeig(j && j.version !== root.dataset.version ? j.version : ''), () => zeig(''));
      };
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
