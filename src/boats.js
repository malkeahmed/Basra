import * as THREE from 'three'

/*
  سفن وقوارب البصرة: مشحوف، سنبوك شراعي، ناقلة نفط، سفينة حاويات، سفينة بضائع بروافع، بارجة وقاطرة.
  تفاصيل واقعية: ألواح بدن بمسامير وصدأ، حاويات مضلّعة، سور وقوارب نجاة، رادار دوّار،
  علم العراق يرفرف، دخان مداخن، أمواج مقدّمة وذيل رغوي، أشرعة ترفرف، وأسماء على الهياكل.
*/

export const shipUniforms = { uTime: { value: 0 } }

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o })
const sstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

/* ---------- خامات مرسومة ---------- */
let _hullTex = null
function hullTexture() {
  if (_hullTex) return _hullTex
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = '#e9e9e9'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`
    g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2)
  }
  g.fillStyle = 'rgba(40,30,20,.55)'
  for (let y = 0; y < 512; y += 64) g.fillRect(0, y, 512, 2.2)
  for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? 0 : 64; x < 512; x += 128) g.fillRect(x, y, 2.2, 64)
  g.fillStyle = 'rgba(30,20,12,.4)'
  for (let y = 6; y < 512; y += 64) for (let x = 5; x < 512; x += 16) g.fillRect(x, y, 2, 2)
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 380
    const l = 20 + Math.random() * 90
    const gr = g.createLinearGradient(0, y, 0, y + l)
    gr.addColorStop(0, 'rgba(120,60,25,.32)')
    gr.addColorStop(1, 'rgba(120,60,25,0)')
    g.fillStyle = gr
    g.fillRect(x, y, 2 + Math.random() * 4, l)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  _hullTex = t
  return t
}
let _corr = null
export function corrTexture() {
  if (_corr) return _corr
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 128, 128)
  for (let x = 0; x < 128; x += 8) {
    g.fillStyle = 'rgba(0,0,0,.22)'
    g.fillRect(x, 0, 3, 128)
    g.fillStyle = 'rgba(255,255,255,.35)'
    g.fillRect(x + 4, 0, 2, 128)
  }
  g.fillStyle = 'rgba(0,0,0,.35)'
  g.fillRect(0, 0, 128, 6)
  g.fillRect(0, 122, 128, 6)
  g.fillRect(0, 0, 4, 128)
  g.fillRect(124, 0, 4, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  _corr = t
  return t
}
function nameTexture(text, color = '#ffffff', font = 'bold 84px Arial, sans-serif') {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 128
  const g = c.getContext('2d')
  g.clearRect(0, 0, 1024, 128)
  g.font = font
  g.fillStyle = color
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, 512, 68)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}
let _flag = null
function flagTexture() {
  if (_flag) return _flag
  const c = document.createElement('canvas')
  c.width = 192
  c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#ce1126'
  g.fillRect(0, 0, 192, 43)
  g.fillStyle = '#ffffff'
  g.fillRect(0, 43, 192, 42)
  g.fillStyle = '#111111'
  g.fillRect(0, 85, 192, 43)
  g.fillStyle = '#007a3d'
  g.font = 'bold 34px Arial, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('الله أكبر', 96, 66)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  _flag = t
  return t
}

/* ---------- هندسة البدن ---------- */
function loft(L, nu, secFn, colorFn, closed) {
  const pos = []
  const col = []
  const uv = []
  let np = 0
  for (let i = 0; i <= nu; i++) {
    const u = -1 + (2 * i) / nu
    const sec = secFn(u)
    np = sec.length
    sec.forEach((p, k) => {
      const x = (u * L) / 2
      pos.push(x, p[1], p[0])
      const c = colorFn(u, p[0], p[1], k, p)
      col.push(Math.pow(c[0], 2.2), Math.pow(c[1], 2.2), Math.pow(c[2], 2.2))
      const deck = k >= 12 && closed
      uv.push(x / 7, deck ? 30 + p[0] / 2.6 : p[1] / 2.6)
    })
  }
  const idx = []
  const ring = closed ? np : np - 1
  for (let i = 0; i < nu; i++) {
    for (let k = 0; k < ring; k++) {
      const a = i * np + k
      const b = i * np + ((k + 1) % np)
      const c = (i + 1) * np + k
      const d = (i + 1) * np + ((k + 1) % np)
      idx.push(a, c, b, b, c, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

function shipHull({ L, B, D, F, bowStart = 0.7, sternRound = 0.9, bowRise = 0, sternRise = 0, keelRise = 0.5, hullTop, hullBottom, deck, band, seed = 1 }) {
  return loft(
    L, 56,
    (u) => {
      let w = 1
      if (u > bowStart) w = Math.pow(Math.max(0, 1 - Math.pow((u - bowStart) / (1 - bowStart), 2)), 0.55)
      if (u < -sternRound) w = Math.pow(Math.max(0, 1 - Math.pow((-u - sternRound) / (1 - sternRound), 2)), 0.35)
      const half = (B / 2) * Math.max(w, 0.02)
      const top = D + F + bowRise * Math.pow(Math.max(0, u), 3) + sternRise * Math.pow(Math.max(0, -u), 2.2)
      const keel = keelRise * D * Math.pow(Math.max(0, u), 2.4) + (u < -0.8 ? 0.35 * D * sstep(-0.8, -1, u) : 0)
      const wl = Math.min(0.95, Math.max(0.1, (D - keel) / (top - keel)))
      const frac = [
        [-1, 1], [-1, wl + 0.04], [-1, wl - 0.03], [-0.94, wl * 0.55], [-0.72, wl * 0.14], [-0.4, 0], [0, 0],
        [0.4, 0], [0.72, wl * 0.14], [0.94, wl * 0.55], [1, wl - 0.03], [1, wl + 0.04], [1, 1], [0, 1],
      ]
      return frac.map(([z, y]) => [z * half, keel + y * (top - keel)])
    },
    (u, z, y, k) => {
      const n = 0.9 + 0.1 * hash(u * 41 + k * 13 + seed)
      const tone = (c) => [c[0] * n, c[1] * n, c[2] * n]
      if (k === 13) return tone(deck)
      if (k === 0 || k === 12) return tone(band || hullTop)
      if (y < D - 0.05) return tone(hullBottom)
      if (y < D + 0.7) {
        const t = (D + 0.7 - y) / 0.75
        return tone(hullTop).map((v) => v * (1 - t * 0.35))
      }
      return tone(hullTop)
    },
    true
  )
}

const hullMat = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, map: hullTexture(), roughness: 0.62, metalness: 0.08, ...o })
const VC = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.05, ...o })

const box = (w, h, d, color, x, y, z, o = {}) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(color, o))
  m.position.set(x, y, z)
  m.castShadow = true
  return m
}
const cyl = (r1, r2, h, color, x, y, z, seg = 12, o = {}) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), M(color, o))
  m.position.set(x, y, z)
  m.castShadow = true
  return m
}
const windowsStrip = (g, w, d, x, y, z, rows = 1, h = 0.4, gap = 0.9) => {
  for (let r = 0; r < rows; r++) g.add(box(w, h, d, 0x10171d, x, y + r * gap, z, { roughness: 0.15, metalness: 0.4 }))
}

/* سور السطح */
function railings(g, x0, x1, y, halfB, color = 0xe9e6dc) {
  const len = x1 - x0
  ;[-1, 1].forEach((s) => {
    g.add(box(len, 0.07, 0.07, color, (x0 + x1) / 2, y + 1.0, s * halfB))
    g.add(box(len, 0.05, 0.05, color, (x0 + x1) / 2, y + 0.55, s * halfB))
  })
  const n = Math.floor(len / 1.8)
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 1.0, 0.07), M(color), n * 2)
  const d = new THREE.Object3D()
  let i = 0
  ;[-1, 1].forEach((s) => {
    for (let k = 0; k < n; k++) {
      d.position.set(x0 + (k + 0.5) * (len / n), y + 0.5, s * halfB)
      d.updateMatrix()
      im.setMatrixAt(i++, d.matrix)
    }
  })
  g.add(im)
}

function lifeboat(g, x, y, z) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 2.6, 4, 10), M(0xe8541e, { roughness: 0.5 }))
  m.rotation.z = Math.PI / 2
  m.position.set(x, y, z)
  m.scale.set(1, 1, 0.8)
  m.castShadow = true
  g.add(m)
  g.add(box(0.1, 0.8, 0.1, 0x333333, x - 0.9, y - 0.5, z))
  g.add(box(0.1, 0.8, 0.1, 0x333333, x + 0.9, y - 0.5, z))
}

/* علم العراق يرفرف */
export function flagMaterial() {
  const m = new THREE.MeshBasicMaterial({ map: flagTexture(), side: THREE.DoubleSide })
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = shipUniforms.uTime
    sh.vertexShader =
      'uniform float uTime;\n' +
      sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat fl = position.x + 0.5;\ntransformed.z += sin(position.x * 7.0 - uTime * 6.5) * 0.09 * fl;\ntransformed.y += sin(position.x * 5.0 - uTime * 5.2) * 0.03 * fl;')
  }
  return m
}
function flag(g, x, y, z, scale = 1) {
  g.add(cyl(0.04, 0.05, 3.2 * scale, 0xdddddd, x, y + 1.6 * scale, z, 6))
  const f = new THREE.Mesh(new THREE.PlaneGeometry(1.5 * scale, 1.0 * scale, 14, 4), flagMaterial())
  f.position.set(x - 0.75 * scale, y + 2.75 * scale, z)
  f.rotation.y = Math.PI / 2
  g.add(f)
}

/* لوحة اسم على جانبَي البدن */
function namePlate(g, text, x, y, halfB, w, h, color, font) {
  const tex = nameTexture(text, color, font)
  ;[-1, 1].forEach((s) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }))
    p.position.set(x, y, s * (halfB + 0.04))
    if (s < 0) p.rotation.y = Math.PI
    g.add(p)
  })
}

/* دخان المدخنة: جسيمات تُحسب بالكامل في الظلال */
function smoke(g, x, y, z, scale = 1) {
  const n = 46
  const seed = new Float32Array(n)
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) seed[i] = Math.random()
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: shipUniforms.uTime, uScale: { value: scale }, uSpeed: { value: 0.5 } },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime; uniform float uScale; uniform float uSpeed;
      varying float vA; varying float vAge;
      void main(){
        float life = 3.6;
        float age = fract(uTime / life + aSeed);
        vec3 p = vec3(
          -age * (3.0 + uSpeed * 9.0) * uScale + sin(aSeed * 40.0) * 0.25,
          age * 8.0 * uScale + 0.3,
          sin(aSeed * 91.0 + age * 5.0) * 0.9 * age * uScale
        );
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (2.2 + age * 15.0) * uScale * 520.0 / -mv.z;
        vA = pow(1.0 - age, 1.4) * smoothstep(0.0, 0.07, age) * 0.55;
        vAge = age;
      }`,
    fragmentShader: `
      varying float vA; varying float vAge;
      void main(){
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.2, d) * vA;
        vec3 c = mix(vec3(0.16), vec3(0.74), vAge);
        gl_FragColor = vec4(c, a);
      }`,
  })
  const pts = new THREE.Points(geo, mat)
  pts.position.set(x, y, z)
  pts.frustumCulled = false
  g.add(pts)
  return mat
}

