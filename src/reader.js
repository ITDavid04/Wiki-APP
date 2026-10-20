/* Stufe 2: Lesen, Prüfungsmodus und Mein Stand als eigene Seiten über der Startseite.
   Jede Seite hat eine Adresse (#/artikel/<pfad>, #/pruefung, #/stand), damit die Zurück-Taste auf dem Handy funktioniert.
   Artikel kommen als Markdown von raw.githubusercontent.com; der Service Worker hebt sie auf, dann gehen sie auch offline.
   Markdown wird mit marked in HTML umgewandelt und mit DOMPurify bereinigt. */
const F = window.FIAE;
const D = F.D, REG = F.REG, Stand = F.stand;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const ARTICLE_CACHE = 'lernwiki-artikel-v1';
const REPO_RAW = 'https://raw.githubusercontent.com/ITDavid04/Bibliothek-Lern-Wiki/main/';
const REPO_BLOB = 'https://github.com/ITDavid04/Bibliothek-Lern-Wiki/blob/main/';
const encPath = p => p.split('/').map(encodeURIComponent).join('/');
const rawUrl = p => REPO_RAW + encPath(p);
const blobUrl = p => REPO_BLOB + encPath(p);
const regOf = a => REG.find(r => r.id === a.r);
const groupLabel = a => {
  if (a.r !== 'lf') return a.g;
  const l = D.lf.find(x => 'LF' + x.n === a.g);
  return l ? l.k : a.g;
};
const AMPEL = { '🔴': 'rot', '🟡': 'gelb', '🟢': 'gruen' };
const ICON = {
  ext: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arr: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

/* ---------- Seite öffnen und schließen ---------- */
const sheet = $('#sheet'), scrollEl = $('#sheetScroll'), body = $('#sheetBody'), crumb = $('#sheetCrumb'), tools = $('#sheetTools'), prog = $('#sheetProgress');
const root = document.documentElement;
let returnFocus = null, deepEntry = false, current = '';

function showSheet(kind){
  if (!F.sheetOpen) {
    returnFocus = document.activeElement;
    F.sheetOpen = true;
    root.classList.add('sheet-open');
    if (F.lenis) F.lenis.stop();
    sheet.hidden = false;
    sheet.classList.remove('in'); void sheet.offsetWidth; sheet.classList.add('in');
  }
  sheet.dataset.kind = kind;
  F.tip && F.tip.hide();
  setTab(kind);
}
function hideSheet(){
  if (!F.sheetOpen) return;
  F.sheetOpen = false;
  sheet.hidden = true;
  root.classList.remove('sheet-open');
  body.innerHTML = ''; tools.innerHTML = ''; crumb.textContent = '';
  current = '';
  if (F.lenis) F.lenis.start();
  setTab('start');
  if (returnFocus && document.contains(returnFocus)) { try { returnFocus.focus({ preventScroll: true }); } catch (e) {} }
}
/* Zurück: wer per Link hereinkam, geht im Verlauf zurück; wer direkt mit #/... startete, landet auf der Startseite */
function closeSheet(){
  if (!F.sheetOpen) return;
  if (deepEntry || history.state !== 'sheet') { deepEntry = false; history.replaceState(null, '', location.pathname + location.search); hideSheet(); }
  else history.back();
}
F.closeSheet = () => { history.replaceState(null, '', location.pathname + location.search); deepEntry = false; hideSheet(); };
$('#sheetBack').addEventListener('click', closeSheet);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && F.sheetOpen) closeSheet(); });
function setTab(kind){
  $$('#tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === (kind === 'artikel' ? '' : kind)));
}
function focusTitle(){
  const h = $('#sheetTitle');
  if (h) h.focus({ preventScroll: true });
}

/* Links mit #/ als eigenen Verlaufseintrag markieren, damit Zurück die Seite schließt */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  const h = a.getAttribute('href');
  if (h !== location.hash) F.go(h);
});
addEventListener('popstate', route);
F.go = h => { if (F.sheetOpen) history.replaceState('sheet', '', h); else history.pushState('sheet', '', h); route(); };
addEventListener('hashchange', route);

function route(){
  const h = location.hash;
  if (h === current) return;
  if (h.startsWith('#/artikel/')) openArticle(decodeURIComponent(h.slice(10)));
  else if (h === '#/pruefung') openExam();
  else if (h === '#/stand') openStand();
  else { current = h; hideSheet(); return; }
  current = h;
}

