/* 3D, zwei Ebenen:
   1. Bühne: zwölf Lernfeld-Würfel im Stil von Version 3 (grün = hat Artikel, weiß gestrichelt = noch leer), stoßen sich von der Maus ab.
   2. Ranke: feste Ebene hinter dem Inhalt. Ein Stängel wächst beim Scrollen von der Bühne bis zum Fuß (und beim Hochscrollen zurück), im Abschnitt "Die Ranke"
      trägt er sechs Zweige mit einem Blatt pro Artikel. Wachstum über die Bogenlänge in Pixeln (aG), im Shader zur Spitze hin verjüngt. */
const F = window.FIAE;
const LF = F.D.lf;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const conn = navigator.connection;
const weak = (conn && conn.saveData) || (navigator.deviceMemory && navigator.deviceMemory < 2);
const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = q => q * q * (3 - 2 * q);
const lfNr = l => l.n < 10 ? String(l.n).padStart(2, '0') : l.k.replace(/^LF/, '');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
let pX = -1, pY = -1, pType = 'mouse';
addEventListener('pointermove', e => { pX = e.clientX; pY = e.clientY; pType = e.pointerType; }, { passive: true });
addEventListener('pointerdown', e => { pX = e.clientX; pY = e.clientY; pType = e.pointerType; }, { passive: true });
document.addEventListener('pointerleave', () => { pX = pY = -1; });

function fail(msg, e){ console.warn(msg, e || ''); F.loadStep(true); }

