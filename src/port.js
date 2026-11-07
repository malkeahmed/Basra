import * as THREE from 'three'
import { makeFlag, corrTexture, shipUniforms } from './boats.js'

/*
  ميناء أم قصر: رصيف خرساني على ضفة النهر، رافعات عملاقة (STS) تفرّغ سفينة الحاويات،
  رافعات ساحة (RTG)، آلاف الحاويات، شاحنات تتحرك، مستودعات مقوّسة، مبنى إدارة مع برج مراقبة،
  لافتات عربية كبيرة، أعمدة إنارة، ومرسى ناقلة نفط بأذرع تحميل وأنابيب.
*/

export const PORT = { z0: -368, z1: -502, depth: 54 }
const sstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const rng = (seed) => {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/* قناع منطقة الميناء على الضفة اليسرى */
export function portMask(x, z, rx, hw) {
  if (z > PORT.z0 + 8 || z < PORT.z1 - 8) return 0
  const d = rx - hw - x
  const mz = sstep(PORT.z0 + 8, PORT.z0, z) * sstep(PORT.z1 - 8, PORT.z1, z)
  const lat = sstep(-1.2, 0.4, d) * (1 - sstep(PORT.depth + 2, PORT.depth + 16, d))
  return mz * lat
}
export function portBlend(h, x, z, rx, hw) {
  const m = portMask(x, z, rx, hw)
  return m > 0 ? h * (1 - m) + 0.55 * m : h
}
export function inPort(x, z, rx, hw, pad = 0.02) {
  return portMask(x, z, rx, hw) > pad
}

/* خامات */
function asphaltTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = '#4a4d52'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 9000; i++) {
    const v = 60 + Math.random() * 40
    g.fillStyle = `rgba(${v},${v},${v + 4},${Math.random() * 0.35})`
    g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2)
  }
  g.fillStyle = 'rgba(235,200,60,.9)'
  for (let y = 0; y < 512; y += 64) g.fillRect(250, y, 6, 34)
  g.fillStyle = 'rgba(240,240,235,.75)'
  g.fillRect(8, 0, 4, 512)
  g.fillRect(500, 0, 4, 512)
  g.fillStyle = 'rgba(0,0,0,.18)'
  for (let i = 0; i < 18; i++) g.fillRect(Math.random() * 480, Math.random() * 480, 8 + Math.random() * 30, 3)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
function concreteTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#b9b5aa'
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 3500; i++) {
    const v = 150 + Math.random() * 60
    g.fillStyle = `rgba(${v},${v - 4},${v - 10},${Math.random() * 0.3})`
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
  }
  g.fillStyle = 'rgba(60,55,45,.5)'
  for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 2, 256)
  for (let y = 0; y < 256; y += 64) g.fillRect(0, y, 256, 2)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
function shedTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#f1ede2'
  g.fillRect(0, 0, 128, 128)
  for (let x = 0; x < 128; x += 8) {
    g.fillStyle = 'rgba(0,0,0,.18)'
    g.fillRect(x, 0, 3, 128)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* لافتة عربية: تُرسم بخط كوفي بعد تحميله */
function signTexture(lines, bg = '#0f3a5c', w = 1600, h = 520) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const draw = () => {
    const g = c.getContext('2d')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#bf9e66'
    g.fillRect(0, 0, w, 26)
    g.fillRect(0, h - 26, w, 26)
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    lines.forEach((l) => {
      g.fillStyle = l.color || '#ffffff'
      g.font = l.font
      g.direction = l.rtl ? 'rtl' : 'ltr'
      g.fillText(l.text, w / 2, l.y)
    })
    tex.needsUpdate = true
  }
  draw()
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('700 200px "Reem Kufi"'), document.fonts.load('700 80px "Tajawal"')]).then(draw).catch(() => {})
  }
  return tex
}

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o })
const box = (w, h, d, color, x, y, z, o = {}) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(color, o))
  m.position.set(x, y, z)
  return m
}
const cyl = (r1, r2, h, color, x, y, z, seg = 12, o = {}) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), M(color, o))
  m.position.set(x, y, z)
  return m
}

