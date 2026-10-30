// THE GEM ENGINE. Every stone and piece on this page is modelled here, in code, from the stone's own cut and
// measurements. Nothing is an AI picture. A real stone has facets, a girdle, a pavilion and a culet, so the
// geometry has them too, and the material is a physical glass with the refractive index of corundum (1.77).
// Scene units are millimetres. (bb-3d-web-asset: modelled geometry, PBR material, environment map, never a primitive.)
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const TAU = Math.PI * 2;
const PAGE_DARK = '#091228', WELL = '#16295c';

/* ---------- geometry ---------- */
function radiusAt(a, cut) {
  if (cut === 'cushion') { const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)); return 0.9 / Math.pow(c ** 4 + s ** 4, 0.25); }
  return 1;
}
function ring(n, r, y, cut, off = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = off + i * TAU / n, rr = r * radiusAt(a, cut);
    let x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (cut === 'oval') { x *= 1.24; z *= 0.84; }
    pts.push([x, y, z]);
  }
  return pts;
}
/** A faceted stone, unit half-width, table up. Rings: table 8, star 16, crown 16, girdle 16, pavilion 16, lower 8, culet. */
export function stoneGeometry(cut = 'round') {
  const N = 16, half = TAU / N / 2;
  const table = ring(8, 0.50, 0.42, cut);
  const star = ring(N, 0.80, 0.30, cut);
  const crown = ring(N, 1.00, 0.10, cut, half);
  const girdle = ring(N, 1.00, -0.02, cut, half);
  const pav = ring(N, 0.58, -0.50, cut);
  const low = ring(8, 0.22, -0.82, cut, half);
  const tc = [0, 0.42, 0], culet = [0, -0.92, 0];
  const v = [];
  const tri = (a, b, c) => {
    // Orient every face outward: the body is convex and holds the origin, so a normal pointing away from the centroid is right.
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2];
    const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
    const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3 + 0.25, cz = (a[2] + b[2] + c[2]) / 3;
    if (nx * cx + ny * cy + nz * cz < 0) [b, c] = [c, b];
    v.push(...a, ...b, ...c);
  };
  for (let i = 0; i < 8; i++) tri(tc, table[i], table[(i + 1) % 8]);
  for (let i = 0; i < 8; i++) { const j = 2 * i; tri(table[i], star[j], star[j + 1]); tri(table[i], star[j + 1], table[(i + 1) % 8]); tri(table[(i + 1) % 8], star[j + 1], star[(j + 2) % N]); }
  const zig = (A, B) => { for (let i = 0; i < N; i++) { tri(A[i], B[i], A[(i + 1) % N]); tri(A[(i + 1) % N], B[i], B[(i + 1) % N]); } };
  zig(star, crown); zig(crown, girdle); zig(girdle, pav);
  for (let i = 0; i < 8; i++) { const j = 2 * i; tri(low[i], pav[j], pav[j + 1]); tri(low[i], pav[j + 1], low[(i + 1) % 8]); tri(low[(i + 1) % 8], pav[j + 1], pav[(j + 2) % N]); }
  for (let i = 0; i < 8; i++) tri(culet, low[i], low[(i + 1) % 8]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

/* ---------- materials ---------- */
export function stoneMaterial(hex, deep, depthMm = 5) {
  // Body colour comes from attenuation through the stone's real depth, so a 4 ct stone sits deeper than a 1 ct.
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex), metalness: 0, roughness: 0.04, transmission: 0.8, thickness: depthMm, ior: 1.77,
    attenuationColor: new THREE.Color(deep), attenuationDistance: depthMm * 0.45, dispersion: 0.3,
    specularIntensity: 0.9, envMapIntensity: 1.25, clearcoat: 1, clearcoatRoughness: 0.03, flatShading: true
  });
}
export function metalMaterial(hex) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), metalness: 1, roughness: 0.2, envMapIntensity: 1.5 });
}

