import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/*
  مركبات واقعية منخفضة التفاصيل لكنها مصقولة: سيدان، دفع رباعي، بيك أب، ميني باص، شاحنة حاويات وصهريج.
  الجسم بتدرّج لون قابل للتلوين لكل مركبة، والزجاج والإطارات والأضواء ثابتة.
*/

const GLASS = [0.04, 0.06, 0.09]
const TIRE = [0.025, 0.025, 0.03]
const RIM = [0.62, 0.64, 0.66]
const HEAD = [1.0, 0.96, 0.78]
const TAIL = [0.9, 0.04, 0.04]
const DARK = [0.06, 0.06, 0.07]
const CHROME = [0.7, 0.72, 0.74]

function prep(geo, color, paint) {
  let g = geo.index ? geo.toNonIndexed() : geo
  g.deleteAttribute('uv')
  const n = g.attributes.position.count
  const col = new Float32Array(n * 3)
  const pt = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    col[i * 3] = color[0]
    col[i * 3 + 1] = color[1]
    col[i * 3 + 2] = color[2]
    pt[i] = paint
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.setAttribute('aPaint', new THREE.BufferAttribute(pt, 1))
  return g
}
const shapeOf = (pts) => {
  const s = new THREE.Shape()
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)))
  s.closePath()
  return s
}
function extrude(pts, W, bevel = 0.07) {
  const g = new THREE.ExtrudeGeometry(shapeOf(pts), { depth: W - bevel * 2, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 6 })
  g.translate(0, 0, -(W - bevel * 2) / 2)
  return g
}
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z)
function wheel(x, y, z, r, w = 0.28) {
  const t = new THREE.CylinderGeometry(r, r, w, 20).rotateX(Math.PI / 2).translate(x, y, z)
  const rim = new THREE.CylinderGeometry(r * 0.62, r * 0.62, w + 0.02, 14).rotateX(Math.PI / 2).translate(x, y, z)
  return [prep(t, TIRE, 0), prep(rim, RIM, 0)]
}

function car({ L, H, W = 1.8, profile, glass, wheelR, wheelBase, rear = 0, parts = [] }) {
  const out = []
  out.push(prep(extrude(profile, W), [1, 1, 1], 1))
  if (glass) {
    const g = new THREE.ExtrudeGeometry(shapeOf(glass), { depth: W + 0.04, bevelEnabled: false })
    g.translate(0, 0, -(W + 0.04) / 2)
    out.push(prep(g, GLASS, 0))
  }
  const wx = [wheelBase / 2 + rear, -wheelBase / 2 + rear]
  wx.forEach((x) => [W / 2 - 0.06, -(W / 2 - 0.06)].forEach((z) => out.push(...wheel(x, wheelR, z, wheelR))))
  /* مصابيح أمامية وخلفية وصدّامات */
  const fx = L / 2
  ;[0.62, -0.62].forEach((z) => {
    out.push(prep(box(0.08, 0.16, 0.34, fx - 0.04, 0.78, z), HEAD, 0))
    out.push(prep(box(0.08, 0.16, 0.34, -fx + 0.04, 0.8, z), TAIL, 0))
  })
  out.push(prep(box(0.14, 0.2, W * 0.86, fx - 0.04, 0.4, 0), DARK, 0))
  out.push(prep(box(0.14, 0.2, W * 0.86, -fx + 0.04, 0.4, 0), DARK, 0))
  out.push(prep(box(0.06, 0.2, 0.7, fx - 0.02, 0.58, 0), CHROME, 0))
  parts.forEach((p) => out.push(p))
  return mergeGeometries(out)
}