/* رادار دوّار */
function radar(g, x, y, z) {
  g.add(cyl(0.08, 0.08, 0.8, 0x666666, x, y + 0.4, z, 6))
  const r = new THREE.Group()
  r.position.set(x, y + 0.9, z)
  r.add(box(2.4, 0.12, 0.28, 0xd8d4c8, 0, 0, 0))
  r.add(box(0.2, 0.25, 0.4, 0x444444, 0, -0.05, 0))
  g.add(r)
  g.userData.radar = r
  return r
}

/* ---------- الموجة والرغوة ---------- */
const WAKE_VS = `
  varying vec2 vUv; varying vec3 vW;
  void main(){
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`
const WAKE_FS = `
  varying vec2 vUv; varying vec3 vW;
  uniform float uTime; uniform float uSpeed; uniform float uCore; uniform float uLen;
  float nz(vec2 p){ return sin(p.x*1.7+sin(p.y*2.3))*.5 + sin(p.x*3.1-p.y*1.9+uTime*.5)*.3 + sin(p.x*6.7+p.y*4.1)*.2; }
  void main(){
    float s = vUv.x; float c = vUv.y; float ac = abs(c);
    vec2 q = vec2(s * uLen * 0.45 - uTime * (0.5 + uSpeed * 2.0), c * 5.0);
    float nn = nz(q) * 0.5 + 0.5;
    float core = exp(-pow(c * 2.4, 2.0)) * (1.0 - s * 0.75) * uCore;
    float arm = smoothstep(0.6, 0.88, ac) * (1.0 - smoothstep(0.9, 1.0, ac)) * (1.0 - s * 0.8);
    float foam = (core * 1.0 + arm * 0.95) * smoothstep(0.18, 0.7, nn);
    float fade = (1.0 - smoothstep(0.5, 1.0, s)) * smoothstep(0.0, 0.05, s);
    float a = foam * fade * clamp(uSpeed, 0.0, 1.0) * 0.9;
    vec3 col = vec3(0.97, 0.98, 0.95);
    float d = length(vW - cameraPosition);
    col = mix(col, vec3(0.66, 0.82, 0.96), smoothstep(260.0, 900.0, d));
    a *= 1.0 - smoothstep(380.0, 800.0, d);
    gl_FragColor = vec4(col, a);
  }`