async function boot(){
  let THREE, RoundedBoxGeometry, RoomEnvironment;
  try {
    THREE = await import('three'); F.loadStep();
    ({ RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js'));
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
    F.loadStep();
  } catch (e) { return fail('3D nicht geladen, Standbilder bleiben.', e); }
  try { await document.fonts.load('500 120px "Hanken Grotesk"'); } catch (e) {}
  let okS = false, okV = false;
  try { okS = bootStage(THREE, RoundedBoxGeometry, RoomEnvironment); } catch (e) { console.warn('Bühne ohne 3D:', e); }
  F.loadStep();
  try { okV = bootVine(THREE, RoomEnvironment); } catch (e) { console.warn('Ranke ohne 3D:', e); }
  F.loadStep(true);
  if (!okS && !okV) console.warn('Kein WebGL, Standbilder bleiben.');
}

/* Passt die Auflösung an: brauchen zwei Messungen in Folge im Schnitt über 24 ms pro Bild, sinkt die Pixeldichte um 0,25 (bis 0,75) */
function adaptive(renderer){
  let dpr = renderer.getPixelRatio(), acc = 0, n = 0, slow = 0;
  return ms => {
    if (!(ms > 0) || ms > 200) return;
    acc += ms; n++;
    if (n < 30) return;
    const avg = acc / n; acc = 0; n = 0;
    if (avg > 24 && dpr > 0.75) { if (++slow >= 2) { dpr = Math.max(0.75, dpr - 0.25); renderer.setPixelRatio(dpr); slow = 0; } }
    else slow = 0;
  };
}

function makeRenderer(THREE, dprMax){
  let r;
  try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  r.setPixelRatio(Math.min(devicePixelRatio || 1, dprMax));
  r.toneMapping = THREE.NeutralToneMapping;
  r.toneMappingExposure = 1.0;
  return r;
}

/* ---------- 1. Bühne mit Würfeln ---------- */
function bootStage(THREE, RoundedBoxGeometry, RoomEnvironment){
  const host = document.getElementById('stage');
  const renderer = makeRenderer(THREE, innerWidth < 700 ? 1.25 : 1.75);
  const quality = adaptive(renderer);
  if (!renderer) return false;
  renderer.domElement.className = 'stage-gl';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(4, 8, 6); scene.add(sun);
  const FOV = 30, CZ = 24;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, CZ);

  function labelTex(l, done){
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d');
    const green = '#1F7A57';
    if (l.a) { g.fillStyle = green; g.fillRect(0, 0, 512, 512); g.fillStyle = '#FFFFFF'; }
    else {
      g.fillStyle = '#F6F8F4'; g.fillRect(0, 0, 512, 512);
      g.strokeStyle = 'rgba(31,122,87,.55)'; g.lineWidth = 10; g.setLineDash([26, 20]);
      g.strokeRect(58, 58, 396, 396); g.setLineDash([]);
      g.fillStyle = green;
    }
    const nr = lfNr(l);
    g.font = `500 ${nr.length > 2 ? 160 : 190}px "Hanken Grotesk", system-ui, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(nr, 256, 268);
    g.font = '600 46px "Hanken Grotesk", system-ui, sans-serif';
    g.fillText('LF', 256, 112);
    /* geschafft: gelbes Häkchen unter der Nummer */
    if (done) {
      g.fillStyle = '#E2F06A';
      g.beginPath(); g.arc(256, 404, 56, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#0F1A15'; g.lineWidth = 15; g.lineCap = g.lineJoin = 'round';
      g.beginPath(); g.moveTo(229, 406); g.lineTo(248, 425); g.lineTo(284, 387); g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  const geo = new RoundedBoxGeometry(1, 1, 1, 6, 0.16);
  const blocks = LF.map((l, i) => {
    const m = new THREE.MeshPhysicalMaterial({
      map: labelTex(l, false), roughness: l.a ? 0.22 : 0.35, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.12, sheen: l.a ? 0 : 0.4,
      emissive: new THREE.Color(0x5FD3A2), emissiveIntensity: 0
    });
    const mesh = new THREE.Mesh(geo, m);
    mesh.userData.lf = l;
    scene.add(mesh);
    const seed = i * 1.618 + 0.4;
    return { mesh, l, i, seed, done: false, pos: new THREE.Vector3((i - 5.5) * 1.4, 12 + i, -4), vel: new THREE.Vector3(), s: 0.001, rot: new THREE.Euler(seed, seed * 2, seed * .5), spin: new THREE.Vector3(), hover: 0 };
  });
  /* Geschafftes Lernfeld: Häkchen auf dem Würfel und ein gelber Schimmer an den Kanten; wird es gerade geschafft, dreht er sich einmal */
  function paintDone(first){
    blocks.forEach(b => {
      const d = F.erfolg.done(b.l.n);
      if (d === b.done) return;
      b.done = d;
      const m = b.mesh.material;
      m.map.dispose(); m.map = labelTex(b.l, d);
      m.sheen = d ? 1 : (b.l.a ? 0 : 0.4);
      m.sheenColor.set(d ? 0xE2F06A : 0x000000);
      m.sheenRoughness = d ? 0.35 : 1;
      if (d && !first && !reduce.matches) b.spin.y += 9;
    });
  }
  paintDone(true);
  addEventListener('fiae-stand', () => paintDone(false));

  let W = 1, H = 1, unit = 1, narrow = false;
  function resize(){
    W = host.clientWidth; H = host.clientHeight; narrow = W < 700;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    unit = (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CZ) / H;
  }
  const wx = px => (px - W / 2) * unit;
  const wy = py => -(py - H / 2) * unit;
  new ResizeObserver(resize).observe(host); resize();

  /* Würfel rechts, die Begrüßung links unten bleibt frei; auf dem Handy oben */
  const WIDE = [[.5,.16,1.2],[.63,.1,-1.4],[.77,.17,.5],[.88,.2,1.4],[.57,.36,-.8],[.71,.31,1],[.85,.38,-1.5],[.66,.54,.8],[.8,.6,-1.1],[.91,.68,.6],[.72,.8,1.4],[.86,.86,-.6]];
  const TALL = [[.16,.17,1.2],[.44,.14,-1.4],[.72,.18,.5],[.85,.3,1.4],[.26,.31,-.8],[.56,.3,1],[.8,.44,-1.5],[.15,.45,.8],[.42,.47,-1.1],[.64,.54,.6],[.24,.6,1.4],[.84,.6,-.6]];
  function layout(t){
    const P = narrow ? TALL : WIDE;
    const s = Math.min(W, H) * unit * (narrow ? 0.15 : 0.13);
    const fl = reduce.matches ? 0 : 1;
    return blocks.map((b, i) => {
      const [u, v, z] = P[i % P.length];
      return {
        x: wx(u * W) + Math.sin(t * .5 + b.seed) * s * .25 * fl,
        y: wy(v * H) + Math.cos(t * .6 + b.seed * 1.3) * s * .3 * fl,
        z: z * s, s: s * (0.86 + (i % 3) * 0.12),
        rx: b.seed + t * .25 * fl, ry: b.seed * 2 + t * .32 * fl, rz: b.seed * .5
      };
    });
  }

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const mouseW = new THREE.Vector3(1e4, 1e4, 0), mPrev = new THREE.Vector3(1e4, 1e4, 0);
  let hovered = null;
  addEventListener('click', e => {
    if (!hovered || e.target.closest('a,button,input,textarea,select,summary')) return;
    F.openTile('lf' + hovered.userData.lf.n);
  });
  const meshes = blocks.map(b => b.mesh), tmp = new THREE.Vector3();
  let last = performance.now(), running = false, visible = true;
  function step(){
    const now = performance.now();
    if (F.sheetOpen) { last = now; return; }
    quality(now - last);
    const dt = Math.min(0.033, Math.max(0, (now - last) / 1000)); last = now;
    const t = now / 1000;
    const rc = host.getBoundingClientRect();
    const inside = pX >= rc.left && pX <= rc.right && pY >= rc.top && pY <= rc.bottom;
    if (inside) { const mx = pX - rc.left, my = pY - rc.top; ndc.set(mx / W * 2 - 1, -(my / H) * 2 + 1); mouseW.set(wx(mx), wy(my), 0); }
    else { ndc.set(-9, -9); mouseW.set(1e4, 1e4, 0); }
    const T = layout(t);
    const mv = tmp.copy(mouseW).sub(mPrev).length(); mPrev.copy(mouseW);
    blocks.forEach((b, i) => {
      const g = T[i];
      const tgt = tmp.set(g.x, g.y, g.z);
      if (reduce.matches) { b.pos.copy(tgt); b.vel.set(0, 0, 0); }
      else {
        const acc = tgt.sub(b.pos).multiplyScalar(26).addScaledVector(b.vel, -7.5);
        const dx = b.pos.x - mouseW.x, dy = b.pos.y - mouseW.y, d = Math.hypot(dx, dy), R = Math.max(2.4, g.s * 2.2);
        if (d < R && d > 1e-3) {
          const f = (1 - d / R) * 140;
          acc.x += dx / d * f; acc.y += dy / d * f;
          b.spin.x += dy / d * f * 0.004 * (1 + Math.min(mv, 3)); b.spin.y -= dx / d * f * 0.004 * (1 + Math.min(mv, 3));
        }
        b.vel.addScaledVector(acc, dt); b.pos.addScaledVector(b.vel, dt);
      }
      b.spin.multiplyScalar(0.94);
      const k = reduce.matches ? 1 : 1 - Math.pow(0.0015, dt);
      b.rot.x += (g.rx - b.rot.x) * k + b.spin.x * dt;
      b.rot.y += (g.ry - b.rot.y) * k + b.spin.y * dt;
      b.rot.z += (g.rz - b.rot.z) * k;
      b.hover += ((b.mesh === hovered ? 1 : 0) - b.hover) * (reduce.matches ? 1 : 0.18);
      b.s += (g.s - b.s) * (reduce.matches ? 1 : 1 - Math.pow(0.002, dt));
      b.mesh.position.copy(b.pos);
      b.mesh.rotation.set(b.rot.x, b.rot.y, b.rot.z);
      b.mesh.scale.setScalar(Math.max(0.001, b.s * (1 + b.hover * 0.1)));
      b.mesh.material.emissiveIntensity = b.hover * 0.35 + (b.done ? 0.14 : 0);
    });
    ray.setFromCamera(ndc, camera);
    const hit = inside ? ray.intersectObjects(meshes, false)[0] : null;
    const next = hit ? hit.object : null;
    if (next !== hovered) {
      hovered = next; F.hoverBlock = !!hovered;
      if (hovered) {
        const l = hovered.userData.lf;
        const info = l.a ? `${l.a === 1 ? '1 Artikel' : l.a + ' Artikel'}${l.rot ? `, ${l.rot} mit Ampel` : ''}${F.erfolg.done(l.n) ? ', geschafft' : ''}` : 'noch leer';
        F.tip.show(`<b>${l.k}</b>${esc(l.titel)}<br><span>${info}, klicken zum Aufdecken</span>`, pX, pY);
      } else F.tip.hide();
    }
    if (hovered) F.tip.move(pX, pY);
    renderer.render(scene, camera);
  }
  function safeStep(){ try { step(); } catch (e) { console.error('Bühne angehalten:', e); stop(); } }
  function start(){ if (!running && visible && !document.hidden) { running = true; last = performance.now(); renderer.setAnimationLoop(safeStep); } }
  function stop(){ running = false; renderer.setAnimationLoop(null); }
  new IntersectionObserver(es => { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(host);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  start();
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('gl-stage')));
  return true;
}

/* ---------- 2. Ranke durch die Seite ---------- */
function bootVine(THREE, RoomEnvironment){
  const renderer = makeRenderer(THREE, innerWidth < 700 ? 1.25 : 1.5);
  const quality = adaptive(renderer);
  const coarse = matchMedia('(pointer:coarse)').matches;
  if (!renderer) return false;
  const cv = renderer.domElement;
  cv.id = 'vine'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-3, 6, 8); scene.add(sun);
  const FOV = 30, CZ = 24;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

  /* Stängel: Radius schrumpft zur wachsenden Spitze hin auf null (aCenter = Mittellinie, aG = Bogenlänge in px) */
  const U = { uGrow: { value: 0 }, uTaper: { value: 140 } };
  const stemMat = new THREE.MeshPhysicalMaterial({ color: 0x2C7A50, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.25, sheen: 0.4, sheenColor: new THREE.Color(0x9FE3BE) });
  stemMat.onBeforeCompile = sh => {
    sh.uniforms.uGrow = U.uGrow; sh.uniforms.uTaper = U.uTaper;
    sh.vertexShader = 'attribute vec3 aCenter;\nattribute float aG;\nuniform float uGrow;\nuniform float uTaper;\n' +
      sh.vertexShader.replace('#include <begin_vertex>', 'float kg = clamp((uGrow - aG) / uTaper, 0.0, 1.0);\nvec3 transformed = aCenter + (position - aCenter) * sqrt(kg);');
  };
  const stem = new THREE.Mesh(new THREE.BufferGeometry(), stemMat);
  stem.frustumCulled = false;
  scene.add(stem);

  /* Blatt: spitzes Oval, an der Mittelrippe leicht gefaltet, Ansatz im Ursprung, zeigt nach +x */
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.25, 0.32, 0.7, 0.3, 1, 0);
  shape.bezierCurveTo(0.7, -0.3, 0.25, -0.32, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(shape, 12);
  const lp = leafGeo.attributes.position;
  for (let i = 0; i < lp.count; i++) { const x = lp.getX(i), y = lp.getY(i); lp.setZ(i, Math.abs(y) * 0.32 + Math.sin(x * Math.PI) * 0.06); }
  leafGeo.computeVertexNormals();
  const leafMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.48, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.5, sheenColor: new THREE.Color(0xCFF5DD), side: THREE.DoubleSide });
  const budGeo = new THREE.SphereGeometry(1, 16, 12);
  const budMat = new THREE.MeshPhysicalMaterial({ color: 0xE5483A, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15, emissive: 0xE5483A, emissiveIntensity: 0.15 });
  const core = new THREE.Mesh(budGeo, new THREE.MeshPhysicalMaterial({ color: 0xF2C14E, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.2 }));
  core.frustumCulled = false;
  scene.add(core);
  let coreG = 0, coreS = 0;

  let dataLeaves = null, decoLeaves = null, buds = null, secCores = null, lfPetals = null, lfCores = null, beeBodies = null, beeHeads = null, beeWings = null;
  let BE = [];                             /* Bienen um die Blüten der geschafften Lernfelder, zwei je Blüte */
  /* Biene: Körper mit Streifen (Kugel, Pole auf der Längsachse x, vorne +x), Kopf, zwei Flügel mit Gelenk am Rücken */
  const beeTex = (() => {
    const c = document.createElement('canvas'); c.width = 8; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#E2F06A'; g.fillRect(0, 0, 8, 64);
    g.fillStyle = '#1A1F14'; [[20, 28], [34, 42], [48, 55], [60, 64]].forEach(([a, b]) => g.fillRect(0, a, 8, b - a));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const beeBodyGeo = new THREE.SphereGeometry(1, 18, 12).rotateZ(-Math.PI / 2);
  const beeBodyMat = new THREE.MeshPhysicalMaterial({ map: beeTex, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const beeHeadMat = new THREE.MeshPhysicalMaterial({ color: 0x1A1F14, roughness: 0.35, clearcoat: 0.8 });
  const wingGeo = new THREE.CircleGeometry(1, 18).translate(0, 1, 0);
  const wingMat = new THREE.MeshBasicMaterial({ color: 0xC9E2F0, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
  let SC = [];                             /* Blütenmitten der Abschnitte */
  let LB = [];                             /* Blüten an den Trieben geschaffter Lernfelder */
  let lfDone = new Set(F.erfolg.list().map(l => l.n));
  addEventListener('fiae-stand', () => { lfDone = new Set(F.erfolg.list().map(l => l.n)); });
  let LD = [], LX = [], BD = [];           /* Blattdaten: Artikel, Deko, Knospen */
  let mainY = [], mainG = [], totalG = 0;  /* für die Zuordnung Scrollposition zu Wachstum */
  let twigTips = [];
  let W = 1, H = 1, unit = 1, built = false;
  const wxp = px => (px - W / 2) * unit, wyp = py => -py * unit;
  const V = (x, y, z) => new THREE.Vector3(wxp(x), wyp(y), z * unit);

  function tube(curve, segs, radial, rFn, gFn, out){
    curve.arcLengthDivisions = Math.max(200, segs * 2);
    curve.updateArcLengths();
    const fr = curve.computeFrenetFrames(segs, false);
    const base = out.P.length / 3;
    for (let i = 0; i <= segs; i++) {
      const u = i / segs, p = curve.getPointAt(u), r = rFn(u) * unit, g = gFn(u);
      const N = fr.normals[i], B = fr.binormals[i];
      for (let j = 0; j <= radial; j++) {
        const v = j / radial * Math.PI * 2, s = Math.sin(v), c = -Math.cos(v);
        const nx = c * N.x + s * B.x, ny = c * N.y + s * B.y, nz = c * N.z + s * B.z;
        out.P.push(p.x + r * nx, p.y + r * ny, p.z + r * nz);
        out.N.push(nx, ny, nz); out.C.push(p.x, p.y, p.z); out.G.push(g);
      }
    }
    for (let i = 1; i <= segs; i++) for (let j = 1; j <= radial; j++) {
      const a = base + (radial + 1) * (i - 1) + (j - 1), b = base + (radial + 1) * i + (j - 1), c = base + (radial + 1) * i + j, d = base + (radial + 1) * (i - 1) + j;
      out.I.push(a, b, d, b, c, d);
    }
  }
  const curveOf = pts => new THREE.CatmullRomCurve3(pts.map(p => V(p[0], p[1], p[2])), false, 'centripetal');
  const lenPx = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };

  function build(){
    const T = F.relayoutTree();
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, true);
    camera.fov = FOV; camera.aspect = W / H; camera.updateProjectionMatrix();
    unit = (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CZ) / H;
    const narrow = W < 860, sc = narrow ? 0.55 : 1;
    const sy = scrollY;
    const box = sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top + sy, b: r.bottom + sy, w: r.width, h: r.height }; };
    const S = box('#stage'), I = box('#idee'), A = box('#a-ranke'), M = box('#main'), E = box('#a-end');
    const marg = W - M.r;
    const mx = marg >= 28 ? M.r + marg * 0.5 : W - 7;
    const sway = marg >= 28 ? Math.min(marg * 0.3, 40) : 2;

    /* Wegpunkte in Seitenpixeln */
    const P = [];
    const add = (x, y, z = 0) => P.push([x, y, z]);
    add(S.l + S.w * 0.8, S.b - S.h * 0.35, -40);
    add(S.l + S.w * 0.78, S.b - 40, -10);
    add(S.l + S.w * 0.74, S.b + 50, 10);
    const loop = (cx, cy, r, zAmp) => {
      for (let k = 0; k <= 8; k++) {
        const a = -Math.PI / 2 - k / 8 * Math.PI * 2;
        add(cx + Math.cos(a) * r, cy + r * 0.2 + Math.sin(a) * r, Math.sin(k / 8 * Math.PI * 2) * zAmp);
      }
    };
    if (narrow) {
      /* Handy: Schlaufe in der Lücke über der Überschrift, dann am rechten Rand an den Texten vorbei */
      loop(W * 0.62, I.t + 48, 30, 40);
      add(W - 10, I.t + 150, 0);
      for (let y = I.t + 420; y < A.t - 160; y += 320) add(W - 7, y, 0);
    } else {
      add(S.l + S.w * 0.6, I.t + I.h * 0.16, 30);
      add(W * 0.42, I.t + I.h * 0.25, 40);
      const lcx = W * 0.17, lcy = I.t + I.h * 0.46, lr = 84;
      loop(lcx, lcy, lr, 70);
      add(lcx - lr * 0.5, lcy + lr * 1.9, 10);
      add(W * 0.28, I.b - I.h * 0.04, 0);
    }
    /* Auf dem Handy liegt der Baum direkt unter der Legende: Stamm erst im Baum beginnen und enden lassen */
    const trunk = T.trunk.map(p => [A.l + p[0], A.t + p[1], p[2]]).filter(p => !narrow || (p[1] > A.t + 150 && p[1] < A.b - 30));
    if (narrow) add(W - 7, A.t + 6, 0);
    else add(trunk[0][0] - 40, trunk[0][1] - 90, 0);
    trunk.forEach(p => add(p[0], p[1], p[2]));
    if (narrow) add(W - 7, A.b + 34, 0);
    else { add(A.l + A.w * 0.7, A.b + 110, 10); add(mx, A.b + 260, 0); }
    let side = 1;
    for (let y = A.b + (narrow ? 360 : 560); y < E.t - 420; y += 340) { add(mx + side * sway, y, side * 24); side = -side; }
    if (narrow) {
      /* von unten rechts unter dem Schlusssatz hindurch zur Blüte */
      add(W - 7, E.b + 10, 0);
      add(Math.min(W - 40, E.l + 110), E.b + 34, 10);
    } else {
      add(mx, E.t - 260, 0);
      add(Math.min(mx - 40, E.l + 220), E.t - 70, 20);
    }
    add(E.l + E.w * 0.5 + 6, E.t + E.h * 0.5, 30);

    /* Stängel */
    const out = { P: [], N: [], C: [], G: [], I: [] };
    const curve = curveOf(P);
    const Lpx = curve.getLength() / unit;
    totalG = Lpx;
    const segs = Math.ceil(Lpx / 5);
    const rMain = u => (9 - 3.5 * u) * sc;
    tube(curve, segs, 10, rMain, u => u * Lpx, out);
    /* Stützpunkte für Scroll zu Wachstum: kumuliertes Maximum der Seiten-y */
    mainY = []; mainG = [];
    const pts = curve.getSpacedPoints(segs);
    let cm = -1e9;
    const mainPx = pts.map((p, i) => { const x = p.x / unit + W / 2, y = -p.y / unit; cm = Math.max(cm, y); mainY.push(cm); mainG.push(i / segs * Lpx); return [x, y]; });
    const gAt = (x, y, from = 0, to = mainPx.length) => {
      let best = 0, bd = 1e18;
      for (let i = from; i < to; i++) { const d = (mainPx[i][0] - x) ** 2 + (mainPx[i][1] - y) ** 2; if (d < bd) { bd = d; best = i; } }
      return mainG[best];
    };
    const trunkI0 = Math.max(0, Math.floor(mainPx.findIndex(p => p[1] >= trunk[0][1]) - 5));

    /* Zweige (Regale) und Triebe (Gruppen) */
    LD = []; LX = []; BD = []; LB = []; twigTips = [];
    T.twigs.forEach((tw, ti) => {
      const tp = tw.pts.map(p => [A.l + p[0], A.t + p[1], p[2]]);
      const g0 = gAt(tp[0][0], tp[0][1], trunkI0);
      const tl = lenPx(tp);
      tube(curveOf(tp), Math.ceil(tl / 4), 7, u => (4.2 - 3.2 * u) * sc, u => g0 + u * tl * 0.75, out);
      twigTips.push({ g: g0 + tl * 0.75, el: T.labels[ti] });
      const N = 24;
      tw.sprigs.forEach(sp => {
        const gs = g0 + sp.s0 * (N / (tw.pts.length - 1)) * tl * 0.75;
        const spp = sp.pts.map(p => [A.l + p[0], A.t + p[1], p[2]]);
        const sl = lenPx(spp);
        tube(curveOf(spp), Math.max(6, Math.ceil(sl / 4)), 5, u => (2 - 1.3 * u) * sc, u => gs + u * sl * 0.75, out);
        sp.leaves.forEach((l, k) => {
          LD.push({
            p: V(A.l + l.x, A.t + l.y, l.z), ang: -l.ang, tilt: l.tilt, size: l.size * unit,
            g: gs + l.s * sl * 0.75, ai: l.ai, rot: l.rot, ph: Math.random() * 6.28,
            col: leafColor(l.ai), jit: ((l.ai * 7919) % 13) / 13 - 0.5
          });
        });
        /* Spitze des Triebs: hier blüht es, wenn das Lernfeld geschafft ist (k: 0 zu, 1 offen) */
        if (sp.lf) {
          const tp = spp[spp.length - 1];
          LB.push({ n: sp.lf, p: V(tp[0], tp[1], tp[2] + 8), g: gs + sl * 0.75, size: T.leafBase * 1.3 * unit, k: lfDone.has(sp.lf) ? 1 : 0 });
        }
      });
    });

    /* Kleine Spiralranken und Deko-Blätter am Stängel, außerhalb des Baums und der Bühne */
    const decoCol = [0x4BAF73, 0x5FBF84, 0x3FA16A].map(c => new THREE.Color(c));
    let nextDeco = 0, nextCurl = 0, flip = 1;
    for (let i = 2; i < pts.length - 2; i++) {
      const g = mainG[i], [x, y] = mainPx[i];
      const inTree = i >= trunkI0 && y <= A.b + 40 && y >= A.t - 80;
      const inStage = y < S.b + 20;
      if (inTree || inStage || g > totalG - 120) continue;
      const a = pts[i - 2], b = pts[i + 2];
      const th = Math.atan2(-(b.y - a.y), b.x - a.x);
      if (g >= nextDeco) {
        nextDeco = g + (narrow ? 170 : 150);
        const sz = (narrow ? 15 : 22) * (0.85 + Math.random() * 0.3) * unit;
        [1, -1].forEach(sg => LX.push({ p: pts[i].clone(), ang: -(th + sg * 1.05), tilt: (Math.random() - 0.5) * 1.2, size: sz, g, ph: Math.random() * 6.28, col: decoCol[(i + sg + 3) % 3] }));
      }
      if (g >= nextCurl) {
        nextCurl = g + (narrow ? 360 : 300);
        const cr = (narrow ? 7 : 11), nrm = th + flip * Math.PI / 2; flip = -flip;
        const c0 = [x + Math.cos(nrm) * cr * 1.6, y + Math.sin(nrm) * cr * 1.6];
        const cp = [[x, y, 0]];
        for (let k = 0; k <= 16; k++) {
          const a2 = nrm + Math.PI + k / 16 * Math.PI * 3.2 * flip, rr = cr * (1 - k / 22);
          cp.push([c0[0] + Math.cos(a2) * rr, c0[1] + Math.sin(a2) * rr, k * 0.6]);
        }
        tube(curveOf(cp), 40, 4, u => (1.3 - 0.8 * u) * sc, u => g + 20 + u * 90, out);
      }
    }
    /* Blüte am Ende: fünf Blütenblätter in Markierungsgelb */
    const end = pts[pts.length - 1];
    core.position.copy(end); core.position.z += 4 * unit; coreG = totalG - 40; coreS = (narrow ? 7 : 10) * unit;
    for (let k = 0; k < 5; k++) LX.push({ p: end.clone(), ang: k / 5 * Math.PI * 2 + 0.3, tilt: 0.35, size: (narrow ? 26 : 38) * unit, g: totalG - 60, ph: k, col: new THREE.Color(0xE2F06A), petal: true });
    /* Blüte je Abschnitt (01 Ranke bis 06 Mitmachen) an einem kurzen Zweig, der vom Stängel zur Seitenmitte hin abgeht.
       Sitzt auf Höhe der Abschnittsnummer; hat der Abschnitt einen eigenen Hintergrund (Prüfungsblock), knapp darüber. */
    SC = [];
    const pr = narrow ? 40 : 60;
    ['#ranke', '#regale', '#lernfelder', '#katalog', '#pruefung', '#mitmachen'].forEach((sel, n) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      const solid = !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(cs.backgroundColor);
      const L0 = narrow ? 74 : 118, rise = L0 * 0.42;
      const fy = solid ? r.top + sy - pr - 10 : r.top + sy + parseFloat(cs.paddingTop) + 10;
      const i = mainY.findIndex(v => v >= fy + rise);
      if (i < 0 || mainG[i] > totalG - 200) return;
      const [x, y] = mainPx[i], z = pts[i].z / unit, dir = x > W / 2 ? -1 : 1;
      /* lang genug, dass die Blüte ganz im Bild liegt */
      const L = Math.max(L0, dir < 0 ? x - (W - pr - 4) : pr + 4 - x);
      const bp = [];
      for (let k = 0; k <= 10; k++) { const s = k / 10; bp.push([x + dir * L * s, y - rise * Math.sin(s * Math.PI / 2), z + s * 12]); }
      const g0 = mainG[i], bl = lenPx(bp), gEnd = g0 + bl * 0.75;
      tube(curveOf(bp), 16, 6, u => (2.8 - 1.6 * u) * sc, u => g0 + u * bl * 0.75, out);
      const tip = V(...bp[10]);
      SC.push({ p: tip.clone().setZ(tip.z + 4 * unit), g: gEnd, size: (narrow ? 11 : 16) * unit });
      for (let k = 0; k < 5; k++) LX.push({ p: tip.clone(), ang: k / 5 * Math.PI * 2 + 0.3 + n, tilt: 0.35, size: pr * unit, g: gEnd - 20, ph: k + n, col: new THREE.Color(0xE2F06A), petal: true });
    });

    /* Geometrie setzen */
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(out.P, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(out.N, 3));
    geo.setAttribute('aCenter', new THREE.Float32BufferAttribute(out.C, 3));
    geo.setAttribute('aG', new THREE.Float32BufferAttribute(out.G, 1));
    geo.setIndex(out.I);
    stem.geometry.dispose(); stem.geometry = geo;

    [dataLeaves, decoLeaves, buds, secCores, lfPetals, lfCores, beeBodies, beeHeads, beeWings].forEach(m => { if (m) { scene.remove(m); m.dispose(); } });
    dataLeaves = new THREE.InstancedMesh(leafGeo, leafMat, Math.max(1, LD.length));
    decoLeaves = new THREE.InstancedMesh(leafGeo, leafMat, Math.max(1, LX.length));
    BD = LD.filter(l => l.rot);
    buds = new THREE.InstancedMesh(budGeo, budMat, Math.max(1, BD.length));
    secCores = new THREE.InstancedMesh(budGeo, core.material, Math.max(1, SC.length));
    secCores.count = SC.length;
    lfPetals = new THREE.InstancedMesh(leafGeo, leafMat, Math.max(1, LB.length * 5));
    lfCores = new THREE.InstancedMesh(budGeo, core.material, Math.max(1, LB.length));
    lfPetals.count = LB.length * 5; lfCores.count = LB.length;
    BE = [];
    LB.forEach((b, i) => [1, -1].forEach((dir, k) => BE.push({ i, dir, ph: i * 1.7 + k * Math.PI, sp: 0.9 + ((i * 37 + k * 11) % 7) / 14 })));
    beeBodies = new THREE.InstancedMesh(beeBodyGeo, beeBodyMat, Math.max(1, BE.length));
    beeHeads = new THREE.InstancedMesh(budGeo, beeHeadMat, Math.max(1, BE.length));
    beeWings = new THREE.InstancedMesh(wingGeo, wingMat, Math.max(1, BE.length * 2));
    beeBodies.count = beeHeads.count = BE.length; beeWings.count = BE.length * 2;
    [dataLeaves, decoLeaves, buds, secCores, lfPetals, lfCores, beeBodies, beeHeads, beeWings].forEach(m => { m.frustumCulled = false; scene.add(m); });
    LD.forEach((l, i) => { l.col = leafColor(l.ai, l.jit); dataLeaves.setColorAt(i, l.col); });
    LX.forEach((l, i) => decoLeaves.setColorAt(i, l.col));
    const petalCol = new THREE.Color(0xE2F06A);
    for (let i = 0; i < LB.length * 5; i++) lfPetals.setColorAt(i, petalCol);
    /* einmal in voller Größe setzen, damit die Hüllkugel für das Anklicken stimmt */
    setLeaves(dataLeaves, LD, 1e9, 0, -1); dataLeaves.computeBoundingSphere();
    built = true;
    hoverI = -1;
  }

  const q = new THREE.Quaternion(), qz = new THREE.Quaternion(), qx = new THREE.Quaternion(), m4 = new THREE.Matrix4(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  const AZ = new THREE.Vector3(0, 0, 1), AX = new THREE.Vector3(1, 0, 0);
  function leafScale(l, g){ return smooth(clamp01((g - l.g) / 80)); }
  function setLeaves(mesh, arr, g, t, hi){
    const wind = reduce.matches ? 0 : 1;
    arr.forEach((l, i) => {
      const k = leafScale(l, g);
      const sw = Math.sin(t * 1.3 + l.ph) * 0.07 * wind;
      qz.setFromAxisAngle(AZ, l.ang + sw);
      qx.setFromAxisAngle(AX, l.tilt + Math.sin(t * 0.9 + l.ph * 1.7) * 0.12 * wind);
      q.multiplyQuaternions(qz, qx);
      const s = Math.max(1e-5, l.size * k * (i === hi ? 1.35 : 1));
      m4.compose(l.p, q, sv.set(s, s, s));
      mesh.setMatrixAt(i, m4);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  function setBuds(g){
    BD.forEach((l, i) => {
      const k = leafScale(l, g + 20);
      const s = Math.max(1e-5, l.size * 0.15 * k);
      m4.compose(l.p, q.identity(), sv.set(s, s, s));
      buds.setMatrixAt(i, m4);
    });
    buds.instanceMatrix.needsUpdate = true;
  }
  function setCores(g){
    SC.forEach((c, i) => {
      const s = Math.max(1e-5, c.size * smooth(clamp01((g - c.g) / 80)));
      m4.compose(c.p, q.identity(), sv.set(s, s, s));
      secCores.setMatrixAt(i, m4);
    });
    secCores.instanceMatrix.needsUpdate = true;
  }
  /* Blüte am Trieb: wächst mit der Ranke und geht auf, sobald das Lernfeld geschafft ist (und zu, wenn nicht mehr) */
  function setBlooms(g, dt){
    LB.forEach((b, i) => {
      const tgt = lfDone.has(b.n) ? 1 : 0;
      b.k = reduce.matches ? tgt : b.k + (tgt - b.k) * Math.min(1, dt * 2.4);
      const k = smooth(clamp01((g - b.g) / 80)) * smooth(clamp01(b.k));
      const s = Math.max(1e-5, b.size * k);
      for (let j = 0; j < 5; j++) {
        qz.setFromAxisAngle(AZ, j / 5 * Math.PI * 2 + b.n + (1 - k) * 0.8);
        qx.setFromAxisAngle(AX, 0.35);
        q.multiplyQuaternions(qz, qx);
        m4.compose(b.p, q, sv.set(s, s, s));
        lfPetals.setMatrixAt(i * 5 + j, m4);
      }
      const c = Math.max(1e-5, b.size * 0.3 * k);
      pv.copy(b.p); pv.z += 2 * unit;
      m4.compose(pv, q.identity(), sv.set(c, c, c));
      lfCores.setMatrixAt(i, m4);
    });
    lfPetals.instanceMatrix.needsUpdate = true;
    lfCores.instanceMatrix.needsUpdate = true;
  }
  /* Bienen fliegen in Achten um die offene Blüte, mal davor, mal dahinter. Fliegen sie nach links, drehen sie sich um die
     Längsachse, damit die Flügel oben bleiben. Bei reduzierter Bewegung sitzen sie still neben der Blüte. */
  const mF = new THREE.Matrix4(), mL = new THREE.Matrix4(), mT = new THREE.Matrix4(), mR = new THREE.Matrix4(), mS = new THREE.Matrix4();
  const qRoll = new THREE.Quaternion().setFromAxisAngle(AX, Math.PI), one = new THREE.Vector3(1, 1, 1);
  function setBees(g, t){
    BE.forEach((e, j) => {
      const b = LB[e.i];
      const k = smooth(clamp01((g - b.g) / 80)) * smooth(clamp01(b.k));
      /* am Handy sind die Blüten klein, die Bienen sollen trotzdem erkennbar bleiben */
      const L = Math.max(1e-5, Math.max(b.size * 0.3, 7.5 * unit) * k), R = Math.max(b.size * 1.6, 30 * unit);
      let x, y, z, head;
      if (reduce.matches) {
        x = b.p.x + e.dir * R * 0.8; y = b.p.y + R * 0.45; z = b.p.z + 2 * unit; head = e.dir > 0 ? Math.PI : 0;
      } else {
        const at = a => [b.p.x + Math.cos(a) * R, b.p.y + Math.sin(a * 2) * R * 0.32 + Math.sin(t * 2.1 + e.ph) * R * 0.07, b.p.z + Math.sin(a) * R * 0.7];
        const a = t * e.sp * e.dir + e.ph, n = at(a + 0.05 * e.dir);
        [x, y, z] = at(a);
        head = Math.atan2(n[1] - y, n[0] - x);
      }
      qz.setFromAxisAngle(AZ, head);
      if (Math.cos(head) < 0) qz.multiply(qRoll);
      mF.compose(pv.set(x, y, z), qz, one);
      beeBodies.setMatrixAt(j, mL.multiplyMatrices(mF, mS.makeScale(L, L * 0.64, L * 0.64)));
      mT.makeTranslation(L * 1.02, L * 0.1, 0);
      beeHeads.setMatrixAt(j, mL.multiplyMatrices(mF, mT).multiply(mS.makeScale(L * 0.46, L * 0.46, L * 0.46)));
      const flap = reduce.matches ? 0.3 : 0.25 + 0.75 * Math.abs(Math.sin(t * 34 + e.ph));
      [[L * 0.12, 0.2], [-L * 0.32, -0.25]].forEach(([hx, tilt], w) => {
        mT.makeTranslation(hx, L * 0.5, (w ? -1 : 1) * L * 0.15);
        mR.makeRotationZ(tilt).multiply(mL.makeRotationX(flap * (w ? -1 : 1)));
        beeWings.setMatrixAt(j * 2 + w, mL.multiplyMatrices(mF, mT).multiply(mR).multiply(mS.makeScale(L * 0.5, L * 0.6, 1)));
      });
    });
    beeBodies.instanceMatrix.needsUpdate = true; beeHeads.instanceMatrix.needsUpdate = true; beeWings.instanceMatrix.needsUpdate = true;
  }

  /* Hover und Klick auf Blätter, nur im Bereich des Baums */
  /* Lernstand: blass = noch nicht, grün = gelesen, dunkelgrün = sitzt (Farben aus app.js) */
  const LEAF = F.LEAF.map(c => new THREE.Color(c));
  function leafColor(ai, jit = 0){
    const c = LEAF[F.stand.get(F.pathOf(F.D.artikel[ai]))].clone();
    return c.offsetHSL(0, 0, jit * 0.05);
  }
  function recolor(){
    if (!dataLeaves) return;
    LD.forEach((l, i) => { l.col = leafColor(l.ai, l.jit); dataLeaves.setColorAt(i, i === hoverI ? hiCol : l.col); });
    dataLeaves.instanceColor.needsUpdate = true;
  }
  addEventListener('fiae-stand', recolor);
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const hiCol = new THREE.Color(0x8FE3B5);
  let hoverI = -1, armed = -1, twigOn = false;
  function pick(){
    const A = document.getElementById('a-ranke').getBoundingClientRect();
    const hb = document.getElementById('top').getBoundingClientRect().bottom;
    if (pX < A.left || pX > A.right || pY < Math.max(A.top, hb) || pY > A.bottom) return -1;
    ndc.set(pX / W * 2 - 1, -(pY / H) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(dataLeaves, false)[0];
    if (!hit || leafScale(LD[hit.instanceId], U.uGrow.value) < 0.6) return -1;
    return hit.instanceId;
  }
  function setHover(i){
    if (i === hoverI) return;
    if (hoverI >= 0) dataLeaves.setColorAt(hoverI, LD[hoverI].col);
    hoverI = i;
    if (i >= 0) {
      dataLeaves.setColorAt(i, hiCol);
      const a = F.D.artikel[LD[i].ai], r = F.REG.find(x => x.id === a.r);
      const touch = pType === 'touch';
      const st = ['noch nicht gelesen', 'gelesen', 'sitzt'][F.stand.get(F.pathOf(a))];
      F.tip.show(`<b>${esc(a.t)}</b>${esc(r.name)} · ${esc(a.g)}${a.rot ? ', mit Prüfungs-Ampel' : ''}<br><span>${st}, ${touch ? 'nochmal tippen zum Lesen' : 'klicken zum Lesen'}</span>`, pX, pY);
    } else F.tip.hide();
    dataLeaves.instanceColor.needsUpdate = true;
    F.hoverBlock = i >= 0;
  }
  addEventListener('click', e => {
    if (!built || e.target.closest('a,button,input,textarea,select,summary')) return;
    const i = pick();
    if (i < 0) {
      armed = -1;
      /* kein Blatt getroffen: vielleicht ein Zweig, dann zur Kachel des Regals */
      const tw = F.twigAt(pX, pY, pType === 'touch' ? 22 : 14);
      if (tw) { F.hotTwig(null); F.openTile('r-' + tw); }
      return;
    }
    if (pType === 'touch' && armed !== i) { armed = i; setHover(i); return; }
    armed = -1;
    F.tip.hide();
    const h = F.artUrl(F.D.artikel[LD[i].ai]);
    if (F.go) F.go(h); else location.hash = h;
  });

  /* Neu bauen, wenn sich Fenster oder Seitenhöhe ändern */
  let bt = 0;
  const rebuild = () => { clearTimeout(bt); bt = setTimeout(() => { try { build(); } catch (e) { console.error('Ranke neu bauen:', e); } }, 180); };
  /* Nur die Höhe hat sich geändert (Adressleiste auf dem Handy): gleicher Maßstab, nur der Blickwinkel wächst mit */
  addEventListener('resize', () => {
    if (!built || innerWidth !== W) { rebuild(); return; }
    H = innerHeight;
    renderer.setSize(W, H, true);
    camera.aspect = W / H;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(H * unit / (2 * CZ)));
    camera.updateProjectionMatrix();
  });
  addEventListener('fiae-tree', rebuild);
  let bodyH = 0;
  new ResizeObserver(() => { const h = document.body.offsetHeight; if (h !== bodyH) { bodyH = h; rebuild(); } }).observe(document.body);
  let lastSy = -1, frameN = 0;

  let last = performance.now(), running = false;
  function step(){
    const now = performance.now();
    if (F.sheetOpen) { last = now; return; }
    quality(now - last);
    const dt = Math.min(0.033, Math.max(0, (now - last) / 1000)); last = now;
    const t = now / 1000;
    const sy = scrollY;
    camera.position.set(0, -(sy + H / 2) * unit, CZ);
    /* Ziel: so weit gewachsen, wie die Seite bis knapp über den unteren Rand gescrollt ist */
    const front = sy + H * 0.92;
    let target = totalG + 400;
    if (!reduce.matches) {
      let lo = 0, hi = mainY.length - 1;
      if (mainY[hi] > front) { while (lo < hi) { const mid = (lo + hi) >> 1; if (mainY[mid] > front) hi = mid; else lo = mid + 1; } target = mainG[lo]; }
    }
    const g = U.uGrow.value, diff = target - g;
    if (reduce.matches) U.uGrow.value = target;
    else if (Math.abs(diff) > 0.5) {
      /* wächst beim Runterscrollen und läuft beim Hochscrollen im selben Tempo zurück */
      const d = Math.abs(diff);
      U.uGrow.value = g + Math.sign(diff) * Math.min(d, Math.max(d * 2.2 * dt, 260 * dt), (d > 3000 ? 4200 : 1700) * dt);
    }
    const G = U.uGrow.value;
    frameN++;
    const idle = sy === lastSy && Math.abs(G - target) <= 0.5;
    lastSy = sy;
    if (coarse && idle && hoverI < 0 && (frameN & 1)) return;
    setLeaves(dataLeaves, LD, G, t, hoverI);
    setLeaves(decoLeaves, LX, G, t, -1);
    setBuds(G);
    setCores(G);
    setBlooms(G, dt);
    setBees(G, t);
    core.scale.setScalar(Math.max(1e-5, coreS * smooth(clamp01((G - coreG) / 80))));
    twigTips.forEach(tt => tt.el && tt.el.classList.toggle('on', G > tt.g - 60));
    if (pType !== 'touch') {
      setHover(pick());
      const tw = hoverI < 0 ? F.twigAt(pX, pY) : null;
      if (tw) F.hoverBlock = true;
      else if (twigOn) F.hoverBlock = hoverI >= 0;
      twigOn = !!tw;
      F.hotTwig(tw);
    }
    if (hoverI >= 0) F.tip.move(pX, pY);
    renderer.render(scene, camera);
  }
  function safeStep(){ try { if (built) step(); } catch (e) { console.error('Ranke angehalten:', e); stop(); } }
  function start(){ if (!running && !document.hidden) { running = true; last = performance.now(); renderer.setAnimationLoop(safeStep); } }
  function stop(){ running = false; renderer.setAnimationLoop(null); }
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  build();
  start();
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('gl-vine')));
  return true;
}

if (weak) F.loadStep(true); else boot();