export function createPort(scene, { riverX, halfW, low = false }) {
  const root = new THREE.Group()
  scene.add(root)
  const r = rng(404)

  const edge = (z) => riverX(z) - halfW(z) + 0.3
  const flow = (z) => {
    const dx = riverX(z - 1) - riverX(z + 1)
    const l = Math.hypot(dx, 2)
    return [dx / l, -2 / l]
  }
  const rightV = (z) => {
    const [fx, fz] = flow(z)
    return [-fz, fx]
  }
  const at = (z, q, a = 0, y = 0) => {
    const [rx, rz] = rightV(z)
    const [fx, fz] = flow(z)
    return new THREE.Vector3(edge(z) + rx * q + fx * a, y, z + rz * q + fz * a)
  }
  const yawWater = (z) => {
    const [rx, rz] = rightV(z)
    return Math.atan2(-rz, rx)
  }
  const yawFlow = (z) => {
    const [fx, fz] = flow(z)
    return Math.atan2(-fz, fx)
  }
  const put = (obj, z, q, y = 0, yaw = null) => {
    const p = at(z, q)
    obj.position.set(p.x, y, p.z)
    obj.rotation.y = yaw === null ? yawWater(z) : yaw
    root.add(obj)
    return obj
  }

  /* ---------- الرصيف ---------- */
  const zs = []
  for (let z = PORT.z0 + 4; z >= PORT.z1 - 4; z -= 4) zs.push(z)
  const strip = (qa, qb, y, tex, repX, repY, color = 0xffffff) => {
    const pos = []
    const uv = []
    const idx = []
    zs.forEach((z, i) => {
      const a = at(z, qa)
      const b = at(z, qb)
      pos.push(a.x, y, a.z, b.x, y, b.z)
      uv.push(i * repX, 0, i * repX, repY)
    })
    for (let i = 0; i < zs.length - 1; i++) {
      const a = i * 2
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setIndex(idx)
    g.computeVertexNormals()
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, color, roughness: 0.92, side: THREE.DoubleSide }))
    m.receiveShadow = true
    root.add(m)
    return m
  }
  const asph = asphaltTexture()
  strip(-1.2, -PORT.depth, 0.62, asph, 0.45, 5.0)
  const conc = concreteTexture()
  strip(0, -1.8, 0.7, conc, 0.5, 0.18)
  /* واجهة الرصيف */
  {
    const pos = []
    const uv = []
    const idx = []
    zs.forEach((z, i) => {
      const a = at(z, 0)
      pos.push(a.x, 0.7, a.z, a.x, -1.8, a.z)
      uv.push(i * 0.5, 0, i * 0.5, 1.2)
    })
    for (let i = 0; i < zs.length - 1; i++) {
      const a = i * 2
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setIndex(idx)
    g.computeVertexNormals()
    root.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: conc, side: THREE.DoubleSide, roughness: 1 })))
  }
  /* دعّامات مطاطية وأوتاد ربط */
  {
    const n = Math.floor((PORT.z0 - PORT.z1) / 6)
    const fend = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.4, 0.4, 1.6, 8), M(0x15171a, { roughness: 0.95 }), n)
    const bol = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.5, 0.7, 8), M(0x2a2c30, { roughness: 0.6 }), n)
    const d = new THREE.Object3D()
    for (let i = 0; i < n; i++) {
      const z = PORT.z0 - 3 - i * 6
      const p = at(z, 0.2)
      d.position.set(p.x, 0.0, p.z)
      d.rotation.set(0, 0, 0)
      d.updateMatrix()
      fend.setMatrixAt(i, d.matrix)
      const b = at(z + 2.5, -1.0)
      d.position.set(b.x, 1.05, b.z)
      d.updateMatrix()
      bol.setMatrixAt(i, d.matrix)
    }
    root.add(fend, bol)
  }

  /* ---------- حاويات الساحة ---------- */
  {
    const colors = [0xb8452b, 0x2a5d8f, 0xd49a2a, 0xe8e4d8, 0x3f7a4a, 0x8c2f3a, 0x555b63, 0x1f4a6a, 0xcf6a1c, 0x2b8a84]
    const items = []
    let zi = 0
    for (let z = PORT.z0 - 14; z > PORT.z1 + 8; z -= 3.05) {
      zi++
      if (zi % 9 === 0) continue
      for (let k = 0; k < 6; k++) {
        const lv = 1 + Math.floor(r() * 4)
        if (r() < 0.12) continue
        for (let l = 0; l < lv; l++) items.push([z, -17 - k * 2.75, 1.4 + l * 2.62, colors[Math.floor(r() * colors.length)]])
      }
    }
    const cap = low ? 600 : 1500
    const list = items.slice(0, cap)
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(2.95, 2.6, 2.65), new THREE.MeshStandardMaterial({ map: corrTexture(), roughness: 0.6, metalness: 0.15 }), list.length)
    const d = new THREE.Object3D()
    const c = new THREE.Color()
    list.forEach((it, i) => {
      const p = at(it[0], it[1])
      d.position.set(p.x, it[2] - 0.1 + 0.62, p.z)
      d.rotation.y = yawFlow(it[0])
      d.updateMatrix()
      im.setMatrixAt(i, d.matrix)
      c.setHex(it[3])
      im.setColorAt(i, c)
    })
    im.castShadow = !low
    im.receiveShadow = true
    im.frustumCulled = false
    root.add(im)
  }

  /* ---------- رافعة الرصيف العملاقة (STS) ---------- */
  const blue = 0x2a6ea8
  const white = 0xf1eee6
  const cranes = []
  function sts() {
    const g = new THREE.Group()
    const add = (m) => {
      m.castShadow = !low
      g.add(m)
      return m
    }
    ;[[-0.8, -6], [-0.8, 6], [-12, -6], [-12, 6]].forEach(([x, z]) => add(box(1.3, 27, 1.3, blue, x, 13.5 + 0.6, z)))
    ;[[-0.8, 8], [-0.8, 20], [-12, 8], [-12, 20]].forEach(([y, y2], i) => {})
    for (const x of [-0.8, -12]) {
      add(box(1.1, 1.1, 13.5, blue, x, 27.4, 0))
      add(box(0.7, 0.7, 12, blue, x, 14, 0))
      add(box(0.7, 0.7, 12, blue, x, 5, 0))
      const br = box(0.5, 0.5, 14.5, white, x, 14, 0)
      br.rotation.x = 0.46
      add(br)
      const br2 = box(0.5, 0.5, 14.5, white, x, 14, 0)
      br2.rotation.x = -0.46
      add(br2)
    }
    for (const z of [-6, 6]) add(box(11.8, 0.8, 0.8, blue, -6.4, 27.4, z))
    /* الذراع */
    for (const z of [-2.2, 2.2]) {
      add(box(34, 1.6, 1.0, blue, 3, 28.4, z))
      add(box(34, 0.6, 0.6, white, 3, 27.2, z))
    }
    for (let x = -14; x < 19; x += 2.6) {
      add(box(0.5, 1.8, 4.8, blue, x, 28.2, 0))
      const dg = box(0.4, 0.4, 5.2, white, x + 1.3, 28.2, 0)
      dg.rotation.z = 0.7
      dg.scale.set(0.9, 0.9, 1)
    }
    /* برج الحبال */
    ;[-3, 3].forEach((z) => {
      const leg = box(0.8, 12, 0.8, blue, -6.4, 35, z)
      leg.rotation.z = 0
      add(leg)
    })
    add(box(1, 0.8, 7.5, blue, -6.4, 41, 0))
    const lines = []
    ;[-3, 3].forEach((z) => {
      lines.push(-6.4, 41, z, 19.5, 29.2, z * 0.8, -6.4, 41, z, -14, 29.2, z * 0.8)
    })
    const lg = new THREE.BufferGeometry()
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3))
    g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x333a42 })))
    /* غرفة المشغّل ومحرّكات */
    add(box(5, 3.2, 6.2, 0xe8e4d8, -12.5, 26.5, 0))
    add(box(0.1, 1.4, 5, 0x10171d, -10, 27.2, 0, { roughness: 0.2, metalness: 0.4 }))
    /* عربة التروللي والحاوية المعلّقة */
    const trolley = new THREE.Group()
    trolley.add(box(3.6, 1.2, 4.6, 0xd9b53a, 0, 0, 0))
    trolley.add(box(1.5, 1.8, 1.4, 0x10171d, 0, -1.4, 2.7, { roughness: 0.2, metalness: 0.3 }))
    const hang = new THREE.Group()
    const sp = box(3.2, 0.35, 2.7, 0x333a42, 0, 0, 0)
    hang.add(sp)
    const ctn = new THREE.Mesh(new THREE.BoxGeometry(2.95, 2.6, 2.65), new THREE.MeshStandardMaterial({ map: corrTexture(), color: [0xb8452b, 0x2a5d8f, 0xd49a2a, 0x3f7a4a][Math.floor(r() * 4)], roughness: 0.6 }))
    ctn.position.y = -1.5
    hang.add(ctn)
    const ropes = []
    ;[[-1.4, -1.2], [-1.4, 1.2], [1.4, -1.2], [1.4, 1.2]].forEach(([x, z]) => {
      const rp = cyl(0.04, 0.04, 1, 0x222222, x, 0, z, 4)
      ropes.push({ m: rp, x, z })
      g.add(rp)
    })
    g.add(trolley)
    g.add(hang)
    cranes.push({ g, trolley, hang, ropes, ph: r() * 6 })
    return g
  }
  ;[-394, -412, -430].forEach((z) => {
    const c = sts()
    put(c, z, 0)
  })

  /* ---------- رافعات الساحة (RTG) ---------- */
  const rtgs = []
  function rtg(z) {
    const g = new THREE.Group()
    ;[[-8, -3.4], [-8, 3.4], [8, -3.4], [8, 3.4]].forEach(([x, zz]) => {
      const leg = box(0.7, 10.5, 0.7, 0xe3a82a, x, 5.25, zz)
      leg.castShadow = !low
      g.add(leg)
    })
    g.add(box(17.5, 0.9, 0.9, 0xe3a82a, 0, 10.6, -3.4))
    g.add(box(17.5, 0.9, 0.9, 0xe3a82a, 0, 10.6, 3.4))
    g.add(box(0.9, 0.9, 7.8, 0xe3a82a, -8, 10.6, 0))
    g.add(box(0.9, 0.9, 7.8, 0xe3a82a, 8, 10.6, 0))
    const tr = box(2.6, 0.8, 3.0, 0x555b63, 0, 9.9, 0)
    g.add(tr)
    for (const [x, zz] of [[-8, -3.4], [-8, 3.4], [8, -3.4], [8, 3.4]]) g.add(box(1.2, 0.7, 1.2, 0x222428, x, 0.35 + 0.62, zz))
    g.add(box(1.8, 1.8, 1.8, 0xe8e4d8, 8.3, 9.8, 2.4))
    const holder = new THREE.Group()
    holder.add(g)
    g.position.y = 0.62
    holder.userData = { z0: z, tr, ph: r() * 6, g }
    rtgs.push(holder)
    return holder
  }
  ;[-386, -420, -456].forEach((z) => {
    const h = rtg(z)
    put(h, z, -22.6)
  })

  /* ---------- مستودعات مقوّسة ---------- */
  {
    const tex = shedTexture()
    tex.repeat.set(10, 1)
    const shape = new THREE.Shape()
    shape.absellipse(0, 0, 8, 3.6, 0, Math.PI, false)
    ;[-420, -470].forEach((z) => {
      const g = new THREE.Group()
      const len = 30
      const body = new THREE.Mesh(new THREE.BoxGeometry(16, 6.5, len), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }))
      body.position.y = 3.25
      g.add(body)
      const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false, curveSegments: 18 }), new THREE.MeshStandardMaterial({ map: tex, color: 0xe9e4d6, roughness: 0.7 }))
      roof.position.set(0, 6.5, -len / 2)
      g.add(roof)
      for (let i = 0; i < 4; i++) g.add(box(0.15, 4.2, 5, 0x30363d, 8.05, 2.3, -10 + i * 6.7))
      g.position.y = 0.62
      const holder = new THREE.Group()
      holder.add(g)
      put(holder, z, -45)
    })
  }

  /* ---------- مبنى الإدارة وبرج المراقبة ---------- */
  {
    const g = new THREE.Group()
    g.add(box(14, 9, 22, 0xf3f0e8, 0, 4.5, 0))
    g.add(box(14.2, 1.6, 22.2, 0x1d4e7a, 0, 8.6, 0))
    for (let i = 0; i < 6; i++) g.add(box(0.1, 2.6, 2.4, 0x10171d, 7.05, 4.2, -9 + i * 3.6, { roughness: 0.15, metalness: 0.4 }))
    for (let i = 0; i < 6; i++) g.add(box(0.1, 1.3, 2.4, 0x10171d, 7.05, 7.2, -9 + i * 3.6, { roughness: 0.15, metalness: 0.4 }))
    const tw = cyl(1.8, 2.4, 17, 0xf3f0e8, -4, 17.5, 0, 16)
    g.add(tw)
    g.add(cyl(3.4, 2.6, 3.4, 0x1d4e7a, -4, 27.2, 0, 16))
    g.add(cyl(3.5, 3.5, 0.5, 0xf3f0e8, -4, 29, 0, 16))
    g.add(cyl(0.1, 0.1, 5, 0x999999, -4, 31.6, 0, 6))
    const dish = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0xdddddd))
    dish.position.set(5, 9.4, 3)
    g.add(dish)
    g.position.y = 0.62
    const holder = new THREE.Group()
    holder.add(g)
    put(holder, -376, -33)
    /* علم العراق */
    const flag = makeFlag(1.1, 20)
    const fh = new THREE.Group()
    fh.add(flag)
    flag.position.y = 0.62
    put(fh, -380, -6, 0, yawWater(-380) + Math.PI)
    /* لافتة على واجهة المبنى */
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 4.4),
      new THREE.MeshBasicMaterial({
        map: signTexture(
          [
            { text: 'ميناء البصرة', font: '700 250px "Reem Kufi", "Tajawal", sans-serif', y: 190, rtl: true },
            { text: 'BASRAH GATEWAY PORT', font: '700 78px "Tajawal", Arial, sans-serif', y: 380, color: '#e7cf9f' },
          ],
          '#0f3a5c'
        ),
      })
    )
    sign.position.set(6.6, 12.0, 0)
    sign.rotation.y = Math.PI / 2
    const sh = new THREE.Group()
    sh.add(sign)
    sh.add(box(0.5, 3.2, 0.5, 0x1d4e7a, 6.6, 10.2, -8))
    sh.add(box(0.5, 3.2, 0.5, 0x1d4e7a, 6.6, 10.2, 8))
    sh.position.y = 0.62
    put(sh, -376, -33)
  }

  /* ---------- بوّابة الميناء: لافتة عملاقة تواجه القادم من أعلى النهر ---------- */
  {
    const g = new THREE.Group()
    const W = 20
    ;[-W / 2 + 0.6, W / 2 - 0.6].forEach((x) => {
      g.add(box(1, 12, 1, 0x1d4e7a, x, 6, 0))
      g.add(box(1.8, 0.6, 1.8, 0x2a2c30, x, 0.3, 0))
    })
    g.add(box(W + 1.6, 0.9, 1.2, 0xbf9e66, 0, 12.1, 0))
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(W, 6.4),
      new THREE.MeshBasicMaterial({
        map: signTexture(
          [
            { text: 'ميناء أم قصر', font: '700 300px "Reem Kufi", "Tajawal", sans-serif', y: 175, rtl: true },
            { text: 'بوّابة العراق إلى العالم', font: '500 96px "Tajawal", Arial, sans-serif', y: 372, color: '#e7cf9f', rtl: true },
            { text: 'UMM QASR PORT', font: '700 64px "Tajawal", Arial, sans-serif', y: 455, color: '#ffffff' },
          ],
          '#0f3a5c', 1600, 520
        ),
        side: THREE.DoubleSide,
      })
    )
    board.position.set(0, 8.4, 0.05)
    g.add(board)
    g.add(box(W + 0.6, 6.9, 0.2, 0xbf9e66, 0, 8.4, -0.08))
    g.position.y = 0.62
    const holder = new THREE.Group()
    holder.add(g)
    const [fx, fz] = flow(PORT.z0 + 2)
    const p = at(PORT.z0 + 2, -10)
    holder.position.set(p.x, 0, p.z)
    holder.rotation.y = Math.atan2(-fx, -fz)
    root.add(holder)
  }

  /* ---------- أعمدة الإنارة ---------- */
  {
    ;[-380, -402, -424, -446, -468, -490].forEach((z, i) => {
      const g = new THREE.Group()
      g.add(cyl(0.22, 0.34, 22, 0x9aa0a6, 0, 11, 0, 8))
      g.add(box(4.2, 0.4, 0.8, 0x2a2c30, 0, 22.2, 0))
      for (let k = -1; k <= 1; k++) g.add(box(0.9, 0.35, 0.7, 0xfff3d0, k * 1.5, 22.0, 0, { emissive: 0xfff3d0, emissiveIntensity: 0.6 }))
      g.position.y = 0.62
      const holder = new THREE.Group()
      holder.add(g)
      put(holder, z, -15.5 + (i % 2) * -26)
    })
  }

  /* ---------- مرسى ناقلة النفط: أذرع تحميل وأنابيب ---------- */
  {
    const rackZ = -472
    const g = new THREE.Group()
    for (let i = 0; i < 3; i++) {
      const pipe = cyl(0.4, 0.4, 40, i === 0 ? 0xb3231a : 0x6c6a64, -20, 3.2 + i * 0.1, -1 + i * 1.0, 10)
      pipe.rotation.z = Math.PI / 2
      g.add(pipe)
    }
    for (let x = -36; x <= -2; x += 6) {
      g.add(box(0.5, 3.2, 3.6, 0x2a2c30, x, 1.6, 0))
    }
    ;[-3, 3].forEach((z) => {
      const base = box(1.4, 4.5, 1.4, 0xd9b53a, 0, 2.3, z)
      g.add(base)
      const arm = box(10, 0.5, 0.5, 0xd9b53a, 4.6, 6, z)
      arm.rotation.z = -0.28
      g.add(arm)
      const down = box(0.4, 4, 0.4, 0xd9b53a, 9, 3.6, z)
      g.add(down)
    })
    g.position.y = 0.62
    const holder = new THREE.Group()
    holder.add(g)
    put(holder, rackZ, -2.2)
  }

  /* ---------- شاحنات تتحرك ---------- */
  const trucks = []
  {
    const cols = [0xb8452b, 0x2a5d8f, 0xd49a2a, 0xe8e4d8, 0x3f7a4a, 0x8c2f3a]
    for (let i = 0; i < (low ? 5 : 10); i++) {
      const g = new THREE.Group()
      g.add(box(2.1, 2.2, 2.3, i % 2 ? 0x1d4e7a : 0xe8e4d8, 3.2, 1.7, 0))
      g.add(box(0.1, 1, 1.9, 0x10171d, 4.3, 2.2, 0, { roughness: 0.15 }))
      g.add(box(6.8, 0.5, 2.3, 0x2a2c30, -0.4, 0.9, 0))
      for (const x of [-3, -1.8, 2.6]) for (const z of [-1.2, 1.2]) g.add(cyl(0.45, 0.45, 0.4, 0x111111, x, 0.5, z, 10)).children[g.children.length - 1].rotation.x = Math.PI / 2
      if (i % 3 !== 2) g.add(box(5.9, 2.6, 2.4, cols[i % cols.length], -1, 2.5, 0, { roughness: 0.6 }))
      const holder = new THREE.Group()
      holder.add(g)
      g.position.y = 0.62
      const lane = i % 2 ? -4 : -8
      holder.userData = { lane, dir: i % 2 ? 1 : -1, s: r(), speed: 3.5 + r() * 2 }
      root.add(holder)
      trucks.push(holder)
    }
  }

  /* ---------- حركة ---------- */
  const zMin = PORT.z1 + 6
  const zMax = PORT.z0 - 6
  function update(t, dt) {
    cranes.forEach((c, i) => {
      const k = t * 0.22 + c.ph
      const x = 4 + Math.sin(k) * 10
      const h = 17 + Math.sin(t * 0.5 + c.ph * 1.3) * 9
      c.trolley.position.set(x, 26.6, 0)
      c.hang.position.set(x, h, 0)
      c.ropes.forEach((rp) => {
        const len = 26.2 - h
        rp.m.scale.y = len
        rp.m.position.set(x + rp.x, h + len / 2, rp.z)
      })
    })
    rtgs.forEach((h) => {
      const u = h.userData
      const z = u.z0 + Math.sin(t * 0.08 + u.ph) * 10
      const p = at(z, -22.6)
      h.position.set(p.x, 0, p.z)
      h.rotation.y = yawWater(z)
      u.tr.position.x = Math.sin(t * 0.4 + u.ph) * 6
    })
    trucks.forEach((h) => {
      const u = h.userData
      u.s += (dt * u.speed * u.dir) / (zMax - zMin)
      if (u.s > 1) u.s -= 1
      if (u.s < 0) u.s += 1
      const z = zMax - (zMax - zMin) * u.s
      const p = at(z, u.lane)
      h.position.set(p.x, 0, p.z)
      h.rotation.y = u.dir === -1 ? yawFlow(z) : yawFlow(z) + Math.PI
    })
  }

  return { update, berth: (z, half) => -(halfW(z) - 0.3 - half - 0.5) }
}
