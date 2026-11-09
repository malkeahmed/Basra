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

/* ---------- لافتة «ميناء أم قصر» الفخمة ---------- */
function pillarTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = '#d6c8a4'
  g.fillRect(0, 0, 256, 512)
  for (let i = 0; i < 5000; i++) {
    const v = 190 + Math.random() * 40
    g.fillStyle = `rgba(${v},${v - 12},${v - 40},${Math.random() * 0.35})`
    g.fillRect(Math.random() * 256, Math.random() * 512, 2, 2)
  }
  for (let m = 0; m < 4; m++) {
    const y = m * 128
    g.fillStyle = '#a88d5a'
    g.fillRect(0, y, 256, 8)
    g.fillRect(0, y + 120, 256, 8)
    g.fillStyle = '#bda57a'
    g.beginPath()
    const cx = 128
    const cy = y + 64
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2 - Math.PI / 2
      const r = k % 2 ? 26 : 50
      g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
    }
    g.closePath()
    g.fill()
    g.fillStyle = '#d6c8a4'
    g.beginPath()
    g.arc(cx, cy, 14, 0, 7)
    g.fill()
    g.fillStyle = '#a88d5a'
    g.beginPath()
    g.arc(cx, cy, 6, 0, 7)
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
function drawPalm(g, x, y, h, color) {
  g.save()
  g.translate(x, y)
  g.fillStyle = color
  g.beginPath()
  g.moveTo(-5, 0)
  g.bezierCurveTo(-3, -h * 0.4, -3, -h * 0.7, -2, -h)
  g.lineTo(5, -h)
  g.bezierCurveTo(4, -h * 0.7, 6, -h * 0.4, 8, 0)
  g.fill()
  for (let k = -4; k <= 4; k++) {
    g.save()
    g.translate(1, -h)
    g.rotate(k * 0.42)
    g.beginPath()
    g.moveTo(0, 0)
    g.bezierCurveTo(10, -h * 0.28, 34, -h * 0.34, 52, -h * 0.1)
    g.bezierCurveTo(32, -h * 0.2, 10, -h * 0.16, 0, 0)
    g.fill()
    g.restore()
  }
  g.restore()
}
function gateSignTexture() {
  const w = 2048
  const h = 700
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const draw = () => {
    const g = c.getContext('2d')
    g.fillStyle = '#0c3552'
    g.fillRect(0, 0, w, h)
    g.fillStyle = 'rgba(255,255,255,.045)'
    for (let y = 20; y < h; y += 56) {
      for (let x = ((y / 56) % 2) * 28; x < w; x += 56) {
        g.beginPath()
        g.moveTo(x, y - 20)
        g.lineTo(x + 20, y)
        g.lineTo(x, y + 20)
        g.lineTo(x - 20, y)
        g.closePath()
        g.fill()
      }
    }
    const strip = (y) => {
      g.fillStyle = '#bf9e66'
      g.fillRect(0, y, w, 34)
      g.fillStyle = '#0c3552'
      for (let x = 17; x < w; x += 34) {
        g.beginPath()
        g.moveTo(x, y + 4)
        g.lineTo(x + 13, y + 17)
        g.lineTo(x, y + 30)
        g.lineTo(x - 13, y + 17)
        g.closePath()
        g.fill()
      }
    }
    strip(0)
    strip(h - 34)
    g.strokeStyle = '#e7cf9f'
    g.lineWidth = 6
    g.strokeRect(46, 62, w - 92, h - 124)
    g.lineWidth = 2
    g.strokeStyle = '#bf9e66'
    g.strokeRect(62, 78, w - 124, h - 156)
    drawPalm(g, 150, h - 110, 330, '#d8bd85')
    drawPalm(g, w - 150, h - 110, 330, '#d8bd85')
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.direction = 'rtl'
    g.font = '500 58px "Tajawal", Arial, sans-serif'
    g.fillStyle = '#e7cf9f'
    g.fillText('الشركة العامة لموانئ العراق', w / 2, 118)
    g.font = '700 300px "Reem Kufi", "Tajawal", sans-serif'
    const gr = g.createLinearGradient(0, 160, 0, 400)
    gr.addColorStop(0, '#fff3cf')
    gr.addColorStop(0.5, '#e9c985')
    gr.addColorStop(1, '#b8914f')
    g.shadowColor = 'rgba(0,0,0,.55)'
    g.shadowBlur = 18
    g.shadowOffsetY = 8
    g.fillStyle = gr
    g.fillText('ميناء أم قصر', w / 2, 300)
    g.shadowColor = 'transparent'
    g.fillStyle = '#bf9e66'
    g.fillRect(w / 2 - 330, 440, 270, 4)
    g.fillRect(w / 2 + 60, 440, 270, 4)
    g.beginPath()
    g.moveTo(w / 2, 424)
    g.lineTo(w / 2 + 22, 442)
    g.lineTo(w / 2, 460)
    g.lineTo(w / 2 - 22, 442)
    g.closePath()
    g.fill()
    g.font = '500 92px "Tajawal", Arial, sans-serif'
    g.fillStyle = '#ffffff'
    g.fillText('بوّابة العراق إلى العالم', w / 2, 528)
    g.direction = 'ltr'
    g.font = '700 58px "Tajawal", Arial, sans-serif'
    g.fillStyle = '#e7cf9f'
    g.fillText('U M M   Q A S R   P O R T   ·   I R A Q', w / 2, 612)
    tex.needsUpdate = true
  }
  draw()
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('700 200px "Reem Kufi"'), document.fonts.load('500 60px "Tajawal"'), document.fonts.load('700 60px "Tajawal"')]).then(draw).catch(() => {})
  }
  return tex
}

