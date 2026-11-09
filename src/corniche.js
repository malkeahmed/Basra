import * as THREE from 'three'
import { createFleet } from './vehicles.js'
import { makeMashoof, makeFlag } from './boats.js'

/*
  كورنيش شطّ العرب على الضفة اليمنى: رصيف حجري بسياج وأعمدة إنارة مزدوجة الكرات،
  أرضية مبلّطة بنقوش بصرية، مقاعد، أحواض زهور ونخيل، مظلّات ثمانية وفسقية وجسر مشاة،
  شارع بسيّاراته، وخلفه بيوت الشناشيل. كلّه يُبنى بالكود ويتبع انحناء النهر.
*/
export const CORN = { z0: 34, z1: -196, depth: 54 }
const sstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
export function cornMask(x, z, rx, hw) {
  if (z > CORN.z0 + 8 || z < CORN.z1 - 8) return 0
  const d = x - (rx + hw)
  const mz = sstep(CORN.z0 + 8, CORN.z0, z) * sstep(CORN.z1 - 8, CORN.z1, z)
  const lat = sstep(-1.2, 0.6, d) * (1 - sstep(CORN.depth + 2, CORN.depth + 14, d))
  return mz * lat
}
export function cornBlend(h, x, z, rx, hw) {
  const m = cornMask(x, z, rx, hw)
  const d = x - (rx + hw)
  const t = -1.8 + (0.78 + 1.8) * sstep(2, 5, d)
  return m > 0 ? h * (1 - m) + t * m : h
}
export const inCorn = (x, z, rx, hw, pad = 0.02) => cornMask(x, z, rx, hw) > pad

const rng = (seed) => {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}
const GOLD = 0xbf9e66
const DECK = 0.96

/* ---------- خامات ---------- */
function canvasTex(w, h, draw, repeat = true) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
function pavingTex() {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#dcc696'
    g.fillRect(0, 0, 256, 256)
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        const odd = (x + y) % 2
        g.fillStyle = odd ? '#e9dbb8' : '#cfb27c'
        g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60)
        /* نجمة ثمانية داخل البلاطة */
        g.save()
        g.translate(x * 64 + 32, y * 64 + 32)
        g.fillStyle = odd ? '#b99a62' : '#f2e8cc'
        for (let k = 0; k < 2; k++) {
          g.rotate(Math.PI / 4)
          g.fillRect(-14, -14, 28, 28)
        }
        g.fillStyle = odd ? '#e9dbb8' : '#cfb27c'
        g.beginPath()
        g.arc(0, 0, 7, 0, 7)
        g.fill()
        g.restore()
      }
    for (let i = 0; i < 2500; i++) {
      g.fillStyle = `rgba(90,70,40,${Math.random() * 0.07})`
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
    }
  })
}
function stoneTex() {
  return canvasTex(256, 128, (g) => {
    g.fillStyle = '#d8ccb0'
    g.fillRect(0, 0, 256, 128)
    for (let r = 0; r < 4; r++) {
      const off = r % 2 ? 32 : 0
      for (let x = -64; x < 256; x += 64) {
        const v = 196 + Math.random() * 30
        g.fillStyle = `rgb(${v},${v - 8},${v - 26})`
        g.fillRect(x + off + 1.5, r * 32 + 1.5, 61, 29)
      }
    }
    for (let i = 0; i < 1800; i++) {
      g.fillStyle = `rgba(80,60,30,${Math.random() * 0.1})`
      g.fillRect(Math.random() * 256, Math.random() * 128, 2, 2)
    }
  })
}
function roadTex() {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#35363a'
    g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 6000; i++) {
      const v = 40 + Math.random() * 40
      g.fillStyle = `rgba(${v},${v},${v + 4},${Math.random() * 0.4})`
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
    }
    g.fillStyle = '#ecebe3'
    g.fillRect(10, 0, 4, 256)
    g.fillRect(242, 0, 4, 256)
    g.fillRect(124, 20, 8, 100)
  })
}
function facadeTex(wall) {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = wall
    g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 3000; i++) {
      g.fillStyle = `rgba(90,70,40,${Math.random() * 0.06})`
      g.fillRect(Math.random() * 256, Math.random() * 256, 3, 3)
    }
    for (let c = 0; c < 2; c++) {
      const x = 28 + c * 128
      g.fillStyle = '#6b5233'
      g.fillRect(x - 3, 48, 66, 120)
      g.fillStyle = '#243247'
      g.beginPath()
      g.moveTo(x, 164)
      g.lineTo(x, 80)
      g.quadraticCurveTo(x + 30, 36, x + 60, 80)
      g.lineTo(x + 60, 164)
      g.fill()
      g.fillStyle = 'rgba(255,255,255,.18)'
      g.fillRect(x + 6, 90, 20, 70)
      g.fillStyle = '#8a6a3a'
      g.fillRect(x - 6, 164, 72, 8)
    }
    g.fillStyle = 'rgba(70,50,25,.35)'
    g.fillRect(0, 252, 256, 4)
  })
}
function latticeTex() {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = '#7a5428'
    g.fillRect(0, 0, 128, 128)
    g.strokeStyle = '#e8d3a2'
    g.lineWidth = 3
    for (let y = 0; y < 128; y += 32)
      for (let x = 0; x < 128; x += 32) {
        g.beginPath()
        g.moveTo(x + 16, y + 3)
        g.lineTo(x + 29, y + 16)
        g.lineTo(x + 16, y + 29)
        g.lineTo(x + 3, y + 16)
        g.closePath()
        g.stroke()
      }
  })
}
function signTex() {
  const t = canvasTex(
    1024,
    256,
    (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h)
      gr.addColorStop(0, '#3a2a17')
      gr.addColorStop(1, '#241a0e')
      g.fillStyle = gr
      g.fillRect(0, 0, w, h)
      g.strokeStyle = '#d8b476'
      g.lineWidth = 6
      g.strokeRect(14, 14, w - 28, h - 28)
      g.lineWidth = 2
      g.strokeRect(26, 26, w - 52, h - 52)
      g.fillStyle = '#e8c98c'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.direction = 'rtl'
      g.font = '700 118px "Reem Kufi", "Tajawal", serif'
      g.fillText('كورنيش شطّ العرب', w / 2, h / 2 + 4)
      ;[90, w - 90].forEach((x) => {
        g.save()
        g.translate(x, h / 2)
        g.fillStyle = '#d8b476'
        for (let k = 0; k < 2; k++) {
          g.rotate(Math.PI / 4)
          g.fillRect(-16, -16, 32, 32)
        }
        g.restore()
      })
    },
    false
  )
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      t.image.getContext('2d')
      t.needsUpdate = true
    })
  }
  return t
}

