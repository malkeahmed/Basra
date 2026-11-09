import * as THREE from 'three'
import { createFleet } from './vehicles.js'
import { makeFlag } from './boats.js'

/*
  ملعب البصرة الدولي («جوهرة الخليج»): ملعب حديث بسعة نحو ٦٥ ألف متفرّج،
  طبقتا مدرّجات بمقاعد زرقاء وبيضاء، سقف أبيض ممتدّ بخيوط فولاذية وواجهة من الزعانف البيضاء،
  أرضية عشب مخطّطة، شاشات ضخمة، وساحة خارجية مع مسابح عاكسة وموقف للسيارات.
*/
export const STAD = { z0: -349, z1: -444, dMin: 8, dMax: 140 }
const sstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
export function stadMask(x, z, rx, hw) {
  if (z > STAD.z0 + 10 || z < STAD.z1 - 10) return 0
  const d = x - (rx + hw)
  const mz = sstep(STAD.z0 + 10, STAD.z0, z) * sstep(STAD.z1 - 10, STAD.z1, z)
  return mz * sstep(STAD.dMin - 2, STAD.dMin + 3, d) * (1 - sstep(STAD.dMax, STAD.dMax + 14, d))
}
export const stadBlend = (h, x, z, rx, hw) => {
  const m = stadMask(x, z, rx, hw)
  return m > 0 ? h * (1 - m) + 0.8 * m : h
}
export const inStad = (x, z, rx, hw, pad = 0.02) => stadMask(x, z, rx, hw) > pad

const rng = (seed) => {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}
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
const seatTex = () =>
  canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, w, h)
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 16; c++) {
        const x = c * 16
        const y = r * 16
        g.fillStyle = 'rgba(0,0,0,.28)'
        g.fillRect(x, y + 14, 16, 2)
        g.fillStyle = 'rgba(0,0,0,.14)'
        g.fillRect(x, y, 1.5, 16)
        g.fillStyle = 'rgba(255,255,255,.35)'
        g.fillRect(x + 2, y + 2, 12, 6)
      }
    /* ممرّ في طرف البلاطة */
    g.fillStyle = 'rgba(255,255,255,.9)'
    g.fillRect(w - 6, 0, 6, h)
  })