export function sedanGeo() {
  return car({
    L: 4.5, H: 1.45, wheelR: 0.33, wheelBase: 2.7,
    profile: [[-2.25, 0.32], [-2.25, 0.8], [-2.05, 0.95], [-1.5, 1.0], [-1.05, 1.07], [-0.62, 1.42], [0.45, 1.45], [1.1, 1.1], [1.95, 0.97], [2.2, 0.8], [2.25, 0.55], [2.2, 0.32]],
    glass: [[-1.0, 1.09], [-0.64, 1.38], [0.42, 1.4], [1.02, 1.12]],
  })
}
export function suvGeo() {
  return car({
    L: 4.7, H: 1.78, W: 1.9, wheelR: 0.39, wheelBase: 2.8,
    profile: [[-2.3, 0.4], [-2.35, 1.1], [-2.15, 1.6], [-1.8, 1.76], [0.7, 1.8], [1.25, 1.42], [2.0, 1.14], [2.3, 0.97], [2.35, 0.55], [2.25, 0.4]],
    glass: [[-2.05, 1.18], [-1.8, 1.7], [0.65, 1.74], [1.15, 1.42], [1.0, 1.18]],
  })
}
export function pickupGeo() {
  const W = 1.85
  const cab = [[-0.9, 0.5], [-0.9, 1.6], [-0.4, 1.82], [0.55, 1.82], [1.1, 1.45], [1.6, 1.2], [2.55, 1.12], [2.62, 0.9], [2.62, 0.5]]
  const glass = [[-0.8, 1.2], [-0.4, 1.75], [0.5, 1.75], [1.0, 1.35], [0.9, 1.2]]
  const bed = []
  bed.push(prep(box(1.9, 0.12, W - 0.1, -1.85, 0.66, 0), [1, 1, 1], 1))
  ;[W / 2 - 0.05, -(W / 2 - 0.05)].forEach((z) => bed.push(prep(box(1.9, 0.5, 0.1, -1.85, 0.95, z), [1, 1, 1], 1)))
  bed.push(prep(box(0.1, 0.5, W - 0.1, -2.8, 0.95, 0), [1, 1, 1], 1))
  bed.push(prep(box(0.1, 0.6, W - 0.1, -0.88, 0.98, 0), [1, 1, 1], 1))
  return car({ L: 5.4, H: 1.82, W, wheelR: 0.38, wheelBase: 3.1, rear: -0.1, profile: cab, glass, parts: bed })
}
export function minibusGeo() {
  const W = 1.95
  const parts = []
  for (let i = 0; i < 6; i++) parts.push(prep(box(0.62, 0.62, W + 0.04, -2.0 + i * 0.78, 1.65, 0), GLASS, 0))
  parts.push(prep(box(0.08, 0.7, W - 0.2, 2.45, 1.45, 0), GLASS, 0))
  return car({
    L: 5.3, H: 2.3, W, wheelR: 0.37, wheelBase: 3.2, rear: -0.1,
    profile: [[-2.65, 0.42], [-2.65, 2.25], [1.95, 2.3], [2.55, 1.75], [2.65, 1.5], [2.65, 0.5], [2.5, 0.42]],
    glass: null, parts,
  })
}
export function truckGeo() {
  const W = 2.35
  const out = []
  const cab = [[1.2, 0.95], [1.2, 3.0], [2.7, 3.05], [3.25, 2.35], [3.3, 0.95]]
  out.push(prep(extrude(cab, W), [1, 1, 1], 1))
  const gl = new THREE.ExtrudeGeometry(shapeOf([[1.35, 2.0], [1.4, 2.85], [2.6, 2.9], [3.1, 2.3], [3.1, 2.0]]), { depth: W + 0.04, bevelEnabled: false })
  gl.translate(0, 0, -(W + 0.04) / 2)
  out.push(prep(gl, GLASS, 0))
  out.push(prep(box(8.6, 0.35, W - 0.3, -2.4, 1.05, 0), DARK, 0))
  out.push(prep(box(6.1, 2.6, 2.45, -2.9, 2.55, 0), [1, 1, 1], 2))
  ;[-0.6, -1.9, -4.0, -5.4].forEach((x) => [W / 2 - 0.05, -(W / 2 - 0.05)].forEach((z) => out.push(...wheel(x, 0.5, z, 0.5, 0.34))))
  ;[1.55, 3.1].forEach((x) => [W / 2 - 0.05, -(W / 2 - 0.05)].forEach((z) => out.push(...wheel(x, 0.5, z, 0.5, 0.34))))
  ;[0.8, -0.8].forEach((z) => {
    out.push(prep(box(0.1, 0.2, 0.4, 3.3, 1.25, z), HEAD, 0))
    out.push(prep(box(0.1, 0.2, 0.4, -7.2, 1.25, z), TAIL, 0))
  })
  out.push(prep(box(0.16, 0.3, W, 3.28, 0.7, 0), DARK, 0))
  return mergeGeometries(out)
}
export function tankerTruckGeo() {
  const W = 2.35
  const out = []
  const cab = [[1.2, 0.95], [1.2, 3.0], [2.7, 3.05], [3.25, 2.35], [3.3, 0.95]]
  out.push(prep(extrude(cab, W), [1, 1, 1], 1))
  const gl = new THREE.ExtrudeGeometry(shapeOf([[1.35, 2.0], [1.4, 2.85], [2.6, 2.9], [3.1, 2.3], [3.1, 2.0]]), { depth: W + 0.04, bevelEnabled: false })
  gl.translate(0, 0, -(W + 0.04) / 2)
  out.push(prep(gl, GLASS, 0))
  out.push(prep(box(8.0, 0.35, W - 0.3, -2.4, 1.05, 0), DARK, 0))
  const tank = new THREE.CylinderGeometry(1.15, 1.15, 6.4, 24).rotateZ(Math.PI / 2).translate(-3.2, 2.35, 0)
  out.push(prep(tank, [0.82, 0.84, 0.86], 0))
  out.push(prep(new THREE.SphereGeometry(1.15, 18, 12).translate(-6.4, 2.35, 0), [0.82, 0.84, 0.86], 0))
  out.push(prep(new THREE.SphereGeometry(1.15, 18, 12).translate(0, 2.35, 0), [0.82, 0.84, 0.86], 0))
  out.push(prep(box(1.6, 0.4, 0.9, -3.2, 3.6, 0), [0.4, 0.4, 0.42], 0))
  ;[-0.6, -1.9, -4.0, -5.4].forEach((x) => [W / 2 - 0.05, -(W / 2 - 0.05)].forEach((z) => out.push(...wheel(x, 0.5, z, 0.5, 0.34))))
  ;[1.55, 3.1].forEach((x) => [W / 2 - 0.05, -(W / 2 - 0.05)].forEach((z) => out.push(...wheel(x, 0.5, z, 0.5, 0.34))))
  ;[0.8, -0.8].forEach((z) => {
    out.push(prep(box(0.1, 0.2, 0.4, 3.3, 1.25, z), HEAD, 0))
    out.push(prep(box(0.1, 0.2, 0.4, -6.6, 1.25, z), TAIL, 0))
  })
  return mergeGeometries(out)
}