/* ---------- builders (millimetres) ---------- */
export function buildStone(stone) {
  const g = stoneGeometry(stone.cut);
  const s = stone.mm[0] / 2;
  const m = new THREE.Mesh(g, stoneMaterial(stone.hex, stone.deep, 1.34 * s));
  m.scale.setScalar(s);
  m.userData.halfW = s; m.userData.top = 0.42 * s; m.userData.bottom = -0.92 * s;
  return m;
}
const tube = (a, b, r, mat) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, r, 10, false), mat);
const ball = (p, r, mat) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat); s.position.copy(p); return s; };

export function buildPiece(kind, stone, metalHex, ringMm = 17.3) {
  const grp = new THREE.Group();
  const mat = metalMaterial(metalHex);
  const w = stone.mm[0] / 2, d = (stone.mm[1] || stone.mm[0]) / 2;
  if (kind === 'ring') {
    const R = ringMm / 2 + 1.0, t = 1.0;
    const band = new THREE.Mesh(new THREE.TorusGeometry(R, t, 28, 110), mat);
    grp.add(band);
    const sm = buildStone(stone); const seatY = R + t + 1.4; sm.position.y = seatY - sm.userData.bottom * 0.2; grp.add(sm);
    const girdleY = sm.position.y - 0.02 * w;
    const seat = new THREE.Mesh(new THREE.TorusGeometry(w * 0.72, 0.45, 12, 48), mat); seat.rotation.x = Math.PI / 2; seat.position.y = girdleY - 1.3; grp.add(seat);
    const gallery = new THREE.Mesh(new THREE.TorusGeometry(w * 0.5, 0.4, 12, 48), mat); gallery.rotation.x = Math.PI / 2; gallery.position.y = R + t + 0.5; grp.add(gallery);
    const corners = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (const [cx, cz] of corners) {
      const px = cx * w * 0.74, pz = cz * d * 0.74;
      const foot = new THREE.Vector3(cx * w * 0.5, R + t + 0.3, cz * d * 0.5), tip = new THREE.Vector3(px, girdleY + 0.9, pz);
      grp.add(tube(foot, tip, 0.42, mat)); grp.add(ball(tip, 0.5, mat));
    }
    grp.userData.radius = R + t + 2 * w + 1;
    grp.userData.pose = { x: 0.42, y: -0.55 }; grp.userData.spin = 'sway';
  } else if (kind === 'pendant') {
    const sm = buildStone(stone); sm.rotation.x = Math.PI / 2; grp.add(sm);
    const bailY = d + 1.9;
    const bail = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.42, 12, 40), mat); bail.rotation.y = Math.PI / 2; bail.position.y = bailY; grp.add(bail);
    grp.add(tube(new THREE.Vector3(0, d * 0.75, -0.2), new THREE.Vector3(0, bailY - 0.8, -0.2), 0.4, mat));
    grp.add(tube(new THREE.Vector3(-1.1, bailY + 0.2, 0), new THREE.Vector3(-22, bailY + 30, 0), 0.32, mat));
    grp.add(tube(new THREE.Vector3(1.1, bailY + 0.2, 0), new THREE.Vector3(22, bailY + 30, 0), 0.32, mat));
    const corners = [[0.86, 0.6], [-0.86, 0.6], [0.86, -0.6], [-0.86, -0.6]];
    for (const [cx, cy] of corners) { const p = new THREE.Vector3(cx * w, cy * d, 0.3 * w); grp.add(tube(new THREE.Vector3(cx * w * 0.9, cy * d * 0.9, -0.5 * w), p, 0.36, mat)); grp.add(ball(p, 0.42, mat)); }
    grp.userData.radius = Math.max(w, d) * 2.6 + 2;
    grp.userData.pose = { x: 0.08, y: -0.25 }; grp.userData.spin = 'sway';
  } else {
    const gap = w + 2.2;
    for (const side of [-1, 1]) {
      const one = new THREE.Group();
      const sm = buildStone(stone); sm.rotation.x = Math.PI / 2; one.add(sm);
      one.add(tube(new THREE.Vector3(0, d * 0.8, -0.2), new THREE.Vector3(0, d + 3.4, -0.2), 0.36, mat));
      one.add(ball(new THREE.Vector3(0, d + 3.6, -0.2), 0.95, mat));
      const corners = [[0.86, 0.6], [-0.86, 0.6], [0.86, -0.6], [-0.86, -0.6]];
      for (const [cx, cy] of corners) { const p = new THREE.Vector3(cx * w, cy * d, 0.3 * w); one.add(tube(new THREE.Vector3(cx * w * 0.9, cy * d * 0.9, -0.5 * w), p, 0.36, mat)); one.add(ball(p, 0.42, mat)); }
      one.position.x = side * gap; grp.add(one);
    }
    grp.userData.radius = gap + w + 3;
    grp.userData.pose = { x: 0.1, y: -0.2 }; grp.userData.spin = 'sway';
  }
  return grp;
}

