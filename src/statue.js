import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildHeadGeometry, buildHangingHandGeometry, buildFistHandGeometry } from './sculpt.js'

/*
  تمثال بدر شاكر السيّاب على كورنيش شطّ العرب: برونز مصبوب بمعطف وربطة عنق ويد ممدودة نحو النهر،
  على قاعدة رخام بنفسجي معرّق مع لوحة عربية، وساحة مرصوفة وسياج أخضر وأعمدة إنارة ومكتبة صغيرة.
*/

export const PLAZA = { zs: -262, z0: -243, z1: -281, depth: 38 }
const sstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const rng = (seed) => {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

export function plazaMask(x, z, rx, hw) {
  if (z > PLAZA.z0 + 8 || z < PLAZA.z1 - 8) return 0
  const d = rx - hw - x
  const mz = sstep(PLAZA.z0 + 8, PLAZA.z0, z) * sstep(PLAZA.z1 - 8, PLAZA.z1, z)
  const lat = sstep(-1.2, 0.4, d) * (1 - sstep(PLAZA.depth + 2, PLAZA.depth + 14, d))
  return mz * lat
}
export function plazaBlend(h, x, z, rx, hw) {
  const m = plazaMask(x, z, rx, hw)
  return m > 0 ? h * (1 - m) + 0.55 * m : h
}
export function inPlaza(x, z, rx, hw, pad = 0.02) {
  return plazaMask(x, z, rx, hw) > pad
}

/* ---------- خامات ---------- */
function marbleTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = '#5a2833'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 40; i++) {
    const gr = g.createRadialGradient(Math.random() * 512, Math.random() * 512, 0, Math.random() * 512, Math.random() * 512, 90 + Math.random() * 120)
    gr.addColorStop(0, `rgba(${120 + Math.random() * 60},${60 + Math.random() * 40},${80 + Math.random() * 50},.25)`)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, 512, 512)
  }
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = `rgba(${200 + Math.random() * 40},${190 + Math.random() * 40},${200 + Math.random() * 40},${0.25 + Math.random() * 0.4})`
    g.lineWidth = 0.6 + Math.random() * 2.2
    g.beginPath()
    let x = Math.random() * 512
    let y = Math.random() * 512
    g.moveTo(x, y)
    for (let k = 0; k < 14; k++) {
      x += (Math.random() - 0.35) * 70
      y += (Math.random() - 0.5) * 50
      g.lineTo(x, y)
    }
    g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
function stoneTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = '#d9d3c6'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 6000; i++) {
    const v = 190 + Math.random() * 50
    g.fillStyle = `rgba(${v},${v - 6},${v - 18},${Math.random() * 0.4})`
    g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2)
  }
  g.fillStyle = 'rgba(90,82,68,.55)'
  for (let x = 0; x < 512; x += 128) g.fillRect(x, 0, 3, 512)
  for (let y = 0; y < 512; y += 128) g.fillRect(0, y, 512, 3)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
function textTexture(lines, bg, w = 1024, h = 640, border = '#3a2a1a') {
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
    if (border) {
      g.strokeStyle = border
      g.lineWidth = 10
      g.strokeRect(14, 14, w - 28, h - 28)
      g.lineWidth = 3
      g.strokeRect(34, 34, w - 68, h - 68)
    }
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    lines.forEach((l) => {
      g.fillStyle = l.color || '#2a1f12'
      g.font = l.font
      g.direction = 'rtl'
      g.fillText(l.text, w / 2, l.y)
    })
    tex.needsUpdate = true
  }
  draw()
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('700 120px "Reem Kufi"'), document.fonts.load('500 60px "Tajawal"')]).then(draw).catch(() => {})
  }
  return tex
}