export function makeGateSign(W = 14) {
  const g = new THREE.Group()
  const stone = new THREE.MeshStandardMaterial({ map: pillarTexture(), roughness: 0.85 })
  stone.map.repeat.set(1, 3)
  const gold = new THREE.MeshStandardMaterial({ color: 0xbf9e66, metalness: 0.6, roughness: 0.32 })
  const sand = new THREE.MeshStandardMaterial({ color: 0xd9c9a2, roughness: 0.8 })
  const mk = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    m.castShadow = true
    g.add(m)
    return m
  }
  const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d)
  mk(bx(W + 4, 0.7, 3.0), sand, 0, 0.35, 0.3)
  mk(bx(W + 3.4, 0.25, 2.5), gold, 0, 0.82, 0.3)
  ;[-1, 1].forEach((s) => {
    mk(bx(W * 0.28, 0.9, 0.9), new THREE.MeshStandardMaterial({ color: 0x2f5a2a, roughness: 1 }), s * (W * 0.32), 1.5, 1.1)
  })
  ;[-1, 1].forEach((s) => {
    const x = s * (W / 2 + 0.4)
    mk(bx(2.2, 0.8, 2.2), sand, x, 1.1, 0)
    mk(bx(1.6, 11.2, 1.6), stone, x, 7.0, 0)
    mk(bx(2.1, 0.45, 2.1), gold, x, 12.8, 0)
    mk(bx(1.8, 0.5, 1.8), sand, x, 13.25, 0)
    mk(bx(1.3, 0.5, 1.3), sand, x, 13.75, 0)
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffe6a8, emissiveIntensity: 1.1, roughness: 0.3 }))
    lamp.position.set(x, 14.5, 0)
    g.add(lamp)
    mk(new THREE.ConeGeometry(0.28, 0.7, 8), gold, x, 15.2, 0)
  })
  mk(bx(W + 1.3, 7.7, 0.6), gold, 0, 8.5, -0.05)
  mk(bx(W + 0.3, 6.9, 0.4), new THREE.MeshStandardMaterial({ color: 0x071d2e, roughness: 0.6 }), 0, 8.5, 0.12)
  const board = new THREE.Mesh(new THREE.PlaneGeometry(W, 6.6), new THREE.MeshBasicMaterial({ map: gateSignTexture(), side: THREE.DoubleSide }))
  board.position.set(0, 8.5, 0.34)
  g.add(board)
  ;[-1, 1].forEach((sx) =>
    [-1, 1].forEach((sy) => mk(new THREE.SphereGeometry(0.2, 12, 10), gold, sx * (W / 2 + 0.35), 8.5 + sy * 3.55, 0.4))
  )
  mk(bx(W + 1.8, 0.55, 0.9), gold, 0, 12.55, 0)
  const n = Math.floor(W / 1.1)
  const merl = new THREE.InstancedMesh(new THREE.ConeGeometry(0.5, 1.05, 4), sand, n)
  const d = new THREE.Object3D()
  for (let i = 0; i < n; i++) {
    d.position.set(-W / 2 + 0.55 + i * ((W - 1.1) / (n - 1)), 13.35, 0)
    d.rotation.set(0, Math.PI / 4, 0)
    d.scale.set(1, 1, 0.5)
    d.updateMatrix()
    merl.setMatrixAt(i, d.matrix)
  }
  merl.castShadow = true
  g.add(merl)
  for (let i = 0; i < 5; i++) {
    mk(bx(0.5, 0.18, 0.5), new THREE.MeshStandardMaterial({ color: 0xfff1c8, emissive: 0xffe6a8, emissiveIntensity: 1.0 }), -W / 2 + 1.5 + i * ((W - 3) / 4), 1.0, 1.7)
  }
  g.rotation.y = Math.PI / 2
  const holder = new THREE.Group()
  holder.add(g)
  return holder
}