/* ---------- a view: renderer, camera, light, well ---------- */
function wellTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  // The pool of light ends inside the canvas edge at the page's own dark, so the canvas has no visible edge.
  const x = c.getContext('2d'); const g = x.createRadialGradient(128, 118, 6, 128, 124, 104);
  g.addColorStop(0, WELL); g.addColorStop(0.5, '#0c1a3e'); g.addColorStop(1, PAGE_DARK);
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function createView(canvas, { still = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: still });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 500);
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(30, 60, 40); scene.add(key);
  const fill = new THREE.DirectionalLight(0xbfd0ff, 0.9); fill.position.set(-40, 10, -20); scene.add(fill);
  // The pool of light rides on the camera and is sized to the frustum, so it fills the canvas exactly and no more.
  const WELL_D = 300;
  const well = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: wellTexture(), toneMapped: false }));
  well.position.z = -WELL_D; camera.add(well); scene.add(camera);
  const sizeWell = () => { const h = 2 * WELL_D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.02; well.scale.set(h * camera.aspect, h, 1); };
  sizeWell();
  const root = new THREE.Group(); scene.add(root);
  let w = 1, h = 1;
  function resize() {
    const cw = canvas.clientWidth || canvas.width, ch = canvas.clientHeight || canvas.height;
    if (cw === w && ch === h) return;
    w = cw; h = ch; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); sizeWell();
  }
  function fit(radius) {
    const dist = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.08;
    camera.position.set(0, dist * 0.18, dist); camera.lookAt(0, 0, 0);
  }
  function clear() {
    root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== undefined && o !== well) { if (o.material.dispose) o.material.dispose(); } });
    root.clear();
  }
  return {
    renderer, scene, camera, root, resize, fit, clear,
    render() { resize(); renderer.render(scene, camera); },
    dispose() { clear(); renderer.dispose(); }
  };
}

/* ---------- stills: the shelf's images, drawn one at a time so the page never stalls ---------- */
export function stillPainter(size = 560, type = 'image/webp') {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const view = createView(canvas, { still: true });
  view.renderer.setPixelRatio(1);
  return {
    paint(s) {
      view.clear();
      const m = buildStone(s);
      const hold = new THREE.Group(); hold.add(m); hold.rotation.x = 0.62; hold.rotation.y = 0.5; view.root.add(hold);
      view.fit(m.userData.halfW * 1.25);
      view.render();
      let url = canvas.toDataURL(type, 0.9);
      if (!url.startsWith('data:' + type)) url = canvas.toDataURL('image/png');
      return url;
    },
    dispose() { view.dispose(); }
  };
}
export function renderStills(stones, size = 560, type = 'image/webp') {
  const p = stillPainter(size, type); const out = new Map();
  for (const s of stones) out.set(s.ref, p.paint(s));
  p.dispose(); return out;
}

export const supported = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } };
