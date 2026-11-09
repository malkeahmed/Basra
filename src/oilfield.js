import * as THREE from 'three'
import { createFleet } from './vehicles.js'
import { makeFlag } from './boats.js'

/*
  حقل الرميلة النفطي (جنوب غرب البصرة) كما يُرى على ضفة شطّ العرب:
  مضخّات رأس الحصان، رؤوس آبار، خطوط أنابيب طويلة على دعامات،
  وحدة فصل الغاز عن النفط، خزانات بيضاء بسلالم حلزونية، ومنصّة تحميل في النهر،
  وشعلات غاز عالية تخرج منها النار.
*/
export const OIL = { z0: -222, z1: -340 }
const sstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
export function oilMask(x, z, rx, hw) {
  if (z > OIL.z0 + 10 || z < OIL.z1 - 10) return 0
  const d = x - (rx + hw)
  const mz = sstep(OIL.z0 + 10, OIL.z0, z) * sstep(OIL.z1 - 10, OIL.z1, z)
  return mz * sstep(6, 11, d) * (1 - sstep(120, 136, d))
}
export const oilBlend = (h, x, z, rx, hw) => {
  const m = oilMask(x, z, rx, hw)
  return m > 0 ? h * (1 - m) + 0.8 * m : h
}
export const inOil = (x, z, rx, hw, pad = 0.02) => oilMask(x, z, rx, hw) > pad

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
function groundTex() {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#4a8a2e'
    g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 12000; i++) {
      const v = Math.random()
      g.fillStyle = v > 0.5 ? `rgba(${70 + Math.random() * 40},${150 + Math.random() * 60},${40 + Math.random() * 30},${0.3 + Math.random() * 0.4})` : `rgba(${30 + Math.random() * 20},${90 + Math.random() * 40},${25},${0.25 + Math.random() * 0.35})`
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 3)
    }
    for (let i = 0; i < 30; i++) {
      g.fillStyle = `rgba(35,80,20,${Math.random() * 0.12})`
      g.beginPath()
      g.ellipse(Math.random() * 256, Math.random() * 256, 10 + Math.random() * 24, 5 + Math.random() * 12, Math.random() * 3, 0, 7)
      g.fill()
    }
  })
}
function tankTex(num) {
  return canvasTex(
    512,
    256,
    (g, w, h) => {
      g.fillStyle = '#f1efe9'
      g.fillRect(0, 0, w, h)
      for (let i = 0; i < 4000; i++) {
        g.fillStyle = `rgba(120,110,95,${Math.random() * 0.06})`
        g.fillRect(Math.random() * w, Math.random() * h, 3, 3)
      }
      g.fillStyle = 'rgba(90,85,75,.35)'
      for (let y = 24; y < h; y += 42) g.fillRect(0, y, w, 2)
      g.fillStyle = '#b8452b'
      g.fillRect(0, 12, w, 20)
      g.fillStyle = '#2a2a2a'
      g.fillRect(0, h - 12, w, 12)
      g.fillStyle = '#2a1f12'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.direction = 'rtl'
      g.font = '700 74px "Reem Kufi", "Tajawal", serif'
      g.fillText('خزّان ' + num, w * 0.5, h * 0.52)
      g.fillStyle = '#bf9e66'
      g.fillRect(w * 0.1, h * 0.72, w * 0.8, 3)
    },
    true
  )
}
function signTex() {
  const t = canvasTex(
    2048,
    704,
    (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h)
      gr.addColorStop(0, '#0f3a2d')
      gr.addColorStop(1, '#082219')
      g.fillStyle = gr
      g.fillRect(0, 0, w, h)
      g.strokeStyle = 'rgba(232,201,140,.07)'
      g.lineWidth = 2
      for (let x = -h; x < w + h; x += 64) {
        g.beginPath()
        g.moveTo(x, 0)
        g.lineTo(x + h, h)
        g.moveTo(x + h, 0)
        g.lineTo(x, h)
        g.stroke()
      }
      const gold = '#e2bf7d'
      g.strokeStyle = gold
      g.lineWidth = 9
      g.strokeRect(26, 26, w - 52, h - 52)
      g.lineWidth = 3
      g.strokeRect(50, 50, w - 100, h - 100)
      ;[[50, 50], [w - 50, 50], [50, h - 50], [w - 50, h - 50]].forEach(([x, y]) => {
        g.save()
        g.translate(x, y)
        g.fillStyle = gold
        for (let k = 0; k < 2; k++) {
          g.rotate(Math.PI / 4)
          g.fillRect(-15, -15, 30, 30)
        }
        g.restore()
      })
      for (let i = 0; i < 44; i++) {
        const x = 110 + i * ((w - 220) / 43)
        ;[96, h - 96].forEach((y) => {
          g.save()
          g.translate(x, y)
          g.rotate(Math.PI / 4)
          g.fillStyle = i % 2 ? gold : 'rgba(226,191,125,.45)'
          g.fillRect(-7, -7, 14, 14)
          g.restore()
        })
      }
      const pump = (cx, cy, flip) => {
        g.save()
        g.translate(cx, cy)
        g.scale(flip ? -1 : 1, 1)
        g.strokeStyle = gold
        g.fillStyle = gold
        g.lineWidth = 7
        g.beginPath()
        g.arc(0, 0, 118, 0, Math.PI * 2)
        g.stroke()
        g.lineWidth = 3
        g.beginPath()
        g.arc(0, 0, 104, 0, Math.PI * 2)
        g.stroke()
        g.lineWidth = 9
        g.lineJoin = 'round'
        g.beginPath()
        g.moveTo(-58, 58)
        g.lineTo(58, 58)
        g.moveTo(-6, 58)
        g.lineTo(-24, -4)
        g.moveTo(10, 58)
        g.lineTo(24, -4)
        g.stroke()
        g.save()
        g.translate(0, -8)
        g.rotate(-0.18)
        g.beginPath()
        g.moveTo(-60, 6)
        g.lineTo(52, -10)
        g.stroke()
        g.beginPath()
        g.arc(56, 8, 22, -1.3, 1.1)
        g.stroke()
        g.restore()
        g.beginPath()
        g.moveTo(66, 34)
        g.lineTo(66, 58)
        g.stroke()
        g.beginPath()
        g.arc(-52, 34, 20, 0, Math.PI * 2)
        g.fill()
        g.restore()
      }
      pump(236, h / 2, false)
      pump(w - 236, h / 2, true)
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.direction = 'rtl'
      g.shadowColor = 'rgba(0,0,0,.55)'
      g.shadowBlur = 14
      g.shadowOffsetY = 6
      const tg = g.createLinearGradient(0, 150, 0, 330)
      tg.addColorStop(0, '#fbe6b2')
      tg.addColorStop(0.55, '#e2bf7d')
      tg.addColorStop(1, '#b98f4a')
      g.fillStyle = tg
      g.font = '700 190px "Reem Kufi", "Tajawal", serif'
      g.fillText('حقل الرميلة النفطي', w / 2, 262)
      g.shadowBlur = 0
      g.shadowOffsetY = 0
      g.strokeStyle = gold
      g.lineWidth = 4
      g.beginPath()
      g.moveTo(560, 396)
      g.lineTo(w / 2 - 54, 396)
      g.moveTo(w / 2 + 54, 396)
      g.lineTo(w - 560, 396)
      g.stroke()
      g.fillStyle = '#071812'
      g.beginPath()
      g.moveTo(w / 2, 362)
      g.bezierCurveTo(w / 2 + 34, 396, w / 2 + 30, 422, w / 2, 424)
      g.bezierCurveTo(w / 2 - 30, 422, w / 2 - 34, 396, w / 2, 362)
      g.fill()
      g.stroke()
      g.fillStyle = '#f4e9cf'
      g.font = '500 82px "Tajawal", sans-serif'
      g.fillText('نفط البصرة · جنوب العراق', w / 2, 500)
      g.fillStyle = gold
      g.direction = 'ltr'
      g.font = '600 56px "Tajawal", sans-serif'
      if ('letterSpacing' in g) g.letterSpacing = '14px'
      g.fillText('RUMAILA OIL FIELD', w / 2, 598)
    },
    false
  )
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => (t.needsUpdate = true))
  return t
}