function wakeGeo(x0, len, w0, spread, rows = 44, cols = 16) {
  const pos = []
  const uv = []
  const idx = []
  for (let i = 0; i <= rows; i++) {
    const s = i / rows
    for (let j = 0; j <= cols; j++) {
      const c = -1 + (2 * j) / cols
      pos.push(x0 - s * len, 0, c * (w0 + s * len * spread))
      uv.push(s, c)
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j
      idx.push(a, a + cols + 1, a + 1, a + 1, a + cols + 1, a + cols + 2)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}
export function makeWake(L, B, kind = 'ship') {
  const g = new THREE.Group()
  const mats = []
  const mk = (geo, core, len) => {
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { uTime: shipUniforms.uTime, uSpeed: { value: 0 }, uCore: { value: core }, uLen: { value: len } },
      vertexShader: WAKE_VS,
      fragmentShader: WAKE_FS,
    })
    const mesh = new THREE.Mesh(geo, m)
    mesh.position.y = -0.88
    mesh.renderOrder = 2
    mesh.frustumCulled = false
    g.add(mesh)
    mats.push(m)
  }
  const len = kind === 'boat' ? L * 3.2 : L * 1.9
  mk(wakeGeo(-L / 2 + 0.5, len, B * 0.5, 0.17), 1, len)
  mk(wakeGeo(L / 2 - B * 0.35, L * 0.42, B * 0.52, 0.05, 20, 12), 0, L * 0.42)
  g.userData.setSpeed = (v) => mats.forEach((m) => (m.uniforms.uSpeed.value = v))
  return g
}