export function createCorniche(scene, { riverX, halfW, terrainH, low = false, plantPalms }) {
  const root = new THREE.Group()
  scene.add(root)
  const B = (z) => riverX(z) + halfW(z)
  const slope = (z) => (B(z - 1.5) - B(z + 1.5)) / -3
  const toRiver = (z) => Math.atan2(-1, slope(z))
  const alongYaw = (z) => Math.atan2(-1, B(z - 1) - B(z + 1)) /* غير مستخدم للمواضع الصغيرة */
  void alongYaw
  const Z0 = CORN.z0
  const Z1 = CORN.z1
  const LEN = Z0 - Z1
  const dummy = new THREE.Object3D()
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o })

  /* شريط مسطّح يتبع الضفة */
  function strip(d0, d1, y, mat, vRep, uRep, zA = Z0, zB = Z1) {
    const n = Math.max(2, Math.ceil(Math.abs(zA - zB) / 3))
    const pos = []
    const uv = []
    const idx = []
    for (let i = 0; i <= n; i++) {
      const z = zA + ((zB - zA) * i) / n
      pos.push(B(z) + d0, y, z, B(z) + d1, y, z)
      uv.push(0, (Math.abs(z - zA) / vRep) * 1, uRep, (Math.abs(z - zA) / vRep) * 1)
      if (i < n) {
        const a = i * 2
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((_, k) => (k % 3 === 1 ? 1 : 0)), 3))
    g.setIndex(idx)
    mat.side = THREE.DoubleSide
    const m = new THREE.Mesh(g, mat)
    m.receiveShadow = true
    root.add(m)
    return m
  }
  function wall(d, y0, y1, mat, vRep, uRep) {
    const n = Math.ceil(LEN / 3)
    const pos = []
    const uv = []
    const idx = []
    for (let i = 0; i <= n; i++) {
      const z = Z0 - (LEN * i) / n
      pos.push(B(z) + d, y0, z, B(z) + d, y1, z)
      uv.push((Z0 - z) / vRep, 0, (Z0 - z) / vRep, uRep)
      if (i < n) {
        const a = i * 2
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((_, k) => (k % 3 === 0 ? -1 : 0)), 3))
    g.setIndex(idx)
    const m = new THREE.Mesh(g, mat)
    root.add(m)
  }
  const tex = (t, rx, ry) => {
    t.repeat.set(rx, ry)
    return t
  }

  /* --- الحجر والرصف --- */
  const paveT = pavingTex()
  const pave = new THREE.MeshStandardMaterial({ map: paveT, roughness: 0.85, side: THREE.DoubleSide })
  const stoneT = stoneTex()
  const stoneM = new THREE.MeshStandardMaterial({ map: stoneT, roughness: 0.9, side: THREE.DoubleSide })
  paveT.repeat.set(1, 1)
  /* رصيف رئيسي */
  strip(0.5, 13, DECK, pave, 6, 13 / 6)
  /* حاشية داكنة وكورنيش حجري عند الحافة */
  strip(-1.5, 0.5, DECK + 0.04, std(0xa58a5c), 6, 1)
  strip(12.4, 13.2, DECK + 0.03, std(0xa58a5c), 6, 1)
  wall(-1.5, -1.7, DECK + 0.04, stoneM, 4, 1)
  /* جدار الحافة الداخلية للرصيف (حوض الزهور) */
  const bedM = new THREE.MeshStandardMaterial({ map: stoneT, roughness: 0.9 })
  strip(13.2, 14.0, DECK + 0.38, bedM, 4, 1)
  wall(13.2, DECK, DECK + 0.38, stoneM, 4, 1)
  strip(14, 19, DECK - 0.1, std(0x4c7a2c, { roughness: 1 }), 4, 1)
  /* الشارع */
  const rt = roadTex()
  rt.repeat.set(1, 1)
  strip(19.6, 29.4, 0.88, new THREE.MeshStandardMaterial({ map: rt, roughness: 0.9, side: THREE.DoubleSide }), 12, 1)
  strip(19, 19.6, 0.97, std(0xd8cfb8), 6, 1)
  strip(29.4, 30, 0.97, std(0xd8cfb8), 6, 1)
  strip(30, 35, 0.94, pave, 6, 5 / 6)

  /* درجات حجرية تنزل إلى الماء: كتلة مصمتة بخدود جانبية تتبع انحدار الدرج */
  const STAIRS = [-20, -88, -150]
  STAIRS.forEach((zc) => {
    const g = new THREE.Group()
    const N = 8
    const run = 0.95
    const rise = 0.235
    const W = 7.4
    const step = new THREE.MeshStandardMaterial({ map: stoneT.clone(), roughness: 0.85 })
    step.map.needsUpdate = true
    step.map.repeat.set(1.5, 0.35)
    for (let k = 0; k < N; k++) {
      const top = DECK + 0.04 - (k + 1) * rise
      const hgt = top + 1.8
      const b = new THREE.Mesh(new THREE.BoxGeometry(W, hgt, run + 0.02), step)
      b.position.set(0, top - hgt / 2, 0.45 + k * run)
      b.receiveShadow = true
      b.castShadow = !low
      g.add(b)
      /* حافة أمامية فاتحة لكل درجة */
      const nose = new THREE.Mesh(new THREE.BoxGeometry(W, 0.05, 0.14), std(0xefe6cf))
      nose.position.set(0, top + 0.025, 0.45 + k * run + run / 2 - 0.07)
      g.add(nose)
      ;[-1, 1].forEach((sd) => {
        const ch = new THREE.Mesh(new THREE.BoxGeometry(0.7, hgt + 0.55, run + 0.02), stoneM)
        ch.position.set(sd * (W / 2 + 0.35), top + 0.55 - (hgt + 0.55) / 2 + 0.0, 0.45 + k * run)
        ch.castShadow = !low
        g.add(ch)
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, run + 0.06), std(0xe9dfc4))
        cap.position.set(sd * (W / 2 + 0.35), top + 0.6, 0.45 + k * run)
        g.add(cap)
      })
    }
    /* عمودا إنارة صغيران في رأس الدرج */
    ;[-1, 1].forEach((sd) => {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.5, 0.55), stoneM)
      pil.position.set(sd * (W / 2 + 0.35), DECK + 0.8, -0.35)
      g.add(pil)
      const gl = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffe0a0, emissiveIntensity: 0.8 }))
      gl.position.set(sd * (W / 2 + 0.35), DECK + 1.85, -0.35)
      g.add(gl)
    })
    g.position.set(B(zc) - 1.5, 0, zc)
    g.rotation.y = toRiver(zc)
    root.add(g)
  })

  /* --- سياج الحافة: أعمدة وقضبان --- */
  {
    const n = Math.floor(LEN / 3)
    const postG = new THREE.CylinderGeometry(0.07, 0.09, 1.05, 8)
    const finG = new THREE.SphereGeometry(0.12, 10, 8)
    const railG = new THREE.BoxGeometry(1, 0.07, 0.09)
    const dark = std(0x2b2a28, { roughness: 0.45, metalness: 0.5 })
    const posts = new THREE.InstancedMesh(postG, dark, n + 1)
    const fins = new THREE.InstancedMesh(finG, std(GOLD, { metalness: 0.6, roughness: 0.35 }), n + 1)
    const rails = new THREE.InstancedMesh(railG, dark, n * 3)
    let r = 0
    for (let i = 0; i <= n; i++) {
      const z = Z0 - i * 3
      const x = B(z) - 1.0
      const gap = STAIRS.some((q) => Math.abs(z - q) < 4.6)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(gap ? 0 : 1, gap ? 0 : 1, gap ? 0 : 1)
      dummy.position.set(x, DECK + 0.52, z)
      dummy.updateMatrix()
      posts.setMatrixAt(i, dummy.matrix)
      dummy.position.set(x, DECK + 1.12, z)
      dummy.updateMatrix()
      fins.setMatrixAt(i, dummy.matrix)
      if (i < n) {
        const z2 = z - 3
        const x2 = B(z2) - 1.0
        const L = STAIRS.some((q) => Math.abs(z - 1.5 - q) < 4.6) ? 0 : Math.hypot(x2 - x, 3)
        ;[0.95, 0.58, 0.22].forEach((hh) => {
          dummy.position.set((x + x2) / 2, DECK + hh, (z + z2) / 2)
          dummy.rotation.set(0, Math.atan2(3, x2 - x), 0)
          dummy.scale.set(L, 1, 1)
          dummy.updateMatrix()
          rails.setMatrixAt(r++, dummy.matrix)
        })
      }
    }
    posts.castShadow = rails.castShadow = !low
    root.add(posts, fins, rails)
  }

  /* --- أعمدة إنارة مزدوجة الكرات على الحافة وعلى جانب الشارع --- */
  const lampList = []
  for (let z = Z0 - 8; z > Z1 + 4; z -= 14) lampList.push([z, 1.4])
  for (let z = Z0 - 14; z > Z1 + 6; z -= 28) lampList.push([z, 12.2])
  for (let z = Z0 - 10; z > Z1 + 6; z -= 28) lampList.push([z, 30.6])
  {
    const n = lampList.length
    const metal = std(0x23221f, { roughness: 0.4, metalness: 0.6 })
    const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.17, 5.4, 10), metal, n)
    const bases = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.42, 0.9, 12), metal, n)
    const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.1, 2.2), metal, n)
    const glow = new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffe0a0, emissiveIntensity: 0.8, roughness: 0.3 })
    const globes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.36, 14, 12), glow, n * 2)
    const tops = new THREE.InstancedMesh(new THREE.ConeGeometry(0.2, 0.5, 8), std(GOLD, { metalness: 0.6, roughness: 0.35 }), n)
    lampList.forEach(([z, d], i) => {
      const x = B(z) + d
      const th = Math.atan2(slope(z), 1)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.position.set(x, DECK + 2.7, z)
      dummy.updateMatrix()
      poles.setMatrixAt(i, dummy.matrix)
      dummy.position.set(x, DECK + 0.45, z)
      dummy.updateMatrix()
      bases.setMatrixAt(i, dummy.matrix)
      dummy.position.set(x, DECK + 5.1, z)
      dummy.rotation.set(0, th, 0)
      dummy.updateMatrix()
      bars.setMatrixAt(i, dummy.matrix)
      ;[-1, 1].forEach((sg, k) => {
        dummy.position.set(x + sg * 1.1 * Math.sin(th), DECK + 5.4, z + sg * 1.1 * Math.cos(th))
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        globes.setMatrixAt(i * 2 + k, dummy.matrix)
      })
      dummy.position.set(x, DECK + 5.62, z)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      tops.setMatrixAt(i, dummy.matrix)
    })
    root.add(poles, bases, bars, globes, tops)
  }

  /* --- مقاعد وسلال --- */
  {
    const list = []
    for (let z = Z0 - 12; z > Z1 + 6; z -= 17) list.push(z)
    const n = list.length
    const wood = std(0x7a5430, { roughness: 0.7 })
    const iron = std(0x1f1f1d, { roughness: 0.5, metalness: 0.5 })
    const seats = new THREE.InstancedMesh(new THREE.BoxGeometry(2.0, 0.09, 0.55), wood, n)
    const backs = new THREE.InstancedMesh(new THREE.BoxGeometry(2.0, 0.5, 0.07), wood, n)
    const legs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.5, 0.55), iron, n * 2)
    const bins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.22, 0.8, 12), std(0x3d5a45), n)
    list.forEach((z, i) => {
      const x = B(z) + 10.2
      const f = toRiver(z)
      const sn = Math.sin(f)
      const cs = Math.cos(f)
      dummy.rotation.set(0, f, 0)
      dummy.scale.set(1, 1, 1)
      dummy.position.set(x, DECK + 0.5, z)
      dummy.updateMatrix()
      seats.setMatrixAt(i, dummy.matrix)
      dummy.position.set(x - sn * 0.27, DECK + 0.8, z - cs * 0.27)
      dummy.updateMatrix()
      backs.setMatrixAt(i, dummy.matrix)
      ;[-0.85, 0.85].forEach((o, k) => {
        dummy.position.set(x + cs * o, DECK + 0.25, z - sn * o)
        dummy.updateMatrix()
        legs.setMatrixAt(i * 2 + k, dummy.matrix)
      })
      dummy.rotation.set(0, 0, 0)
      dummy.position.set(x + 2.0, DECK + 0.4, z + 1.3)
      dummy.updateMatrix()
      bins.setMatrixAt(i, dummy.matrix)
    })
    root.add(seats, backs, legs, bins)
  }

  /* --- أحواض الزهور والسياج الأخضر --- */
  {
    const nF = low ? 260 : 700
    const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 7, 6), new THREE.MeshStandardMaterial({ roughness: 0.6 }), nF)
    const r = rng(3)
    const cols = [0xd8402f, 0xf0c53a, 0xe36aa0, 0xf4f0e6, 0xb24fb8, 0xf08a2c]
    const c = new THREE.Color()
    for (let i = 0; i < nF; i++) {
      const z = Z0 - r() * LEN
      dummy.position.set(B(z) + 13.3 + 0.1 + r() * 0.5, DECK + 0.5 + r() * 0.15, z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(0.7 + r() * 0.8)
      dummy.updateMatrix()
      flowers.setMatrixAt(i, dummy.matrix)
      flowers.setColorAt(i, c.setHex(cols[Math.floor(r() * cols.length)]))
    }
    dummy.scale.set(1, 1, 1)
    root.add(flowers)
    const nH = Math.floor(LEN / 3.4)
    const hedge = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std(0x2f5a28, { roughness: 1 }), nH)
    for (let i = 0; i < nH; i++) {
      const z = Z0 - 1.7 - i * 3.4
      dummy.position.set(B(z) + 17.6, DECK + 0.45, z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1.2, 0.95, 3.2)
      dummy.updateMatrix()
      hedge.setMatrixAt(i, dummy.matrix)
    }
    dummy.scale.set(1, 1, 1)
    root.add(hedge)
  }

  /* --- مظلّات ثمانية --- */
  const cream = std(0xf2e8cf, { roughness: 0.8 })
  const goldM = std(GOLD, { metalness: 0.55, roughness: 0.35 })
  const latT = latticeTex()
  const latM = new THREE.MeshStandardMaterial({ map: latT, roughness: 0.9, side: THREE.DoubleSide })
  function gazebo(z, d, s = 1) {
    const g = new THREE.Group()
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.7, 3.9, 0.5, 8), stoneM)
    base.position.y = 0.25
    g.add(base)
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.06, 8), pave)
    floor.position.y = 0.52
    g.add(floor)
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8
      const x = Math.cos(a) * 3.1
      const zz = Math.sin(a) * 3.1
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 3.4, 10), cream)
      col.position.set(x, 2.25, zz)
      col.castShadow = !low
      g.add(col)
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.4), goldM)
      cap.position.set(x, 3.99, zz)
      g.add(cap)
      /* لوح مشربية فوق الفتحة */
      const a2 = a + Math.PI / 8
      const panel = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.95, 0.08), latM)
      panel.position.set(Math.cos(a2) * 3.0, 3.35, Math.sin(a2) * 3.0)
      panel.rotation.y = -a2 + Math.PI / 2
      g.add(panel)
    }
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(3.7, 3.7, 0.28, 8), cream)
    ring.position.y = 4.18
    ring.rotation.y = Math.PI / 8
    g.add(ring)
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), std(0xd7bd8a, { roughness: 0.55, metalness: 0.15 }))
    dome.position.y = 4.3
    dome.scale.y = 0.85
    dome.castShadow = !low
    g.add(dome)
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.1, 10), goldM)
    fin.position.y = 7.55
    g.add(fin)
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), goldM)
    ball.position.y = 7.1
    g.add(ball)
    const bench = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.16, 6, 16), std(0x7a5430))
    bench.rotation.x = Math.PI / 2
    bench.position.y = 1.1
    g.add(bench)
    g.scale.setScalar(s)
    g.position.set(B(z) + d, DECK - 0.02, z)
    g.rotation.y = toRiver(z)
    root.add(g)
  }
  const GZ = [-38, -112, -176]
  GZ.forEach((z) => gazebo(z, 7.6, 1))

  /* --- فسقية دائرية مع نوافير --- */
  const jets = []
  const FZ = -76
  {
    const g = new THREE.Group()
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.8, 0.7, 36), stoneM)
    rim.position.y = 0.35
    g.add(rim)
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.2, 0.05, 36),
      new THREE.MeshStandardMaterial({ color: 0x3aa3a8, roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.85, emissive: 0x0d4a52, emissiveIntensity: 0.35 })
    )
    water.position.y = 0.6
    g.add(water)
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.5, 1.8, 14), stoneM)
    col.position.y = 1.4
    g.add(col)
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.35, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), cream)
    bowl.position.y = 2.5
    bowl.rotation.x = Math.PI
    g.add(bowl)
    const jm = new THREE.MeshStandardMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.55, roughness: 0.2 })
    const mid = new THREE.Mesh(new THREE.ConeGeometry(0.32, 3.2, 12, 1, true), jm)
    mid.position.y = 4.3
    mid.rotation.x = Math.PI
    g.add(mid)
    jets.push({ m: mid, base: 3.2, y: 4.3 })
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2
      const j = new THREE.Mesh(new THREE.ConeGeometry(0.16, 2.0, 8, 1, true), jm)
      j.position.set(Math.cos(a) * 3.0, 1.6, Math.sin(a) * 3.0)
      j.rotation.x = Math.PI
      j.rotation.z = Math.cos(a) * 0.35
      j.rotation.x = Math.PI - Math.sin(a) * 0.35
      g.add(j)
      jets.push({ m: j, base: 2.0, y: 1.6, ph: k })
    }
    g.position.set(B(FZ) + 24, DECK - 0.1, FZ)
    root.add(g)
  }

  /* --- بوّابة مدخل الكورنيش --- */
  {
    const g = new THREE.Group()
    ;[0.5, 12.4].forEach((d) => {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(1.5, 8, 1.5), stoneM)
      pil.position.set(d + 0.4, 4, 0)
      pil.castShadow = !low
      g.add(pil)
      const cap = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 2.0), goldM)
      cap.position.set(d + 0.4, 8.2, 0)
      g.add(cap)
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 8), goldM)
      fin.position.set(d + 0.4, 9.15, 0)
      g.add(fin)
    })
    const beam = new THREE.Mesh(new THREE.BoxGeometry(13.4, 2.9, 0.7), new THREE.MeshStandardMaterial({ map: signTex(), roughness: 0.6 }))
    beam.position.set(6.9, 6.3, 0)
    beam.rotation.y = Math.PI / 2
    beam.rotation.y = 0
    g.add(beam)
    const back = beam.clone()
    back.rotation.y = Math.PI
    back.position.z = 0.0
    g.add(back)
    const top = new THREE.Mesh(new THREE.BoxGeometry(14.2, 0.45, 1.1), goldM)
    top.position.set(6.9, 7.9, 0)
    g.add(top)
    const zg = Z0 - 3
    g.position.set(B(zg), DECK, zg)
    g.rotation.y = Math.atan2(0, 1)
    root.add(g)
    /* أعلام العراق */
    ;[2.2, 11.6].forEach((d, i) => {
      const f = makeFlag(0.55, 9)
      f.position.set(B(Z0 - 8) + d, DECK, Z0 - 8)
      f.rotation.y = Math.PI * (0.5 + i * 0.0)
      root.add(f)
    })
  }

  /* --- النخيل على الرصيف وعلى جانب الحديقة --- */
  {
    const list = []
    const r = rng(41)
    for (let z = Z0 - 7; z > Z1 + 4; z -= 12.5) {
      if (GZ.some((g) => Math.abs(g - z) < 6) || Math.abs(FZ - z) < 6) continue
      list.push({ x: B(z) + 12.0 + (r() - 0.5) * 0.4, y: DECK - 0.15, z, s: 0.95 + r() * 0.25 })
    }
    for (let z = Z0 - 14; z > Z1 + 4; z -= 17) {
      if (Math.abs(FZ - z) < 9) continue
      list.push({ x: B(z) + 20.2 + (r() - 0.5) * 0.6, y: DECK - 0.2, z, s: 1.05 + r() * 0.3 })
    }
    for (let z = Z0 - 6; z > Z1 + 4; z -= 22) list.push({ x: B(z) + 33.5, y: DECK - 0.2, z, s: 0.95 + r() * 0.3 })
    plantPalms(list)
  }

  /* --- المباني وراء الشارع: بيوت بشناشيل ومحال --- */
  {
    const r = rng(77)
    const walls = ['#e9d7b0', '#f0e4c8', '#dcc093', '#efdcc4']
    const mats = walls.map((w) => {
      const t = facadeTex(w)
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 })
    })
    const roofM = std(0xcbb88e, { roughness: 1 })
    const awnC = [0xb8452b, 0x2a5d8f, 0x3f7a4a, 0xd49a2a, 0x8c2f3a]
    let z = Z0 - 6
    let bi = 0
    while (z > Z1 + 8) {
      const W = 11 + r() * 5
      const floors = 3 + Math.floor(r() * 3)
      const H = floors * 3.5
      const Dp = 12
      const zc = z - W / 2
      const d = 42 + r() * 4
      const g = new THREE.Group()
      const mat = mats[bi % mats.length].clone()
      mat.map = mat.map.clone()
      mat.map.needsUpdate = true
      mat.map.repeat.set(Math.round(W / 4.5), floors)
      const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, Dp), mat)
      body.position.y = H / 2
      body.castShadow = !low
      body.receiveShadow = true
      g.add(body)
      const roof = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.5, Dp + 0.5), roofM)
      roof.position.y = H + 0.25
      g.add(roof)
      /* خزّان ماء وغرفة سطح */
      if (r() > 0.4) {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.4, 10), std(0x8a8d90))
        tank.position.set((r() - 0.5) * W * 0.5, H + 1.2, 0)
        g.add(tank)
      }
      /* شناشيل: صناديق خشبية بارزة من الطابق الثاني */
      const nb = Math.max(1, Math.floor(W / 5.5))
      for (let f = 1; f < floors; f++)
        for (let k = 0; k < nb; k++) {
          const bx = -W / 2 + (W / nb) * (k + 0.5)
          const bay = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.3, 1.1), latM)
          bay.position.set(bx, f * 3.5 + 1.9, Dp / 2 + 0.55)
          g.add(bay)
          const rf = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.18, 1.35), std(0x4a3320))
          rf.position.set(bx, f * 3.5 + 3.1, Dp / 2 + 0.55)
          g.add(rf)
        }
      /* محل أرضي بمظلّة ملوّنة */
      const awn = new THREE.Mesh(new THREE.BoxGeometry(W * 0.8, 0.14, 1.8), std(awnC[bi % awnC.length], { roughness: 0.8 }))
      awn.position.set(0, 3.1, Dp / 2 + 0.9)
      awn.rotation.x = 0.18
      g.add(awn)
      const shop = new THREE.Mesh(new THREE.BoxGeometry(W * 0.76, 2.4, 0.1), std(0x1d2733, { roughness: 0.2, metalness: 0.3 }))
      shop.position.set(0, 1.4, Dp / 2 + 0.06)
      g.add(shop)
      g.position.set(B(zc) + d, terrainH(B(zc) + d, zc), zc)
      g.rotation.y = toRiver(zc) + Math.PI * 0
      root.add(g)
      z -= W + 1.2 + r() * 2
      bi++
    }
  }

  /* --- جسر مشاة يمتدّ داخل النهر مع قارب راسٍ --- */
  const PZ = -128
  const obstacles = []
  const moored = []
  {
    const g = new THREE.Group()
    const deckM = std(0x8a6a44, { roughness: 0.8 })
    const wood = new THREE.Mesh(new THREE.BoxGeometry(26, 0.3, 4.6), deckM)
    wood.position.set(-13 + 0.5, DECK - 0.22, 0)
    wood.receiveShadow = true
    g.add(wood)
    const head = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.3, 14), deckM)
    head.position.set(-26.5, DECK - 0.22, 0)
    head.receiveShadow = true
    g.add(head)
    for (let x = -3; x > -27; x -= 4.5)
      [-1, 1].forEach((s) => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 4.2, 10), std(0x4a3a2a))
        p.position.set(x, -1.2, s * 2.1)
        g.add(p)
      })
    ;[-1, 1].forEach((s) => {
      for (let x = 0; x > -27; x -= 3) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.1, 8), std(0x2b2a28))
        post.position.set(x, DECK + 0.5, s * 2.2)
        g.add(post)
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(27, 0.07, 0.09), std(0x2b2a28))
      rail.position.set(-13, DECK + 1.0, s * 2.2)
      g.add(rail)
      const rail2 = rail.clone()
      rail2.position.y = DECK + 0.55
      g.add(rail2)
    })
    ;[[-26.5, -6.8], [-26.5, 6.8], [-24, 0]].forEach(([x, zz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 4.4, 8), std(0x23221f))
      post.position.set(x, DECK + 2.2, zz)
      g.add(post)
      const gl = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffe0a0, emissiveIntensity: 0.8 }))
      gl.position.set(x, DECK + 4.6, zz)
      g.add(gl)
    })
    g.position.set(B(PZ), 0, PZ)
    g.rotation.y = 0
    root.add(g)
    obstacles.push({ zE: PZ, off: halfW(PZ) - 13, hz: 4, hx: 15, moored: true, waiting: false })
    obstacles.push({ zE: PZ, off: halfW(PZ) - 26.5, hz: 9, hx: 4, moored: true, waiting: false })
    /* مشحوف راسٍ بجانب الرصيف */
    const mo = makeMashoof()
    const sc = 1.15
    mo.scale.setScalar(sc)
    mo.position.y = -0.95 - (mo.userData.draft || 0) * sc
    const h = new THREE.Group()
    h.add(mo)
    const zb = PZ + 12
    h.position.set(B(zb) - 23, 0, zb)
    h.rotation.y = Math.atan2(2, riverX(zb - 1) - riverX(zb + 1)) + 0.12
    root.add(h)
    moored.push({ h, ph: 1.7 })
    obstacles.push({ zE: zb, off: halfW(zb) - 23, hz: (mo.userData.L * sc) / 2 + 1, hx: (mo.userData.B * sc) / 2 + 1.5, moored: true, waiting: false })
  }

  /* --- حركة المرور على شارع الكورنيش --- */
  const fleet = createFleet({ sedan: 8, suv: 4, pickup: 2, minibus: 2 })
  const lanes = [
    { d: 22.4, dir: -1, v: 7, cars: [] },
    { d: 26.4, dir: 1, v: 8, cars: [] },
  ]
  let li = 0
  fleet.forEach((f) => {
    root.add(f.im)
    for (let i = 0; i < f.n; i++) lanes[li++ % 2].cars.push({ f, i, s: 0 })
  })
  lanes.forEach((ln) => ln.cars.forEach((c, k) => (c.s = (k + Math.random() * 0.3) / ln.cars.length)))
  const T0 = Z0 + 40
  const T1 = Z1 - 40
  function update(t, dt) {
    lanes.forEach((ln) => {
      ln.cars.forEach((c) => {
        c.s = (c.s + (ln.v * dt) / (T0 - T1) + 1) % 1
        const z = ln.dir < 0 ? T0 - c.s * (T0 - T1) : T1 + c.s * (T0 - T1)
        const x = B(z) + ln.d
        const sl = slope(z)
        const dz = ln.dir
        const dx = sl * ln.dir
        dummy.position.set(x, 0.9, z)
        dummy.rotation.set(0, Math.atan2(-dz, dx), 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        c.f.im.setMatrixAt(c.i, dummy.matrix)
      })
    })
    fleet.forEach((f) => (f.im.instanceMatrix.needsUpdate = true))
    jets.forEach((j, i) => {
      const k = 0.88 + 0.12 * Math.sin(t * 3.1 + (j.ph || 0) * 1.3 + i)
      j.m.scale.y = k
      j.m.position.y = j.y - (j.base * (1 - k)) / 2
    })
    moored.forEach((m) => {
      m.h.position.y = Math.sin(t * 0.9 + m.ph) * 0.05
      m.h.rotation.z = Math.sin(t * 0.7 + m.ph) * 0.012
    })
  }
  update(0, 0)

  return { update, obstacles: () => obstacles }
}