/* ---------- التمثال الحقيقي: قصّ من الصورة + نفخ ثلاثي الأبعاد من قناع الظل ---------- */
function loadImage(url) {
  return new Promise((res, rej) => {
    const im = new Image()
    im.onload = () => res(im)
    im.onerror = rej
    im.src = url
  })
}
async function buildRelief(parent, env, { height = 6.3, maxDepth = 0.36, castShadow = true } = {}) {
  const [colorImg, depthImg, normImg] = await Promise.all([loadImage('./assets/sayyab-statue.png'), loadImage('./assets/sayyab-depth.png'), loadImage('./assets/sayyab-normal.png')])
  const w = colorImg.width
  const h = colorImg.height
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const cx = cv.getContext('2d', { willReadFrequently: true })
  cx.imageSmoothingEnabled = true
  cx.drawImage(depthImg, 0, 0, w, h)
  const dd = cx.getImageData(0, 0, w, h).data
  const sc = height / h
  const step = 6
  const nx = Math.floor((w - 1) / step) + 1
  const ny = Math.floor((h - 1) / step) + 1
  const pos = new Float32Array(nx * ny * 3)
  const uv = new Float32Array(nx * ny * 2)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const px = Math.min(i * step, w - 1)
      const py = Math.min(j * step, h - 1)
      const d = dd[(py * w + px) * 4] / 255
      const k = (j * nx + i) * 3
      pos[k] = (px - w / 2) * sc
      pos[k + 1] = (h - py) * sc
      pos[k + 2] = Math.pow(d, 0.78) * maxDepth
      uv[(j * nx + i) * 2] = px / (w - 1)
      uv[(j * nx + i) * 2 + 1] = 1 - py / (h - 1)
    }
  }
  const idx = []
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i
      idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geo.setIndex(idx)
  geo.computeVertexNormals()

  const tex = new THREE.Texture(colorImg)
  tex.needsUpdate = true
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const dtex = new THREE.Texture(depthImg)
  dtex.needsUpdate = true
  const ntex = new THREE.Texture(normImg)
  ntex.needsUpdate = true
  ntex.anisotropy = 8

  /* الواجهة: الصورة الحقيقية للبرونز + انعكاسات خفيفة */
  const front = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map: tex,
      color: 0x8a7868,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 0.62,
      metalness: 0.55,
      roughness: 0.42,
      envMap: env,
      envMapIntensity: 0.7,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    })
  )
  front.castShadow = castShadow
  /* الظهر: برونز داكن */
  const back = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0x1d1814, metalness: 0.7, roughness: 0.45, envMap: env, envMapIntensity: 0.8, alphaMap: dtex, alphaTest: 0.05, side: THREE.DoubleSide })
  )
  back.scale.z = -1
  back.castShadow = castShadow
  const g = new THREE.Group()
  g.add(front, back)
  parent.add(g)
  return g
}