/* ---------- أشخاص ---------- */
function person(kind = 'stand') {
  const g = new THREE.Group()
  const robe = kind === 'woman' ? 0x15110e : 0xeeeadf
  const h = kind === 'sit' ? 0.62 : 1.0
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.27, h, 10), M(robe, { roughness: 0.95 }))
  body.position.y = h / 2
  g.add(body)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), M(0xb88a62))
  head.position.y = h + 0.14
  g.add(head)
  const wrap = new THREE.Mesh(new THREE.SphereGeometry(0.175, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), M(kind === 'woman' ? 0x15110e : 0xf4f0e6, { roughness: 0.95 }))
  wrap.position.y = h + 0.2
  g.add(wrap)
  return g
}

/* ---------- المشحوف ---------- */
export function makeMashoof() {
  const L = 7.4
  const shape = (u, scaleZ = 1, lift = 0) => {
    const a = Math.abs(u)
    const w = 0.62 * Math.pow(Math.max(0, 1 - Math.pow(a, 2.4)), 0.55) * scaleZ
    const top = 0.55 + 1.15 * Math.pow(a, 2.6) + lift
    const bot = -0.18 + 0.4 * Math.pow(a, 2.0) + lift * 0.4
    const pts = []
    for (let k = -8; k <= 8; k++) {
      const v = k / 8
      pts.push([w * v, bot + (top - bot) * Math.pow(Math.abs(v), 1.75)])
    }
    return pts
  }
  const outer = loft(L, 40, (u) => shape(u), (u, z, y, k) => (k <= 0 || k >= 16 ? [0.45, 0.33, 0.18] : [0.07, 0.055, 0.045]), false)
  const inner = loft(L, 40, (u) => shape(u, 0.9, 0.07), (u, z, y, k) => [0.46 + Math.abs(z) * 0.1, 0.33, 0.19], false)
  const g = new THREE.Group()
  const hull = new THREE.Mesh(outer, VC({ side: THREE.DoubleSide, roughness: 0.4, metalness: 0.1 }))
  hull.castShadow = true
  g.add(hull)
  g.add(new THREE.Mesh(inner, VC({ side: THREE.DoubleSide, roughness: 0.9 })))
  ;[-0.35, 0.12, 0.55].forEach((u) => {
    const w = 0.62 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 2.4)), 0.55) * 0.92
    g.add(box(0.14, 0.07, w * 2, 0x6b4a28, u * L * 0.5, 0.52 + 1.15 * Math.pow(Math.abs(u), 2.6) - 0.1, 0))
  })
  const poler = person('stand')
  poler.position.set(-L * 0.3, -0.05, 0)
  g.add(poler)
  const pole = new THREE.Group()
  pole.position.set(-L * 0.3 - 0.2, 0.9, 0.22)
  pole.add(cyl(0.04, 0.05, 4.8, 0x7a5a30, 0, -1.7, 0, 6))
  g.add(pole)
  const sitter = person('sit')
  sitter.position.set(L * 0.08, -0.02, 0.12)
  g.add(sitter)
  const lady = person('woman')
  lady.scale.setScalar(0.82)
  lady.position.set(L * 0.3, -0.02, -0.08)
  g.add(lady)
  g.userData = { draft: 0.1, L, B: 1.3, pole, poler, kind: 'boat' }
  return g
}

