import * as THREE from 'three'
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js'

/*
  نحت ثلاثي الأبعاد حقيقي للرأس واليدين (سطوح ضمنية SDF ثم مكعبات مسيرة)،
  بملامح مطابقة لتمثال السيّاب في الصورة: جبهة عالية، حاجبان بارزان، أنف مستقيم، شفتان رقيقتان، أذن، وشعر مسرّح للخلف.
*/

const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const sdS = (x, y, z, cx, cy, cz, r) => len3(x - cx, y - cy, z - cz) - r
function sdE(x, y, z, cx, cy, cz, rx, ry, rz) {
  const ax = (x - cx) / rx
  const ay = (y - cy) / ry
  const az = (z - cz) / rz
  const k0 = len3(ax, ay, az)
  const k1 = len3(ax / rx, ay / ry, az / rz)
  return k1 > 1e-9 ? (k0 * (k0 - 1)) / k1 : -Math.min(rx, ry, rz)
}
function sdC(x, y, z, ax, ay, az, bx, by, bz, r) {
  const pax = x - ax
  const pay = y - ay
  const paz = z - az
  const bax = bx - ax
  const bay = by - ay
  const baz = bz - az
  const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1)
  return len3(pax - bax * h, pay - bay * h, paz - baz * h) - r
}
const smin = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - h * h * k * 0.25
}
const smax = (a, b, k) => -smin(-a, -b, k)
const sstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