function pitchTex() {
  return canvasTex(
    1024,
    672,
    (g, w, h) => {
      const n = 14
      for (let i = 0; i < n; i++) {
        g.fillStyle = i % 2 ? '#3f8f2c' : '#4aa233'
        g.fillRect((i * w) / n, 0, w / n + 1, h)
      }
      for (let i = 0; i < 6000; i++) {
        g.fillStyle = `rgba(20,60,10,${Math.random() * 0.09})`
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2)
      }
      g.strokeStyle = '#f4f4ec'
      g.lineWidth = 5
      const m = 22
      g.strokeRect(m, m, w - 2 * m, h - 2 * m)
      g.beginPath()
      g.moveTo(w / 2, m)
      g.lineTo(w / 2, h - m)
      g.stroke()
      g.beginPath()
      g.arc(w / 2, h / 2, 76, 0, 7)
      g.stroke()
      g.fillStyle = '#f4f4ec'
      g.beginPath()
      g.arc(w / 2, h / 2, 6, 0, 7)
      g.fill()
      ;[0, 1].forEach((k) => {
        const x0 = k ? w - m : m
        const s = k ? -1 : 1
        g.strokeRect(k ? w - m - 170 : m, h / 2 - 190, 170, 380)
        g.strokeRect(k ? w - m - 60 : m, h / 2 - 90, 60, 180)
        g.beginPath()
        g.arc(x0 + s * 114, h / 2, 76, k ? Math.PI * 0.62 : -Math.PI * 0.38, k ? Math.PI * 1.38 : Math.PI * 0.38)
        g.stroke()
        g.beginPath()
        g.arc(x0 + s * 114, h / 2, 5, 0, 7)
        g.fill()
      })
    },
    false
  )
}
function screenTex() {
  const t = canvasTex(
    1024,
    256,
    (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, 0)
      gr.addColorStop(0, '#07294a')
      gr.addColorStop(0.5, '#0c4a7a')
      gr.addColorStop(1, '#07294a')
      g.fillStyle = gr
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#ffffff'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.direction = 'rtl'
      g.font = '700 110px "Reem Kufi","Tajawal",serif'
      g.fillText('ملعب البصرة الدولي', w / 2, h * 0.42)
      g.fillStyle = '#ffd35a'
      g.font = '500 54px "Tajawal",sans-serif'
      g.fillText('جوهرة الخليج', w / 2, h * 0.8)
    },
    false
  )
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => (t.needsUpdate = true))
  return t
}
function signTex() {
  const t = canvasTex(
    2048,
    640,
    (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h)
      gr.addColorStop(0, '#0c3d66')
      gr.addColorStop(1, '#072a49')
      g.fillStyle = gr
      g.fillRect(0, 0, w, h)
      /* شبكة معينات خافتة تذكّر بنسيج الواجهة */
      g.strokeStyle = 'rgba(255,255,255,.06)'
      g.lineWidth = 2
      for (let x = -h; x < w + h; x += 70) {
        g.beginPath()
        g.moveTo(x, 0)
        g.lineTo(x + h, h)
        g.moveTo(x + h, 0)
        g.lineTo(x, h)
        g.stroke()
      }
      const gold = '#e4c27e'
      g.strokeStyle = gold
      g.lineWidth = 8
      g.strokeRect(24, 24, w - 48, h - 48)
      g.lineWidth = 3
      g.strokeRect(46, 46, w - 92, h - 92)
      ;[[46, 46], [w - 46, 46], [46, h - 46], [w - 46, h - 46]].forEach(([x, y]) => {
        g.save()
        g.translate(x, y)
        g.fillStyle = gold
        for (let k = 0; k < 2; k++) {
          g.rotate(Math.PI / 4)
          g.fillRect(-14, -14, 28, 28)
        }
        g.restore()
      })
      /* شعار الملعب: بيضوي بنسيج الأوراق وقبّة مضيئة */
      const emblem = (cx, cy) => {
        g.save()
        g.translate(cx, cy)
        g.strokeStyle = gold
        g.lineWidth = 6
        g.beginPath()
        g.arc(0, 0, 112, 0, Math.PI * 2)
        g.stroke()
        g.lineWidth = 3
        g.beginPath()
        g.arc(0, 0, 98, 0, Math.PI * 2)
        g.stroke()
        /* القرص */
        g.fillStyle = '#f6f2e6'
        g.beginPath()
        g.ellipse(0, -8, 74, 26, 0, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = '#2f9a52'
        g.beginPath()
        g.ellipse(0, -10, 40, 10, 0, 0, Math.PI * 2)
        g.fill()
        /* الواجهة المنسوجة */
        g.strokeStyle = '#f6f2e6'
        g.lineWidth = 5
        for (let r = 0; r < 3; r++) {
          const y = 14 + r * 15
          for (let i = -3; i <= 3; i++) {
            g.beginPath()
            g.ellipse(i * 22 + (r % 2 ? 11 : 0), y, 14, 6, 0, 0, Math.PI * 2)
            g.stroke()
          }
        }
        g.restore()
      }
      emblem(250, h / 2)
      emblem(w - 250, h / 2)
      /* العنوان */
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.direction = 'rtl'
      g.shadowColor = 'rgba(0,0,0,.5)'
      g.shadowBlur = 12
      g.shadowOffsetY = 5
      const tg = g.createLinearGradient(0, 120, 0, 300)
      tg.addColorStop(0, '#fff3cf')
      tg.addColorStop(0.55, '#e4c27e')
      tg.addColorStop(1, '#b98f4a')
      g.fillStyle = tg
      g.font = '700 168px "Reem Kufi","Tajawal",serif'
      g.fillText('ملعب البصرة الدولي', w / 2, 230)
      g.shadowBlur = 0
      g.shadowOffsetY = 0
      /* فاصل بقطرة وألماسة */
      g.strokeStyle = gold
      g.lineWidth = 4
      g.beginPath()
      g.moveTo(520, 352)
      g.lineTo(w / 2 - 40, 352)
      g.moveTo(w / 2 + 40, 352)
      g.lineTo(w - 520, 352)
      g.stroke()
      g.save()
      g.translate(w / 2, 352)
      g.rotate(Math.PI / 4)
      g.fillStyle = gold
      g.fillRect(-14, -14, 28, 28)
      g.restore()
      g.fillStyle = '#ffffff'
      g.font = '500 92px "Tajawal",sans-serif'
      g.fillText('جوهرة الخليج', w / 2, 438)
      g.fillStyle = gold
      g.direction = 'ltr'
      g.font = '600 54px "Tajawal",sans-serif'
      if ('letterSpacing' in g) g.letterSpacing = '16px'
      g.fillText('BASRA INTERNATIONAL STADIUM', w / 2, 540)
    },
    false
  )
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => (t.needsUpdate = true))
  return t
}

function plazaTex() {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#e9e1cf'
    g.fillRect(0, 0, 256, 256)
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        g.fillStyle = (x + y) % 2 ? '#e2d8c0' : '#efe8d8'
        g.fillRect(x * 64 + 1.5, y * 64 + 1.5, 61, 61)
      }
    for (let i = 0; i < 2200; i++) {
      g.fillStyle = `rgba(90,70,40,${Math.random() * 0.06})`
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
    }
  })
}
function lotTex() {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#3b3c40'
    g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 4000; i++) {
      const v = 44 + Math.random() * 36
      g.fillStyle = `rgba(${v},${v},${v + 4},${Math.random() * 0.4})`
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
    }
    g.fillStyle = '#e8e6dc'
    for (let i = 0; i <= 8; i++) g.fillRect(i * 32 - 1, 20, 3, 100)
    for (let i = 0; i <= 8; i++) g.fillRect(i * 32 - 1, 136, 3, 100)
  })
}