/* ---------- السنبوك ---------- */
export function makeDhow() {
  const L = 17
  const g = new THREE.Group()
  const hull = new THREE.Mesh(
    shipHull({ L, B: 4.2, D: 1.5, F: 1.35, bowStart: 0.2, sternRound: 0.82, bowRise: 1.6, sternRise: 1.4, keelRise: 0.9, hullTop: [0.33, 0.19, 0.1], hullBottom: [0.3, 0.09, 0.06], deck: [0.58, 0.42, 0.25], band: [0.82, 0.74, 0.55], seed: 7 }),
    VC({ roughness: 0.78 })
  )
  hull.castShadow = true
  g.add(hull)
  g.add(box(3.4, 1.5, 3.0, 0x7a4a24, -L * 0.34, 3.7, 0))
  g.add(box(3.6, 0.15, 3.3, 0x4a2c16, -L * 0.34, 4.5, 0))
  windowsStrip(g, 0.02, 2.2, -L * 0.34 + 1.71, 3.8, 0, 1, 0.5)
  for (let i = 0; i < 4; i++) g.add(cyl(0.18, 0.18, 0.5, 0x6b4a28, 1 + i * 1.2, 3.1, i % 2 ? 1.1 : -1.1, 8))
  const sailMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide })
  sailMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = shipUniforms.uTime
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat hh2 = clamp((position.y - 3.2) / 9.0, 0.0, 1.0);\ntransformed.z += sin(position.x * 0.9 + uTime * 1.8) * 0.16 * (1.0 - hh2 * 0.6) + sin(position.y * 1.3 - uTime * 1.3) * 0.05;')
  }
  const tops = []
  const makeSail = (x, h, len) => {
    g.add(cyl(0.11, 0.18, h + 1.4, 0x4a3320, x, 2.2 + (h + 1.4) / 2, 0, 8))
    const A = new THREE.Vector3(x + len * 0.62, 3.4, 0)
    const B = new THREE.Vector3(x - len * 0.12, 3.4 + h, 0)
    const C = new THREE.Vector3(x - len * 0.85, 3.9, 0)
    const nU = 12
    const nV = 8
    const posA = []
    const colA = []
    const idx = []
    for (let i = 0; i <= nU; i++) {
      for (let j = 0; j <= nV; j++) {
        const u = i / nU
        const v = j / nV
        const p = A.clone().lerp(C, u).lerp(B, v)
        p.z = Math.sin(u * Math.PI) * (1 - v * 0.85) * (0.6 + 0.4 * (1 - v))
        posA.push(p.x, p.y, p.z)
        const panel = 0.9 + 0.08 * (Math.floor(v * 7) % 2) + 0.03 * Math.sin(u * 40)
        const c = Math.pow(panel * 0.96, 2.2)
        colA.push(c, c * 0.96, c * 0.86)
      }
    }
    for (let i = 0; i < nU; i++) {
      for (let j = 0; j < nV; j++) {
        const q = i * (nV + 1) + j
        idx.push(q, q + 1, q + nV + 1, q + 1, q + nV + 2, q + nV + 1)
      }
    }
    const sg = new THREE.BufferGeometry()
    sg.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3))
    sg.setAttribute('color', new THREE.Float32BufferAttribute(colA, 3))
    sg.setIndex(idx)
    sg.computeVertexNormals()
    const sail = new THREE.Mesh(sg, sailMat)
    sail.castShadow = true
    g.add(sail)
    const dir = B.clone().sub(A)
    const yard = cyl(0.07, 0.07, dir.length() * 1.08, 0x5a3d22, (A.x + B.x) / 2, (A.y + B.y) / 2, 0.02, 6)
    yard.rotation.z = Math.atan2(dir.y, dir.x) - Math.PI / 2
    g.add(yard)
    const boom = cyl(0.05, 0.05, A.distanceTo(C), 0x5a3d22, (A.x + C.x) / 2, (A.y + C.y) / 2, 0.02, 6)
    boom.rotation.z = Math.atan2(C.y - A.y, C.x - A.x) - Math.PI / 2
    g.add(boom)
    tops.push(new THREE.Vector3(x, 3.4 + h + 0.4, 0))
  }
  makeSail(1.4, 11, 9.5)
  makeSail(-3.6, 8.4, 7)
  const bow = cyl(0.07, 0.07, 6, 0x4a3320, L * 0.52, 3.3, 0, 6)
  bow.rotation.z = -1.2
  g.add(bow)
  const lp = []
  ;[
    [L * 0.52 + 2.4, 5.4, 0], [-L * 0.46, 4.5, 0], [tops[0].x + 0.5, 3.0, 1.9], [tops[0].x + 0.5, 3.0, -1.9], [tops[0].x - 1.5, 3.0, 1.9], [tops[0].x - 1.5, 3.0, -1.9],
  ].forEach((e) => lp.push(tops[0].x, tops[0].y, tops[0].z, e[0], e[1], e[2]))
  ;[[-L * 0.46, 4.5, 0], [tops[1].x + 0.4, 3.0, 1.9], [tops[1].x + 0.4, 3.0, -1.9], [tops[0].x, tops[0].y - 1, 0]].forEach((e) => lp.push(tops[1].x, tops[1].y, tops[1].z, e[0], e[1], e[2]))
  const lg = new THREE.BufferGeometry()
  lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3))
  g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2a1d10 })))
  const m = person('stand')
  m.position.set(-L * 0.12, 3.0, 0.6)
  g.add(m)
  const m2 = person('sit')
  m2.position.set(-L * 0.34, 4.55, 0.8)
  g.add(m2)
  flag(g, -L * 0.47, 4.2, 0, 0.7)
  g.userData = { draft: 1.5, L, B: 4.2, kind: 'boat' }
  return g
}