/* Fortschrittsbalken oben und "bis zum Ende gelesen" */
let readHook = null;
scrollEl.addEventListener('scroll', () => {
  const max = scrollEl.scrollHeight - scrollEl.clientHeight;
  const p = max > 0 ? scrollEl.scrollTop / max : 1;
  prog.style.transform = `scaleX(${p})`;
  if (readHook && p > 0.92) { const f = readHook; readHook = null; f(); }
}, { passive: true });
function resetScroll(){ scrollEl.scrollTop = 0; prog.style.transform = 'scaleX(0)'; }

/* ---------- Artikel lesen ---------- */
let libs = null;
async function loadLibs(){
  if (!libs) libs = Promise.all([import('./vendor/marked.esm.js'), import('./vendor/purify.es.mjs')])
    .then(([m, p]) => ({ marked: m.marked, purify: p.default }));
  return libs;
}
function slug(text, used){
  let s = text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
  let k = s, n = 1;
  while (used.has(k)) k = `${s}-${n++}`;
  used.add(k);
  return k;
}
function statusBar(p){
  const v = Stand.get(p);
  const opts = [[0, 'Noch nicht'], [1, 'Gelesen'], [2, 'Sitzt']];
  return `<div class="seg" role="radiogroup" aria-label="Wie gut sitzt der Artikel?">` +
    opts.map(([k, t]) => `<button type="button" role="radio" aria-checked="${v === k}" data-st="${k}">${k === 2 ? ICON.check : ''}${t}</button>`).join('') + `</div>`;
}
function wireStatus(scope, p){
  $$('.seg', scope).forEach(seg => seg.addEventListener('click', e => {
    const b = e.target.closest('[data-st]');
    if (!b) return;
    Stand.set(p, Number(b.dataset.st));
  }));
}
function paintStatus(p){
  const v = Stand.get(p);
  $$('.seg [data-st]', sheet).forEach(b => b.setAttribute('aria-checked', String(Number(b.dataset.st) === v)));
  const chip = $('#stChip');
  if (chip) { chip.textContent = ['offen', 'gelesen', 'sitzt'][v]; chip.className = 'st-chip micro s' + v; }
}

async function openArticle(p){
  const i = F.indexOfPath(p);
  const a = D.artikel[i];
  showSheet('artikel');
  resetScroll();
  readHook = null;
  if (!a) {
    crumb.textContent = 'Artikel';
    body.innerHTML = `<h1 id="sheetTitle" tabindex="-1">Nicht gefunden</h1><p class="lead">Diesen Artikel gibt es im Katalog nicht (mehr). Vielleicht wurde er umbenannt.</p><p><a class="tlink" href="#katalog">Zum Katalog</a></p>`;
    focusTitle(); return;
  }
  const r = regOf(a);
  crumb.textContent = `${r.kurz} · ${groupLabel(a)}`;
  tools.innerHTML =
    `<span class="st-chip micro" id="stChip"></span>` +
    (a.rot ? `<button type="button" class="pillbtn micro" id="onlyRot" aria-pressed="false"><span class="dot" aria-hidden="true"></span>Nur ROT</button>` : '') +
    `<a class="ibtn" href="${esc(blobUrl(p))}" target="_blank" rel="noopener" aria-label="Auf GitHub öffnen" title="Auf GitHub öffnen">${ICON.ext}</a>`;
  body.innerHTML =
    `<header class="art-head"><p class="eyebrow micro">${esc(r.name)} · ${esc(groupLabel(a))}</p>` +
    `<h1 id="sheetTitle" tabindex="-1">${esc(a.t)}</h1>` +
    (a.rot ? `<p class="art-ampel"><span class="dot" aria-hidden="true"></span>Mit Prüfungs-Ampel. Rot markiert ist Prüfungsstoff.</p>` : '') +
    `</header><div class="prose" id="prose"><p class="loading">Artikel wird geladen …</p></div>`;
  paintStatus(p);
  focusTitle();
  Stand.touch(p);

  let text = null, offline = false;
  try {
    const res = await fetch(rawUrl(p));
    if (!res.ok) throw new Error(res.status);
    text = await res.text();
  } catch (e) { offline = true; }
  if (current !== '#/artikel/' + encodeURIComponent(p) && location.hash !== '#/artikel/' + encodeURIComponent(p)) return;
  const prose = $('#prose');
  if (offline) {
    prose.innerHTML = `<div class="callout">Dieser Artikel ist noch nicht auf dem Gerät gespeichert und gerade gibt es kein Netz. ` +
      `Öffne ihn einmal mit Internet, dann bleibt er offline da. Unter <a href="#/stand">Mein Stand</a> kannst du auch alle Artikel auf einmal speichern.</div>`;
    return;
  }
  const { marked, purify } = await loadLibs();
  const html = purify.sanitize(marked.parse(text, { gfm: true, breaks: false }));
  prose.innerHTML = html;
  enhance(prose, p);

  /* Ende des Artikels: Lernstand und weiter im Regal */
  const same = D.artikel.map((x, k) => ({ x, k })).filter(o => o.x.r === a.r);
  const pos = same.findIndex(o => o.k === i);
  const next = same[pos + 1] || same[0];
  const end = document.createElement('section');
  end.className = 'art-end';
  end.innerHTML = `<h2 class="micro">Wie sitzt das Thema?</h2>${statusBar(p)}` +
    (next && next.k !== i ? `<a class="next" href="${F.artUrl(next.x)}"><span class="micro">Weiter in der Abteilung ${esc(r.kurz)}</span><b>${esc(next.x.t)}</b>${ICON.arr}</a>` : '') +
    `<p class="src">Quelle: <a href="${esc(blobUrl(p))}" target="_blank" rel="noopener">${esc(p)}</a> im Wiki auf GitHub</p>`;
  body.appendChild(end);
  wireStatus(end, p);
  paintStatus(p);
  /* bis zum Ende gescrollt: als gelesen markieren, wenn noch nichts gesetzt ist */
  readHook = () => { if (Stand.get(p) === 0) { Stand.set(p, 1); F.toast && F.toast('Als gelesen markiert.', 'Rückgängig', () => Stand.set(p, 0), 4000); } };
  requestAnimationFrame(() => scrollEl.dispatchEvent(new Event('scroll')));
}

