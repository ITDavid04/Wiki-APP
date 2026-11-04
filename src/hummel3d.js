/* Klaus-Dieter Pollenberg in 3D: dieselbe Hummel wie die Zeichnung in hummel.js, aus Grundformen gebaut (wie die Bienen in scene.js).
   Eigene kleine WebGL-Fläche im Knopf über dem Inhalt. hummel.js steuert Ort, Blickrichtung, Neigung und die Zustände
   (winkt, fliegt); hier wird nur gezeichnet. Klappt WebGL nicht, bleibt die Zeichnung.
   - Flauschig: runder Körper mit Streifen, darauf Fellbüschel (eine Instanz-Form, gefärbt nach Streifen), runde Goldbrille.
   - Wenden: er dreht sich wirklich um und schaut dabei kurz in die Kamera.
   - Flügel zittern leicht, im Flug schwirren sie; Fühler wippen; ab und zu blinzelt er; beim Winken hebt er ein Vorderbein.
   - Gezeichnet wird nur, solange er im Bild ist; in Ruhe mit 30 Bildern pro Sekunde, im Flug und beim Winken mit vollen.
   - Bei "weniger Bewegung" sitzt er still und wird nur bei Änderungen neu gezeichnet.
   - Notbremse: erst messen, dann bauen (über 34 ms pro Bild bleibt die Zeichnung); im Betrieb über 45 ms gibt er sein 3D auf
     (schwache Geräte, und der Testlauf auf GitHub, der 3D ohne Grafikkarte rechnet). */
/* Wie flüssig läuft die Seite gerade? Mittlerer Abstand zwischen n Bildern in ms */
const bildtakt = n => new Promise(r => { const d = []; let l = 0; const f = t => { if (l && t - l < 500) d.push(t - l); l = t; if (d.length < n) requestAnimationFrame(f); else r(d.reduce((a, b) => a + b, 0) / d.length); }; requestAnimationFrame(f); });

export async function baue(api){
  const { fe, stand } = api;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (await bildtakt(40) > 34) { console.info('Klaus-Dieter zeichnet ohne 3D, das Gerät ist dafür zu langsam.'); return false; }
  const THREE = await import('three');

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch (e) { return false; }
  if (!renderer.getContext()) return false;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);
  const cv = renderer.domElement;
  cv.className = 'fe-3d'; cv.setAttribute('aria-hidden', 'true');

  /* Licht: Himmel und Boden, eine Sonne von vorn oben, ein warmer Rand von hinten (billiger als eine Spiegelungsumgebung) */
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xF3E9D2, 2.4));
  const sun = new THREE.DirectionalLight(0xffffff, 2.0); sun.position.set(-2, 5, 6); scene.add(sun);
  const rim = new THREE.DirectionalLight(0xFFE3A0, 1.0); rim.position.set(3, 2, -4); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.set(0.3, 0.6, 11);
  camera.lookAt(0.3, 0.2, 0);

  /* ---------- Farben und Materialien ---------- */
  const GELB = 0xF5C842, SCHWARZ = 0x2A2433, WEISS = 0xFFF6E6;
  const M = o => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.6 }, o));
  const augeW = M({ color: 0xFFFFFF, roughness: 0.25 });
  const pupille = M({ color: 0x1A1420, roughness: 0.15 });
  const glanzW = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const gold = M({ color: 0xE0B04A, metalness: 0.35, roughness: 0.3, emissive: new THREE.Color(0x8A5A10), emissiveIntensity: 0.25 });
  const glas = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  const kopfMat = M({ color: SCHWARZ, roughness: 0.75 });
  const backe = new THREE.MeshBasicMaterial({ color: 0xFF9ECF, transparent: true, opacity: 0.6, depthWrite: false });
  const mund = M({ color: 0xFFC2E3, roughness: 0.4 });
  const beinMat = M({ color: SCHWARZ, roughness: 0.7 });
  const fluegelMat = new THREE.MeshStandardMaterial({ color: 0xEAF6FF, emissive: new THREE.Color(0x9CC8E6), emissiveIntensity: 0.25,
    transparent: true, opacity: 0.6, roughness: 0.15, side: THREE.DoubleSide, depthWrite: false });

  const kugel = new THREE.SphereGeometry(1, 28, 20);
  const mesh = (geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); return m; };

  /* ---------- Klaus-Dieter ---------- */
  const kd = new THREE.Group();          /* Neigung */
  const dreh = new THREE.Group();        /* Blickrichtung */
  const leib = new THREE.Group();        /* Schweben */
  kd.add(dreh); dreh.add(leib); scene.add(kd);

  /* Körper: Streifen nach Länge (x). Vorn gelber Kragen, dann schwarz, gelb, schwarz, weißes Hinterteil */
  const RX = 1.18, RY = 0.98, RZ = 0.98;
  const streifen = x => { const u = (x + RX) / (2 * RX); return u < 0.22 ? WEISS : u < 0.38 ? SCHWARZ : u < 0.56 ? GELB : u < 0.74 ? SCHWARZ : GELB; };
  const leibGeo = new THREE.SphereGeometry(1, 40, 28);
  { const p = leibGeo.attributes.position, c = [], col = new THREE.Color();
    for (let i = 0; i < p.count; i++) { col.set(streifen(p.getX(i) * RX)); c.push(col.r, col.g, col.b); }
    leibGeo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); }
  leib.add(mesh(leibGeo, M({ vertexColors: true, roughness: 0.85 }), 0, 0, 0, RX, RY, RZ));
  /* Fell: kurze Büschel auf der Oberfläche, nach außen gerichtet, in der Farbe ihres Streifens */
  const busch = new THREE.SphereGeometry(1, 8, 6).scale(0.085, 0.1, 0.085).translate(0, 0.035, 0);
  const N = 520, fell = new THREE.InstancedMesh(busch, M({ roughness: 0.95 }), N);
  { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), n = new THREE.Vector3(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1), col = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const y = 1 - (i + 0.5) / N * 2, r = Math.sqrt(1 - y * y), a = i * 2.399963;
      n.set(Math.cos(a) * r, y, Math.sin(a) * r);
      p.set(n.x * RX, n.y * RY, n.z * RZ);
      const nn = new THREE.Vector3(n.x / RX, n.y / RY, n.z / RZ).normalize();
      q.setFromUnitVectors(up, nn);
      s.setScalar(0.85 + ((i * 7919) % 11) / 30);
      m.compose(p, q, s); fell.setMatrixAt(i, m);
      fell.setColorAt(i, col.set(streifen(p.x)));
    } }
  leib.add(fell);
  /* Beine: drei Paare unter dem Körper; das vordere, der Kamera zugewandte Bein winkt (Gelenk oben) */
  const beinGeo = new THREE.CapsuleGeometry(0.06, 0.42, 4, 8);
  const bein = (x, z, k) => { const g = new THREE.Group(); g.position.set(x, -0.8, z); g.rotation.z = k; g.add(mesh(beinGeo, beinMat, 0, -0.24, 0)); leib.add(g); return g; };
  const beine = [bein(-0.45, -0.32, -0.25), bein(0.05, -0.38, -0.05), bein(0.5, -0.32, 0.2), bein(-0.45, 0.32, -0.25), bein(0.05, 0.38, -0.05)];
  const wink = bein(0.55, 0.34, 0.25);
  /* Kopf mit Augen, Brille, Backen, Lächeln und Fühlern */
  const kopf = new THREE.Group(); kopf.position.set(1.22, 0.2, 0); leib.add(kopf);
  kopf.add(mesh(kugel, kopfMat, 0, 0, 0, 0.56, 0.54, 0.54));
  const augen = [];
  const linse = new THREE.TorusGeometry(0.2, 0.032, 10, 32), scheibe = new THREE.CircleGeometry(0.2, 28);
  [-1, 1].forEach(s => {
    /* Auge sitzt vorn seitlich, schaut nach vorn-außen */
    const a = new THREE.Group(); a.position.set(0.44, 0.1, s * 0.27); a.rotation.y = s * -0.6; kopf.add(a);
    const lid = new THREE.Group(); a.add(lid);
    lid.add(mesh(kugel, augeW, 0, 0, 0.02, 0.17, 0.19, 0.09));
    lid.add(mesh(kugel, pupille, 0.02, -0.01, 0.09, 0.095, 0.11, 0.04));
    lid.add(mesh(kugel, glanzW, 0.05, 0.05, 0.125, 0.03));
    augen.push(lid);
    /* Brillenglas vor dem Auge */
    const g = mesh(linse, gold, 0, 0, 0.14); g.scale.setScalar(1.1); a.add(g);
    const sch = mesh(scheibe, glas, 0, 0, 0.14); sch.scale.setScalar(1.1); a.add(sch);
    /* Bügel nach hinten zum Kopf */
    const buegel = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 6), gold, -0.21, 0.02, -0.12);
    buegel.rotation.set(0, 0, Math.PI / 2); buegel.rotation.y = s * 0.0; a.add(buegel);
    kopf.add(mesh(kugel, backe, 0.36, -0.17, s * 0.32, 0.1, 0.06, 0.05));
  });
  /* Steg zwischen den Gläsern, vorn über der Mitte */
  const steg = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.022, 8, 16, Math.PI), gold);
  steg.position.set(0.6, 0.15, 0); steg.rotation.y = Math.PI / 2; kopf.add(steg);
  const laecheln = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 8, 20, Math.PI * 0.8), mund);
  laecheln.position.set(0.53, -0.2, 0); laecheln.rotation.set(0, Math.PI / 2, Math.PI + Math.PI * 0.1); kopf.add(laecheln);
  const fuehler = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(0.22, 0.42, s * 0.16); kopf.add(g);
    const kurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.12, 0.3, s * 0.06), new THREE.Vector3(0.38, 0.5, s * 0.14)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(kurve, 16, 0.025, 6), kopfMat));
    g.add(mesh(kugel, kopfMat, 0.38, 0.5, s * 0.14, 0.06));
    return g;
  });
  /* Flügel: zwei Paare, Gelenk oben auf dem Rücken */
  const flForm = (rx, ry) => new THREE.ShapeGeometry(new THREE.Shape(new THREE.EllipseCurve(-rx, 0, rx, ry, 0, Math.PI * 2).getPoints(28)));
  const fluegel = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(0.2, 0.86, s * 0.18); leib.add(g);
    /* Flügel stehen schräg nach hinten oben, leicht nach außen geneigt, damit man sie von der Seite sieht */
    const gross = new THREE.Mesh(flForm(0.66, 0.3), fluegelMat); gross.rotation.set(s * 0.45, 0, -0.55);
    const klein = new THREE.Mesh(flForm(0.44, 0.2), fluegelMat); klein.position.set(-0.08, -0.06, s * 0.02); klein.rotation.set(s * 0.4, 0, -0.2);
    g.add(gross, klein);
    return { g, s };
  });

  /* ---------- Größe ---------- */
  function groesse(){
    const w = cv.clientWidth || 1, h = cv.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  fe.querySelector('.fe-hub').append(cv);
  fe.classList.add('drei');
  groesse();
  addEventListener('resize', groesse);

  /* ---------- Bewegung ---------- */
  let sichtbar = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { sichtbar = es[0].isIntersecting; }).observe(fe);
  let winkT = -1, blinzelNaechst = 2500, letzteSig = '';
  const wohin = b => -0.5 - (1 - b) / 2 * (Math.PI - 1.0);   /* blick 1: nach rechts, 0: in die Kamera, -1: nach links */
  function zeichne(t){
    const z = stand(), still = reduce.matches;
    const fliegt = fe.classList.contains('fliegt'), winkt = fe.classList.contains('winkt');
    const sek = still ? 0 : t / 1000;
    dreh.rotation.y = wohin(z.blick);
    kd.rotation.z = -(z.kipp * Math.sign(z.blick || 1)) * Math.PI / 180;
    /* Hummeln schaukeln im Flug ein wenig */
    leib.position.y = fliegt ? Math.sin(sek * 7) * 0.05 : Math.sin(sek * 1.85) * 0.04;
    leib.rotation.x = fliegt ? Math.sin(sek * 3.1) * 0.08 : 0;
    /* Flügel: in Ruhe ein leichtes Zittern, im Flug schwirren sie */
    const schlag = fliegt ? Math.sin(sek * 60) * 0.7 : Math.sin(sek * 3) * 0.08;
    fluegel.forEach(f => { f.g.rotation.x = f.s * schlag; });
    fuehler.forEach((f, i) => { f.rotation.z = Math.sin(sek * 2.4 + i) * 0.12 + (winkt && !still ? Math.sin(sek * 14) * 0.2 : 0); });
    /* Beine: im Flug angezogen, beim Winken hebt sich ein Vorderbein in drei Schwüngen */
    if (winkt && winkT < 0) winkT = t; if (!winkt) winkT = -1;
    let w = 0;
    if (winkT >= 0 && !still) { const u = (t - winkT) / 2200; w = u < 1 ? Math.sin(Math.min(1, u * 6) * Math.PI / 2) * (1.6 + Math.sin(u * Math.PI * 6) * 0.4) * (u > 0.85 ? (1 - u) / 0.15 : 1) : 0; }
    const tuck = fliegt ? 0.7 : 0;
    wink.rotation.z = 0.25 + w + tuck;
    beine.forEach((b, i) => { b.rotation.x = 0; b.rotation.z = [-0.25, -0.05, 0.2][i % 3] + (fliegt ? (i % 3 === 2 ? tuck : -tuck * 0.8) : 0); });
    kopf.rotation.z = winkt && !still ? Math.sin(sek * 6) * 0.06 + 0.05 : Math.sin(sek * 0.9) * 0.03;
    /* Blinzeln */
    let lid = 1;
    if (!still) { if (t > blinzelNaechst + 140) blinzelNaechst = t + 2500 + Math.random() * 3500; if (t > blinzelNaechst) lid = 0.12; }
    augen.forEach(a => { a.scale.y = lid; });
    renderer.render(scene, camera);
  }
  /* Notbremse: Abstände zwischen den Bildern messen, in denen er gezeichnet hat */
  let aus = false, letzt = 0, summe = 0, n = 0, start = 0, letztesBild = 0;
  function aufgeben(){
    aus = true;
    removeEventListener('resize', groesse);
    renderer.dispose(); renderer.forceContextLoss();
    cv.remove(); fe.classList.remove('drei');
    console.info('Klaus-Dieter zeichnet ohne 3D, das Gerät ist dafür zu langsam.');
  }
  function schleife(t){
    if (aus) return;
    requestAnimationFrame(schleife);
    if (!sichtbar || document.hidden) { letzt = 0; return; }
    if (letzt && t - letzt < 500) { summe += t - letzt; n++; }
    letzt = t;
    if (!start) start = t;
    if (n >= 30) { if (t - start > 1500 && summe / n > 45) return aufgeben(); summe = 0; n = 0; }
    /* In Ruhe reichen 30 Bilder pro Sekunde */
    const lebhaft = fe.classList.contains('fliegt') || fe.classList.contains('winkt');
    if (!lebhaft && !reduce.matches && t - letztesBild < 30) return;
    letztesBild = t;
    if (reduce.matches) {
      const z = stand(), sig = z.blick.toFixed(2) + z.kipp.toFixed(1) + fe.className;
      if (sig === letzteSig) return;
      letzteSig = sig;
    }
    zeichne(t);
  }
  requestAnimationFrame(schleife);
  return true;
}
