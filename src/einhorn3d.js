/* Udo in 3D: dasselbe Einhorn wie die Zeichnung in einhorn.js, aus Grundformen gebaut (wie die Bienen in scene.js).
   Eigene kleine WebGL-Fläche im Knopf von Udo, über dem Inhalt. einhorn.js steuert Ort, Blickrichtung, Neigung und
   die Zustände (winkt, fliegt); hier wird nur gezeichnet. Klappt WebGL nicht, bleibt die Zeichnung.
   - Wenden: Udo dreht sich wirklich um und schaut dabei kurz in die Kamera.
   - Flügel schlagen langsam, im Flug schnell; Schweif schwingt; ab und zu blinzelt er; beim Winken hebt er den Vorderhuf.
   - Gezeichnet wird nur, solange Udo im Bild ist; bei "weniger Bewegung" steht er still und wird nur bei Änderungen neu gezeichnet. */
export async function baue(api){
  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const { fe, stand } = api;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch (e) { return false; }
  if (!renderer.getContext()) return false;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);
  const cv = renderer.domElement;
  cv.className = 'fe-3d'; cv.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(-2, 5, 6); scene.add(sun);
  const rim = new THREE.DirectionalLight(0xFFC2E3, 0.8); rim.position.set(3, 2, -4); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.set(0.15, 0.85, 11);
  camera.lookAt(0.15, 0.5, 0);

  /* ---------- Materialien ---------- */
  const M = (o) => new THREE.MeshPhysicalMaterial(Object.assign({ roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35 }, o));
  const fell = M({ color: 0xFBF8FF, sheen: 0.6, sheenColor: new THREE.Color(0xD9C2FF), sheenRoughness: 0.5 });
  const schnauze = M({ color: 0xFFE9F3, sheen: 0.4, sheenColor: new THREE.Color(0xFFC2E3) });
  const huf = M({ color: 0xC9B4F5, roughness: 0.3, clearcoat: 0.9 });
  const auge = M({ color: 0x2B1D3D, roughness: 0.15, clearcoat: 1 });
  const weiss = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const backe = new THREE.MeshBasicMaterial({ color: 0xFF9ECF, transparent: true, opacity: 0.55, depthWrite: false });
  const ohrInnen = M({ color: 0xFFC2E3 });
  const gold = M({ color: 0xFFD98A, metalness: 0.55, roughness: 0.25, clearcoat: 1, emissive: new THREE.Color(0xFFB347), emissiveIntensity: 0.18 });
  const spirale = M({ color: 0xF6A5CC, roughness: 0.3, clearcoat: 1 });
  const PASTELL = [0xFF9ECF, 0xC9A8FF, 0x8FE6CB, 0xFFB3D9, 0xB9A0FF];
  const haar = PASTELL.map(c => M({ color: c, roughness: 0.5, sheen: 0.7, sheenColor: new THREE.Color(0xffffff) }));
  const blatt = M({ color: 0x3FA16A, roughness: 0.5 });
  const BLUETE = [0xE2F06A, 0xFFB3D9, 0xA8F0DA];
  const bluete = BLUETE.map(c => M({ color: c, roughness: 0.45 }));
  const fluegelMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, emissive: new THREE.Color(0x6B4A8F), emissiveIntensity: 0.25, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false,
    roughness: 0.15, iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [200, 700], clearcoat: 1 });

  const kugel = new THREE.SphereGeometry(1, 28, 20);
  const mesh = (geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); return m; };

  /* ---------- Udo ---------- */
  const udo = new THREE.Group();          /* Neigung (um die Blickachse) */
  const dreh = new THREE.Group();         /* Blickrichtung (um die Hochachse) */
  const leib = new THREE.Group();         /* Schweben */
  udo.add(dreh); dreh.add(leib); scene.add(udo);

  /* Körper */
  leib.add(mesh(new THREE.CapsuleGeometry(0.6, 0.5, 10, 24).rotateZ(Math.PI / 2), fell, 0, 0, 0, 1, 1, 0.95));
  /* Beine mit Hufen; das vordere, der Kamera zugewandte Bein winkt (Gelenk an der Schulter) */
  const beinGeo = new THREE.CapsuleGeometry(0.17, 0.3, 6, 14), hufGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.15, 18);
  const bein = (x, z) => { const g = new THREE.Group(); g.position.set(x, -0.3, z); g.add(mesh(beinGeo, fell, 0, -0.36, 0)); g.add(mesh(hufGeo, huf, 0, -0.66, 0)); leib.add(g); return g; };
  const beinHL = bein(-0.48, -0.27), beinHR = bein(-0.42, 0.27), beinVL = bein(0.4, -0.27), wink = bein(0.47, 0.27);
  /* Hals und Kopf */
  leib.add(mesh(new THREE.CapsuleGeometry(0.32, 0.45, 8, 18), fell, 0.62, 0.52, 0).rotateZ(-0.55));
  const kopf = new THREE.Group(); kopf.position.set(0.95, 1.08, 0); kopf.scale.setScalar(1.2); leib.add(kopf);
  kopf.add(mesh(kugel, fell, 0, 0, 0, 0.52, 0.47, 0.45));
  kopf.add(mesh(kugel, schnauze, 0.42, -0.17, 0, 0.34, 0.28, 0.3));
  [-1, 1].forEach(s => {
    kopf.add(mesh(kugel, auge, 0.73, -0.1, s * 0.09, 0.025));                     /* Nüstern */
    kopf.add(mesh(kugel, backe, 0.3, -0.16, s * 0.36, 0.1, 0.06, 0.04));
    const ohr = new THREE.Group(); ohr.position.set(-0.14, 0.4, s * 0.2); ohr.rotation.set(s * -0.25, 0, 0.25); kopf.add(ohr);
    ohr.add(mesh(new THREE.ConeGeometry(0.12, 0.34, 16), fell, 0, 0.12, 0));
    ohr.add(mesh(new THREE.ConeGeometry(0.07, 0.24, 12), ohrInnen, 0.03, 0.1, 0));
  });
  /* Augen auf beiden Seiten, mit Glanzpunkt; blinzeln über scale.y */
  const augen = [];
  [-1, 1].forEach(s => {
    const a = new THREE.Group(); a.position.set(0.24, 0.06, s * 0.37); a.rotation.y = s * -0.35; kopf.add(a);
    a.add(mesh(kugel, auge, 0, 0, 0, 0.085, 0.11, 0.05));
    a.add(mesh(kugel, weiss, 0.03, 0.04, s * 0.04, 0.028));
    augen.push(a);
  });
  /* Horn: goldener Kegel mit rosa Spirale, an der Spitze ein Schimmer */
  const horn = new THREE.Group(); horn.position.set(0.12, 0.4, 0); horn.rotation.z = -0.32; kopf.add(horn);
  horn.add(mesh(new THREE.ConeGeometry(0.1, 0.7, 24), gold, 0, 0.35, 0));
  const helix = [];
  for (let k = 0; k <= 60; k++) { const u = k / 60, r = 0.1 * (1 - u) + 0.006, a = u * Math.PI * 2 * 3.2; helix.push(new THREE.Vector3(Math.cos(a) * r, u * 0.68, Math.sin(a) * r)); }
  horn.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 120, 0.014, 6), spirale));
  const glanzTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,248,220,1)'); gr.addColorStop(0.35, 'rgba(255,214,235,.6)'); gr.addColorStop(1, 'rgba(255,214,235,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const glanz = new THREE.Sprite(new THREE.SpriteMaterial({ map: glanzTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glanz.position.set(0, 0.72, 0); glanz.scale.setScalar(0.2); horn.add(glanz);
  /* Perlen entlang einer Kurve: Wolkenmähne und Schweif in Pastell, dünner werdend */
  const perlen = (pts, r0, r1, n, versatz, ziel) => {
    const kurve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1), p = kurve.getPointAt(u), r = r0 + (r1 - r0) * u;
      ziel.add(mesh(kugel, haar[(k + versatz) % haar.length], p.x, p.y, p.z, r));
    }
  };
  perlen([[0.18, 0.42, 0], [-0.12, 0.44, 0], [-0.4, 0.2, 0], [-0.55, -0.15, 0], [-0.62, -0.5, 0]], 0.17, 0.11, 11, 0, kopf);
  perlen([[0.22, 0.4, 0.12], [0.36, 0.34, 0.2]], 0.11, 0.08, 3, 2, kopf);         /* Stirnlocke */
  perlen([[-0.1, 0.35, -0.16], [-0.45, 0.05, -0.18], [-0.6, -0.4, -0.16]], 0.13, 0.09, 6, 3, kopf);
  /* Blumenkranz um den Hornansatz */
  for (let k = 0; k < 7; k++) {
    const a = -0.4 + k / 6 * Math.PI * 1.1, x = 0.02 + Math.cos(a) * 0.24, z = Math.sin(a) * 0.3;
    if (k % 2) kopf.add(mesh(kugel, blatt, x, 0.42, z, 0.07, 0.025, 0.04));
    else {
      const b = new THREE.Group(); b.position.set(x, 0.44, z); kopf.add(b);
      for (let j = 0; j < 5; j++) { const w = j / 5 * Math.PI * 2; b.add(mesh(kugel, bluete[(k / 2) % 3], Math.cos(w) * 0.05, 0.01, Math.sin(w) * 0.05, 0.04)); }
      b.add(mesh(kugel, weiss, 0, 0.02, 0, 0.03));
    }
  }
  /* Schweif */
  const schweif = new THREE.Group(); schweif.position.set(-0.85, 0.12, 0); leib.add(schweif);
  perlen([[0, 0, 0], [-0.35, 0.05, 0.05], [-0.55, -0.25, 0.08], [-0.45, -0.6, 0.05], [-0.6, -0.85, 0]], 0.16, 0.08, 10, 1, schweif);
  perlen([[0, -0.05, -0.08], [-0.3, -0.15, -0.12], [-0.38, -0.5, -0.1]], 0.12, 0.07, 6, 4, schweif);
  /* Feenflügel: zwei Lappen je Seite, Gelenk am Rücken */
  const fluegelForm = (() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(-0.15, 0.55, -0.55, 1.05, -0.95, 1.0);
    s.bezierCurveTo(-1.25, 0.95, -1.05, 0.45, -0.55, 0.2);
    s.bezierCurveTo(-0.85, 0.1, -0.95, -0.25, -0.7, -0.35);
    s.bezierCurveTo(-0.45, -0.42, -0.15, -0.2, 0, 0);
    const geo = new THREE.ShapeGeometry(s, 24), pos = geo.attributes.position, col = [];
    const A = new THREE.Color(0xFFB3D9), B = new THREE.Color(0xC9A8FF), C = new THREE.Color(0x8FE6CB), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const u = Math.min(1, Math.hypot(pos.getX(i), pos.getY(i)) / 1.3);
      if (u < 0.5) c.copy(A).lerp(B, u * 2); else c.copy(B).lerp(C, (u - 0.5) * 2);
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return geo;
  })();
  const fluegel = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(-0.1, 0.5, s * 0.18); g.scale.setScalar(0.85); leib.add(g);
    const w = new THREE.Mesh(fluegelForm, fluegelMat); w.rotation.x = s * 0.35; g.add(w);
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
    udo.rotation.z = -(z.kipp * Math.sign(z.blick || 1)) * Math.PI / 180;
    leib.position.y = Math.sin(sek * 1.85) * 0.06;
    /* Flügel */
    const schlag = fliegt ? Math.sin(sek * 22) * 0.55 : Math.sin(sek * 2.2) * 0.14;
    fluegel.forEach(f => { f.g.rotation.x = f.s * (0.15 + schlag); f.g.rotation.z = 0.15 + (fliegt ? 0.1 : 0); });
    schweif.rotation.z = Math.sin(sek * 1.9) * 0.12; schweif.rotation.y = Math.sin(sek * 1.3) * 0.15;
    /* Beine: im Flug angezogen, beim Winken hebt sich der vordere Huf in drei Schwüngen */
    if (winkt && winkT < 0) winkT = t; if (!winkt) winkT = -1;
    let w = 0;
    if (winkT >= 0 && !still) { const u = (t - winkT) / 2200; w = u < 1 ? Math.sin(Math.min(1, u * 6) * Math.PI / 2) * (1.15 + Math.sin(u * Math.PI * 6) * 0.3) * (u > 0.85 ? (1 - u) / 0.15 : 1) : 0; }
    const tuck = fliegt ? 0.55 : 0;
    wink.rotation.z = w + tuck; beinVL.rotation.z = tuck * 0.8; beinHL.rotation.z = -tuck * 0.7; beinHR.rotation.z = -tuck * 0.6;
    kopf.rotation.z = winkt && !still ? Math.sin(sek * 6) * 0.06 + 0.06 : Math.sin(sek * 0.9) * 0.03;
    /* Blinzeln */
    let lid = 1;
    if (!still) { if (t > blinzelNaechst + 140) blinzelNaechst = t + 2500 + Math.random() * 3500; if (t > blinzelNaechst) lid = 0.12; }
    augen.forEach(a => { a.scale.y = lid; });
    glanz.material.opacity = still ? 0.9 : 0.65 + Math.sin(sek * 2.6) * 0.3;
    renderer.render(scene, camera);
  }
  function schleife(t){
    requestAnimationFrame(schleife);
    if (!sichtbar || document.hidden) return;
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