const glowTex = (() => {
  let t
  return () => {
    if (t) return t
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    gr.addColorStop(0, 'rgba(255,200,110,.9)')
    gr.addColorStop(0.35, 'rgba(255,120,30,.35)')
    gr.addColorStop(1, 'rgba(255,80,0,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, 128, 128)
    t = new THREE.CanvasTexture(c)
    return t
  }
})()

/* مسار بزوايا مدوّرة لأنابيب واقعية */
function roundedPath(pts, rad) {
  const path = new THREE.CurvePath()
  let cur = pts[0].clone()
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]
    const a = pts[i - 1]
    const b = pts[i + 1]
    const d1 = p.clone().sub(a)
    const d2 = b.clone().sub(p)
    const r = Math.min(rad, d1.length() * 0.45, d2.length() * 0.45)
    const s = p.clone().sub(d1.normalize().multiplyScalar(r))
    const e = p.clone().add(d2.normalize().multiplyScalar(r))
    if (s.distanceTo(cur) > 1e-4) path.add(new THREE.LineCurve3(cur, s))
    path.add(new THREE.QuadraticBezierCurve3(s, p.clone(), e))
    cur = e
  }
  path.add(new THREE.LineCurve3(cur, pts[pts.length - 1].clone()))
  return path
}

export function createOilField(scene, { riverX, halfW, terrainH, low = false }) {
  const root = new THREE.Group()
  scene.add(root)
  const B = (z) => riverX(z) + halfW(z)
  const slope = (z) => (B(z - 1.5) - B(z + 1.5)) / -3
  const toRiver = (z) => Math.atan2(-1, slope(z))
  const facingX = (z) => Math.atan2(-slope(z), -1)
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.15, ...o })
  const GY = 0.82
  const P = (z, d, y = GY) => new THREE.Vector3(B(z) + d, y, z)
  const dummy = new THREE.Object3D()
  const uni = { uTime: { value: 0 } }
  const anim = []

  /* أرض الموقع: حصى رملي مضغوط */
  {
    const gt = groundTex()
    gt.repeat.set(1, 1)
    const n = 40
    const pos = []
    const uv = []
    const idx = []
    const d0 = 8
    const d1 = 124
    for (let i = 0; i <= n; i++) {
      const z = OIL.z0 + ((OIL.z1 - OIL.z0) * i) / n
      pos.push(B(z) + d0, GY + 0.04, z, B(z) + d1, GY + 0.04, z)
      uv.push(0, (-z + OIL.z0) / 14, (d1 - d0) / 14, (-z + OIL.z0) / 14)
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
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: gt, roughness: 1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }))
    m.receiveShadow = true
    root.add(m)
  }

  /* --- أنابيب --- */
  const flangeG = new THREE.CylinderGeometry(1, 1, 0.14, 14)
  const flangeMat = std(0x777a7c, { metalness: 0.6, roughness: 0.4 })
  const flanges = []
  const supports = []
  function pipe(pts, radius, color, { sup = 0, flangeEvery = 7 } = {}) {
    const path = roundedPath(pts, radius * 5)
    const len = path.getLength()
    const geo = new THREE.TubeGeometry(path, Math.max(8, Math.ceil(len / 1.2)), radius, 12, false)
    const m = new THREE.Mesh(geo, std(color, { metalness: 0.3, roughness: 0.5 }))
    m.castShadow = !low
    root.add(m)
    for (let s = flangeEvery * 0.5; s < len; s += flangeEvery) {
      const u = s / len
      flanges.push({ p: path.getPointAt(u), t: path.getTangentAt(u), r: radius * 1.45 })
    }
    if (sup)
      for (let s = sup * 0.5; s < len; s += sup) {
        const p = path.getPointAt(s / len)
        supports.push({ x: p.x, z: p.z, y: p.y - radius })
      }
    return path
  }

  /* --- شعلات الغاز: برج مشبّك وشعلة نارية متحرّكة --- */
  const flameMat = (seed) =>
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
      uniforms: { uTime: uni.uTime, uSeed: { value: seed } },
      vertexShader: 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uSeed;
        float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
        float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
        void main(){
          float h = vUv.y;
          float x = (vUv.x - 0.5) * 2.0;
          float t = uTime * 2.6 + uSeed;
          float n = noise(vec2(vUv.x * 3.2 + sin(t * 0.7) , h * 3.0 - t)) * 0.6 + noise(vec2(vUv.x * 7.0, h * 6.0 - t * 1.7)) * 0.4;
          float sway = (n - 0.5) * 0.55 * h + sin(t * 1.3 + h * 4.0) * 0.12 * h;
          float w = abs(x - sway);
          float width = (0.30 + 0.70 * smoothstep(0.0, 0.28, h)) * (1.0 - pow(h, 1.5)) * (0.65 + 0.55 * n);
          float m = smoothstep(width, width * 0.35, w) * smoothstep(1.0, 0.82, h);
          float k = clamp(w / max(width, 0.001) * 0.9 + h * 0.75, 0.0, 1.0);
          vec3 col = mix(vec3(1.0, 0.7, 0.22), vec3(1.0, 0.38, 0.04), smoothstep(0.0, 0.4, k));
          col = mix(col, vec3(0.85, 0.12, 0.02), smoothstep(0.45, 0.95, k));
          float low = (1.0 - smoothstep(0.0, 0.14, h)) * 0.6;
          col = mix(col, vec3(0.3, 0.45, 0.9), low * 0.5 * smoothstep(0.3, 0.0, w));
          gl_FragColor = vec4(col * 0.95, m * (0.95 - h * 0.25));
        }`,
    })
  function flareStack(z, d, H, seed) {
    const g = new THREE.Group()
    const steel = std(0xb9bcbf, { metalness: 0.5, roughness: 0.45 })
    /* مدماك خرساني */
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.9, 16), std(0xa9a498, { roughness: 0.9 }))
    pad.position.y = 0.45
    g.add(pad)
    /* برج مشبّك ثلاثي الأرجل */
    const leg = 2.6
    const tip = 0.5
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.3
      const a2 = a
      const A = new THREE.Vector3(Math.cos(a) * leg, 0.9, Math.sin(a) * leg)
      const Bv = new THREE.Vector3(Math.cos(a2) * tip, H, Math.sin(a2) * tip)
      const dv = Bv.clone().sub(A)
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, dv.length(), 6), steel)
      m.position.copy(A).addScaledVector(dv, 0.5)
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dv.clone().normalize())
      m.castShadow = !low
      g.add(m)
    }
    /* حلقات أفقية وتعشيق قُطري */
    const rings = 9
    for (let r = 1; r <= rings; r++) {
      const y = 0.9 + ((H - 0.9) * r) / (rings + 1)
      const rad = leg + (tip - leg) * (r / (rings + 1))
      const ring = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.07, 5, 18), steel)
      ring.rotation.x = Math.PI / 2
      ring.position.y = y
      g.add(ring)
    }
    /* أنبوب الغاز المركزي وطرف الشعلة */
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, H + 0.8, 12), std(0x6c6f72, { metalness: 0.5 }))
    stack.position.y = (H + 0.8) / 2
    g.add(stack)
    const tipM = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.5, 1.4, 12, 1, true), std(0x3a3a3a, { metalness: 0.5, side: THREE.DoubleSide }))
    tipM.position.y = H + 1.0
    g.add(tipM)
    /* مصباح تحذير أحمر */
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff3b2f, emissive: 0xff2a1a, emissiveIntensity: 1 }))
    lamp.position.set(leg * 0.2, H * 0.62, 0.3)
    g.add(lamp)
    anim.push((t) => (lamp.material.emissiveIntensity = 0.3 + 1.1 * Math.max(0, Math.sin(t * 2 + seed))))
    /* اللهب: ثلاثة مستويات متقاطعة */
    const fh = H * 0.5
    const fw = fh * 0.55
    const fg = new THREE.PlaneGeometry(fw, fh)
    fg.translate(0, fh / 2, 0)
    const fm = flameMat(seed)
    for (let k = 0; k < 3; k++) {
      const f = new THREE.Mesh(fg, fm)
      f.position.y = H + 1.7
      f.rotation.y = (k * Math.PI) / 3
      f.renderOrder = 5
      g.add(f)
    }
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, opacity: 0.22 }))
    halo.scale.setScalar(fh * 1.25)
    halo.position.y = H + 1.7 + fh * 0.35
    g.add(halo)
    anim.push((t) => halo.scale.setScalar(fh * (1.2 + 0.08 * Math.sin(t * 7.3 + seed))))
    /* دخان أسود يتصاعد من الشعلة ويتبدّد مع الرياح */
    const smokeTex = (() => {
      const c = document.createElement('canvas')
      c.width = c.height = 64
      const x = c.getContext('2d')
      const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32)
      gr.addColorStop(0, 'rgba(40,36,34,.8)')
      gr.addColorStop(1, 'rgba(40,36,34,0)')
      x.fillStyle = gr
      x.fillRect(0, 0, 64, 64)
      return new THREE.CanvasTexture(c)
    })()
    const puffs = []
    for (let k = 0; k < (low ? 5 : 9); k++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0.3 }))
      sp.renderOrder = 4
      g.add(sp)
      puffs.push({ sp, ph: k / 9 })
    }
    anim.push((t) => {
      puffs.forEach((q) => {
        const p = (q.ph + t * 0.045) % 1
        q.sp.position.set(p * H * 0.55, H + fh * 0.85 + p * H * 0.8, Math.sin(p * 7 + seed) * 1.5)
        q.sp.scale.setScalar(fh * (0.5 + p * 1.7))
        q.sp.material.opacity = 0.34 * (1 - p) * Math.min(1, p * 7)
      })
    })
    g.position.copy(P(z, d, GY))
    root.add(g)
    return g
  }
  flareStack(-254, 22, 46, 1.3)
  flareStack(-308, 22, 40, 4.1)
  flareStack(-336, 16, 30, 7.7)

  /* --- مضخّات رأس الحصان --- */
  const pumpMat = std(0xd8a21e, { metalness: 0.35, roughness: 0.5 })
  const pumpDark = std(0x2b2d30, { metalness: 0.5, roughness: 0.5 })
  const blue = std(0x1f5f8b, { metalness: 0.3 })
  function pumpjack(z, d, phase) {
    const g = new THREE.Group()
    const skid = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.5, 2.6), std(0x5a5d60))
    skid.position.set(0.2, 0.25, 0)
    g.add(skid)
    ;[-1, 1].forEach((s) => {
      ;[[-0.6, -1.6], [1.6, 0.2]].forEach(([x0]) => {
        const A = new THREE.Vector3(x0, 0.5, s * 0.85)
        const Bv = new THREE.Vector3(0.5, 4.5, s * 0.35)
        const dv = Bv.clone().sub(A)
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.28, dv.length(), 0.28), blue)
        m.position.copy(A).addScaledVector(dv, 0.5)
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dv.clone().normalize())
        g.add(m)
      })
    })
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.3, 12), pumpDark)
    hub.rotation.x = Math.PI / 2
    hub.position.set(0.5, 4.6, 0)
    g.add(hub)
    /* عارضة الحركة */
    const beamG = new THREE.Group()
    beamG.position.set(0.5, 4.6, 0)
    const beam = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.42, 0.55), pumpMat)
    beam.position.x = 0.0
    beamG.add(beam)
    const horse = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.24, 6, 18, 0.9), pumpMat)
    horse.rotation.z = -0.45
    beamG.add(horse)
    g.add(beamG)
    /* الكرنك والثقل الموازن */
    const crankG = new THREE.Group()
    crankG.position.set(-2.1, 1.7, 0)
    ;[-1, 1].forEach((s) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 0.28), pumpMat)
      w.position.set(-0.6, 0, s * 0.8)
      crankG.add(w)
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.18), pumpDark)
      arm.position.set(0.3, 0, s * 0.8)
      crankG.add(arm)
    })
    g.add(crankG)
    const gear = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 1.4), std(0x40454a))
    gear.position.set(-2.1, 1.15, 0)
    g.add(gear)
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.2, 14), std(0x2e7a54))
    motor.rotation.z = Math.PI / 2
    motor.position.set(-3.6, 0.85, 0.2)
    g.add(motor)
    const pitman = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 8), pumpDark)
    g.add(pitman)
    /* رأس البئر والقضيب المصقول */
    const wellhead = new THREE.Group()
    const wb = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.7, 12), std(0x23527a))
    wb.position.y = 0.55
    wellhead.add(wb)
    const valve = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), std(0xb0302a))
    valve.position.set(0, 1.1, 0)
    wellhead.add(valve)
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 8), std(0xcfd2d4, { metalness: 0.8, roughness: 0.2 }))
    wellhead.add(rod)
    const carrier = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.5), pumpDark)
    wellhead.add(carrier)
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 6), pumpDark)
    wellhead.add(cable)
    wellhead.position.set(3.95, 0.0, 0)
    g.add(wellhead)
    g.position.copy(P(z, d, GY))
    g.rotation.y = facingX(z)
    g.traverse((o) => (o.castShadow = !low && o.isMesh))
    root.add(g)
    anim.push((t) => {
      const ph = t * 0.85 + phase
      const th = 0.3 * Math.sin(ph)
      beamG.rotation.z = th
      crankG.rotation.z = ph + Math.PI
      const pin = new THREE.Vector3(-2.1 + Math.cos(ph) * 0.62, 1.7 + Math.sin(ph) * 0.62, 0)
      const tail = new THREE.Vector3(0.5 - 3.4 * Math.cos(th), 4.6 - 3.4 * Math.sin(th), 0)
      const dv = tail.clone().sub(pin)
      pitman.scale.y = dv.length()
      pitman.position.copy(pin).addScaledVector(dv, 0.5)
      pitman.rotation.z = Math.atan2(dv.y, dv.x) - Math.PI / 2
      const tipY = 4.6 + 3.4 * Math.sin(th)
      const cy = tipY - 2.4
      carrier.position.y = cy
      rod.position.y = cy - 1.5
      cable.scale.y = 2.4
      cable.position.y = cy + 1.2
      void tail
    })
  }
  ;[-268, -284, -300, -316, -332].forEach((z, i) => pumpjack(z, 14 + (i % 2) * 2, i * 1.7))

  /* --- رؤوس آبار (شجرة عيد الميلاد) بعجلات تحكّم --- */
  function xmasTree(z, d) {
    const g = new THREE.Group()
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 1.8), std(0x6b6e70, { roughness: 0.9 }))
    base.position.y = 0.15
    g.add(base)
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 2.6, 12), std(0x23527a))
    stem.position.y = 1.5
    g.add(stem)
    const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 1.6, 10), std(0x23527a))
    cross.rotation.z = Math.PI / 2
    cross.position.y = 2.0
    g.add(cross)
    ;[-0.75, 0.75].forEach((x) => {
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.5, 0.38), std(0xb0302a))
      v.position.set(x, 2.0, 0)
      g.add(v)
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 5, 14), std(0xd9b84a))
      wheel.position.set(x, 2.45, 0)
      wheel.rotation.x = Math.PI / 2
      g.add(wheel)
    })
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.8, 10), std(0xb0302a))
    cap.position.y = 3.2
    g.add(cap)
    const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 14), std(0xf1efe9))
    gauge.rotation.x = Math.PI / 2
    gauge.position.set(0, 3.7, 0.2)
    g.add(gauge)
    g.position.copy(P(z, d, GY))
    root.add(g)
  }
  ;[-238, -262, -286, -310].forEach((z, i) => xmasTree(z, 28 + (i % 2) * 2))

  /* --- خزانات التخزين مع سلالم حلزونية وسواتر ترابية --- */
  function tank(z, d, n) {
    const g = new THREE.Group()
    const R = 10
    const H = 13
    const tt = tankTex(n)
    tt.repeat.set(3, 1)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 40, 1, true), new THREE.MeshStandardMaterial({ map: tt, roughness: 0.55, metalness: 0.3 }))
    body.position.y = H / 2
    body.castShadow = !low
    body.receiveShadow = true
    g.add(body)
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.3, R, 1.6, 40), std(0xd9d6cc, { metalness: 0.3, roughness: 0.6 }))
    roof.position.y = H + 0.8
    g.add(roof)
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 1.0, 12), std(0x888b8d))
    vent.position.y = H + 2.1
    g.add(vent)
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.05, 0.08, 6, 48), std(0x2b2d30))
    rim.rotation.x = Math.PI / 2
    rim.position.y = H + 0.95
    g.add(rim)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.5, R + 0.7, 0.5, 40), std(0x9a968c, { roughness: 0.95 }))
    base.position.y = 0.25
    g.add(base)
    /* سلّم حلزوني */
    const pts = []
    for (let i = 0; i <= 80; i++) {
      const u = i / 80
      const a = u * Math.PI * 2 * 1.15 + 0.6
      pts.push(new THREE.Vector3(Math.cos(a) * (R + 0.7), 0.5 + u * (H + 0.4), Math.sin(a) * (R + 0.7)))
    }
    const stair = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 100, 0.17, 6, false), std(0x2b2d30, { metalness: 0.5 }))
    g.add(stair)
    /* ساتر ترابي حول الخزان */
    const berm = new THREE.Mesh(new THREE.TorusGeometry(R + 5.5, 1.2, 8, 40), std(0x9d8a63, { roughness: 1 }))
    berm.rotation.x = Math.PI / 2
    berm.scale.set(1, 1, 0.8)
    berm.position.y = 0.2
    g.add(berm)
    g.position.copy(P(z, d, GY))
    root.add(g)
    return g
  }
  const tankPos = [[-244, 70], [-282, 70], [-244, 102], [-282, 102]]
  tankPos.forEach(([z, d], i) => tank(z, d, ['١', '٢', '٣', '٤'][i]))

  /* --- وحدة فصل الغاز: أسطوانات أفقية وأبراج --- */
  {
    const drumMat = std(0xb7c1c8, { metalness: 0.4, roughness: 0.45 })
    ;[-256, -270, -284].forEach((z, i) => {
      const g = new THREE.Group()
      const body = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 14, 24), drumMat)
      body.rotation.z = Math.PI / 2
      body.position.y = 3.2
      body.castShadow = !low
      g.add(body)
      ;[-1, 1].forEach((s) => {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(2.1, 18, 12), drumMat)
        cap.scale.x = 0.55
        cap.position.set(s * 7.4, 3.2, 0)
        g.add(cap)
        const sad = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 3.4), std(0x7d8084, { roughness: 0.9 }))
        sad.position.set(s * 4.4, 1.1, 0)
        g.add(sad)
      })
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.4, 12), drumMat)
      neck.position.set(0, 5.9, 0)
      g.add(neck)
      const platform = new THREE.Mesh(new THREE.BoxGeometry(5, 0.12, 1.6), std(0x4a4d50))
      platform.position.set(0, 5.6, 1.9)
      g.add(platform)
      g.position.copy(P(z, 42 + (i % 2) * 2, GY))
      g.rotation.y = toRiver(z) + Math.PI / 2
      root.add(g)
    })
    ;[-298, -312].forEach((z, i) => {
      const g = new THREE.Group()
      const H = 24
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, H, 20), std(0xcfd2d0, { metalness: 0.35, roughness: 0.5 }))
      col.position.y = H / 2 + 0.5
      col.castShadow = !low
      g.add(col)
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1.7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0xcfd2d0, { metalness: 0.35 }))
      dome.position.y = H + 0.5
      g.add(dome)
      for (let k = 1; k <= 4; k++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.07, 5, 24), std(0x2b2d30))
        ring.rotation.x = Math.PI / 2
        ring.position.y = k * 4.6
        g.add(ring)
        const plat = new THREE.Mesh(new THREE.RingGeometry(1.7, 2.4, 24), std(0x4a4d50, { side: THREE.DoubleSide }))
        plat.rotation.x = -Math.PI / 2
        plat.position.y = k * 4.6
        g.add(plat)
      }
      const lad = new THREE.Mesh(new THREE.BoxGeometry(0.14, H, 0.5), std(0x2b2d30))
      lad.position.set(1.85, H / 2 + 0.5, 0)
      g.add(lad)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.5, 20), std(0x9a968c, { roughness: 0.95 }))
      base.position.y = 0.25
      g.add(base)
      g.position.copy(P(z, 48 + i * 4, GY))
      root.add(g)
    })
    /* مبنى التحكّم ومستودع */
    const ctl = new THREE.Mesh(new THREE.BoxGeometry(13, 5, 7), std(0xe9e3d3, { roughness: 0.85, metalness: 0 }))
    const cz = -330
    ctl.position.copy(P(cz, 44, GY + 2.5))
    ctl.rotation.y = toRiver(cz) + Math.PI * 0
    ctl.castShadow = !low
    root.add(ctl)
    const roofC = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.4, 7.6), std(0x8a8d90))
    roofC.position.copy(ctl.position).add(new THREE.Vector3(0, 2.7, 0))
    roofC.rotation.y = ctl.rotation.y
    root.add(roofC)
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 9.6), std(0x1d2733, { roughness: 0.2, metalness: 0.4 }))
    win.position.copy(ctl.position)
    win.position.x -= 6.6
    win.position.y = GY + 3
    win.scale.z = 0.9
    win.rotation.y = ctl.rotation.y
    root.add(win)
  }

  /* --- خطوط أنابيب طويلة على دعامات --- */
  let jetty
  {
    const y1 = GY + 1.25
    /* جامع رئيسي موازٍ للنهر يجمع رؤوس الآبار */
    const col = []
    for (let z = -224; z >= -338; z -= 14) col.push(P(z, 33, y1 + (z % 28 ? 0 : 0)))
    pipe(col, 0.42, 0xd8a21e, { sup: 6, flangeEvery: 9 })
    pipe(col.map((p) => p.clone().add(new THREE.Vector3(2.2, 0, 0))), 0.3, 0x3f7a4a, { sup: 6, flangeEvery: 9 })
    /* من كل بئر إلى الجامع */
    ;[-238, -262, -286, -310].forEach((z, i) => {
      const a = P(z, 29 + (i % 2) * 2, GY + 2.0)
      const b = P(z, 33, y1)
      pipe([a, new THREE.Vector3(a.x + 1, y1 + 0.6, z), new THREE.Vector3(b.x - 0.2, y1, z - 0.2), b], 0.2, 0xb0302a, { flangeEvery: 3 })
    })
    /* من الجامع إلى وحدة الفصل ثم إلى الخزانات: ممرّات عرضية */
    ;[-256, -270, -284].forEach((z, i) => {
      const a = P(z, 33, y1)
      const b = P(z, 42, y1 + 0.2)
      pipe([a, new THREE.Vector3(a.x + 4, y1, z), new THREE.Vector3(a.x + 5, y1 + 3.6, z), new THREE.Vector3(b.x - 5, y1 + 3.6, z), new THREE.Vector3(b.x - 4, 5.2, z), P(z, 42, 5.4)], 0.32, [0x3e6a8a, 0xd8a21e, 0x3e6a8a][i], { flangeEvery: 6 })
    })
    /* خط التصدير الطويل نحو الميناء والمنصّة، يتبع تضاريس الأرض مع حلقات تمدّد */
    const trunk = []
    for (let z = -224; z >= -338; z -= 10) trunk.push(P(z, 38, terrainH(B(z) + 38, z) + 1.3))
    pipe(trunk, 0.55, 0x2f6a8a, { sup: 6, flangeEvery: 8 })
    /* حلقة تمدّد على شكل U */
    ;[-250, -290].forEach((z) => {
      const p0 = P(z, 38, GY + 1.3)
      const p1 = P(z, 38, GY + 7.5)
      const p2 = P(z - 9, 38, GY + 7.5)
      const p3 = P(z - 9, 38, GY + 1.3)
      pipe([p0, p1, p2, p3], 0.42, 0x2f6a8a, { flangeEvery: 5 })
    })
    /* من الخط الرئيسي إلى المنصّة داخل النهر */
    const JZ = -280
    const jt = [P(JZ, 38, y1 + 0.2), P(JZ, 30, y1), P(JZ, 12, y1), P(JZ, 3, y1), P(JZ, -6, y1 + 0.1), P(JZ, -22, y1 + 0.2)]
    pipe(jt, 0.5, 0x2f6a8a, { sup: 5, flangeEvery: 6 })
    pipe(jt.map((p) => p.clone().add(new THREE.Vector3(0, 0, 1.3))), 0.3, 0xb0302a, { sup: 0, flangeEvery: 6 })
    /* منصّة التحميل: سطح فوق ركائز داخل الماء، ذراع تحميل ومصابيح */
    const jg = new THREE.Group()
    const deck = new THREE.Mesh(new THREE.BoxGeometry(24, 0.5, 6), std(0x6b6e70, { roughness: 0.9 }))
    deck.position.set(-12, GY + 0.2, 0)
    deck.receiveShadow = true
    jg.add(deck)
    const head = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 14), std(0x6b6e70, { roughness: 0.9 }))
    head.position.set(-24, GY + 0.2, 0)
    jg.add(head)
    for (let x = -2; x > -27; x -= 4.6)
      [-1, 1].forEach((s) => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 5.4, 10), std(0x5a4d3f))
        p.position.set(x, -1.6, s * 2.6)
        jg.add(p)
      })
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 7.5, 10), std(0xb0302a))
    arm.position.set(-24, GY + 4.0, 0)
    arm.rotation.z = Math.PI / 2
    jg.add(arm)
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 5.2, 10), std(0xd8a21e))
    mast.position.set(-24, GY + 2.8, 0)
    jg.add(mast)
    ;[[-26, -6], [-26, 6], [-14, 0]].forEach(([x, zz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.6, 8), std(0x23221f))
      post.position.set(x, GY + 2.2, zz)
      jg.add(post)
      const gl = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffe0a0, emissiveIntensity: 0.8 }))
      gl.position.set(x, GY + 4.1, zz)
      jg.add(gl)
    })
    jg.position.copy(P(JZ, 0, 0))
    root.add(jg)
    jetty = { z: JZ }
  }

  /* --- حواجز وأعمدة ولافتة المدخل --- */
  {
    const g = new THREE.Group()
    const sand = std(0xd9c9a3, { roughness: 0.9, metalness: 0 })
    const sandDark = std(0xb8a47b, { roughness: 0.95, metalness: 0 })
    const goldM = std(0xcaa25a, { metalness: 0.75, roughness: 0.3 })
    const blackG = std(0x111111, { metalness: 0.5, roughness: 0.18 })
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(23, 0.8, 4.6), sandDark)
    b1.position.y = 0.4
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(21.4, 0.8, 3.8), sand)
    b2.position.y = 1.2
    g.add(b1, b2)
    ;[-1, 1].forEach((sd) => {
      const x = sd * 9.2
      const col = new THREE.Mesh(new THREE.BoxGeometry(3.2, 12.6, 2.6), sand)
      col.position.set(x, 7.1, 0)
      col.castShadow = !low
      const band = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.5, 2.85), goldM)
      band.position.set(x, 3.0, 0)
      const band2 = band.clone()
      band2.position.y = 12.2
      ;[-0.8, 0, 0.8].forEach((o) => {
        const groove = new THREE.Mesh(new THREE.BoxGeometry(0.16, 8.4, 0.08), goldM)
        groove.position.set(x + o, 7.6, 1.34)
        g.add(groove)
      })
      const cap = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.7, 3.3), sandDark)
      cap.position.set(x, 13.75, 0)
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 2.0), sand)
      top.position.set(x, 14.35, 0)
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffd78a, emissiveIntensity: 1.0 }))
      lamp.position.set(x, 15.1, 0)
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 8), goldM)
      fin.position.set(x, 15.9, 0)
      g.add(col, band, band2, cap, top, lamp, fin)
    })
    const under = new THREE.Mesh(new THREE.BoxGeometry(15.2, 3.7, 1.5), sand)
    under.position.set(0, 3.45, 0)
    g.add(under)
    const underBand = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.3, 1.7), goldM)
    underBand.position.set(0, 5.3, 0)
    g.add(underBand)
    const sg = signTex()
    const panel = new THREE.Mesh(new THREE.BoxGeometry(14.6, 5.1, 0.45), [
      std(0x1a1a1a),
      std(0x1a1a1a),
      std(0x1a1a1a),
      std(0x1a1a1a),
      new THREE.MeshStandardMaterial({ map: sg, emissiveMap: sg, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.45 }),
      std(0x0b241b),
    ])
    panel.position.set(0, 7.8, 0.1)
    g.add(panel)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(15.3, 5.8, 0.4), goldM)
    frame.position.set(0, 7.8, -0.05)
    g.add(frame)
    const corn = new THREE.Mesh(new THREE.BoxGeometry(15.9, 0.55, 1.0), goldM)
    corn.position.set(0, 10.95, 0.15)
    g.add(corn)
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.7), sand)
      m.position.set(-6.8 + i * 1.7, 11.7, 0.12)
      g.add(m)
    }
    const dp = []
    for (let i = 0; i <= 24; i++) {
      const u = i / 24
      const y = u * 3.3
      const r = Math.sin(Math.pow(u, 0.7) * Math.PI) * 1.15
      dp.push(new THREE.Vector2(Math.max(0.001, r), y))
    }
    const drop = new THREE.Mesh(new THREE.LatheGeometry(dp, 32), blackG)
    drop.position.set(0, 12.0, 0.1)
    drop.scale.set(1, 1.05, 0.6)
    g.add(drop)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.12, 8, 28), goldM)
    ring.position.set(0, 13.0, 0.1)
    ring.scale.set(1, 1.1, 0.6)
    g.add(ring)
    ;[-5.2, 0, 5.2].forEach((x) => {
      const fl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.5, 10), std(0x2b2d30, { metalness: 0.6 }))
      fl.position.set(x, 1.65, 1.9)
      fl.rotation.x = -0.45
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), new THREE.MeshBasicMaterial({ color: 0xfff1cf }))
      lens.position.set(x, 1.78, 2.18)
      lens.rotation.x = -0.45
      g.add(fl, lens)
    })
    const bed = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, 1.6), std(0x4a7a2a, { roughness: 1, metalness: 0 }))
    bed.position.set(0, 0.25, 3.2)
    g.add(bed)
    const cols2 = [0xd8402f, 0xf0c53a, 0xf4f0e6, 0xe36aa0]
    for (let i = 0; i < 30; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5), std(cols2[i % 4], { roughness: 0.6, metalness: 0 }))
      f.position.set(-8.4 + i * 0.58, 0.62, 3.2 + (((i * 7) % 5) - 2) * 0.26)
      g.add(f)
    }
    ;[-12.8, 12.8].forEach((x) => {
      const fg = makeFlag(0.5, 9)
      fg.position.set(x, 0, 0)
      g.add(fg)
    })
    const zs = -228
    g.position.copy(P(zs, 12, GY))
    g.rotation.y = toRiver(zs)
    g.scale.setScalar(1.2)
    root.add(g)
    /* سياج أمان أصفر وأسود على حدود الموقع */
    const nF = 40
    const fence = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 1.7, 0.16), std(0xe0b21a), nF)
    const rail = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.1, 3), std(0x2b2a28), nF * 2)
    let ri = 0
    for (let i = 0; i < nF; i++) {
      const z = OIL.z0 - 3 - (i * (OIL.z1 - OIL.z0 + 6)) / (nF - 1)
      const x = B(z) + 9.4
      const nearSign = Math.abs(z + 228) < 17
      dummy.scale.setScalar(nearSign ? 0 : 1)
      dummy.position.set(x, GY + 0.85, z)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      fence.setMatrixAt(i, dummy.matrix)
      ;[0.5, 1.4].forEach((yy) => {
        dummy.position.set(x, GY + yy, z - 1.5)
        dummy.rotation.set(0, Math.atan2(0, 1), 0)
        dummy.updateMatrix()
        rail.setMatrixAt(ri++, dummy.matrix)
      })
    }
    rail.count = ri
    root.add(fence, rail)
  }

  /* --- شاحنات صهاريج راسية عند نقطة التحميل --- */
  {
    const fleet = createFleet({ tanker: 3, pickup: 2 })
    const spots = {
      tanker: [[-225, 86, 0.1], [-229, 86, 0.1], [-233, 86, 0.1]],
      pickup: [[-258, 25, 1.2], [-296, 56, 2.2]],
    }
    fleet.forEach((f) => {
      root.add(f.im)
      for (let i = 0; i < f.n; i++) {
        const [z, d, y] = spots[f.name][i]
        dummy.position.copy(P(z, d, GY))
        dummy.rotation.set(0, f.name === 'tanker' ? Math.atan2(0, 1) + 0 : toRiver(z) + Math.PI / 2 + y, 0)
        dummy.updateMatrix()
        f.im.setMatrixAt(i, dummy.matrix)
      }
      f.im.instanceMatrix.needsUpdate = true
    })
  }

  /* --- حلقات الأنابيب والدعامات كنُسخ --- */
  {
    const n = flanges.length
    const fl = new THREE.InstancedMesh(flangeG, flangeMat, Math.max(1, n))
    const up = new THREE.Vector3(0, 1, 0)
    flanges.forEach((f, i) => {
      dummy.position.copy(f.p)
      dummy.quaternion.setFromUnitVectors(up, f.t)
      dummy.scale.set(f.r, 1, f.r)
      dummy.updateMatrix()
      fl.setMatrixAt(i, dummy.matrix)
    })
    dummy.scale.set(1, 1, 1)
    dummy.quaternion.identity()
    root.add(fl)
    const sp = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 1, 0.5), std(0x9a968c, { roughness: 1, metalness: 0 }), Math.max(1, supports.length))
    supports.forEach((s, i) => {
      const h = Math.max(0.3, s.y - GY + 0.15)
      dummy.position.set(s.x, GY + h / 2 - 0.1, s.z)
      dummy.scale.set(1, h, 1)
      dummy.updateMatrix()
      sp.setMatrixAt(i, dummy.matrix)
    })
    root.add(sp)
    dummy.scale.set(1, 1, 1)
  }

  function update(t) {
    uni.uTime.value = t
    anim.forEach((f) => f(t))
  }
  update(0)
  const obstacles = [
    { zE: jetty.z, off: halfW(jetty.z) - 12, hz: 4, hx: 14, moored: true, waiting: false },
    { zE: jetty.z, off: halfW(jetty.z) - 24, hz: 9, hx: 5, moored: true, waiting: false },
  ]
  return { update, obstacles: () => obstacles }
}