/* ---------- ناقلة النفط ---------- */
export function makeTanker() {
  const L = 54
  const B = 8.6
  const g = new THREE.Group()
  const hull = new THREE.Mesh(
    shipHull({ L, B, D: 3.3, F: 2.5, bowStart: 0.8, sternRound: 0.88, bowRise: 1.4, sternRise: 0.5, keelRise: 0.55, hullTop: [0.1, 0.11, 0.13], hullBottom: [0.42, 0.1, 0.07], deck: [0.42, 0.37, 0.3], seed: 3 }),
    hullMat()
  )
  hull.castShadow = true
  g.add(hull)
  const dy = 5.8
  g.add(box(7, 5, 7.6, 0xf1eee6, -L / 2 + 6.5, dy + 2.5, 0))
  g.add(box(5.4, 3, 7.8, 0xf6f3eb, -L / 2 + 6, dy + 6.4, 0))
  g.add(box(3.4, 1.4, 8.4, 0xf1eee6, -L / 2 + 5.4, dy + 8.6, 0))
  windowsStrip(g, 0.05, 7.2, -L / 2 + 9.55, dy + 3.1, 0, 2, 0.45, 1.3)
  windowsStrip(g, 0.05, 7.4, -L / 2 + 8.75, dy + 6.5, 0, 1, 0.8)
  windowsStrip(g, 0.05, 8.2, -L / 2 + 7.15, dy + 8.7, 0, 1, 0.7)
  g.add(cyl(0.9, 1.1, 3.2, 0x1c1d20, -L / 2 + 4.2, dy + 8.3, 1.6, 14))
  g.add(cyl(1.12, 1.12, 0.6, 0xb3231a, -L / 2 + 4.2, dy + 9.1, 1.6, 14))
  g.add(cyl(0.08, 0.08, 4, 0x888888, -L / 2 + 5.4, dy + 11, 0, 6))
  const rd = radar(g, -L / 2 + 5.4, dy + 10.2, 0)
  lifeboat(g, -L / 2 + 3, dy + 3.3, B / 2 + 0.2)
  lifeboat(g, -L / 2 + 3, dy + 3.3, -B / 2 - 0.2)
  for (let i = 0; i < 3; i++) {
    const pipe = cyl(0.22, 0.22, L * 0.62, 0x6c6a64, -L * 0.04, dy + 0.55, -1.4 + i * 1.4, 8)
    pipe.rotation.z = Math.PI / 2
    g.add(pipe)
  }
  for (let i = 0; i < 8; i++) g.add(cyl(0.7, 0.7, 0.5, 0x4d4b46, -L / 2 + 14 + i * 5, dy + 0.3, 2.6 * (i % 2 ? 1 : -1), 12))
  g.add(box(1.4, 1.4, 5.6, 0x8a6a2a, 2, dy + 0.9, 0))
  g.add(box(0.22, 5.5, 0.22, 0xc9a43a, L * 0.1, dy + 2.8, 3.5))
  const boom = box(0.18, 0.18, 5.8, 0xc9a43a, L * 0.1, dy + 5.4, 6.2)
  boom.rotation.x = 0.7
  g.add(boom)
  g.add(box(0.3, 3.2, 0.3, 0x2c2c2c, L * 0.44, dy + 1.6, 0))
  railings(g, -L / 2 + 10.5, L * 0.4, dy, B / 2 - 0.12)
  namePlate(g, 'BASRAH OIL', L * 0.18, 4.1, B / 2, 12, 1.5, '#f4f0e4')
  flag(g, -L / 2 + 1.1, dy + 0.1, 0, 1.1)
  const sm = smoke(g, -L / 2 + 4.2, dy + 9.9, 1.6, 1.1)
  g.userData = { draft: 3.3, L, B, smoke: sm, radar: rd, kind: 'ship' }
  return g
}