/* تحويل حقل مسافة إلى شبكة مثلثات ملساء */
function polygonize(res, half, sdf, boundsFn, maxPoly = 320000) {
  const mc = new MarchingCubes(res, new THREE.MeshBasicMaterial(), false, false, maxPoly)
  mc.isolation = 80
  const cell = (2 * half) / res
  const k = 24 / cell
  const f = mc.field
  let i = 0
  const hr = res / 2
  for (let z = 0; z < res; z++) {
    const pz = ((z - hr) / hr) * half
    for (let y = 0; y < res; y++) {
      const py = ((y - hr) / hr) * half
      for (let x = 0; x < res; x++) {
        const px = ((x - hr) / hr) * half
        let v = boundsFn(px, py, pz)
        if (v < 0.06) v = sdf(px, py, pz)
        f[i++] = clamp(80 - v * k, 0, 220)
      }
    }
  }
  mc.update()
  const n = mc.count
  const pos = new Float32Array(n * 3)
  const nor = new Float32Array(n * 3)
  for (let j = 0; j < n * 3; j++) {
    pos[j] = mc.positionArray[j] * half
    nor[j] = mc.normalArray[j]
  }
  /* تسوية الاتجاه: طبيعي المسافة يشير للخارج، نعيد تطبيعه */
  for (let j = 0; j < n; j++) {
    const a = nor[j * 3]
    const b = nor[j * 3 + 1]
    const c = nor[j * 3 + 2]
    const l = Math.hypot(a, b, c) || 1
    nor[j * 3] = a / l
    nor[j * 3 + 1] = b / l
    nor[j * 3 + 2] = c / l
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  mc.geometry.dispose()
  return g
}

/* ---------- الرأس ---------- */
function headSdf(x, y, z) {
  /* جمجمة وجبهة */
  let d = sdE(x, y, z, 0, 0.1, -0.04, 0.29, 0.36, 0.37)
  /* الفكّ والوجه السفلي */
  d = smin(d, sdE(x, y, z, 0, -0.2, 0.07, 0.235, 0.3, 0.27), 0.12)
  /* الذقن */
  d = smin(d, sdS(x, y, z, 0, -0.4, 0.19, 0.095), 0.07)
  d = smin(d, sdE(x, y, z, 0, -0.34, 0.16, 0.125, 0.095, 0.115), 0.06)
  /* وجنتان */
  d = smin(d, sdS(x, y, z, 0.17, -0.05, 0.2, 0.09), 0.08)
  d = smin(d, sdS(x, y, z, -0.17, -0.05, 0.2, 0.09), 0.08)
  /* حاجبان بارزان */
  d = smin(d, sdC(x, y, z, -0.17, 0.125, 0.315, 0.17, 0.125, 0.315, 0.04), 0.06)
  /* محجرا العينين */
  d = smax(d, -sdE(x, y, z, 0.105, 0.065, 0.36, 0.052, 0.03, 0.04), 0.03)
  d = smax(d, -sdE(x, y, z, -0.105, 0.065, 0.36, 0.052, 0.03, 0.04), 0.03)
  /* مقلتان خفيفتان وجفنان */
  d = smin(d, sdE(x, y, z, 0.105, 0.062, 0.33, 0.05, 0.034, 0.028), 0.02)
  d = smin(d, sdE(x, y, z, -0.105, 0.062, 0.33, 0.05, 0.034, 0.028), 0.02)
  d = smin(d, sdE(x, y, z, 0.105, 0.096, 0.338, 0.058, 0.014, 0.026), 0.015)
  d = smin(d, sdE(x, y, z, -0.105, 0.096, 0.338, 0.058, 0.014, 0.026), 0.015)
  /* الأنف: جسر مستقيم وطرف وجناحان */
  d = smin(d, sdC(x, y, z, 0, 0.08, 0.325, 0, -0.09, 0.395, 0.046), 0.05)
  d = smin(d, sdS(x, y, z, 0, -0.105, 0.405, 0.052), 0.04)
  d = smin(d, sdS(x, y, z, 0.052, -0.09, 0.372, 0.034), 0.03)
  d = smin(d, sdS(x, y, z, -0.052, -0.09, 0.372, 0.034), 0.03)
  d = smax(d, -sdS(x, y, z, 0.03, -0.14, 0.415, 0.014), 0.012)
  d = smax(d, -sdS(x, y, z, -0.03, -0.14, 0.415, 0.014), 0.012)
  /* الشفتان */
  d = smin(d, sdE(x, y, z, 0, -0.2, 0.335, 0.082, 0.026, 0.034), 0.02)
  d = smin(d, sdE(x, y, z, 0, -0.238, 0.328, 0.068, 0.022, 0.032), 0.02)
  d = smax(d, -sdE(x, y, z, 0, -0.215, 0.362, 0.075, 0.005, 0.026), 0.008)
  /* الأذنان */
  ;[1, -1].forEach((s) => {
    d = smin(d, sdE(x, y, z, 0.295 * s, -0.01, -0.03, 0.04, 0.09, 0.06), 0.03)
    d = smax(d, -sdE(x, y, z, 0.31 * s, -0.01, -0.01, 0.022, 0.05, 0.03), 0.015)
  })
  /* الشعر المسرّح للخلف مع تحديد خط الشعر */
  const hairBase = sdE(x, y, z, 0, 0.14, -0.05, 0.32, 0.37, 0.42)
  const lineY = -0.1 + 0.34 * sstep(-0.12, 0.2, z) + 0.03 * Math.abs(x)
  const strand = 0.006 * Math.sin(95 * x + 7 * y + 3 * z) + 0.004 * Math.sin(60 * x - 11 * z)
  const hair = smax(hairBase + strand, lineY - y, 0.03)
  d = smin(d, hair, 0.02)
  /* سوالف */
  d = smin(d, sdC(x, y, z, 0.27, 0.05, 0.1, 0.275, -0.1, 0.13, 0.035), 0.03)
  d = smin(d, sdC(x, y, z, -0.27, 0.05, 0.1, -0.275, -0.1, 0.13, 0.035), 0.03)
  /* فرق الشعر: أخدود صغير */
  d = smax(d, -sdC(x, y, z, -0.11, 0.42, 0.1, -0.06, 0.2, 0.34, 0.012), 0.01)
  /* العنق */
  d = smin(d, sdC(x, y, z, 0, -0.45, -0.06, 0, -0.95, -0.1, 0.165), 0.1)
  return d
}
export function buildHeadGeometry() {
  return polygonize(
    150,
    0.8,
    headSdf,
    (x, y, z) => {
      const d = len3(x, y * 0.82, z) - 0.62
      return y < -0.38 ? Math.min(d, Math.abs(x) + Math.abs(z) - 0.3) * 0.5 : d
    }
  )
}

/* ---------- اليد: سلاميات منحنية بزوايا التفاف ---------- */
function finger(x, y, z, base, dir, up, lens, curls, r, spread) {
  /* سلسلة قطع أسطوانية تلتفّ نحو الراحة (-up) */
  let d = 1e9
  let px = base[0]
  let py = base[1]
  let pz = base[2]
  let ang = spread
  let tot = 0
  for (let i = 0; i < lens.length; i++) {
    tot += curls[i]
    const dx = Math.cos(tot) * dir[0] - Math.sin(tot) * up[0]
    const dy = Math.cos(tot) * dir[1] - Math.sin(tot) * up[1]
    const dz = Math.cos(tot) * dir[2] - Math.sin(tot) * up[2] + ang
    const l = Math.hypot(dx, dy, dz)
    const nx = px + (dx / l) * lens[i]
    const ny = py + (dy / l) * lens[i]
    const nz = pz + (dz / l) * lens[i]
    d = smin(d, sdC(x, y, z, px, py, pz, nx, ny, nz, r * (1 - i * 0.14)), 0.012)
    px = nx
    py = ny
    pz = nz
  }
  return d
}

/* يد الجانب الأيمن من الصورة: متدلّية بأصابع منحنية قليلاً. المحور +X من الرسغ نحو الأصابع، +Y ظهر اليد، Z عرض الكف */
function handHangingSdf(x, y, z) {
  let d = sdC(x, y, z, -0.12, 0, 0, 0.02, 0, 0, 0.082)
  d = smin(d, sdE(x, y, z, 0.12, 0, 0, 0.11, 0.044, 0.085), 0.05)
  const up = [0, 1, 0]
  const dir = [1, 0, 0]
  const lens = [0.075, 0.062, 0.05]
  const defs = [
    { z: -0.062, curl: [0.1, 0.35, 0.4], l: 1.0 },
    { z: -0.02, curl: [0.12, 0.4, 0.45], l: 1.08 },
    { z: 0.022, curl: [0.14, 0.42, 0.5], l: 1.04 },
    { z: 0.062, curl: [0.18, 0.46, 0.55], l: 0.9 },
  ]
  defs.forEach((f) => {
    d = smin(d, finger(x, y, z, [0.22, 0.01, f.z], dir, up, lens.map((v) => v * f.l), f.curl, 0.021, f.z * 0.12), 0.02)
  })
  /* الإبهام ملتصق بجانب الكف */
  d = smin(d, sdC(x, y, z, 0.08, -0.02, -0.08, 0.17, -0.045, -0.095, 0.026), 0.03)
  d = smin(d, sdC(x, y, z, 0.17, -0.045, -0.095, 0.225, -0.07, -0.075, 0.02), 0.02)
  return d
}
export function buildHangingHandGeometry() {
  return polygonize(
    96,
    0.5,
    handHangingSdf,
    (x, y, z) => len3(x * 0.8, y, z) - 0.42
  )
}

/* يد الجانب الأيسر: قبضة مرتخية: أصابع ملتفّة نحو الراحة والإبهام فوقها */
function handFistSdf(x, y, z) {
  let d = sdC(x, y, z, -0.14, 0, 0, 0.02, 0, 0, 0.086)
  d = smin(d, sdE(x, y, z, 0.13, 0.005, 0, 0.115, 0.058, 0.09), 0.05)
  const up = [0, 1, 0]
  const dir = [1, 0, 0]
  const defs = [
    { z: -0.062, curl: [0.55, 0.95, 0.9], l: 1.0 },
    { z: -0.02, curl: [0.6, 1.0, 0.95], l: 1.08 },
    { z: 0.024, curl: [0.62, 1.0, 0.95], l: 1.04 },
    { z: 0.064, curl: [0.66, 1.0, 0.9], l: 0.9 },
  ]
  defs.forEach((f) => {
    d = smin(d, finger(x, y, z, [0.24, 0.02, f.z], dir, up, [0.075, 0.062, 0.05].map((v) => v * f.l), f.curl, 0.022, f.z * 0.05), 0.02)
  })
  /* الإبهام فوق السبابة */
  d = smin(d, sdC(x, y, z, 0.1, 0.045, -0.075, 0.2, 0.062, -0.075, 0.027), 0.03)
  d = smin(d, sdC(x, y, z, 0.2, 0.062, -0.075, 0.285, 0.035, -0.06, 0.021), 0.02)
  return d
}
export function buildFistHandGeometry() {
  return polygonize(
    96,
    0.5,
    handFistSdf,
    (x, y, z) => len3(x * 0.8, y, z) - 0.42
  )
}
