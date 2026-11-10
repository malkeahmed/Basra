import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/* نخلة خرما واقعية: جذع بحلقات، سعف ريشي بوريقات كثيرة، عذوق تمر، وقصب للضفاف */

const rng = (seed) => {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}
const sstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function paint(geo, fn) {
  const p = geo.attributes.position
  const c = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    const col = fn(p.getX(i), p.getY(i), p.getZ(i), i)
    c[i * 3] = col[0]
    c[i * 3 + 1] = col[1]
    c[i * 3 + 2] = col[2]
  }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3))
}

function makeTrunk(H, bend, r) {
  const g = new THREE.CylinderGeometry(0.2, 0.34, H, 8, 18, true)
  g.translate(0, H / 2, 0)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    const a = Math.atan2(z, x)
    const base = Math.hypot(x, z)
    const ring = 1 + 0.07 * Math.sin(y * 9.5) + 0.035 * Math.sin(y * 23 + a * 3)
    const flare = 1 + 0.9 * Math.exp(-y * 1.3)
    const crown = 1 + 0.55 * sstep(H - 1.6, H - 0.2, y)
    const rough = 1 + 0.05 * Math.sin(a * 7 + y * 3.1) * Math.cos(a * 3 - y)
    const k = ring * flare * crown * rough
    const t = y / H
    p.setX(i, x * k + bend * H * t * t)
    p.setZ(i, z * k + bend * 0.4 * H * t * t)
  }
  g.computeVertexNormals()
  g.deleteAttribute('uv')
  paint(g, (x, y) => {
    const t = y / H
    const crev = 0.5 + 0.5 * Math.sin(y * 9.5)
    const shade = 0.62 + crev * 0.38
    const base = [0.22 + 0.2 * t, 0.15 + 0.15 * t, 0.09 + 0.1 * t]
    return [base[0] * shade, base[1] * shade, base[2] * shade]
  })
  return g
}

/* سعفة ريشية: عرق مركزي مقوّس وعشرات الوريقات المتدلية */
function makeFrond(len, lift, drop, dry, rand) {
  const pos = []
  const col = []
  const rach = (t) => {
    const x = t * len
    const y = Math.sin(t * Math.PI * 0.6) * len * lift - t * t * len * drop
    return new THREE.Vector3(x, y, 0)
  }
  const push = (v, c) => {
    pos.push(v.x, v.y, v.z)
    col.push(c[0], c[1], c[2])
  }
  const greenBase = [0.2, 0.28, 0.1]
  const greenTip = [0.55, 0.64, 0.3]
  const dryBase = [0.42, 0.32, 0.16]
  const dryTip = [0.62, 0.52, 0.3]
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

  const N = 14
  for (let i = 0; i < N; i++) {
    const t = 0.1 + (i / (N - 1)) * 0.88
    const P = rach(t)
    const P2 = rach(Math.min(1, t + 0.01))
    const tan = P2.clone().sub(P).normalize()
    const ll = len * 0.3 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.75)), 0.65) * (1 - 0.35 * t) * (0.85 + rand() * 0.3)
    for (const s of [-1, 1]) {
      const dir = new THREE.Vector3(0, 0, s).multiplyScalar(1).add(tan.clone().multiplyScalar(0.62)).add(new THREE.Vector3(0, -0.5 - t * 0.3, 0)).normalize()
      const w = (0.045 + ll * 0.045) * 1.4
      const a = P.clone().addScaledVector(tan, -w)
      const b = P.clone().addScaledVector(tan, w)
      const mid = P.clone().addScaledVector(dir, ll * 0.5).add(new THREE.Vector3(0, ll * 0.1, 0))
      const tip = P.clone().addScaledVector(dir, ll).add(new THREE.Vector3(0, -ll * 0.1, 0))
      const wv = 0.8 + rand() * 0.4
      const cB = dry ? mixc(dryBase, dryTip, 0.1) : mixc(greenBase, greenTip, 0.1)
      const cM = dry ? mixc(dryBase, dryTip, 0.5) : mixc(greenBase, greenTip, 0.45 * wv)
      const cT = dry ? mixc(dryBase, dryTip, 0.9) : mixc(greenBase, greenTip, 0.95 * wv)
      const wm = w * 0.9
      const ma = mid.clone().addScaledVector(tan, -wm)
      const mb = mid.clone().addScaledVector(tan, wm)
      /* وريقة بقسمين لتنحني */
      push(a, cB), push(b, cB), push(mb, cM)
      push(a, cB), push(mb, cM), push(ma, cM)
      push(ma, cM), push(mb, cM), push(tip, cT)
    }
  }
  /* العرق المركزي */
  const segs = 10
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs
    const t1 = (i + 1) / segs
    const a = rach(t0)
    const b = rach(t1)
    const w0 = 0.09 * (1 - t0 * 0.8)
    const w1 = 0.09 * (1 - t1 * 0.8)
    const c = dry ? [0.45, 0.36, 0.2] : [0.38, 0.4, 0.2]
    const up = new THREE.Vector3(0, 0, 1)
    push(a.clone().addScaledVector(up, -w0), c), push(a.clone().addScaledVector(up, w0), c), push(b.clone().addScaledVector(up, w1), c)
    push(a.clone().addScaledVector(up, -w0), c), push(b.clone().addScaledVector(up, w1), c), push(b.clone().addScaledVector(up, -w1), c)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.computeVertexNormals()
  return g
}