/* ---------- سفينة الحاويات ---------- */
export function makeContainerShip() {
  const L = 58
  const B = 9.2
  const g = new THREE.Group()
  const hull = new THREE.Mesh(
    shipHull({ L, B, D: 3.4, F: 3.1, bowStart: 0.78, sternRound: 0.88, bowRise: 1.6, sternRise: 0.4, keelRise: 0.6, hullTop: [0.1, 0.18, 0.3], hullBottom: [0.44, 0.1, 0.07], deck: [0.28, 0.3, 0.32], seed: 5 }),
    hullMat()
  )
  hull.castShadow = true
  g.add(hull)
  const dy = 6.5
  g.add(box(6.2, 9.6, 8.4, 0xf3f1ea, -L / 2 + 5.6, dy + 4.8, 0))
  g.add(box(4.6, 1.6, 9.2, 0xf3f1ea, -L / 2 + 5.2, dy + 10.4, 0))
  windowsStrip(g, 0.05, 8, -L / 2 + 8.75, dy + 2.2, 0, 4, 0.55, 1.9)
  windowsStrip(g, 0.05, 9, -L / 2 + 7.55, dy + 10.4, 0, 1, 0.9)
  g.add(cyl(0.95, 1.1, 3.4, 0xb3231a, -L / 2 + 4.2, dy + 12.5, 2.2, 14))
  g.add(cyl(1.15, 1.15, 0.5, 0x15171a, -L / 2 + 4.2, dy + 14.4, 2.2, 14))
  g.add(cyl(0.08, 0.08, 5, 0x999999, -L / 2 + 5.4, dy + 13.2, 0, 6))
  const rd = radar(g, -L / 2 + 5.4, dy + 15.4, 0)
  lifeboat(g, -L / 2 + 3.2, dy + 3.5, B / 2 + 0.2)
  lifeboat(g, -L / 2 + 3.2, dy + 3.5, -B / 2 - 0.2)
  const colors = [0xb8452b, 0x2a5d8f, 0xd49a2a, 0xe8e4d8, 0x3f7a4a, 0x8c2f3a, 0x555b63, 0x1f4a6a, 0xcf6a1c]
  const items = []
  const cl = 2.9
  for (let x = -L / 2 + 13; x < L / 2 - 8; x += cl + 0.1) {
    const hgt = 2 + Math.floor(Math.random() * 3) + (x < 0 ? 1 : 0)
    for (let col = -1; col <= 1; col++) {
      const levels = Math.max(1, hgt - (col === 0 ? 0 : Math.floor(Math.random() * 2)))
      for (let lv = 0; lv < levels; lv++) items.push([x, dy + 1.4 + lv * 2.75, col * 2.95, colors[Math.floor(Math.random() * colors.length)]])
    }
  }
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(cl, 2.6, 2.75), new THREE.MeshStandardMaterial({ map: corrTexture(), roughness: 0.6, metalness: 0.15 }), items.length)
  const d = new THREE.Object3D()
  const c = new THREE.Color()
  items.forEach((it, i) => {
    d.position.set(it[0], it[1] - 0.2, it[2])
    d.updateMatrix()
    im.setMatrixAt(i, d.matrix)
    c.setHex(it[3])
    im.setColorAt(i, c)
  })
  im.castShadow = true
  g.add(im)
  const slotMats = items.map((it) => new THREE.Matrix4().makeTranslation(it[0], it[1] - 0.2, it[2]))
  const hideMat = new THREE.Matrix4().makeScale(0, 0, 0)
  const cargo = {
    items,
    setSlot(i, vis) {
      im.setMatrixAt(i, vis ? slotMats[i] : hideMat)
      im.instanceMatrix.needsUpdate = true
    },
  }
  namePlate(g, 'SINDBAD LINE', L * 0.2, 4.4, B / 2, 15, 1.9, '#f4f0e4')
  flag(g, -L / 2 + 1.2, dy + 0.1, 0, 1.2)
  const sm = smoke(g, -L / 2 + 4.2, dy + 15, 2.2, 1.1)
  g.userData = { draft: 3.4, L, B, smoke: sm, radar: rd, kind: 'ship', cargo }
  return g
}

/* ---------- سفينة بضائع بروافع ---------- */
export function makeCargoShip() {
  const L = 46
  const B = 8.2
  const g = new THREE.Group()
  const hull = new THREE.Mesh(
    shipHull({ L, B, D: 2.9, F: 2.6, bowStart: 0.76, sternRound: 0.86, bowRise: 1.8, sternRise: 0.6, keelRise: 0.6, hullTop: [0.1, 0.24, 0.2], hullBottom: [0.4, 0.1, 0.07], deck: [0.34, 0.31, 0.28], band: [0.88, 0.86, 0.8], seed: 9 }),
    hullMat()
  )
  hull.castShadow = true
  g.add(hull)
  const dy = 5.5
  g.add(box(6, 6.4, 7.4, 0xf1eee6, -L / 2 + 5.4, dy + 3.2, 0))
  g.add(box(4.4, 1.4, 7.8, 0xf1eee6, -L / 2 + 5, dy + 7.1, 0))
  windowsStrip(g, 0.05, 7, -L / 2 + 8.45, dy + 3.2, 0, 2, 0.45, 1.5)
  windowsStrip(g, 0.05, 7.6, -L / 2 + 7.25, dy + 7.1, 0, 1, 0.7)
  g.add(cyl(0.9, 1.0, 2.6, 0x1f4a3a, -L / 2 + 3.6, dy + 8, 1.4, 14))
  g.add(cyl(1.02, 1.02, 0.4, 0x15171a, -L / 2 + 3.6, dy + 9.4, 1.4, 14))
  const rd = radar(g, -L / 2 + 5, dy + 8.1, 0)
  lifeboat(g, -L / 2 + 3, dy + 3, B / 2 + 0.2)
  lifeboat(g, -L / 2 + 3, dy + 3, -B / 2 - 0.2)
  g.add(box(9, 0.9, 5.6, 0x3b4046, -L * 0.1, dy + 0.45, 0))
  g.add(box(9, 0.9, 5.6, 0x3b4046, L * 0.2, dy + 0.45, 0))
  const cranes = []
  ;[-L * 0.28, L * 0.04, L * 0.36].forEach((x, i) => {
    const side = i % 2 ? 1 : -1
    g.add(cyl(0.3, 0.38, 8.5, 0xd9b53a, x, dy + 4.25, side * 3.2, 10))
    const boomG = new THREE.Group()
    boomG.position.set(x, dy + 8.4, side * 3.2)
    boomG.add(box(0.28, 0.28, 11, 0xd9b53a, 0, 0, side * 5.2))
    boomG.add(cyl(0.03, 0.03, 4.2, 0x222222, 0, -2.1, side * 10.4, 4))
    boomG.rotation.x = side * 0.5
    boomG.userData.base = side * 0.5
    boomG.userData.side = side
    cranes.push(boomG)
    g.add(boomG)
  })
  railings(g, -L / 2 + 9.5, L * 0.38, dy, B / 2 - 0.12)
  namePlate(g, 'UMM QASR', L * 0.18, 3.9, B / 2, 10, 1.6, '#f4f0e4')
  flag(g, -L / 2 + 1, dy + 0.1, 0, 1.1)
  const sm = smoke(g, -L / 2 + 3.6, dy + 9.8, 1.4, 0.9)
  g.userData = { draft: 2.9, L, B, smoke: sm, radar: rd, cranes, kind: 'ship' }
  return g
}