/* Nach dem Umwandeln: erste Überschrift weg (steht schon oben), Sprungmarken, Links, Bilder, Tabellen, Ampel */
function enhance(prose, p){
  const h1 = prose.querySelector('h1');
  if (h1 && !h1.previousElementSibling) h1.remove();
  const used = new Set();
  $$('h1,h2,h3,h4,h5,h6', prose).forEach(h => { h.id = slug(h.textContent, used); });
  const dir = p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '';
  const base = 'https://wiki.local/' + encPath(dir);
  $$('a[href]', prose).forEach(link => {
    const href = link.getAttribute('href');
    if (href.startsWith('#')) {
      link.addEventListener('click', e => {
        e.preventDefault();
        const t = document.getElementById(decodeURIComponent(href.slice(1)));
        if (t) scrollEl.scrollTo({ top: t.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop - 72, behavior: reduce.matches ? 'auto' : 'smooth' });
      });
      return;
    }
    if (/^[a-z]+:/i.test(href)) { link.target = '_blank'; link.rel = 'noopener'; return; }
    const u = new URL(href, base);
    const target = decodeURIComponent(u.pathname.slice(1));
    const hit = F.byPath(target);
    if (hit) link.setAttribute('href', F.artUrl(hit));
    else { link.href = blobUrl(target) + u.hash; link.target = '_blank'; link.rel = 'noopener'; }
  });
  $$('img[src]', prose).forEach(img => {
    const src = img.getAttribute('src');
    if (!/^[a-z]+:/i.test(src)) img.src = REPO_RAW + new URL(src, base).pathname.slice(1);
    img.loading = 'lazy'; img.decoding = 'async';
  });
  $$('table', prose).forEach(t => { const w = document.createElement('div'); w.className = 'tbl'; t.replaceWith(w); w.appendChild(t); });
  $$('pre > code.language-mermaid', prose).forEach(code => {
    const box = document.createElement('div');
    box.className = 'callout';
    box.innerHTML = `Hier steht ein Diagramm. Die App zeigt es noch nicht an, auf <a href="${esc(blobUrl(p))}" target="_blank" rel="noopener">GitHub</a> siehst du es gezeichnet.<details><summary>Quelltext des Diagramms</summary></details>`;
    const pre = code.parentElement;
    pre.replaceWith(box);
    $('details', box).appendChild(pre);
  });
  let rot = 0;
  $$('p, li, blockquote, h2, h3, h4', prose).forEach(el => {
    if (el.parentElement.closest('[data-ampel]')) return;
    const t = el.textContent.trimStart();
    for (const k in AMPEL) if (t.startsWith(k)) { el.dataset.ampel = AMPEL[k]; if (k === '🔴') rot++; }
  });
  $$('tr', prose).forEach(tr => {
    const hits = Object.keys(AMPEL).filter(k => tr.textContent.includes(k));
    if (hits.length === 1) { tr.dataset.ampel = AMPEL[hits[0]]; if (hits[0] === '🔴') rot++; }
  });
  const btn = $('#onlyRot');
  if (btn) {
    if (!rot) btn.remove();
    else btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      prose.classList.toggle('only-rot', on);
      F.toast && F.toast(on ? `Nur ROT: ${rot} Stellen mit Prüfungsstoff, Gelb und Grün sind ausgeblendet.` : 'Wieder alles sichtbar.', null, null, 3000);
    });
  }
}