function makeCrown(H, bend, seed) {
  const rand = rng(seed)
  const cx = bend * H
  const cz = bend * 0.4 * H
  const parts = []
  const nF = 11
  for (let k = 0; k < nF; k++) {
    const u = k / (nF - 1)
    const theta = k * 2.399963 + rand() * 0.3
    const tilt = 0.95 - u * 1.95 + (rand() - 0.5) * 0.12
    const len = 5.6 * (1.05 - 0.2 * u) * (0.9 + rand() * 0.2)
    const dry = u > 0.82
    const g = makeFrond(len, 0.24 - u * 0.05, 0.34 + u * 0.55, dry, rand)
    g.rotateZ(tilt)
    g.rotateY(theta)
    g.translate(cx, H + 0.1 - u * 0.25, cz)
    parts.push(g)
  }
  return mergeGeometries(parts)
}

function makeDates(H, bend, seed) {
  const rand = rng(seed * 3 + 1)
  const parts = []
  const cx = bend * H
  const cz = bend * 0.4 * H
  for (let b = 0; b < 4; b++) {
    const a = rand() * Math.PI * 2
    const bx = cx + Math.cos(a) * 0.9
    const bz = cz + Math.sin(a) * 0.9
    for (let i = 0; i < 6; i++) {
      const s = new THREE.IcosahedronGeometry(0.11 + rand() * 0.05, 0)
      s.scale(1, 1.5, 1)
      s.translate(bx + (rand() - 0.5) * 0.45, H - 0.9 - rand() * 1.1, bz + (rand() - 0.5) * 0.45)
      parts.push(s)
    }
  }
  const g = mergeGeometries(parts.map((p) => p.toNonIndexed()))
  paint(g, () => {
    const v = rand()
    return [0.6 + 0.2 * v, 0.28 + 0.1 * v, 0.07]
  })
  return g
}

export function makePalmVariants() {
  const variants = []
  const spec = [
    { H: 8.6, bend: 0.045 },
    { H: 10.8, bend: -0.035 },
    { H: 12.6, bend: 0.06 },
    { H: 9.6, bend: -0.06 },
  ]
  spec.forEach((s, i) => {
    variants.push({
      H: s.H,
      trunk: makeTrunk(s.H, s.bend),
      fronds: makeCrown(s.H, s.bend, 11 + i * 7),
      dates: makeDates(s.H, s.bend, 5 + i),
    })
  })
  return variants
}

/* قصب بضفاف النهر */
export function makeReeds() {
  const rand = rng(77)
  const parts = []
  for (let i = 0; i < 9; i++) {
    const h = 1.6 + rand() * 2.2
    const a = rand() * Math.PI * 2
    const lean = 0.25 + rand() * 0.5
    const ox = (rand() - 0.5) * 0.7
    const oz = (rand() - 0.5) * 0.7
    const pos = []
    const segs = 4
    for (let s = 0; s <= segs; s++) {
      const t = s / segs
      const w = 0.07 * (1 - t) + 0.005
      const y = t * h
      const d = t * t * lean * h
      pos.push(ox + Math.cos(a) * d - w, y, oz + Math.sin(a) * d, ox + Math.cos(a) * d + w, y, oz + Math.sin(a) * d)
    }
    const idx = []
    for (let s = 0; s < segs; s++) {
      const q = s * 2
      idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    paint(g, (x, y) => {
      const t = y / h
      return [0.22 + 0.4 * t, 0.3 + 0.36 * t, 0.12 + 0.18 * t]
    })
    parts.push(g)
  }
  return mergeGeometries(parts)
}

/* حركة الرياح عبر الظلال */
export function swayMaterial(mat, uTime, strength = 1, flutter = false) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime
    sh.vertexShader =
      'uniform float uTime;\n' +
      sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float hh = max(position.y, 0.0);
        float ph = instanceMatrix[3].x * 0.13 + instanceMatrix[3].z * 0.11;
        float k = pow(hh / 10.0, 2.0) * ${strength.toFixed(2)};
        transformed.x += (sin(uTime * 1.3 + ph) * 0.5 + sin(uTime * 2.1 + ph * 1.7) * 0.25) * k * 0.5;
        transformed.z += cos(uTime * 1.1 + ph) * k * 0.3;
        ${flutter ? 'float rr = length(position.xz); transformed.y += sin(uTime * 2.6 + rr * 1.4 + ph) * 0.05 * rr * step(5.0, hh);' : ''}`
      )
  }
  return mat
}


/* حزمة عشب */
export function makeGrass() {
  const rand = rng(303)
  const parts = []
  for (let i = 0; i < 8; i++) {
    const h = 0.55 + rand() * 0.8
    const a = rand() * Math.PI * 2
    const lean = 0.2 + rand() * 0.55
    const ox = (rand() - 0.5) * 0.5
    const oz = (rand() - 0.5) * 0.5
    const pos = []
    const segs = 3
    const side = rand() * Math.PI
    for (let s = 0; s <= segs; s++) {
      const t = s / segs
      const w = 0.045 * (1 - t) + 0.004
      const y = t * h
      const d = t * t * lean * h
      const cx = ox + Math.cos(a) * d
      const cz = oz + Math.sin(a) * d
      pos.push(cx - Math.cos(side) * w, y, cz - Math.sin(side) * w, cx + Math.cos(side) * w, y, cz + Math.sin(side) * w)
    }
    const idx = []
    for (let s = 0; s < segs; s++) {
      const q = s * 2
      idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    paint(g, (x, y) => {
      const t = y / h
      return [0.1 + 0.42 * t, 0.22 + 0.5 * t, 0.05 + 0.14 * t]
    })
    parts.push(g)
  }
  return mergeGeometries(parts)
}