/* ---------- الساحة والتمثال ---------- */
export function createStatuePlaza(scene, { riverX, halfW, renderer, low = false }) {
  const root = new THREE.Group()
  scene.add(root)
  const r = rng(77)
  const env = (() => {
    try {
      const pm = new THREE.PMREMGenerator(renderer)
      const t = pm.fromScene(new RoomEnvironment(), 0.04).texture
      return t
    } catch (e) {
      return null
    }
  })()

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
  const at = (z, q, a = 0) => {
    const [rx, rz] = rightV(z)
    const [fx, fz] = flow(z)
    return new THREE.Vector3(edge(z) + rx * q + fx * a, 0, z + rz * q + fz * a)
  }
  const yawWater = (z) => {
    const [rx, rz] = rightV(z)
    return Math.atan2(-rz, rx)
  }
  const put = (obj, z, q, y = 0.62, yaw = null) => {
    const p = at(z, q)
    obj.position.set(p.x, y, p.z)
    obj.rotation.y = yaw === null ? yawWater(z) : yaw
    root.add(obj)
    return obj
  }
  const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o })
  const box = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(x, y, z)
    m.castShadow = !low
    m.receiveShadow = true
    return m
  }

  /* أرضية مرصوفة */
  const zs = []
  for (let z = PLAZA.z0 + 4; z >= PLAZA.z1 - 4; z -= 3) zs.push(z)
  const stone = stoneTexture()
  const marble = marbleTexture()
  const strip = (qa, qb, y, tex, rx, ry, color = 0xffffff) => {
    const pos = []
    const uv = []
    const idx = []
    zs.forEach((z, i) => {
      const a = at(z, qa)
      const b = at(z, qb)
      pos.push(a.x, y, a.z, b.x, y, b.z)
      uv.push(i * rx, 0, i * rx, ry)
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
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, color, roughness: 0.7, side: THREE.DoubleSide }))
    m.receiveShadow = true
    root.add(m)
  }
  strip(-0.4, -PLAZA.depth, 0.62, stone, 0.36, 4.2)
  strip(0.2, -0.9, 0.78, marble, 0.5, 0.2)
  /* واجهة الحافة */
  {
    const pos = []
    const idx = []
    zs.forEach((z, i) => {
      const a = at(z, 0.2)
      pos.push(a.x, 0.78, a.z, a.x, -1.8, a.z)
    })
    for (let i = 0; i < zs.length - 1; i++) {
      const a = i * 2
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    root.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x8e887a, roughness: 1, side: THREE.DoubleSide })))
  }

  /* السياج الأخضر على الحافة */
  {
    const n = 14
    const step = (PLAZA.z0 - PLAZA.z1 - 2) / n
    const green = M(0x6fb18a, { roughness: 0.5, metalness: 0.3 })
    const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), green, n + 1)
    const rails = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.09, 0.09), green, n * 2)
    const braces = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.05, 0.05), green, n * 2)
    const d = new THREE.Object3D()
    for (let i = 0; i <= n; i++) {
      const z = PLAZA.z0 - 1 - i * step
      const p = at(z, -0.45)
      d.position.set(p.x, 0.62 + 0.7, p.z)
      d.rotation.set(0, 0, 0)
      d.scale.set(1, 1, 1)
      d.updateMatrix()
      posts.setMatrixAt(i, d.matrix)
      if (i < n) {
        const z2 = z - step
        const p2 = at(z2, -0.45)
        const mx = (p.x + p2.x) / 2
        const mz = (p.z + p2.z) / 2
        const len = Math.hypot(p2.x - p.x, p2.z - p.z)
        const yaw = Math.atan2(-(p2.z - p.z), p2.x - p.x)
        ;[1.22, 0.72].forEach((y, k) => {
          d.position.set(mx, 0.62 + y, mz)
          d.rotation.set(0, yaw, 0)
          d.scale.set(len, 1, 1)
          d.updateMatrix()
          rails.setMatrixAt(i * 2 + k, d.matrix)
        })
        ;[1, -1].forEach((s, k) => {
          d.position.set(mx, 0.62 + 0.97, mz)
          d.rotation.set(0, yaw, s * Math.atan2(0.5, len))
          d.scale.set(Math.hypot(len, 0.5), 1, 1)
          d.updateMatrix()
          braces.setMatrixAt(i * 2 + k, d.matrix)
        })
      }
    }
    posts.castShadow = !low
    root.add(posts, rails, braces)
  }

  /* أعمدة الإنارة ذات الكرتين */
  ;[-14, -5, 5, 14].forEach((dz) => {
    const g = new THREE.Group()
    g.add(box(0.2, 5.6, 0.2, M(0x23272b, { roughness: 0.5, metalness: 0.5 }), 0, 2.8, 0))
    const arm = box(2.6, 0.12, 0.12, M(0x23272b, { metalness: 0.5 }), 0, 5.5, 0)
    g.add(arm)
    ;[-1.25, 1.25].forEach((x) => {
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 14), new THREE.MeshStandardMaterial({ color: 0xfff7e0, emissive: 0xfff2c8, emissiveIntensity: 0.55, roughness: 0.3 }))
      globe.position.set(x, 5.5, 0)
      g.add(globe)
      g.add(box(0.5, 0.1, 0.5, M(0xf2efe8), x, 5.84, 0))
    })
    g.rotation.y = Math.PI / 2
    const holder = new THREE.Group()
    holder.add(g)
    const p = at(PLAZA.zs + dz, -2.6)
    holder.position.set(p.x, 0.62, p.z)
    holder.rotation.y = yawWater(PLAZA.zs + dz)
    root.add(holder)
  })

  /* جدران رخام منخفضة تحيط بالقاعدة */
  const marbleMat = new THREE.MeshStandardMaterial({ map: marble, roughness: 0.18, metalness: 0.15, envMap: env, envMapIntensity: 0.5 })
  const capMat = new THREE.MeshStandardMaterial({ color: 0x161619, roughness: 0.2, metalness: 0.3, envMap: env, envMapIntensity: 0.5 })
  {
    const wall = (len, z, q, yaw) => {
      const g = new THREE.Group()
      g.add(box(len, 1.3, 0.9, marbleMat, 0, 0.65, 0))
      g.add(box(len + 0.2, 0.18, 1.1, capMat, 0, 1.38, 0))
      const holder = new THREE.Group()
      holder.add(g)
      put(holder, z, q, 0.62, yawWater(z) + yaw)
    }
    wall(17, PLAZA.zs, -22.5, Math.PI / 2)
    wall(11, PLAZA.zs + 8.5, -17.5, 0)
    wall(11, PLAZA.zs - 8.5, -17.5, 0)
    /* مقاعد */
    ;[-12, 12].forEach((dz) => {
      const g = new THREE.Group()
      g.add(box(2.4, 0.12, 0.7, M(0x8a5a2b, { roughness: 0.8 }), 0, 0.62, 0))
      g.add(box(2.4, 0.5, 0.1, M(0x8a5a2b, { roughness: 0.8 }), 0, 0.98, -0.3))
      g.add(box(0.1, 0.6, 0.6, M(0x1a1c1f, { metalness: 0.5 }), -1.1, 0.3, 0))
      g.add(box(0.1, 0.6, 0.6, M(0x1a1c1f, { metalness: 0.5 }), 1.1, 0.3, 0))
      const holder = new THREE.Group()
      holder.add(g)
      put(holder, PLAZA.zs + dz, -6, 0.62, yawWater(PLAZA.zs + dz) + Math.PI / 2)
    })
  }

  /* مكتبة صغيرة (خزانة كتب) */
  {
    const g = new THREE.Group()
    g.add(box(1.4, 1.7, 0.8, M(0xf3f1ea, { roughness: 0.6 }), 0, 0.85 + 0.4, 0))
    g.add(box(1.5, 0.12, 0.9, M(0x2a6ea8), 0, 0.4, 0))
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.9, 4), M(0x2a6ea8))
    roof.rotation.y = Math.PI / 4
    roof.scale.set(1, 1, 0.6)
    roof.position.y = 2.55
    g.add(roof)
    g.add(box(1.0, 1.1, 0.05, M(0x222a30, { roughness: 0.2, metalness: 0.4 }), 0, 1.15, 0.42))
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.34), new THREE.MeshBasicMaterial({ map: textTexture([{ text: 'مكتبة الشاطئ', font: '700 120px "Reem Kufi", "Tajawal", sans-serif', y: 180 }], '#f3f1ea', 600, 200, null) }))
    sign.position.set(0, 1.98, 0.42)
    g.add(sign)
    const holder = new THREE.Group()
    holder.add(g)
    put(holder, PLAZA.zs + 13, -12, 0.62, yawWater(PLAZA.zs + 13) + Math.PI / 2)
  }

  /* ---------- القاعدة والتمثال ---------- */
  const stat = new THREE.Group()
  const steps = new THREE.MeshStandardMaterial({ map: stone, roughness: 0.75 })
  stat.add(box(8.2, 0.3, 7.0, steps, 0, 0.15, 0))
  stat.add(box(6.6, 0.3, 5.5, steps, 0, 0.45, 0))
  stat.add(box(4.6, 0.3, 3.8, capMat, 0, 0.75, 0))
  stat.add(box(4.0, 3.2, 3.2, marbleMat, 0, 2.5, 0))
  stat.add(box(4.5, 0.32, 3.7, capMat, 0, 4.26, 0))
  /* لوحة عربية */
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 1.5),
    new THREE.MeshStandardMaterial({
      map: textTexture(
        [
          { text: 'الشاعر', font: '600 70px "Tajawal", sans-serif', y: 105, color: '#5a2833' },
          { text: 'بدر شاكر السيّاب', font: '700 150px "Reem Kufi", "Tajawal", sans-serif', y: 275 },
          { text: '١٩٢٦ – ١٩٦٤', font: '600 90px "Tajawal", sans-serif', y: 450, color: '#5a2833' },
          { text: 'أنشودة المطر', font: '500 62px "Tajawal", sans-serif', y: 560, color: '#6b5a3a' },
        ],
        '#efe9dc', 1024, 640
      ),
      roughness: 0.4,
    })
  )
  plaque.position.set(0, 2.5, 1.62)
  stat.add(plaque)
  const figHolder = new THREE.Group()
  figHolder.position.set(0, 4.42, 0)
  stat.add(figHolder)
  buildRelief(figHolder, env, { height: 6.3, maxDepth: 0.52, castShadow: !low }).catch(() => {})
  /* الرأس واليدان: نحت ثلاثي الأبعاد حقيقي */
  setTimeout(() => {
    const sc = 6.3 / 444
    const P = (px, py) => [(px - 384 - 120) * sc, (444 - (py - 72)) * sc]
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x3b2f27, emissive: 0x1a130e, emissiveIntensity: 0.6, metalness: 0.78, roughness: 0.42, envMap: env, envMapIntensity: 1.1 })
    const head = new THREE.Mesh(buildHeadGeometry(), bronzeMat)
    const [hx, hy] = P(485, 109)
    head.position.set(hx, hy, 0.08)
    head.rotation.set(-0.08, -0.55, 0, 'YXZ')
    head.scale.setScalar(0.86)
    head.castShadow = !low
    figHolder.add(head)
    const fist = new THREE.Mesh(buildFistHandGeometry(), bronzeMat)
    const [fx, fy] = P(426, 277)
    fist.position.set(fx + 0.02, fy + 0.02, 0.2)
    fist.rotation.set(0, Math.PI + 0.52, -0.1, 'YXZ')
    fist.scale.setScalar(1.3)
    fist.castShadow = !low
    figHolder.add(fist)
    const hang = new THREE.Mesh(buildHangingHandGeometry(), bronzeMat)
    const [gx, gy] = P(590, 320)
    hang.position.set(gx + 0.06, gy - 0.06, 0.05)
    hang.rotation.set(0, 0, -Math.PI / 4)
    hang.scale.setScalar(1.3)
    hang.castShadow = !low
    figHolder.add(hang)
  }, 300)
  stat.rotation.y = Math.PI / 2
  const holder = new THREE.Group()
  holder.add(stat)
  put(holder, PLAZA.zs, -9.7)
  /* تركيز ضوئي ناعم على التمثال */
  const spot = new THREE.PointLight(0xffe9c8, 5.5, 26, 1.6)
  spot.position.set(2.5, 10.5, 6)
  stat.add(spot)

  return { statuePos: at(PLAZA.zs, -9.7) }
}
