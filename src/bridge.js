import * as THREE from 'three'
import { createFleet } from './vehicles.js'

/*
  الجسر الإيطالي (جسر محمد باقر الصدر) على شطّ العرب في البصرة، كما أُنجز عام 2017:
  جسر معلّق بحبال مائلة بامتداد مركزي 69 + 150 + 69 م، سطح فولاذي-خرساني مركّب،
  برجان (صاريان) فولاذيان عموديان على المحور المركزي بارتفاع 40 م فوق السطح،
  يحمل كلّ منهما 14 حبلاً في مستوى واحد (سبعة لكل جهة)، وجسرا مدخل على أعمدة خرسانية دائرية.
  الأبعاد الطولية مصغّرة بمعامل 0.7 لتناسب عرض النهر في المشهد، مع الحفاظ على النسب.
*/
export const BRIDGE = { z: 105, s: 0.7 }
const S = BRIDGE.s
export const MAIN_HALF = 144 * S
export const TOWER_X = 75 * S
const VL = 120
const X1 = MAIN_HALF + VL
const H_DECK = 19
const H_END = 10.5
const D = 2.0
const W_MAIN = 21.5 * S
const W_VIA = 18 * S
const H_TOWER = 40 * S

const yTop = (x) => {
  const a = Math.abs(x)
  return a <= MAIN_HALF ? H_DECK : H_DECK - ((H_DECK - H_END) * (a - MAIN_HALF)) / VL
}
const widthAt = (x) => (Math.abs(x) <= MAIN_HALF ? W_MAIN : W_VIA)
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o })
const lin = (c) => c.map((v) => Math.pow(v, 2.2))

function roadTexture() {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#2d2e32'
  g.fillRect(0, 0, 1024, 256)
  for (let i = 0; i < 9000; i++) {
    const v = 36 + Math.random() * 46
    g.fillStyle = `rgba(${v},${v},${v + 4},${Math.random() * 0.45})`
    g.fillRect(Math.random() * 1024, Math.random() * 256, 2, 2)
  }
  /* آثار إطارات */
  g.fillStyle = 'rgba(10,10,12,.22)'
  ;[0.3, 0.36, 0.68, 0.74].forEach((v) => g.fillRect(0, v * 256 - 6, 1024, 12))
  g.fillStyle = '#ecebe3'
  g.fillRect(0, 12, 1024, 7)
  g.fillRect(0, 237, 1024, 7)
  g.fillStyle = '#f2c21b'
  g.fillRect(0, 122, 1024, 4)
  g.fillRect(0, 130, 1024, 4)
  g.fillStyle = '#ecebe3'
  for (let x = 0; x < 1024; x += 256) {
    g.fillRect(x, 70, 130, 5)
    g.fillRect(x, 181, 130, 5)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
function concreteTexture(light = 0.86) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const b = Math.round(light * 255)
  g.fillStyle = `rgb(${b},${b - 3},${b - 8})`
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 7000; i++) {
    const v = b - 30 + Math.random() * 40
    g.fillStyle = `rgba(${v},${v - 3},${v - 9},${Math.random() * 0.35})`
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
  }
  g.fillStyle = 'rgba(70,64,56,.25)'
  for (let y = 0; y < 256; y += 64) g.fillRect(0, y, 256, 2)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function sweep(N, secFn, colorFn, withUv) {
  const pos = []
  const col = []
  const uv = []
  let np = 0
  for (let i = 0; i <= N; i++) {
    const x = -X1 + (2 * X1 * i) / N
    const sec = secFn(x)
    np = sec.length
    sec.forEach((p, k) => {
      pos.push(x, p[1], p[0])
      if (colorFn) col.push(...lin(colorFn(k, x)))
      if (withUv) uv.push(x / 24, (p[0] + widthAt(x) / 2) / widthAt(x))
    })
  }
  const idx = []
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < np - (withUv ? 1 : 0); k++) {
      const a = i * np + k
      const b = i * np + ((k + 1) % np)
      const c = (i + 1) * np + k
      const d = (i + 1) * np + ((k + 1) % np)
      idx.push(a, c, b, b, c, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  if (colorFn) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  if (withUv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}
function tube(a, b, r, mat, seg = 10) {
  const A = new THREE.Vector3(...a)
  const B = new THREE.Vector3(...b)
  const d = B.clone().sub(A)
  const len = d.length()
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat)
  m.position.copy(A).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  m.castShadow = true
  return m
}
function obround(w, d, h, mat) {
  const r = d / 2
  const s = new THREE.Shape()
  const hw = w / 2 - r
  s.moveTo(-hw, -r)
  s.lineTo(hw, -r)
  s.absarc(hw, 0, r, -Math.PI / 2, Math.PI / 2, false)
  s.lineTo(-hw, r)
  s.absarc(-hw, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false)
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 20 })
  g.rotateX(-Math.PI / 2)
  return new THREE.Mesh(g, mat)
}