export function createPort(scene, { riverX, halfW, low = false, plantPalms = null }) {
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
  const beacons = []
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
    const bc = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff3b2f, emissive: 0xff2a1a, emissiveIntensity: 1 }))
    bc.position.set(-6.4, 41.9, 0)
    g.add(bc)
    beacons.push(bc)
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
    const ctn = new THREE.Mesh(new THREE.BoxGeometry(2.75, 2.6, 2.9), new THREE.MeshStandardMaterial({ map: corrTexture(), color: [0xb8452b, 0x2a5d8f, 0xd49a2a, 0x3f7a4a][Math.floor(r() * 4)], roughness: 0.6 }))
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
    cranes.push({ g, trolley, hang, ropes, ph: r() * 6, ctn })
    return g
  }
  ;[-386, -401, -416].forEach((z) => {
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
    for (let i = 0; i < 0; i++) {
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

  /* ======================= لمسات احترافية ======================= */
  const extras = []
  const flatTex = (color) => {
    const c = document.createElement('canvas')
    c.width = c.height = 4
    const g = c.getContext('2d')
    g.fillStyle = color
    g.fillRect(0, 0, 4, 4)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }

  /* شريط تحذيري أصفر وأسود على حافة الرصيف + سكك الرافعات */
  {
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 32
    const g = c.getContext('2d')
    g.fillStyle = '#f2c21b'
    g.fillRect(0, 0, 128, 32)
    g.fillStyle = '#161616'
    for (let x = -32; x < 160; x += 32) {
      g.beginPath()
      g.moveTo(x, 32)
      g.lineTo(x + 16, 32)
      g.lineTo(x + 48, 0)
      g.lineTo(x + 32, 0)
      g.closePath()
      g.fill()
    }
    const hz = new THREE.CanvasTexture(c)
    hz.wrapS = hz.wrapT = THREE.RepeatWrapping
    hz.colorSpace = THREE.SRGBColorSpace
    strip(-0.25, -1.25, 0.8, hz, 0.75, 1)
    const rail = flatTex('#3a3d42')
    strip(-0.85, -1.15, 0.8, rail, 1, 1)
    strip(-11.85, -12.15, 0.8, rail, 1, 1)
  }

  /* أرقام الأرصفة بالعربية على الأرض */
  {
    const label = (txt) => {
      const c = document.createElement('canvas')
      c.width = 512
      c.height = 256
      const tex = new THREE.CanvasTexture(c)
      tex.colorSpace = THREE.SRGBColorSpace
      const draw = () => {
        const g = c.getContext('2d')
        g.clearRect(0, 0, 512, 256)
        g.fillStyle = 'rgba(255,255,255,.92)'
        g.font = '700 150px "Reem Kufi", "Tajawal", sans-serif'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.direction = 'rtl'
        g.fillText(txt, 256, 130)
        tex.needsUpdate = true
      }
      draw()
      if (document.fonts && document.fonts.load) document.fonts.load('700 150px "Reem Kufi"').then(draw).catch(() => {})
      return tex
    }
    ;[['رصيف ١', -400], ['رصيف ٢', -470]].forEach(([txt, z]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ map: label(txt), transparent: true, depthWrite: false }))
      m.rotation.x = -Math.PI / 2
      m.rotation.z = Math.PI / 2
      const h = new THREE.Group()
      h.add(m)
      put(h, z, -7.5, 0.67)
    })
  }

  /* صوامع الحبوب مع برج رأسي ومبنى المعالجة */
  {
    const ribs = (() => {
      const c = document.createElement('canvas')
      c.width = 128
      c.height = 256
      const g = c.getContext('2d')
      g.fillStyle = '#f0ede4'
      g.fillRect(0, 0, 128, 256)
      g.fillStyle = 'rgba(0,0,0,.14)'
      for (let y = 0; y < 256; y += 32) g.fillRect(0, y, 128, 3)
      for (let x = 0; x < 128; x += 16) g.fillRect(x, 0, 2, 256)
      const t = new THREE.CanvasTexture(c)
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.colorSpace = THREE.SRGBColorSpace
      return t
    })()
    const mat = new THREE.MeshStandardMaterial({ map: ribs, roughness: 0.7 })
    const g = new THREE.Group()
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 4; i++) {
        const sil = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 24, 24), mat)
        sil.position.set(row * 7.2, 12, i * 7.2)
        sil.castShadow = !low
        g.add(sil)
        const cap = new THREE.Mesh(new THREE.ConeGeometry(3.5, 2.4, 24), M(0xd9d4c6, { roughness: 0.6 }))
        cap.position.set(row * 7.2, 25.2, i * 7.2)
        g.add(cap)
      }
    }
    g.add(box(4, 30, 4, 0xe9e5d8, 3.6, 15, 10.8))
    g.add(box(18, 2.4, 3, 0xd0cab8, 3.6, 28.5, 10.8))
    g.add(box(18, 0.6, 28, 0xc0b9a4, 3.6, 24.2, 10.8))
    g.add(box(5, 8, 32, 0x9a9588, 11, 4, 10.8))
    const holder = new THREE.Group()
    holder.add(g)
    g.position.set(0, 0.62, -14)
    put(holder, -448, -64)
  }

  /* خزانات نفط بيضاء بسقوف عائمة وسلالم دوّارة */
  {
    const tankMat = M(0xf4f1e8, { roughness: 0.55 })
    ;[-466, -482, -498].forEach((z, i) => {
      const g = new THREE.Group()
      const body = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 10, 40), tankMat)
      body.position.y = 5
      body.castShadow = !low
      g.add(body)
      g.add(cyl(7.1, 7.1, 0.5, 0xb3231a, 0, 10.2, 0, 40))
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 6.8, 0.4, 40), M(0xcfcabb))
      roof.position.y = 9.2 - i * 0.7
      g.add(roof)
      /* سلّم حلزوني مبسّط */
      for (let k = 0; k < 14; k++) {
        const a = k * 0.5
        g.add(box(1.2, 0.2, 0.7, 0x777b80, Math.cos(a) * 7.35, 0.8 + k * 0.65, Math.sin(a) * 7.35))
      }
      /* أنابيب إلى الرصيف */
      const pipe = cyl(0.35, 0.35, 56, 0x6c6a64, 28, 1.2, 0, 8)
      pipe.rotation.z = Math.PI / 2
      g.add(pipe)
      g.position.y = 0.62
      const h = new THREE.Group()
      h.add(g)
      put(h, z, -66)
    })
  }

  /* أعلام العراق على صفّ على حافة الرصيف */
  ;[-374, -398, -422, -446, -470, -494].forEach((z) => {
    const f = makeFlag(0.7, 11)
    const h = new THREE.Group()
    h.add(f)
    f.position.y = 0.62
    put(h, z, -1.6, 0, yawWater(z) + Math.PI / 2)
  })

  /* تشجير: صفّ نخيل على الجانب الداخلي ومزارع زرع */
  if (plantPalms) {
    const list = []
    for (let z = -372; z > -498; z -= 13) {
      const p = at(z, -50)
      list.push({ x: p.x, y: 0.62, z: p.z, s: 0.7 + r() * 0.35 })
    }
    for (let z = -376; z > -496; z -= 19) {
      const p = at(z, -3.2)
      list.push({ x: p.x, y: 0.62, z: p.z, s: 0.5 + r() * 0.2 })
    }
    plantPalms(list)
  }

  /* حاجز بوابة وكشك حراسة عند مدخل الرصيف */
  {
    const g = new THREE.Group()
    g.add(box(2.4, 2.6, 2.4, 0xf1eee6, 0, 1.3, 0))
    g.add(box(2.8, 0.3, 2.8, 0x1d4e7a, 0, 2.75, 0))
    g.add(box(0.05, 1.2, 1.8, 0x10171d, 1.22, 1.6, 0))
    g.add(box(0.5, 1.2, 0.5, 0x2a2c30, 0, 0.6, 4))
    const arm = box(0.14, 0.14, 6, 0xe8e4d8, 0, 1.2, 7)
    g.add(arm)
    for (let i = 0; i < 6; i++) g.add(box(0.15, 0.16, 0.6, 0xc9241a, 0, 1.2, 4.2 + i * 1.0))
    g.position.y = 0.62
    const h = new THREE.Group()
    h.add(g)
    put(h, -372, -30, 0, yawFlow(-372))
  }

  /* رصيف إسقاط الأمواج ومنارة حمراء وبيضاء مع ضوء نابض */
  {
    const g = new THREE.Group()
    g.add(box(54, 3, 6, 0xcfcab8, 22, -0.8, 0))
    g.add(box(54, 0.25, 6.4, 0x8e887a, 22, 0.75, 0))
    for (let i = 0; i < 6; i++) g.add(cyl(0.35, 0.5, 0.7, 0x2a2c30, 0 + i * 9.5, 1.1, 2.6, 8))
    const tw = new THREE.Group()
    tw.add(cyl(2.5, 2.7, 3, 0xf1eee6, 0, 1.5, 0, 24))
    for (let b = 0; b < 4; b++) tw.add(cyl(2.2 - b * 0.18, 2.4 - b * 0.18, 3, b % 2 ? 0xf6f3eb : 0xc9241a, 0, 4.5 + b * 3, 0, 24))
    tw.add(cyl(2.7, 2.7, 0.35, 0x2a2c30, 0, 16.5, 0, 24))
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.3, 20), new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xffe9a0, emissiveIntensity: 1.2, roughness: 0.3 }))
    lamp.position.y = 17.8
    tw.add(lamp)
    const dome = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.8, 20), M(0xc9241a))
    dome.position.y = 19.8
    tw.add(dome)
    tw.position.set(46, 0.8, 0)
    g.add(tw)
    const h = new THREE.Group()
    h.add(g)
    const p = at(-512, -4)
    h.position.set(p.x, 0, p.z)
    h.rotation.y = yawWater(-512)
    root.add(h)
    extras.push((t) => {
      lamp.material.emissiveIntensity = 0.5 + 0.9 * Math.max(0, Math.sin(t * 2.2))
    })
  }

  /* عوّامات ملاحة حمراء وخضراء تهتزّ على الماء */
  {
    const buoys = []
    for (let i = 0; i < 9; i++) {
      const z = -330 - i * 22
      ;[[34, 0xc9241a], [176, 0x1c8a3c]].forEach(([q, col]) => {
        const g = new THREE.Group()
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 1.4, 14), M(col, { roughness: 0.45 }))
        body.position.y = 0.2
        g.add(body)
        g.add(cyl(0.45, 0.75, 1.6, col, 0, 1.6, 0, 12))
        g.add(cyl(0.12, 0.12, 1.2, 0x222222, 0, 3, 0, 6))
        const light = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1 }))
        light.position.y = 3.7
        g.add(light)
        const p = at(z, q)
        g.position.set(p.x, -0.9, p.z)
        root.add(g)
        buoys.push({ g, light, ph: r() * 6, y0: -0.9 })
      })
    }
    extras.push((t) => {
      buoys.forEach((b) => {
        b.g.position.y = b.y0 + Math.sin(t * 1.3 + b.ph) * 0.14
        b.g.rotation.z = Math.sin(t * 1.1 + b.ph) * 0.05
        b.light.material.emissiveIntensity = 0.3 + 1.2 * Math.max(0, Math.sin(t * 2.5 + b.ph))
      })
    })
  }

  /* رافعات شوكية ورافعات حاويات متحركة في الساحة */
  {
    const stackers = []
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group()
      g.add(box(4.2, 1.7, 2.6, 0xe3a82a, 0, 1.4, 0))
      g.add(box(1.7, 1.7, 2.3, 0x1d2a33, 1.5, 3.0, 0))
      g.add(box(0.1, 1.1, 2.0, 0x10171d, 2.4, 3.1, 0, { roughness: 0.15 }))
      const boom = box(6.2, 0.55, 0.55, 0xe3a82a, -2.6, 3.4, 0)
      boom.rotation.z = 0.35
      g.add(boom)
      g.add(box(3.0, 0.3, 2.6, 0x333a42, -5.4, 4.7, 0))
      g.add(box(5.8, 2.6, 2.4, [0xb8452b, 0x2a5d8f, 0xd49a2a][i], -5.5, 6.0, 0))
      for (const x of [-1.4, 1.4]) for (const z of [-1.3, 1.3]) g.add(cyl(0.55, 0.55, 0.45, 0x111111, x, 0.55, z, 10)).children[g.children.length - 1].rotation.x = Math.PI / 2
      g.position.y = 0.62
      const h = new THREE.Group()
      h.add(g)
      h.userData = { z0: -392 - i * 34, ph: r() * 6 }
      root.add(h)
      stackers.push(h)
    }
    extras.push((t) => {
      stackers.forEach((h) => {
        const z = h.userData.z0 + Math.sin(t * 0.12 + h.userData.ph) * 16
        const p = at(z, -15)
        h.position.set(p.x, 0, p.z)
        h.rotation.y = yawFlow(z) + (Math.cos(t * 0.12 + h.userData.ph) > 0 ? Math.PI : 0)
      })
    })
  }

  /* لافتات على المستودعات */
  {
    ;[-420, -470].forEach((z) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 3.4),
        new THREE.MeshBasicMaterial({
          map: signTexture(
            [
              { text: 'مستودعات ميناء أم قصر', font: '700 120px "Reem Kufi", "Tajawal", sans-serif', y: 180, color: '#f4f0e4' },
            ],
            '#0f3a5c', 1400, 340
          ),
        })
      )
      m.position.set(8.2, 4.4, 0)
      m.rotation.y = Math.PI / 2
      const h = new THREE.Group()
      h.add(m)
      put(h, z, -45, 0.62)
    })
  }

  /* نبض أضواء الإنذار على رؤوس الرافعات */
  extras.push((t) => {
    beacons.forEach((b, i) => {
      b.material.emissiveIntensity = 0.25 + 1.1 * Math.max(0, Math.sin(t * 2.0 + i))
    })
  })

  /* ======================= دورة التفريغ والتحميل ======================= */
  /* شاحنات خدمة: واحدة لكل رافعة في ممرّها الخاص بين رجلي الرافعة */
  const svcTrucks = []
  const SVC_LANES = [-3.2, -6.4, -9.6]
  const CRANE_ZS = [-386, -401, -416]
  const palette = [0xb8452b, 0x2a5d8f, 0xd49a2a, 0x3f7a4a, 0x8c2f3a, 0x1f4a6a]
  CRANE_ZS.forEach((zc, i) => {
    const g = new THREE.Group()
    g.add(box(2.1, 2.2, 2.3, i % 2 ? 0x1d4e7a : 0xe8e4d8, 3.2, 1.7, 0))
    g.add(box(0.1, 1, 1.9, 0x10171d, 4.3, 2.2, 0, { roughness: 0.15 }))
    g.add(box(6.8, 0.5, 2.3, 0x2a2c30, -0.4, 0.9, 0))
    for (const x of [-3, -1.8, 2.6]) {
      for (const z of [-1.2, 1.2]) {
        const w = cyl(0.45, 0.45, 0.4, 0x111111, x, 0.5, z, 10)
        w.rotation.x = Math.PI / 2
        g.add(w)
      }
    }
    const cm = new THREE.MeshStandardMaterial({ map: corrTexture(), color: palette[i], roughness: 0.6, metalness: 0.15 })
    const cont = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.6, 2.75), cm)
    cont.position.set(-1, 2.5, 0)
    cont.castShadow = !low
    g.add(cont)
    g.position.y = 0.62
    const h = new THREE.Group()
    h.add(g)
    root.add(h)
    svcTrucks.push({ h, cont, cm, z: zc - 1, zc: zc, lane: SVC_LANES[i], has: false, mode: 'park', vis: true, pending: null })
  })
  const wait = (zc) => zc - 1 /* مركز الشاحنة بحيث تقع الحاوية تحت مركز الرافعة */

  /* ربط السفينة: حاويات حقيقية تُرفع وتُنزل من الحاويات المرسومة */
  let ship = null
  const slots = [] /* لكل رافعة: أعمدة الحاويات المتاحة */
  const hideM = new THREE.Matrix4().makeScale(0, 0, 0)
  const tmpV = new THREE.Vector3()
  function attachShip(g) {
    ship = g
    cranes.forEach((c) => (c.ctn.visible = false))
    const cargo = g.userData.cargo
    const items = cargo.items
    const L = g.userData.L
    /* لكل رافعة نختار عمود x في السفينة المحاذي لها */
    CRANE_ZS.forEach((zc, ci) => {
      const stacks = []
      const target = -402 - zc /* x المحلي للسفينة */
      let bestX = null
      let bestD = 1e9
      items.forEach((it) => {
        const d = Math.abs(it[0] - target)
        if (d < bestD) {
          bestD = d
          bestX = it[0]
        }
      })
      ;[-2.95, 0, 2.95].forEach((cz) => {
        const idxs = []
        items.forEach((it, i) => {
          if (Math.abs(it[0] - bestX) < 0.01 && Math.abs(it[2] - cz) < 0.01) idxs.push(i)
        })
        idxs.sort((a, b) => items[a][1] - items[b][1])
        if (idxs.length) stacks.push({ idxs, vis: idxs.map(() => true) })
      })
      slots[ci] = stacks
    })
  }

  /* حالة كل رافعة */
  const PH = [5, 3.2, 0.8, 3.2, 5, 3.4, 1.4, 2.6, 7.5, 3.4, 0.8, 3, 5, 3.2, 0.8, 5.5]
  const CYCLE = PH.reduce((a, b) => a + b, 0)
  const SAFE = 22
  const ease = (u) => u * u * (3 - 2 * u)
  const mixn = (a, b, u) => a + (b - a) * ease(Math.min(1, Math.max(0, u)))
  const ctl = CRANE_ZS.map((zc, i) => ({ clock: -i * 17, idx: -1, stackI: -1, top: 0, prevX: 0, shipX: 0, zOff: 0, cycle: 0, ph: -1 }))

  function runCrane(ci, t, dt) {
    const c = cranes[ci]
    const k = ctl[ci]
    const tr = svcTrucks[ci]
    if (!ship || !slots[ci]) return
    const cargo = ship.userData.cargo
    k.clock += dt
    const truckX0 = tr.lane
    if (k.clock < 0) {
      c.trolley.position.set(truckX0, 26.6, 0)
      c.hang.position.set(truckX0, SAFE, 0)
      c.ropes.forEach((rp) => {
        const len = 26.2 - SAFE
        rp.m.scale.y = len
        rp.m.position.set(truckX0 + rp.x, SAFE + len / 2, rp.z)
      })
      tr.h.visible = true
      const p0 = at(wait(tr.zc), tr.lane)
      tr.h.position.set(p0.x, 0, p0.z)
      tr.h.rotation.y = yawFlow(wait(tr.zc))
      return
    }
    const tc = k.clock % CYCLE
    let ph = 0
    let acc = 0
    while (ph < PH.length - 1 && tc >= acc + PH[ph]) {
      acc += PH[ph]
      ph++
    }
    const u = (tc - acc) / PH[ph]
    /* بداية دورة جديدة: اختيار الحاوية */
    if (ph !== k.ph) {
      if (ph === 0) {
        const stacks = slots[ci]
        k.cycle++
        const si = k.cycle % stacks.length
        const st = stacks[si]
        let top = -1
        for (let j = st.idxs.length - 1; j >= 0; j--) if (st.vis[j]) { top = j; break }
        if (top < 0) top = st.idxs.length - 1
        k.stackI = si
        k.top = top
        k.idx = st.idxs[top]
        k.prevX = k.shipX || truckX0
      }
      /* أحداث عند الدخول في طور جديد */
      const st = slots[ci][k.stackI]
      if (ph === 3) {
        /* التقاط من السفينة */
        cargo.setSlot(k.idx, false)
        st.vis[k.top] = false
        c.ctn.material.color.setHex(cargo.items[k.idx][3])
        c.ctn.visible = true
      }
      if (ph === 7) {
        /* الإنزال على الشاحنة تمّ */
        tr.cm.color.copy(c.ctn.material.color)
        tr.cont.visible = true
        tr.has = true
        c.ctn.visible = false
        tr.mode = 'leave'
      }
      if (ph === 8) {
        tr.pending = 'full'
      }
      if (ph === 11) {
        /* التقاط الحاوية من الشاحنة لتحميلها في السفينة */
        c.ctn.material.color.setHex(cargo.items[k.idx][3])
        c.ctn.visible = true
        tr.cont.visible = false
        tr.has = false
        tr.mode = 'leave'
      }
      if (ph === 15) {
        /* وُضعت الحاوية في السفينة */
        cargo.setSlot(k.idx, true)
        st.vis[k.top] = true
        c.ctn.visible = false
        tr.pending = 'empty'
      }
      if (ph === 0 && k.cycle === 1) {
        tr.mode = 'park'
        tr.has = false
        tr.cont.visible = false
        tr.vis = true
        tr.z = wait(tr.zc)
        c.ctn.visible = false
      }
      k.ph = ph
    }
    /* موضع الهدف في إطار الرافعة */
    const it = cargo.items[k.idx]
    tmpV.set(it[0], it[1] - 0.2, it[2])
    ship.localToWorld(tmpV)
    c.g.worldToLocal(tmpV)
    const shipX = tmpV.x
    const slotY = tmpV.y + 1.5
    k.shipX = shipX
    k.zOff = Math.max(-1.4, Math.min(1.4, tmpV.z))
    const truckX = tr.lane
    const dropY = 2.6 + 1.5
    let x = shipX
    let y = SAFE
    switch (ph) {
      case 0: x = mixn(k.prevX, shipX, u); y = SAFE; break
      case 1: x = shipX; y = mixn(SAFE, slotY, u); break
      case 2: x = shipX; y = slotY; break
      case 3: x = shipX; y = mixn(slotY, SAFE, u); break
      case 4: x = mixn(shipX, truckX, u); y = SAFE; break
      case 5: x = truckX; y = mixn(SAFE, dropY, u); break
      case 6: x = truckX; y = dropY; break
      case 7: x = truckX; y = mixn(dropY, SAFE, u); break
      case 8: x = truckX; y = SAFE; break
      case 9: x = truckX; y = mixn(SAFE, dropY, u); break
      case 10: x = truckX; y = dropY; break
      case 11: x = truckX; y = mixn(dropY, SAFE, u); break
      case 12: x = mixn(truckX, shipX, u); y = SAFE; break
      case 13: x = shipX; y = mixn(SAFE, slotY, u); break
      case 14: x = shipX; y = slotY; break
      default: x = shipX; y = mixn(slotY, SAFE, u); break
    }
    c.trolley.position.set(x, 26.6, 0)
    c.hang.position.set(x, y, 0)
    c.ropes.forEach((rp) => {
      const len = 26.2 - y
      rp.m.scale.y = len
      rp.m.position.set(x + rp.x, y + len / 2, rp.z)
    })
    /* الشاحنة: تغادر 30 وحدة وتتلاشى ثم تعود من الجهة الأخرى */
    const wz = wait(tr.zc)
    const leaveZ = wz - 30
    const startZ = wz + 30
    let want = wz
    if (tr.mode === 'leave') {
      want = leaveZ
      if (tr.z <= leaveZ + 0.5) {
        tr.mode = 'hidden'
        tr.vis = false
      }
    }
    if (tr.mode === 'hidden' && tr.pending) {
      tr.mode = 'arrive'
      tr.z = startZ
      tr.vis = true
      if (tr.pending === 'full') {
        tr.cm.color.setHex(cargo.items[k.idx][3])
        tr.cont.visible = true
        tr.has = true
      } else {
        tr.cont.visible = false
        tr.has = false
      }
      tr.pending = null
    }
    const v = tr.mode === 'leave' ? 8 : 7
    tr.z += Math.max(-v * dt, Math.min(v * dt, want - tr.z))
    const dist = Math.abs(tr.z - wz)
    const sc = dist > 22 ? Math.max(0.001, (30 - dist) / 8) : 1
    tr.h.scale.setScalar(sc)
    tr.h.visible = tr.vis
    const p = at(tr.z, tr.lane)
    tr.h.position.set(p.x, 0, p.z)
    tr.h.rotation.y = yawFlow(tr.z)
    c.hang.position.z = k.zOff * 0.9
  }

  /* ---------- حركة ---------- */
  const zMin = PORT.z1 + 6
  const zMax = PORT.z0 - 6
  function update(t, dt) {
    extras.forEach((f) => f(t))
    cranes.forEach((c, i) => runCrane(i, t, dt))
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

  return { update, attachShip, berth: (z, half) => -(halfW(z) - 0.3 - half - 0.5) }
}
