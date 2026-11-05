/* Klaus-Dieter Pollenberg in 3D: dieselbe Hummel wie die Zeichnung in hummel.js, aus Grundformen gebaut (wie die Bienen in scene.js).
   Eigene kleine WebGL-Fläche im Knopf über dem Inhalt. hummel.js steuert Ort, Blickrichtung, Neigung und die Zustände
   (winkt, fliegt); hier wird nur gezeichnet. Klappt WebGL nicht, bleibt die Zeichnung.
   - Aussehen: runder blauer Plüsch-Knubbel mit samtiger Oberfläche, dunkelblaue und gelbe Streifen hinten, das Gesicht sitzt
     vorn am Körper: große glänzende Kulleraugen mit Lichtpunkten, Bäckchen, kleines Lächeln. Fühler mit gelben Spitzen,
     durchscheinende Flügel mit Adern, Stummelbeinchen, und in den Händchen eine kleine gelbe Blume.
   - Wenden: er dreht sich wirklich um und schaut dabei kurz in die Kamera.
   - Flügel zittern leicht, im Flug schwirren sie; Fühler wippen; ab und zu blinzelt er; beim Winken hebt er ein Beinchen.
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
  scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xDCE6F5, 2.3));
  const sun = new THREE.DirectionalLight(0xffffff, 2.0); sun.position.set(-1.5, 4, 6); scene.add(sun);
  const rim = new THREE.DirectionalLight(0xFFE9B0, 1.2); rim.position.set(-3, 2, -4); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.set(0.1, 0.55, 11);
  camera.lookAt(0.1, 0.25, 0);

  /* ---------- Farben und Materialien ---------- */
  const NAVY = new THREE.Color(0x1E2550);
  const M = o => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.6 }, o));
  const auge = M({ color: 0x0E1730, roughness: 0.12 });
  const iris = M({ color: 0x3A5A9A, roughness: 0.2 });
  const weiss = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const backe = new THREE.MeshBasicMaterial({ color: 0xFF7FAE, transparent: true, opacity: 0.5, depthWrite: false });
  const navy = M({ color: NAVY, roughness: 0.8 });
  const gelb = M({ color: 0xF5C842, roughness: 0.55 });
  const bluetenGelb = M({ color: 0xFFD54A, roughness: 0.5 }), bluetenMitte = M({ color: 0xF29A2E, roughness: 0.5 }), stiel = M({ color: 0x3FA16A });

  const kugel = new THREE.SphereGeometry(1, 28, 20);
  const mesh = (geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); return m; };

  /* ---------- Klaus-Dieter ---------- */
  const kd = new THREE.Group();          /* Neigung */
  const dreh = new THREE.Group();        /* Blickrichtung */
  const leib = new THREE.Group();        /* Schweben */
  kd.add(dreh); dreh.add(leib); scene.add(kd);

  /* Körper: ein runder Knubbel, vorn das Gesicht, hinten Streifen (dunkelblau, gelb, dunkelblau, blauer Po mit Ring).
     Die Streifen sind auf eine schmale Leinwand gemalt und liegen längs auf der Kugel (Pole vorn und hinten), so bleiben die
     Kanten sauber; samtig durch Sheen wie bei Plüsch */
  const RX = 1.12, RY = 1, RZ = 1;
  const streifenTex = (() => {
    const c = document.createElement('canvas'); c.width = 4; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#6E97E0'; g.fillRect(0, 0, 4, 512);
    /* x-Bereich auf der Kugel (1 vorn, -1 hinten) in Bildzeilen: Zeile = acos(x) / pi */
    const zeile = x => Math.acos(Math.max(-1, Math.min(1, x))) / Math.PI * 512;
    [[0.52, 0.3, '#1E2550'], [0.3, 0.04, '#F2C14E'], [0.04, -0.24, '#1E2550'], [-0.56, -0.74, '#1E2550']].forEach(([a, b, f]) => {
      g.fillStyle = f; g.fillRect(0, zeile(a), 4, zeile(b) - zeile(a));
    });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  })();
  /* Pol leicht nach oben gekippt: die Streifen laufen schräg, unten weiter vorn als oben (wie auf dem Bild) */
  const leibGeo = new THREE.SphereGeometry(1, 64, 48).rotateZ(-Math.PI / 2 + 0.6);
  const samt = new THREE.MeshPhysicalMaterial({ map: streifenTex, roughness: 0.75, sheen: 1, sheenColor: new THREE.Color(0xDCE8FF), sheenRoughness: 0.45 });
  leib.add(mesh(leibGeo, samt, 0, 0, 0, RX, RY, RZ));
  /* Punkt auf der Körperoberfläche in Richtung (x, y, z), etwas nach außen versetzt */
  const auf = (x, y, z, raus = 0) => { const v = new THREE.Vector3(x, y, z).normalize(); return new THREE.Vector3(v.x * (RX + raus), v.y * (RY + raus), v.z * (RZ + raus)); };
  const ausrichten = (o, p) => { o.position.copy(p); o.lookAt(p.clone().multiplyScalar(2)); };

  /* Gesicht (dreht beim Nicken mit) */
  const kopf = new THREE.Group(); leib.add(kopf);
  const augen = [];
  [-1, 1].forEach(s => {
    const a = new THREE.Group(); ausrichten(a, auf(0.93, 0.16, s * 0.33, -0.02)); kopf.add(a);
    const lid = new THREE.Group(); a.add(lid);
    lid.add(mesh(kugel, auge, 0, 0, 0.03, 0.22, 0.25, 0.1));
    lid.add(mesh(kugel, iris, 0.02, -0.05, 0.08, 0.12, 0.12, 0.05));
    lid.add(mesh(kugel, weiss, -0.07, 0.09, 0.12, 0.075));
    lid.add(mesh(kugel, weiss, 0.07, -0.09, 0.115, 0.032));
    augen.push(lid);
    const b = new THREE.Group(); ausrichten(b, auf(0.86, -0.12, s * 0.52, 0.0)); kopf.add(b);
    b.add(mesh(kugel, backe, 0, 0, 0.02, 0.14, 0.08, 0.03));
  });
  const laecheln = new THREE.Group(); ausrichten(laecheln, auf(1, -0.08, 0, 0.005)); kopf.add(laecheln);
  const bogen = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.02, 8, 20, Math.PI * 0.75), navy);
  bogen.rotation.z = Math.PI + Math.PI * 0.125; laecheln.add(bogen);
  /* Fühler: dunkelblau, mit gelber Spitze */
  const fuehler = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.copy(auf(0.42, 0.9, s * 0.24, -0.04)); kopf.add(g);
    const kurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, 0.3, s * 0.08), new THREE.Vector3(0.24, 0.55, s * 0.2)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(kurve, 16, 0.03, 6), navy));
    g.add(mesh(kugel, gelb, 0.24, 0.55, s * 0.2, 0.1));
    return g;
  });
  /* Beinchen: kleine dunkelblaue Stummel unten; das vordere, der Kamera zugewandte winkt */
  const beinGeo = new THREE.CapsuleGeometry(0.11, 0.14, 4, 10).translate(0, -0.12, 0);
  const bein = (x, z) => { const g = new THREE.Group(); g.position.copy(auf(x, -0.95, z, -0.05)); g.add(mesh(beinGeo, navy)); leib.add(g); return g; };
  const beine = [bein(-0.35, -0.3), bein(-0.35, 0.3), bein(0.3, -0.32)];
  const wink = bein(0.3, 0.32);
  /* Händchen mit Blume vor dem Bauch */
  const blume = new THREE.Group(); blume.position.copy(auf(0.85, -0.5, 0.2, 0.06)); leib.add(blume);
  blume.add(mesh(kugel, navy, -0.02, -0.06, -0.14, 0.11, 0.09, 0.1));
  blume.add(mesh(kugel, navy, 0.02, -0.08, 0.14, 0.11, 0.09, 0.1));
  const st = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.42, 6), stiel, 0.04, 0.02, 0); st.rotation.z = -0.15; blume.add(st);
  const kopfB = new THREE.Group(); kopfB.position.set(0.08, 0.24, 0); kopfB.rotation.y = Math.PI / 2 - 0.3; blume.add(kopfB);
  for (let k = 0; k < 5; k++) { const w = k / 5 * Math.PI * 2; kopfB.add(mesh(kugel, bluetenGelb, Math.cos(w) * 0.09, Math.sin(w) * 0.09, 0, 0.07, 0.07, 0.025)); }
  kopfB.add(mesh(kugel, bluetenMitte, 0, 0, 0.02, 0.05));
  /* Flügel: durchscheinend mit Adern (auf eine kleine Leinwand gemalt), Gelenk oben am Rücken */
  const flTex = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 160;
    const g = c.getContext('2d');
    const form = () => { g.beginPath(); g.moveTo(236, 130); g.bezierCurveTo(200, 60, 120, 8, 52, 14); g.bezierCurveTo(4, 20, 8, 80, 60, 108); g.bezierCurveTo(110, 132, 180, 138, 236, 130); g.closePath(); };
    const gr = g.createLinearGradient(0, 0, 256, 160);
    gr.addColorStop(0, 'rgba(243,230,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,248,236,0.45)'); gr.addColorStop(1, 'rgba(217,232,255,0.55)');
    form(); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(216,198,160,0.85)'; g.lineWidth = 2.2;
    [[236, 130, 140, 60, 40, 40], [236, 130, 150, 100, 60, 90], [236, 130, 120, 40, 110, 16], [180, 92, 150, 70, 130, 128]].forEach(([a, b, c1, d, e, f]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(c1, d, e, f); g.stroke(); });
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 4; form(); g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const flMat = new THREE.MeshBasicMaterial({ map: flTex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const flGeo = new THREE.PlaneGeometry(1.45, 0.9).translate(-0.7, 0.35, 0);
  const fluegel = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.copy(auf(-0.05, 0.9, s * 0.3, -0.05)); leib.add(g);
    const w = new THREE.Mesh(flGeo, flMat); w.rotation.set(s * 0.55, 0, -0.35); g.add(w);
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
  const wohin = b => -0.85 - (1 - b) / 2 * (Math.PI - 1.7);   /* blick 1: nach rechts, 0: in die Kamera, -1: nach links */
  function zeichne(t){
    const z = stand(), still = reduce.matches;
    const fliegt = fe.classList.contains('fliegt'), winkt = fe.classList.contains('winkt'), spricht = fe.classList.contains('spricht');
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
    /* Beinchen: im Flug angezogen, beim Winken hebt sich das vordere in drei Schwüngen */
    if (winkt && winkT < 0) winkT = t; if (!winkt) winkT = -1;
    let w = 0;
    if (winkT >= 0 && !still) { const u = (t - winkT) / 2200; w = u < 1 ? Math.sin(Math.min(1, u * 6) * Math.PI / 2) * (1.5 + Math.sin(u * Math.PI * 6) * 0.4) * (u > 0.85 ? (1 - u) / 0.15 : 1) : 0; }
    const tuck = fliegt ? 0.6 : 0;
    wink.rotation.z = w + tuck;
    beine.forEach((b, i) => { b.rotation.z = i < 2 ? -tuck : tuck; });
    kopf.rotation.z = winkt && !still ? Math.sin(sek * 6) * 0.04 + 0.03 : Math.sin(sek * 0.9) * 0.02;
    /* Beim Sprechen nickt er leicht im Takt */
    if (spricht && !still) kopf.rotation.z += Math.abs(Math.sin(sek * 7.5)) * 0.05;
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