export function createBridge(scene, { riverX, halfW, low = false }) {
  const z = BRIDGE.z
  const root = new THREE.Group()
  const dx = riverX(z - 1) - riverX(z + 1)
  const l = Math.hypot(dx, 2)
  const fx = dx / l
  const fz = -2 / l
  const rx = -fz
  const rz = fx
  root.position.set(riverX(z), 0, z)
  root.rotation.y = Math.atan2(-rz, rx)
  scene.add(root)

  const concrete = new THREE.MeshStandardMaterial({ map: concreteTexture(0.86), roughness: 0.78 })
  const pierMat = new THREE.MeshStandardMaterial({ map: concreteTexture(0.78), roughness: 0.82 })

  /* سطح الطريق مع خطوط وعلامات */
  const roadTex = roadTexture()
  const top = new THREE.Mesh(
    sweep(240, (x) => [[-widthAt(x) / 2, yTop(x)], [widthAt(x) / 2, yTop(x)]], null, true),
    new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.88, side: THREE.DoubleSide })
  )
  top.receiveShadow = true
  root.add(top)

  /* جسم السطح: صندوق مائل الأضلاع بلون خرساني فاتح */
  const body = new THREE.Mesh(
    sweep(
      240,
      (x) => {
        const w = widthAt(x) / 2
        const y = yTop(x)
        return [[w, y], [w, y - D * 0.34], [w - D * 0.35, y - D * 0.72], [w - D * 1.0, y - D], [-w + D * 1.0, y - D], [-w + D * 0.35, y - D * 0.72], [-w, y - D * 0.34], [-w, y]]
      },
      (k, x) => {
        const n = 0.93 + 0.05 * Math.sin(x * 0.7)
        return k <= 1 || k >= 6 ? [0.86 * n, 0.85 * n, 0.82 * n] : k === 2 || k === 5 ? [0.74 * n, 0.73 * n, 0.7 * n] : [0.56, 0.55, 0.53]
      },
      false
    ),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide })
  )
  body.castShadow = !low
  root.add(body)

  /* حواجز خرسانية جانبية ومتوسطة وفواصل تمدّد */
  {
    const seg = 6
    const n = Math.floor((2 * X1) / seg)
    const barrier = new THREE.InstancedMesh(new THREE.BoxGeometry(seg + 0.04, 1.0, 0.55), M(0xe4e1da, { roughness: 0.75 }), n * 2 + Math.floor((2 * MAIN_HALF) / seg) * 2)
    const d = new THREE.Object3D()
    let i = 0
    for (let k = 0; k < n; k++) {
      const x0 = -X1 + k * seg + seg / 2
      const ya = yTop(x0 - seg / 2)
      const yb = yTop(x0 + seg / 2)
      const pitch = Math.atan2(yb - ya, seg)
      ;[-1, 1].forEach((s) => {
        d.position.set(x0, (ya + yb) / 2 + 0.5, s * (widthAt(x0) / 2 - 0.28))
        d.rotation.set(0, 0, pitch)
        d.updateMatrix()
        barrier.setMatrixAt(i++, d.matrix)
      })
      if (Math.abs(x0) < MAIN_HALF) {
        ;[-1, 1].forEach((s) => {
          d.position.set(x0, (ya + yb) / 2 + 0.5, s * 1.25)
          d.updateMatrix()
          barrier.setMatrixAt(i++, d.matrix)
        })
      }
    }
    barrier.count = i
    barrier.castShadow = !low
    root.add(barrier)
    /* فواصل تمدّد داكنة عبر السطح */
    const joints = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.06, 1), M(0x222326), 14)
    let j = 0
    for (let x = -X1 + 36; x < X1 - 20; x += 36) {
      d.position.set(x, yTop(x) + 0.04, 0)
      d.rotation.set(0, 0, 0)
      d.scale.set(1, 1, widthAt(x))
      d.updateMatrix()
      joints.setMatrixAt(j++, d.matrix)
    }
    d.scale.set(1, 1, 1)
    joints.count = j
    root.add(joints)
    /* عوارض عرضية تحت السطح تظهر من الأسفل */
    const cross = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.5, 1), M(0xb9b6ae), 50)
    let c = 0
    for (let x = -X1 + 9; x < X1 - 6; x += 9) {
      d.position.set(x, yTop(x) - D + 0.28, 0)
      d.scale.set(1, 1, widthAt(x) - D * 2)
      d.updateMatrix()
      cross.setMatrixAt(c++, d.matrix)
    }
    d.scale.set(1, 1, 1)
    cross.count = c
    root.add(cross)
  }

  /* أعمدة جسري المدخل: أعمدة دائرية بأرؤوس متسعة على شكل T */
  {
    ;[-1, 1].forEach((s) => {
      for (let k = 0; k <= 4; k++) {
        const x = s * (MAIN_HALF + k * (VL / 4))
        const ytop = yTop(x) - D
        const h = ytop + 1.8
        const col = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.15, h - 0.9, 32), pierMat)
        col.position.set(x, -1.8 + (h - 0.9) / 2, 0)
        col.castShadow = !low
        root.add(col)
      }
    })
  }

  /* البرجان: صاريان فولاذيان عموديان على المحور المركزي مع ركيزة النهر الخرسانية */
  const steel = new THREE.MeshStandardMaterial({ color: 0xe9ebec, roughness: 0.32, metalness: 0.45 })
  const cable = new THREE.MeshStandardMaterial({ color: 0xdfe2e4, roughness: 0.4, metalness: 0.25 })
  const collar = M(0x35383c, { roughness: 0.5, metalness: 0.5 })
  const warn = []
  ;[-1, 1].forEach((s) => {
    const xt = s * TOWER_X
    const dy = yTop(xt)
    const yTopT = dy + H_TOWER
    /* ركيزة النهر: بيضاوية من الماء حتى السطح مع قاعدة واسعة */
    const pier = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.2, dy + 3, 48), pierMat)
    pier.position.set(xt, -3 + (dy + 3) / 2, 0)
    pier.castShadow = !low
    root.add(pier)
    /* الصاري الفولاذي: مقطع صندوقي متناقص */
    const g = new THREE.CylinderGeometry(0.62, 1.4, H_TOWER, 4, 1)
    g.rotateY(Math.PI / 4)
    const mast = new THREE.Mesh(g, steel)
    mast.scale.set(1, 1, 1.5)
    mast.position.set(xt, dy + H_TOWER / 2, 0)
    mast.castShadow = !low
    root.add(mast)
    /* قمة الصاري: غطاء ومصباح تحذير */
    const capT = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.8), collar)
    capT.position.set(xt, yTopT + 0.25, 0)
    root.add(capT)
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), new THREE.MeshStandardMaterial({ color: 0xff3b2f, emissive: 0xff2a1a, emissiveIntensity: 1 }))
    lamp.position.set(xt, yTopT + 0.95, 0)
    root.add(lamp)
    warn.push(lamp)
    /* سبعة حبال في كل جهة بمستوى واحد */
    ;[-1, 1].forEach((dir) => {
      for (let k = 0; k < 7; k++) {
        const ax = xt + dir * (14 + k * 9.5) * S * 0.95
        const attachY = dy + H_TOWER * (0.55 + 0.4 * (k / 6))
        root.add(tube([xt, attachY, 0], [ax, yTop(ax) + 0.2, 0], 0.11 + 0.012 * k, cable, 10))
        /* رأس التثبيت على السطح وعلى الصاري */
        const an = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.9, 12), collar)
        an.position.set(ax, yTop(ax) + 0.45, 0)
        root.add(an)
        const at = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 10), collar)
        at.rotation.x = Math.PI / 2
        at.position.set(xt + dir * 0.4, attachY, 0)
        root.add(at)
      }
    })
  })

  /* أعمدة إنارة بأذرع منحنية على جانبي السطح */
  {
    const step = 28
    const n = Math.floor((2 * X1) / step)
    const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.16, 8, 10), M(0xc6cacd, { metalness: 0.5, roughness: 0.4 }), n * 2)
    const arms = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.1, 2.6), M(0xc6cacd, { metalness: 0.5, roughness: 0.4 }), n * 2)
    const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.14, 0.34), new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffe6a8, emissiveIntensity: 0.9 }), n * 2)
    const d = new THREE.Object3D()
    let i = 0
    for (let k = 0; k < n; k++) {
      const x = -X1 + step / 2 + k * step
      ;[-1, 1].forEach((s) => {
        const zb = s * (widthAt(x) / 2 - 0.45)
        const y0 = yTop(x)
        d.position.set(x, y0 + 4.0, zb)
        d.rotation.set(0, 0, 0)
        d.updateMatrix()
        poles.setMatrixAt(i, d.matrix)
        d.position.set(x, y0 + 8.0, zb - s * 1.3)
        d.updateMatrix()
        arms.setMatrixAt(i, d.matrix)
        d.position.set(x, y0 + 7.9, zb - s * 2.5)
        d.updateMatrix()
        heads.setMatrixAt(i, d.matrix)
        i++
      })
    }
    root.add(poles, arms, heads)
  }

  /* حركة المرور: سيارات وشاحنات حقيقية الشكل بحارتين في كل اتجاه */
  const fleet = createFleet({ sedan: 14, suv: 8, pickup: 5, minibus: 4, truck: 4, tanker: 2 })
  const lanes = [
    { z: 3.3, dir: 1, v: 10, cars: [] },
    { z: 5.7, dir: 1, v: 14, cars: [] },
    { z: -3.3, dir: -1, v: 10, cars: [] },
    { z: -5.7, dir: -1, v: 14, cars: [] },
  ]
  let li = 0
  fleet.forEach((f) => {
    root.add(f.im)
    for (let i = 0; i < f.n; i++) {
      lanes[li % 4].cars.push({ f, i, len: f.len })
      li++
    }
  })
  lanes.forEach((ln) => {
    const m = ln.cars.length
    const off = Math.random()
    ln.cars.forEach((c, k) => {
      c.s = (k / m + off) % 1
    })
  })
  const dummy = new THREE.Object3D()
  function update(t, dt) {
    lanes.forEach((ln) => {
      ln.cars.forEach((c) => {
        c.s = (c.s + (ln.dir * ln.v * dt) / (2 * X1) + 1) % 1
        const x = -X1 + c.s * 2 * X1
        dummy.position.set(x, yTop(x), ln.z)
        dummy.rotation.set(0, ln.dir > 0 ? 0 : Math.PI, 0)
        dummy.updateMatrix()
        c.f.im.setMatrixAt(c.i, dummy.matrix)
      })
    })
    fleet.forEach((f) => (f.im.instanceMatrix.needsUpdate = true))
    warn.forEach((w, i) => {
      w.material.emissiveIntensity = 0.3 + 1.1 * Math.max(0, Math.sin(t * 2.0 + i * 1.3))
    })
  }
  update(0, 0)

  return {
    update,
    obstacles: () => [-1, 1].flatMap((s) => [
      { zE: z, off: s * TOWER_X, hz: 8, hx: 8, moored: true, waiting: false },
      { zE: z, off: s * MAIN_HALF, hz: 3, hx: 3, moored: true, waiting: false },
    ]),
  }
}