/* ---------- Prüfungsmodus ---------- */
const examState = { filter: 'offen', regal: 'all' };
function openExam(){
  showSheet('pruefung');
  resetScroll(); readHook = null;
  crumb.textContent = 'Prüfungsmodus';
  tools.innerHTML = '';
  renderExam();
  focusTitle();
}
function renderExam(){
  const list = D.artikel.map((a, i) => ({ a, i, p: F.pathOf(a) })).filter(o => o.a.rot);
  const total = list.length;
  const sitzt = list.filter(o => Stand.get(o.p) === 2).length;
  const regale = REG.filter(r => list.some(o => o.a.r === r.id));
  const shown = list.filter(o => (examState.regal === 'all' || o.a.r === examState.regal) &&
    (examState.filter === 'alle' || (examState.filter === 'offen' ? Stand.get(o.p) < 2 : Stand.get(o.p) === 2)));
  const nextOpen = list.find(o => Stand.get(o.p) < 2);
  const pct = total ? Math.round(sitzt / total * 100) : 0;
  const chip = (k, t, on) => `<button type="button" class="chip" data-${k}="${t[0]}" aria-pressed="${on}">${esc(t[1])}</button>`;
  body.innerHTML =
    `<header class="art-head"><p class="eyebrow micro">Prüfungsmodus</p><h1 id="sheetTitle" tabindex="-1">ROT zuerst.</h1>` +
    `<p class="lead">Alle ${total} Artikel mit Prüfungs-Ampel. Lies sie, und hak ab, was sitzt. Im Artikel blendet „Nur ROT“ alles außer dem Prüfungsstoff aus.</p></header>` +
    `<div class="meter-big"><div class="mb-num"><b>${sitzt}</b><span>von ${total} sitzen</span></div><div class="bar big"><i style="--w:${pct}%"></i></div></div>` +
    (nextOpen ? `<a class="btn" href="${F.artUrl(nextOpen.a)}">Nächsten offenen öffnen <span class="ar">${ICON.arr}</span></a>` : `<p class="callout">Alles abgehakt. Stark! Viel Erfolg bei der Prüfung.</p>`) +
    `<div class="chips exam-chips" role="group" aria-label="Filter">` +
      chip('f', ['offen', 'Offen'], examState.filter === 'offen') + chip('f', ['sitzt', 'Sitzt'], examState.filter === 'sitzt') + chip('f', ['alle', 'Alle'], examState.filter === 'alle') +
    `</div><div class="chips exam-chips" role="group" aria-label="Abteilung">` +
      chip('r', ['all', 'Alle Abteilungen'], examState.regal === 'all') + regale.map(r => chip('r', [r.id, r.kurz], examState.regal === r.id)).join('') +
    `</div>` +
    (shown.length ? regale.filter(r => shown.some(o => o.a.r === r.id)).map(r =>
      `<section class="exam-group"><h2>${esc(r.name)} <small>${shown.filter(o => o.a.r === r.id).length}</small></h2><ul class="exam-list">` +
      shown.filter(o => o.a.r === r.id).map(o => {
        const v = Stand.get(o.p);
        return `<li class="s${v}"><label class="tick"><input type="checkbox" data-p="${esc(o.p)}"${v === 2 ? ' checked' : ''}><span class="sr">sitzt</span></label>` +
          `<a href="${F.artUrl(o.a)}"><span class="t">${esc(o.a.t)}</span><span class="g micro">${esc(groupLabel(o.a))}${v === 1 ? ' · gelesen' : ''}</span></a></li>`;
      }).join('') + `</ul></section>`).join('')
      : `<p class="callout">${examState.filter === 'sitzt' ? 'Hier ist noch nichts abgehakt.' : 'In dieser Auswahl ist alles abgehakt.'}</p>`);
  $$('[data-f]', body).forEach(b => b.addEventListener('click', () => { examState.filter = b.dataset.f; renderExam(); }));
  $$('[data-r]', body).forEach(b => b.addEventListener('click', () => { examState.regal = b.dataset.r; renderExam(); }));
  $$('input[data-p]', body).forEach(c => c.addEventListener('change', () => {
    const p = c.dataset.p;
    Stand.set(p, c.checked ? 2 : (Stand.get(p) === 2 ? 1 : Stand.get(p)));
  }));
}