/* ---------- بارجة مع قاطرة ---------- */
export function makeBargeTug() {
  const g = new THREE.Group()
  const barge = new THREE.Mesh(
    shipHull({ L: 27, B: 6.2, D: 1.1, F: 1.0, bowStart: 0.9, sternRound: 0.96, bowRise: 0.4, sternRise: 0, keelRise: 0.3, hullTop: [0.34, 0.17, 0.1], hullBottom: [0.3, 0.08, 0.05], deck: [0.4, 0.3, 0.2], seed: 11 }),
    hullMat()
  )
  barge.castShadow = true
  g.add(barge)
  const heap = new THREE.Mesh(new THREE.ConeGeometry(2.8, 2.4, 12), M(0xb59a68, { roughness: 1, flatShading: true }))
  heap.scale.set(2.4, 1, 1)
  heap.position.set(1, 3.3, 0)
  heap.castShadow = true
  g.add(heap)
  const tug = new THREE.Group()
  const th = new THREE.Mesh(
    shipHull({ L: 11, B: 4.2, D: 1.5, F: 1.3, bowStart: 0.6, sternRound: 0.85, bowRise: 0.5, sternRise: 0.3, keelRise: 0.5, hullTop: [0.62, 0.1, 0.08], hullBottom: [0.1, 0.1, 0.1], deck: [0.3, 0.3, 0.3], band: [0.9, 0.88, 0.82], seed: 13 }),
    hullMat()
  )
  th.castShadow = true
  tug.add(th)
  tug.add(box(3.4, 2.2, 3.2, 0xf1eee6, -1, 3.9, 0))
  tug.add(box(2.2, 0.9, 3.6, 0xf1eee6, -1, 5.4, 0))
  windowsStrip(tug, 0.05, 3, 0.72, 3.9, 0, 1, 0.7)
  tug.add(cyl(0.4, 0.5, 2.0, 0x1c1d20, -2.4, 5.2, 0, 10))
  const rd = radar(tug, -1, 5.9, 0)
  namePlate(tug, 'BASRA PORT', 0.4, 2.6, 2.1, 4.2, 0.55, '#f4f0e4', 'bold 80px Arial, sans-serif')
  flag(tug, -4.4, 2.95, 0, 0.6)
  tug.position.set(-27 / 2 - 4.6, 0, 0)
  g.add(tug)
  const sm = smoke(tug, -2.4, 6.3, 0, 0.7)
  g.userData = { draft: 1.1, L: 38, B: 6.2, smoke: sm, radar: rd, kind: 'ship' }
  return g
}

/* ---------- حركة تفاصيل السفينة ---------- */
export function animateVessel(g, t, phase = 0, speed = 0) {
  const u = g.userData
  if (u.radar) u.radar.rotation.y = t * 2.4
  if (u.smoke) u.smoke.uniforms.uSpeed.value = speed
  if (u.cranes) u.cranes.forEach((c, i) => (c.rotation.x = c.userData.base + Math.sin(t * 0.25 + i * 1.7) * 0.06 * c.userData.side))
  if (u.pole) {
    const k = Math.sin(t * 1.4 + phase)
    u.pole.rotation.z = 0.55 + k * 0.28
    u.pole.position.y = 0.9 - Math.max(0, -k) * 0.15
    if (u.poler) u.poler.rotation.z = k * 0.05
  }
}

/* سارية وعلم العراق للاستخدام خارج السفن */
export function makeFlag(scale = 1, height = 12) {
  const g = new THREE.Group()
  g.add(cyl(0.12 * scale, 0.18 * scale, height, 0xe8e8e8, 0, height / 2, 0, 8))
  const f = new THREE.Mesh(new THREE.PlaneGeometry(4.2 * scale, 2.8 * scale, 18, 6), flagMaterial())
  f.position.set(2.1 * scale, height - 1.6 * scale, 0)
  g.add(f)
  return g
}