export function createStadium(scene, { riverX, halfW, terrainH, low = false, plantPalms }) {
  const root = new THREE.Group()
  scene.add(root)
  const B = (z) => riverX(z) + halfW(z)
  const slope = (z) => (B(z - 1.5) - B(z + 1.5)) / -3
  const toRiver = (z) => Math.atan2(-1, slope(z))
  const GY = 0.8
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, ...o })
  const dummy = new THREE.Object3D()
  const anim = []
  const P = (z, d, y = GY) => new THREE.Vector3(B(z) + d, y, z)

  /* ---- الساحة الخارجية ---- */
  {
    const n = 36
    const pos = []
    const uv = []
    const idx = []
    const d0 = STAD.dMin
    const d1 = STAD.dMax
    for (let i = 0; i <= n; i++) {
      const z = STAD.z0 + ((STAD.z1 - STAD.z0) * i) / n
      pos.push(B(z) + d0, GY + 0.03, z, B(z) + d1, GY + 0.03, z)
      uv.push(0, (STAD.z0 - z) / 12, (d1 - d0) / 12, (STAD.z0 - z) / 12)
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
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: plazaTex(), roughness: 0.9, side: THREE.DoubleSide }))
    m.receiveShadow = true
    root.add(m)
  }

  const ZC = -397
  const DC = 74
  const C = P(ZC, DC)
  const bowl = new THREE.Group()
  bowl.position.copy(C)
  bowl.rotation.y = toRiver(ZC)
  bowl.scale.setScalar(0.48)
  root.add(bowl)

  const AP = 27 /* نصف طول أرض الملعب على امتداد الضفة */
  const BP = 17.5 /* نصف عرضها */
  const NSE = 2.0
  const se = (th, A, Bz) => {
    const c = Math.cos(th)
    const s = Math.sin(th)
    return [A * Math.sign(c) * Math.pow(Math.abs(c), 2 / NSE), Bz * Math.sign(s) * Math.pow(Math.abs(s), 2 / NSE)]
  }
  const ringPt = (th, off, y) => {
    const [x, z] = se(th, AP + off, BP + off)
    return new THREE.Vector3(x, y, z)
  }

  /* شريط حلقي: مقطع (offset,y) يُمسح حول الملعب */
  function band(profile, { N = low ? 96 : 160, rep = 24, colors, vRep = 1 } = {}) {
    const pos = []
    const uv = []
    const col = []
    const idx = []
    let base = 0
    for (let k = 0; k < profile.length - 1; k++) {
      const [s0, y0] = profile[k]
      const [s1, y1] = profile[k + 1]
      const segLen = Math.hypot(s1 - s0, y1 - y0)
      const cc = colors ? colors[Math.min(k, colors.length - 1)] : [1, 1, 1]
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2
        const a = ringPt(th, s0, y0)
        const b = ringPt(th, s1, y1)
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z)
        uv.push((i / N) * rep, 0, (i / N) * rep, (segLen / 2.4) * vRep)
        col.push(...cc, ...cc)
        if (i < N) {
          const q = base + i * 2
          idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3)
        }
      }
      base += (N + 1) * 2
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }
  const lin = (hex) => {
    const c = new THREE.Color(hex)
    return [c.r, c.g, c.b]
  }

  /* أرض الملعب */
  {
    const pt = pitchTex()
    const pitch = new THREE.Mesh(new THREE.PlaneGeometry(AP * 2 + 6, BP * 2 + 6), new THREE.MeshStandardMaterial({ map: pt, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }))
    pitch.rotation.x = -Math.PI / 2
    pitch.position.y = 0.5
    pitch.receiveShadow = true
    bowl.add(pitch)
    /* مرميان */
    ;[-1, 1].forEach((sd) => {
      const gx = sd * (AP + 3)
      const gm = std(0xf4f4ec, { metalness: 0.2 })
      ;[-1.8, 1.8].forEach((zz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 8), gm)
        post.position.set(gx, 1.3, zz)
        bowl.add(post)
      })
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.7, 8), gm)
      bar.rotation.x = Math.PI / 2
      bar.position.set(gx, 2.1, 0)
      bowl.add(bar)
      const net = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 3.6), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35 }))
      net.position.set(gx + sd * 0.9, 1.34, 0)
      bowl.add(net)
    })
  }

  /* المدرّجات: سور اللوحات ثم الطبقة السفلى الحمراء ثم الممشى ثم الطبقة العليا الخضراء */
  const st = seatTex()
  const seatMat = new THREE.MeshStandardMaterial({ map: st, vertexColors: true, roughness: 0.82, side: THREE.DoubleSide })
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xcfc8b6, roughness: 0.9, side: THREE.DoubleSide })
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.6, side: THREE.DoubleSide })
  {
    const lowerC = lin(0xb4302a)
    const upperC = lin(0x2f9a52)
    const lower = new THREE.Mesh(band([[3.5, 0.25], [4.2, 2.3]], { rep: 1, colors: [lin(0xffffff)] }), wallMat)
    bowl.add(lower)
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x0a2540, emissive: 0x2a8fff, emissiveIntensity: 1.1, roughness: 0.4 })
    const led = new THREE.Mesh(band([[3.35, 0.2], [3.35, 1.2]], { rep: 1 }), ledMat)
    bowl.add(led)
    anim.push((t) => ledMat.emissive.setHSL(0.58 + 0.08 * Math.sin(t * 0.5), 0.9, 0.5))
    const t1 = new THREE.Mesh(band([[4.2, 2.3], [15.5, 8.4]], { rep: 28, colors: [lowerC] }), seatMat)
    t1.receiveShadow = true
    bowl.add(t1)
    bowl.add(new THREE.Mesh(band([[15.5, 8.4], [15.5, 9.4], [20.5, 9.4]], { rep: 1 }), deckMat))
    const t2 = new THREE.Mesh(band([[20.5, 9.8], [36, 19.6]], { rep: 36, colors: [upperC] }), seatMat)
    t2.receiveShadow = true
    bowl.add(t2)
    bowl.add(new THREE.Mesh(band([[15.5, 8.4], [15.5, 9.4]], { rep: 1 }), wallMat))
    bowl.add(new THREE.Mesh(band([[3.5, 0.2], [20, 0.2]], { rep: 1 }), deckMat))
    bowl.add(new THREE.Mesh(band([[15.5, 8.4], [15.5, 0.2]], { rep: 1, colors: [lin(0xa8a395)] }), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide })))
    bowl.add(new THREE.Mesh(band([[36, 19.6], [41, 19.6], [41, 0.2]], { rep: 1, colors: [lin(0xe8e4d8), lin(0xe8e4d8)] }), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide })))
  }

  /* الواجهة المنسوجة: أوراق سعف بيضاء طويلة ومدببة تتقاطع بميل متبادل في طبقتين، والواجهة أضيق عند القاعدة */
  {
    const lensShape = new THREE.Shape()
    lensShape.moveTo(-1, 0)
    lensShape.quadraticCurveTo(-0.2, 1.25, 1, 0)
    lensShape.quadraticCurveTo(-0.2, -1.25, -1, 0)
    const lensGeo = new THREE.ExtrudeGeometry(lensShape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.28, bevelSize: 0.03, bevelSegments: 2, curveSegments: 16 })
    lensGeo.translate(0, 0, -0.25)
    const back = new THREE.Mesh(band([[41.5, 3.4], [48.6, 22.0]], { rep: 1 }), new THREE.MeshStandardMaterial({ color: 0x141b1b, roughness: 0.9, side: THREE.DoubleSide }))
    bowl.add(back)
    const rows = 6
    const perRow = low ? 34 : 44
    const layers = 1
    const lens = new THREE.InstancedMesh(lensGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38, metalness: 0.06 }), rows * perRow * layers)
    lens.castShadow = !low
    lens.receiveShadow = !low
    const q = new THREE.Quaternion()
    const m4 = new THREE.Matrix4()
    const tg = new THREE.Vector3()
    const nrm = new THREE.Vector3()
    const upv = new THREE.Vector3(0, 1, 0)
    let k = 0
    for (let layer = 0; layer < layers; layer++)
      for (let r = 0; r < rows; r++) {
        const y = 5.2 + r * 3.1
        const off = 41.4 + (y - 5.2) * 0.46 - layer * 0.0 + (layer ? -1.2 : 0.4)
        const tilt = (r % 2 ? 1 : -1) * 0.07
        for (let i = 0; i < perRow; i++) {
          const th = ((i + (r % 2 ? 0.5 : 0)) / perRow) * Math.PI * 2
          const p = ringPt(th, off, y)
          const p2 = ringPt(th + 0.004, off, y)
          nrm.set(p2.z - p.z, 0, -(p2.x - p.x)).normalize()
          if (nrm.x * p.x + nrm.z * p.z < 0) nrm.negate()
          /* يميل السطح مع ميل الواجهة إلى الخارج */
          nrm.y = 0.5
          nrm.normalize()
          const tgx = new THREE.Vector3(nrm.z, 0, -nrm.x).normalize()
          tg.copy(tgx)
          const up2 = nrm.clone().cross(tg)
          q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(tg, up2, nrm))
          q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), tilt))
          m4.compose(p, q, new THREE.Vector3(7.0, 3.3, 1.5))
          lens.setMatrixAt(k, m4)
          lens.setColorAt(k++, new THREE.Color().setHSL(0.11, 0.1, 0.92 + ((i * 37 + r * 11 + layer * 5) % 7) * 0.011))
        }
      }
    bowl.add(lens)
    /* أعمدة خرسانية قصيرة في القاعدة */
    const NC = low ? 36 : 64
    const cols = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.8, 1.0, 4.4, 14), std(0xd2cec2, { roughness: 0.8 }), NC)
    for (let i = 0; i < NC; i++) {
      const th = (i / NC) * Math.PI * 2
      const p = ringPt(th, 41.8, 2.2)
      dummy.position.copy(p)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      cols.setMatrixAt(i, dummy.matrix)
    }
    cols.castShadow = !low
    bowl.add(cols)
    bowl.add(new THREE.Mesh(band([[40, 1.2], [56, 1.2]], { rep: 1 }), new THREE.MeshStandardMaterial({ color: 0xdedacc, roughness: 0.9, side: THREE.DoubleSide })))
    bowl.add(new THREE.Mesh(band([[56, 0.3], [56, 1.2]], { rep: 1 }), new THREE.MeshStandardMaterial({ color: 0xc6c1b0, roughness: 0.9, side: THREE.DoubleSide })))
  }

  /* السقف: قرص كبير شبه مسطّح بحافة سميكة بيضاء، خطوط شعاعية رفيعة، وحلقة زجاجية فيروزية عريضة حول الفتحة */
  {
    const roofTex = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#d9d4c6'
      g.fillRect(0, 0, w, h)
      g.fillStyle = 'rgba(255,255,255,.28)'
      g.fillRect(6, 0, w - 12, h)
      g.fillStyle = 'rgba(255,255,255,.55)'
      g.fillRect(w * 0.5 - 1, 0, 2, h)
      g.fillStyle = 'rgba(95,88,72,.4)'
      g.fillRect(0, 0, 2, h)
      g.fillRect(w - 2, 0, 2, h)
      for (let i = 0; i < 1800; i++) {
        g.fillStyle = `rgba(100,90,70,${Math.random() * 0.05})`
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2)
      }
    })
    const roofTop = new THREE.Mesh(band([[53, 22.0], [50, 23.3], [19, 25.7]], { rep: 48, vRep: 0.22 }), new THREE.MeshStandardMaterial({ map: roofTex, color: 0xffffff, roughness: 0.6, side: THREE.DoubleSide }))
    roofTop.castShadow = !low
    bowl.add(roofTop)
    bowl.add(new THREE.Mesh(band([[50, 22.4], [19, 24.6]], { rep: 1 }), new THREE.MeshStandardMaterial({ color: 0xb9b4a4, roughness: 0.85, side: THREE.DoubleSide })))
    /* حافّة سميكة */
    bowl.add(new THREE.Mesh(band([[53, 20.6], [53, 22.0]], { rep: 1 }), new THREE.MeshStandardMaterial({ color: 0xf7f4ea, roughness: 0.45, side: THREE.DoubleSide })))
    bowl.add(new THREE.Mesh(band([[53, 20.6], [50, 22.4]], { rep: 1 }), new THREE.MeshStandardMaterial({ color: 0xcfcab9, roughness: 0.8, side: THREE.DoubleSide })))
    /* شريط إضاءة فيروزي تحت حافة السقف */
    bowl.add(new THREE.Mesh(band([[50.6, 21.0], [50.6, 21.5]], { rep: 1 }), new THREE.MeshStandardMaterial({ color: 0x1b8f93, emissive: 0x57e0d4, emissiveIntensity: 1.5, side: THREE.DoubleSide })))
    /* حلقة زجاجية فيروزية مائلة نحو الداخل */
    bowl.add(new THREE.Mesh(band([[19, 25.7], [14.6, 23.2]], { rep: 1 }), new THREE.MeshStandardMaterial({ color: 0x55c4bd, emissive: 0x0f6a70, emissiveIntensity: 0.5, roughness: 0.1, metalness: 0.55, side: THREE.DoubleSide })))
    bowl.add(new THREE.Mesh(band([[19.3, 25.7], [19, 25.95]], { rep: 1 }), new THREE.MeshStandardMaterial({ color: 0xf7f4ea, roughness: 0.4, side: THREE.DoubleSide })))
    /* خطوط شعاعية بارزة خفيفة */
    const NR = 36
    const ribs = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.12, 0.28), std(0xf6f3ea, { roughness: 0.5 }), NR)
    for (let i = 0; i < NR; i++) {
      const th = (i / NR) * Math.PI * 2
      const a2 = ringPt(th, 50.2, 23.35)
      const b2 = ringPt(th, 19.8, 25.78)
      const mid = a2.clone().add(b2).multiplyScalar(0.5)
      dummy.position.copy(mid)
      dummy.lookAt(b2)
      dummy.rotateY(Math.PI / 2)
      dummy.scale.set(a2.distanceTo(b2), 1, 1)
      dummy.updateMatrix()
      ribs.setMatrixAt(i, dummy.matrix)
    }
    dummy.scale.set(1, 1, 1)
    dummy.rotation.set(0, 0, 0)
    bowl.add(ribs)
    const NL = low ? 40 : 80
    const lights = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.3, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff6dc }), NL)
    for (let i = 0; i < NL; i++) {
      const th = (i / NL) * Math.PI * 2
      const p = ringPt(th, 17, 24.2)
      const q2 = ringPt(th + 0.01, 17, 24.2)
      dummy.position.copy(p)
      dummy.rotation.set(0, Math.atan2(-(q2.z - p.z), q2.x - p.x), 0)
      dummy.updateMatrix()
      lights.setMatrixAt(i, dummy.matrix)
    }
    dummy.rotation.set(0, 0, 0)
    bowl.add(lights)
  }

  /* خندق مائي حول الملعب مع أربعة جسور مشاة شعاعية */
  {
    const moat = new THREE.Mesh(band([[56, 0.55], [70, 0.55]], { rep: 1 }), new THREE.MeshStandardMaterial({ color: 0x1f7f86, roughness: 0.08, metalness: 0.45, emissive: 0x0a3e44, emissiveIntensity: 0.35, side: THREE.DoubleSide }))
    bowl.add(moat)
    const edgeOut = new THREE.Mesh(band([[70, 0.2], [70, 1.1], [72.5, 1.1]], { rep: 1 }), new THREE.MeshStandardMaterial({ color: 0xd8d3c2, roughness: 0.9, side: THREE.DoubleSide }))
    bowl.add(edgeOut)
    ;[0.25, 0.75, 1.25, 1.75].forEach((q) => {
      const th = q * Math.PI
      const a = ringPt(th, 54, 1.25)
      const b = ringPt(th, 74, 1.25)
      const mid = a.clone().add(b).multiplyScalar(0.5)
      const L = a.distanceTo(b)
      const yaw = Math.atan2(-(b.z - a.z), b.x - a.x)
      const deck = new THREE.Mesh(new THREE.BoxGeometry(L, 0.5, 10), std(0xe0dccf, { roughness: 0.85 }))
      deck.position.copy(mid)
      deck.rotation.y = yaw
      bowl.add(deck)
      ;[-1, 1].forEach((sd) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(L, 0.9, 0.35), std(0xf4f1e6, { roughness: 0.7 }))
        rail.position.set(mid.x + Math.sin(yaw) * sd * 4.9, 1.9, mid.z + Math.cos(yaw) * sd * 4.9)
        rail.rotation.y = yaw
        bowl.add(rail)
      })
    })
  }

  /* الشاشات الكبيرة في طرفي الملعب */
  {
    const tex = screenTex()
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.3 })
    ;[-1, 1].forEach((sd) => {
      const sc = new THREE.Mesh(new THREE.BoxGeometry(2.2, 6.4, 22), mat)
      sc.position.set(sd * (AP + 24.5), 18, 0)
      /* وجه الشاشة نحو الملعب */
      sc.rotation.y = 0
      bowl.add(sc)
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 7.0, 23), std(0x222426, { metalness: 0.5 }))
      frame.position.set(sd * (AP + 24.9), 18, 0)
      bowl.add(frame)
    })
  }

  /* المتفرّجون: مكعبات ملوّنة موزّعة على المقاعد بنسبة امتلاء عالية */
  {
    const cols = [0xd0252d, 0xf4f4f0, 0x1a1a1a, 0x1f9a4a, 0xf0d34a, 0x2a78b8]
    const NS = low ? 700 : 2200
    const crowd = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 1.0, 0.45), new THREE.MeshStandardMaterial({ roughness: 0.85 }), NS)
    const r = rng(123)
    const cc = new THREE.Color()
    for (let i = 0; i < NS; i++) {
      const upper = r() > 0.42
      const th = r() * Math.PI * 2
      const u = r()
      const off = upper ? 21 + u * 14.4 : 5.2 + u * 9.8
      const y = upper ? 9.8 + ((off - 20.5) / 15.5) * 9.8 + 0.5 : 2.3 + ((off - 4.2) / 11.3) * 6.1 + 0.5
      const p = ringPt(th, off, y)
      const q = ringPt(th + 0.01, off, y)
      dummy.position.copy(p)
      dummy.rotation.set(0, Math.atan2(-(q.z - p.z), q.x - p.x), 0)
      dummy.scale.set(1, 0.9 + r() * 0.3, 1)
      dummy.updateMatrix()
      crowd.setMatrixAt(i, dummy.matrix)
      crowd.setColorAt(i, cc.setHex(cols[Math.floor(r() * cols.length)]))
    }
    dummy.scale.set(1, 1, 1)
    dummy.rotation.set(0, 0, 0)
    bowl.add(crowd)
  }

  /* ---- اللافتة الأمامية ---- */
  {
    const g = new THREE.Group()
    const white = std(0xf4f1e8, { roughness: 0.4 })
    const goldM = std(0xcaa25a, { metalness: 0.75, roughness: 0.3 })
    const navy = std(0x0b3558, { roughness: 0.5 })
    const stone = std(0xd7d0bd, { roughness: 0.9 })
    /* قاعدة حجرية ودرجة */
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(31, 0.7, 5.4), stone)
    b1.position.y = 0.35
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(28.6, 0.7, 4.4), white)
    b2.position.y = 1.05
    g.add(b1, b2)
    /* عمودان منحوتان بتيجان ذهبية ومصابيح */
    ;[-1, 1].forEach((sd) => {
      const x = sd * 12.2
      const col = new THREE.Mesh(new THREE.BoxGeometry(2.2, 14.2, 2.2), white)
      col.position.set(x, 8.1, 0)
      col.castShadow = !low
      g.add(col)
      ;[-0.6, 0.6].forEach((o) => {
        const gr = new THREE.Mesh(new THREE.BoxGeometry(0.14, 9.6, 0.08), goldM)
        gr.position.set(x + o, 7.4, 1.14)
        g.add(gr)
      })
      const band = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 2.5), goldM)
      band.position.set(x, 2.6, 0)
      const band2 = band.clone()
      band2.position.y = 13.6
      const cap = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.5, 3.0), stone)
      cap.position.set(x, 15.4, 0)
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.75, 18, 14), new THREE.MeshStandardMaterial({ color: 0xfff3d4, emissive: 0xffe0a0, emissiveIntensity: 1.2 }))
      glow.position.set(x, 16.3, 0)
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.8, 8), goldM)
      fin.position.set(x, 17.4, 0)
      g.add(band, band2, cap, glow, fin)
    })
    /* جسم اللوحة: صندوق عريض بإطار ذهبي، ووجه مضيء */
    const st2 = signTex()
    const face = new THREE.MeshStandardMaterial({ map: st2, emissiveMap: st2, emissive: 0xffffff, emissiveIntensity: 0.62, roughness: 0.45 })
    const board = new THREE.Mesh(new THREE.BoxGeometry(21.6, 6.8, 0.7), [navy, navy, navy, navy, face, navy])
    board.position.set(0, 10.2, 0)
    g.add(board)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(22.8, 7.6, 0.5), goldM)
    frame.position.set(0, 10.2, -0.22)
    g.add(frame)
    /* جدار حجري تحت اللوحة يصل بين العمودين */
    const under = new THREE.Mesh(new THREE.BoxGeometry(21.8, 5.4, 1.4), white)
    under.position.set(0, 4.3, 0)
    g.add(under)
    const underBand = new THREE.Mesh(new THREE.BoxGeometry(22.2, 0.35, 1.7), goldM)
    underBand.position.set(0, 7.2, 0)
    g.add(underBand)
    /* لوحة سفلية صغيرة بنقش الأوراق */
    const plaqueTex = canvasTex(
      1024,
      256,
      (c, w, h) => {
        c.fillStyle = '#f4f1e8'
        c.fillRect(0, 0, w, h)
        c.strokeStyle = '#c7a35f'
        c.lineWidth = 3
        for (let r = 0; r < 4; r++)
          for (let i = -1; i < 14; i++) {
            c.beginPath()
            c.ellipse(i * 80 + (r % 2 ? 40 : 0), 32 + r * 64, 46, 20, 0, 0, Math.PI * 2)
            c.stroke()
          }
      },
      false
    )
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(21.2, 4.2), new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.6 }))
    plaque.position.set(0, 4.3, 0.72)
    g.add(plaque)
    /* كشّافات أرضية تضيء اللوحة من الأسفل */
    ;[-7.5, -2.5, 2.5, 7.5].forEach((x) => {
      const fl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.5, 10), std(0x2b2d30, { metalness: 0.6 }))
      fl.position.set(x, 1.55, 2.1)
      fl.rotation.x = -0.5
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), new THREE.MeshBasicMaterial({ color: 0xfff1cf }))
      lens.position.set(x, 1.68, 2.36)
      lens.rotation.x = -0.5
      g.add(fl, lens)
    })
    /* أحواض نباتية وزهور على جانبي القاعدة */
    ;[-1, 1].forEach((sd) => {
      const bed = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.55, 2.2), std(0x4a7a2a, { roughness: 1, metalness: 0 }))
      bed.position.set(sd * 8.6, 0.28, 3.4)
      g.add(bed)
      const cols = [0xd8402f, 0xf0c53a, 0xf4f0e6, 0xe36aa0]
      for (let i = 0; i < 16; i++) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5), std(cols[i % 4], { roughness: 0.6, metalness: 0 }))
        f.position.set(sd * 8.6 - 3.4 + i * 0.45, 0.7, 3.4 + (((i * 7) % 5) - 2) * 0.3)
        g.add(f)
      }
    })
    /* مسبح عاكس أمام اللوحة */
    const pool = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 4.4), stone)
    pool.position.set(0, 0.2, 3.9)
    g.add(pool)
    const water = new THREE.Mesh(new THREE.BoxGeometry(13, 0.1, 3.4), new THREE.MeshStandardMaterial({ color: 0x2f9fb8, roughness: 0.06, metalness: 0.45, emissive: 0x0a4a5a, emissiveIntensity: 0.32 }))
    water.position.set(0, 0.42, 3.9)
    g.add(water)
    g.position.copy(P(-358, 20))
    g.rotation.y = toRiver(-358)
    g.scale.setScalar(0.92)
    root.add(g)
  }

  {
    const lampList = []
    for (let z = -356; z > -442; z -= 14) {
      lampList.push([z, 22])
      lampList.push([z, 122])
    }
    const n = lampList.length
    const mt = std(0x2b2d30, { metalness: 0.6, roughness: 0.4 })
    const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.3, 14, 10), mt, n)
    const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 0.35, 0.9), new THREE.MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffe9b0, emissiveIntensity: 1 }), n)
    lampList.forEach(([z, d], i) => {
      const p = P(z, d)
      dummy.position.set(p.x, GY + 7, p.z)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      poles.setMatrixAt(i, dummy.matrix)
      dummy.position.set(p.x, GY + 14.1, p.z)
      dummy.rotation.set(0, toRiver(z), 0)
      dummy.updateMatrix()
      heads.setMatrixAt(i, dummy.matrix)
    })
    dummy.rotation.set(0, 0, 0)
    root.add(poles, heads)
  }

  /* أعلام وسواري على حافة الساحة المطلّة على النهر */
  ;[-372, -384, -410, -424, -436].forEach((z, i) => {
    const f = makeFlag(0.55, 11)
    f.position.copy(P(z, 12))
    f.rotation.y = toRiver(z) + Math.PI / 2
    root.add(f)
    void i
  })

  /* موقف السيارات الجنوبي والغربي */
  {
    const lt = lotTex()
    const lotM = new THREE.MeshStandardMaterial({ map: lt, roughness: 0.9 })
    const lots = [
      [-356, 122, 22, 32],
      [-438, 122, 22, 32],
    ]
    lots.forEach(([zc, dc, wz, wd]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(wd, 0.1, wz), lotM)
      m.material.map.repeat.set(wd / 20, wz / 20)
      m.position.copy(P(zc, dc, GY + 0.02))
      m.rotation.y = toRiver(zc) + Math.PI / 2
      root.add(m)
    })
    const fleet = createFleet({ sedan: 26, suv: 14, minibus: 3, pickup: 4 })
    const r = rng(9)
    const slots = []
    lots.forEach(([zc, dc, wz, wd]) => {
      for (let row = 0; row < 2; row++)
        for (let k = 0; k < 8; k++) {
          const lz = zc + (row ? 6.5 : -6.5)
          const ld = dc - wd / 2 + 3 + k * 3.7
          slots.push([lz, ld, row])
        }
    })
    let si = 0
    fleet.forEach((f) => {
      root.add(f.im)
      let placed = 0
      for (let i = 0; i < f.n && si < slots.length; i++, si++) {
        placed++
        const [lz, ld, row] = slots[si]
        if (r() < 0.22) {
          dummy.scale.setScalar(0)
        } else dummy.scale.setScalar(1)
        dummy.position.copy(P(lz, ld, GY + 0.05))
        dummy.rotation.set(0, toRiver(lz) + (row ? Math.PI : 0), 0)
        dummy.updateMatrix()
        f.im.setMatrixAt(i, dummy.matrix)
      }
      /* السيارات الفائضة عن المواقف: تُخفى بدل أن تبقى عند مركز المشهد فوق الماء */
      for (let i = placed; i < f.n; i++) {
        dummy.position.set(0, -500, 0)
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        f.im.setMatrixAt(i, dummy.matrix)
      }
      f.im.instanceMatrix.needsUpdate = true
    })
    dummy.scale.set(1, 1, 1)
  }

  /* نخيل زينة على أطراف الساحة */
  {
    const list = []
    bowl.updateMatrixWorld(true)
    for (let i = 0; i < 8; i++) {
      const w = bowl.localToWorld(ringPt(((i + 0.5) / 8) * Math.PI * 2, 80, 0))
      list.push({ x: w.x, y: GY - 0.05, z: w.z, s: 0.9 + ((i * 7) % 5) * 0.07 })
    }
    const r = rng(31)
    for (let z = -352; z > -442; z -= 10) {
      list.push({ x: B(z) + 134 + (r() - 0.5), y: GY - 0.1, z, s: 1 + r() * 0.3 })
    }
    for (let d = 30; d < 130; d += 14) {
      list.push({ x: B(-350) + d, y: GY - 0.1, z: -351, s: 1 + r() * 0.3 })
      list.push({ x: B(-443) + d, y: GY - 0.1, z: -443, s: 1 + r() * 0.3 })
    }
    if (plantPalms) plantPalms(list)
  }

  function update(t) {
    anim.forEach((f) => f(t))
  }
  update(0)
  return { update }
}