/* ---------- Mein Stand ---------- */
async function articleCacheCount(){
  try {
    if (!('caches' in window)) return null;
    const c = await caches.open(ARTICLE_CACHE);
    const keys = new Set((await c.keys()).map(r => r.url));
    return D.artikel.filter(a => keys.has(rawUrl(F.pathOf(a)))).length;
  } catch (e) { return null; }
}
let saving = false;
function openStand(){
  showSheet('stand');
  resetScroll(); readHook = null;
  crumb.textContent = 'Mein Stand';
  tools.innerHTML = '';
  renderStand();
  focusTitle();
}
async function renderStand(){
  const c = Stand.count();
  const n = D.artikel.length;
  const recent = Stand.recent().map(p => F.byPath(p)).filter(Boolean).slice(0, 5);
  const rows = REG.map(r => {
    const k = Stand.count(a => a.r === r.id);
    const g = Math.round((k.gelesen - k.sitzt) / r.n * 100), s = Math.round(k.sitzt / r.n * 100);
    return `<li><div class="rr"><b>${esc(r.name)}</b><span>${k.sitzt} sitzen, ${k.gelesen} gelesen, von ${r.n}</span></div>` +
      `<div class="bar two" aria-hidden="true"><i class="s" style="--w:${s}%"></i><i class="g" style="--w:${g}%"></i></div></li>`;
  }).join('');
  body.innerHTML =
    `<header class="art-head"><p class="eyebrow micro">Mein Stand</p><h1 id="sheetTitle" tabindex="-1">${c.gelesen ? 'Deine Ranke wächst.' : 'Deine Ranke wartet.'}</h1>` +
    `<p class="lead">Dein Lernstand bleibt auf diesem Gerät. Niemand sonst sieht ihn, und es braucht kein Konto.</p></header>` +
    `<div class="stand-nums"><div><b>${c.gelesen}</b><span>von ${n} gelesen</span></div><div><b>${c.sitzt}</b><span>sitzen</span></div>` +
    `<div><b>${Stand.count(a => a.rot).sitzt}</b><span>von ${D.artikel.filter(a => a.rot).length} mit Ampel sitzen</span></div></div>` +
    `<ul class="regal-bars">${rows}</ul>` +
    `<ul class="leaf-key micro"><li><i style="--c:${F.LEAF[2]}"></i>sitzt</li><li><i style="--c:${F.LEAF[1]}"></i>gelesen</li><li><i style="--c:${F.LEAF[0]}"></i>noch nicht</li></ul>` +
    (recent.length ? `<section class="block"><h2>Weiterlesen</h2><ul class="exam-list plain">${recent.map(a => {
      const v = Stand.get(F.pathOf(a));
      return `<li class="s${v}"><a href="${F.artUrl(a)}"><span class="t">${esc(a.t)}</span><span class="g micro">${esc(regOf(a).kurz)} · ${esc(groupLabel(a))}${v ? ' · ' + ['', 'gelesen', 'sitzt'][v] : ''}</span></a></li>`;
    }).join('')}</ul></section>` : '') +
    `<section class="block"><h2>Offline lesen</h2><p id="offInfo">Wird gezählt …</p>` +
      `<button type="button" class="btn" id="saveAll">Alle Artikel offline speichern</button><p class="small" id="saveProg"></p></section>` +
    `<section class="block"><h2>Lernstand sichern</h2><p>Speichert deinen Stand als Datei, zum Beispiel bevor du das Handy wechselst. Mit „Wiederherstellen“ liest du sie wieder ein.</p>` +
      `<div class="row-btns"><button type="button" class="pillbtn micro" id="exp">Sichern</button>` +
      `<label class="pillbtn micro">Wiederherstellen<input type="file" accept="application/json,.json" id="imp" hidden></label>` +
      `<button type="button" class="pillbtn micro danger" id="reset">Zurücksetzen</button></div></section>` +
    `<section class="block about"><h2>Über die App</h2><p>Katalog vom ${esc((D.stand || '').split('-').reverse().join('.'))}, ${n} Artikel aus dem ` +
      `<a href="${esc(D.repo)}" target="_blank" rel="noopener">Wiki auf GitHub</a>. Bibliotheken und Schrift mit ihren Lizenzen liegen in <a href="vendor/LICENSES/README.txt" target="_blank" rel="noopener">vendor/LICENSES</a>.</p></section>`;

  const cnt = await articleCacheCount();
  const info = $('#offInfo', body);
  if (info) info.textContent = cnt === null ? 'Offline-Speicher ist in diesem Browser nicht verfügbar.' :
    `${cnt} von ${n} Artikeln sind auf diesem Gerät gespeichert.` + (navigator.serviceWorker && !navigator.serviceWorker.controller ? ' Der Speicher wird beim nächsten Start aktiv.' : '');
  const btn = $('#saveAll', body);
  if (btn) {
    btn.disabled = saving || cnt === null || !navigator.onLine;
    if (!navigator.onLine) $('#saveProg', body).textContent = 'Dafür braucht es Internet.';
    btn.addEventListener('click', saveAll);
  }
  $('#exp', body).addEventListener('click', exportStand);
  $('#imp', body).addEventListener('change', importStand);
  $('#reset', body).addEventListener('click', () => {
    if (confirm('Wirklich den ganzen Lernstand auf diesem Gerät löschen?')) { Stand.replace({}); F.toast && F.toast('Lernstand zurückgesetzt.', null, null, 3000); }
  });
}
async function saveAll(){
  if (saving) return;
  saving = true;
  const btn = $('#saveAll'), out = $('#saveProg');
  if (btn) btn.disabled = true;
  const todo = D.artikel.map(a => rawUrl(F.pathOf(a)));
  let done = 0, failed = 0, k = 0;
  const work = async () => {
    while (k < todo.length) {
      const u = todo[k++];
      try { const r = await fetch(u); if (!r.ok) failed++; else await r.text(); } catch (e) { failed++; }
      done++;
      const o = $('#saveProg'); if (o) o.textContent = `${done} von ${todo.length} …`;
    }
  };
  await Promise.all([work(), work(), work(), work()]);
  saving = false;
  const o = $('#saveProg');
  if (o) o.textContent = failed ? `Fertig, ${failed} Artikel ließen sich nicht laden.` : 'Fertig. Alle Artikel gehen jetzt auch offline.';
  if (sheet.dataset.kind === 'stand') { const cnt = await articleCacheCount(); const info = $('#offInfo'); if (info && cnt !== null) info.textContent = `${cnt} von ${D.artikel.length} Artikeln sind auf diesem Gerät gespeichert.`; }
}
function exportStand(){
  const data = { app: 'lernwiki', version: 1, gesichert: new Date().toISOString(), stand: Stand.all() };
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `lernstand-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
async function importStand(e){
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!data || data.app !== 'lernwiki' || typeof data.stand !== 'object') throw new Error('Format');
    const merged = { ...Stand.all() };
    let n = 0;
    for (const [p, v] of Object.entries(data.stand)) {
      if (!v || ![1, 2].includes(v.s)) continue;
      if (!merged[p] || merged[p].s < v.s) { merged[p] = { s: v.s, t: Number(v.t) || Date.now() }; n++; }
    }
    Stand.replace(merged);
    F.toast && F.toast(`Wiederhergestellt: ${n} Einträge übernommen.`, null, null, 4000);
  } catch (err) {
    F.toast && F.toast('Diese Datei ist keine Sicherung der Lern-Wiki-App.', null, null, 4000);
  }
}

/* Lernstand geändert: offene Seite auffrischen */
addEventListener('fiae-stand', e => {
  if (!F.sheetOpen) return;
  const kind = sheet.dataset.kind;
  if (kind === 'artikel') { const p = decodeURIComponent(location.hash.slice(10)); paintStatus(p); }
  else if (kind === 'pruefung') { const y = scrollEl.scrollTop; renderExam(); scrollEl.scrollTop = y; }
  else if (kind === 'stand' && !saving) { const y = scrollEl.scrollTop; renderStand().then(() => { scrollEl.scrollTop = y; }); }
});

/* Start: direkt mit #/... geöffnet (Lesezeichen, geteilter Link) */
if (location.hash.startsWith('#/')) { deepEntry = true; route(); }
else setTab('start');