/* مادة طلاء لامعة مع صبغة لكل مركبة */
export function paintMaterial() {
  const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, metalness: 0.5, roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.22 })
  m.onBeforeCompile = (sh) => {
    sh.vertexShader =
      'attribute float aPaint;\nattribute vec3 aTint;\nattribute vec3 aTint2;\nvarying float vPaint;\nvarying vec3 vTint;\nvarying vec3 vTint2;\n' +
      sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaint = aPaint; vTint = aTint; vTint2 = aTint2;')
    sh.fragmentShader =
      'varying float vPaint;\nvarying vec3 vTint;\nvarying vec3 vTint2;\n' +
      sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nif (vPaint > 1.5) diffuseColor.rgb *= vTint2; else if (vPaint > 0.5) diffuseColor.rgb *= vTint;')
  }
  return m
}

const PAINTS = [0xf2f0ea, 0xe9e6dd, 0x1c1f24, 0x6b7076, 0xb8c0c8, 0x7a1f23, 0x1f3b57, 0xc9c5b8, 0x2d4a3a, 0xd7a02a, 0xffffff, 0x4a4f55]
const TAXI = 0xe88a1a

/* مجموعة مركبات: كل نوع InstancedMesh مع صبغة */
export function createFleet(counts) {
  const defs = [
    ['sedan', sedanGeo, 4.5],
    ['suv', suvGeo, 4.7],
    ['pickup', pickupGeo, 5.4],
    ['minibus', minibusGeo, 5.3],
    ['truck', truckGeo, 9.2],
    ['tanker', tankerTruckGeo, 9.2],
  ]
  const mat = paintMaterial()
  const meshes = []
  const c = new THREE.Color()
  defs.forEach(([name, fn, len]) => {
    const n = counts[name] || 0
    if (!n) return
    const geo = fn()
    const t1 = new Float32Array(n * 3)
    const t2 = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const hex = name === 'sedan' && i % 4 === 0 ? TAXI : name === 'tanker' ? 0xe9e6dd : PAINTS[(i * 5 + name.length) % PAINTS.length]
      c.setHex(hex)
      t1[i * 3] = c.r
      t1[i * 3 + 1] = c.g
      t1[i * 3 + 2] = c.b
      c.setHex([0xb8452b, 0x2a5d8f, 0xd49a2a, 0x3f7a4a, 0xe8e4d8, 0x555b63][i % 6])
      t2[i * 3] = c.r
      t2[i * 3 + 1] = c.g
      t2[i * 3 + 2] = c.b
    }
    geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(t1, 3))
    geo.setAttribute('aTint2', new THREE.InstancedBufferAttribute(t2, 3))
    const im = new THREE.InstancedMesh(geo, mat, n)
    im.frustumCulled = false
    im.castShadow = true
    meshes.push({ name, im, n, len })
  })
  return meshes
}
