import * as THREE from 'three'
import { makePalmVariants, makeReeds, makeGrass, swayMaterial } from './palm.js'
import { createPort, portBlend, portMask, inPort } from './port.js'
import { makeMashoof, makeDhow, makeTanker, makeContainerShip, makeCargoShip, makeBargeTug, makeWake, animateVessel, shipUniforms } from './boats.js'

/* مجسّم البصرة: نهر يتلوّى بين رمال ذهبية ونخيل وزوارق، تطير الكاميرا فوقه مع التمرير */

export const RIVER_LEN = 480
const SAND = 0xbf9e66
const PAPER = 0xf7f0e2
const INK = 0x2a1f12

const riverX = (z) => Math.sin(z * 0.013) * 34 + Math.sin(z * 0.041 + 1) * 9
const halfW = (z) => 105 + Math.sin(z * 0.02) * 8
const leftBank = (z) => riverX(z) - halfW(z)

const rng = (seed) => {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

const ISL = { z: -235, off: 66, rx: 28, rz: 42 }
function islandK(x, z) {
  const cx = riverX(z) + ISL.off
  const d = Math.hypot((x - cx) / ISL.rx, (z - ISL.z) / ISL.rz)
  return 1 - THREE.MathUtils.smoothstep(d, 0.55, 1.0)
}
function terrainH(x, z) {
  const d = Math.abs(x - riverX(z))
  const w = halfW(z)
  const dune = Math.sin(x * 0.045 + z * 0.02) * 2.2 + Math.cos(z * 0.03 - x * 0.02) * 1.8 + Math.sin(x * 0.11) * Math.cos(z * 0.09) * 0.7
  const bank = THREE.MathUtils.smoothstep(d, w - 1, w + 11)
  let h = THREE.MathUtils.lerp(-2.4, 0.7 + dune * 0.55, bank)
  if (d > w + 36) h += (d - w - 36) * 0.07
  const isl = islandK(x, z)
  if (isl > 0) h = Math.max(h, -2.4 + isl * 3.4 + Math.sin(x * 0.4) * Math.cos(z * 0.3) * 0.15 * isl)
  return portBlend(h, x, z, riverX(z), halfW(z))
}

/*
  مسار كاميرا سينمائي: نقاط [التقدّم، موضع الكاميرا(u,y,z)، نقطة النظر(u,y,z)، المجال، الميلان].
  u = البعد عن الضفة اليسرى نحو النهر. المسار يعبر النهر يميناً ويساراً ويدور حول الجزيرة
  ثم يصعد فوق الميناء. الاستيفاء هيرميتي سلس بلا اهتزاز.
*/
const ISLAND_U = 171
const WAYPOINTS = (() => {
  const w = [
    [0.0, [58, 42, 30], [112, 0, -150], 50, 0],
    [0.06, [40, 26, -40], [105, 1, -150], 52, -2],
    [0.12, [22, 12, -95], [80, 2, -150], 54, -3],
    [0.17, [48, 9, -125], [150, 3, -175], 56, 3],
    [0.23, [88, 7, -155], [190, 4, -215], 58, 4],
    [0.29, [112, 9, -178], [150, 6, -232], 54, 0],
  ]
  /* مدار حول جزيرة النخيل: زاوية ١٨٠° إلى ‎-٩٩°‎ */
  const n = 16
  for (let i = 0; i <= n; i++) {
    const k = i / n
    const p = 0.33 + k * 0.24
    const th = Math.PI * (1.0 - 1.55 * k)
    w.push([p, [ISLAND_U + 48 * Math.cos(th), 16 - 4 * k, -235 + 48 * Math.sin(th)], [ISLAND_U, 5, -235], 50, Math.sin(k * Math.PI) * -3])
  }
  w.push(
    [0.6, [150, 8, -300], [60, 7, -335], 52, 0],
    [0.66, [120, 6, -330], [40, 8, -345], 56, 3],
    [0.72, [90, 8, -350], [10, 10, -368], 54, 2],
    [0.78, [64, 18, -360], [-10, 12, -385], 52, 0],
    [0.84, [58, 26, -392], [-25, 12, -410], 50, 0],
    [0.9, [52, 38, -425], [-30, 6, -445], 48, -3],
    [0.95, [64, 52, -455], [-35, 0, -480], 46, -2],
    [1.0, [50, 74, -440], [-20, 0, -510], 44, 0]
  )
  return w
})()
function makeTrack(get) {
  const T = WAYPOINTS.map((k) => k[0])
  const Y = WAYPOINTS.map(get)
  const n = T.length
  const m = Y.map((_, i) => {
    if (i === 0) return (Y[1] - Y[0]) / (T[1] - T[0])
    if (i === n - 1) return (Y[n - 1] - Y[n - 2]) / (T[n - 1] - T[n - 2])
    return ((Y[i + 1] - Y[i - 1]) / (T[i + 1] - T[i - 1])) * 0.9
  })
  return (t) => {
    t = Math.min(1, Math.max(0, t))
    let i = 0
    while (i < n - 2 && t > T[i + 1]) i++
    const h = T[i + 1] - T[i]
    const s = (t - T[i]) / h
    const s2 = s * s
    const s3 = s2 * s
    return (2 * s3 - 3 * s2 + 1) * Y[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * Y[i + 1] + (s3 - s2) * h * m[i + 1]
  }
}
const camU = makeTrack((k) => k[1][0])
const camY = makeTrack((k) => k[1][1])
const camZ = makeTrack((k) => k[1][2])
const lokU = makeTrack((k) => k[2][0])
const lokY = makeTrack((k) => k[2][1])
const lokZ = makeTrack((k) => k[2][2])
const fovT = makeTrack((k) => k[3])
const rollT = makeTrack((k) => k[4])

function latticeTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#8c6c34'
  g.fillRect(0, 0, 128, 128)
  g.fillStyle = '#f1e4c4'
  for (let y = 0; y < 128; y += 32) {
    for (let x = 0; x < 128; x += 32) {
      g.beginPath()
      g.moveTo(x + 16, y + 2)
      g.lineTo(x + 30, y + 16)
      g.lineTo(x + 16, y + 30)
      g.lineTo(x + 2, y + 16)
      g.closePath()
      g.fill()
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1.5, 1.5)
  return t
}

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  gr.addColorStop(0, 'rgba(255,248,225,1)')
  gr.addColorStop(0.35, 'rgba(255,225,160,.55)')
  gr.addColorStop(1, 'rgba(255,225,160,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

function grassTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = '#7f9a4a'
  g.fillRect(0, 0, 512, 512)
  const r = rng(5)
  for (let i = 0; i < 9000; i++) {
    const x = r() * 512
    const y = r() * 512
    const l = 5 + r() * 12
    const a = -Math.PI / 2 + (r() - 0.5) * 1.0
    const v = r()
    g.strokeStyle = v < 0.5 ? `rgba(${40 + v * 80},${90 + v * 100},${20 + v * 40},.55)` : `rgba(${150 + v * 60},${170 + v * 50},${70 + v * 40},.4)`
    g.lineWidth = 0.8 + r() * 1.1
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l)
    g.stroke()
  }
  for (let i = 0; i < 500; i++) {
    g.fillStyle = `rgba(${20 + r() * 40},${50 + r() * 40},${15},.25)`
    g.beginPath()
    g.arc(r() * 512, r() * 512, 3 + r() * 9, 0, 7)
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(90, 140)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function createScene(canvas, { low = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !low, alpha: false, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1.4 : 2))
  renderer.setClearColor(PAPER)
  if (!low) {
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
  }

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(PAPER)
  scene.fog = new THREE.Fog(PAPER, 110, low ? 330 : 440)

  const camera = new THREE.PerspectiveCamera(52, 1, 0.5, 1400)

  scene.add(new THREE.HemisphereLight(0xfffaf0, 0x8aa05a, 1.1))
  const sun = new THREE.DirectionalLight(0xfff0d2, 2.0)
  sun.position.set(-50, 60, 20)
  if (!low) {
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    const sc = sun.shadow.camera
    sc.left = -80
    sc.right = 80
    sc.top = 80
    sc.bottom = -80
    sc.near = 1
    sc.far = 260
    sun.shadow.bias = -0.0006
    sun.shadow.normalBias = 0.4
  }
  scene.add(sun, sun.target)
  const uTime = { value: 0 }

  /* الشمس البعيدة */
  const disc = new THREE.Mesh(new THREE.CircleGeometry(62, 64), new THREE.MeshBasicMaterial({ color: 0xe3c58d, fog: false }))
  disc.position.set(0, 52, -640)
  scene.add(disc)
  const halo = new THREE.Mesh(new THREE.CircleGeometry(96, 64), new THREE.MeshBasicMaterial({ color: 0xf1e1bb, fog: false }))
  halo.position.set(0, 52, -645)
  scene.add(halo)

  /* التضاريس */
  const tw = 440
  const tl = 700
  const tg = new THREE.PlaneGeometry(tw, tl, low ? 90 : 130, low ? 130 : 190)
  tg.rotateX(-Math.PI / 2)
  tg.translate(0, 0, -250)
  const tp = tg.attributes.position
  const cols = new Float32Array(tp.count * 3)
  const mud = new THREE.Color(0x4a3a22)
  const lush = new THREE.Color(0x3f7a22)
  const meadow = new THREE.Color(0x5f9a2c)
  const olive = new THREE.Color(0x86973a)
  const r1 = rng(7)
  const tmp = new THREE.Color()
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i)
    const z = tp.getZ(i)
    const h = terrainH(x, z)
    tp.setY(i, h)
    const d = Math.abs(x - riverX(z)) - halfW(z)
    const k = THREE.MathUtils.clamp(d / 5, 0, 1)
    const patch = 0.5 + 0.5 * Math.sin(x * 0.045 + Math.sin(z * 0.03) * 2.0) * Math.cos(z * 0.037 - x * 0.012)
    tmp.copy(lush).lerp(meadow, patch)
    tmp.lerp(olive, THREE.MathUtils.clamp(h * 0.12 + Math.max(0, d - 30) * 0.008, 0, 0.55))
    const ik = islandK(x, z)
    tmp.lerp(mud, (1 - k) * 0.85 * (1 - Math.min(1, ik * 2.2)))
    if (ik > 0 && ik < 0.45) tmp.lerp(new THREE.Color(0xb9a77a), (1 - ik / 0.45) * 0.7)
    const pmk = portMask(x, z, riverX(z), halfW(z))
    if (pmk > 0.02) tmp.lerp(new THREE.Color(0x77705f), Math.min(1, pmk * 1.2))
    tmp.offsetHSL((r1() - 0.5) * 0.015, (r1() - 0.5) * 0.06, (r1() - 0.5) * 0.04)
    cols[i * 3] = tmp.r
    cols[i * 3 + 1] = tmp.g
    cols[i * 3 + 2] = tmp.b
  }
  tg.setAttribute('color', new THREE.BufferAttribute(cols, 3))
  tg.computeVertexNormals()
  const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, map: grassTexture(), roughness: 1 }))
  terrain.receiveShadow = true
  scene.add(terrain)

  /* النهر */
  const rows = 240
  const cl = 14
  const z0 = 30
  const z1 = -560
  const wp = new Float32Array((rows + 1) * (cl + 1) * 3)
  const widx = []
  for (let i = 0; i <= rows; i++) {
    const z = z0 + ((z1 - z0) * i) / rows
    for (let j = 0; j <= cl; j++) {
      const k = (i * (cl + 1) + j) * 3
      wp[k] = riverX(z) + (j / cl - 0.5) * 2 * (halfW(z) + 2.5)
      wp[k + 1] = -0.95
      wp[k + 2] = z
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cl; j++) {
      const a = i * (cl + 1) + j
      const b = a + cl + 1
      widx.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }
  const wuv = new Float32Array((rows + 1) * (cl + 1) * 2)
  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= cl; j++) {
      const k = (i * (cl + 1) + j) * 2
      wuv[k] = j / cl
      wuv[k + 1] = i / rows
    }
  }
  const wg = new THREE.BufferGeometry()
  wg.setAttribute('position', new THREE.BufferAttribute(wp, 3))
  wg.setAttribute('uv', new THREE.BufferAttribute(wuv, 2))
  wg.setIndex(widx)

  /* ماء حقيقي: انعكاس فرينل، تموّجات، لمعان الشمس، وعمق يتدرّج نحو الضفاف */
  const waterMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uFogColor: { value: new THREE.Vector3(0.969, 0.941, 0.886) },
      uFogNear: { value: scene.fog.near },
      uFogFar: { value: scene.fog.far },
    },
    vertexShader: `
      varying vec3 vWorld;
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        vUv = uv;
        vec3 p = position;
        p.y += sin(p.x * 0.5 + uTime * 1.2 + p.z * 0.2) * 0.05;
        vec4 w = modelMatrix * vec4(p, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: `
      varying vec3 vWorld;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uFogColor;
      uniform float uFogNear;
      uniform float uFogFar;
      float hgt(vec2 p) {
        float t = uTime;
        float h = sin(p.x * 0.9 + t * 1.3) * 0.5;
        h += sin(p.y * 1.3 - t * 1.1 + p.x * 0.4) * 0.5;
        h += sin((p.x + p.y) * 2.1 + t * 2.0) * 0.25;
        h += sin(p.x * 3.7 - p.y * 2.9 + t * 2.6) * 0.14;
        h += sin(p.x * 7.3 + p.y * 6.1 - t * 3.3) * 0.07;
        return h;
      }
      void main() {
        vec2 p = vWorld.xz;
        float e = 0.08;
        float dist0 = length(vWorld - cameraPosition);
        float amp = 0.075 * (1.0 - smoothstep(30.0, 200.0, dist0) * 0.85);
        vec3 n = normalize(vec3(
          -(hgt(p + vec2(e, 0.0)) - hgt(p - vec2(e, 0.0))) / (2.0 * e) * amp,
          1.0,
          -(hgt(p + vec2(0.0, e)) - hgt(p - vec2(0.0, e))) / (2.0 * e) * amp
        ));
        vec3 V = normalize(cameraPosition - vWorld);
        float ndv = max(dot(n, V), 0.0);
        float fres = 0.03 + 0.97 * pow(1.0 - ndv, 4.0);

        float edge = abs(vUv.x - 0.5) * 2.0;
        float dEdge = (1.0 - edge) * 105.0;
        float shallow = 1.0 - smoothstep(0.0, 18.0, dEdge);
        vec3 deep = vec3(0.12, 0.29, 0.28);
        vec3 mid = vec3(0.26, 0.41, 0.33);
        vec3 shore = vec3(0.52, 0.55, 0.38);
        vec3 body = mix(mix(deep, mid, 1.0 - smoothstep(14.0, 80.0, dEdge)), shore, shallow);
        float murk = 0.5 + 0.5 * sin(p.x * 0.07 + p.y * 0.05);
        body = mix(body, vec3(0.34, 0.38, 0.28), murk * 0.4);

        vec3 R = reflect(-V, n);
        float sky = clamp(R.y * 1.6, 0.0, 1.0);
        vec3 skyCol = mix(vec3(0.99, 0.93, 0.80), vec3(0.62, 0.78, 0.86), sky);
        vec3 col = mix(body, skyCol, fres);

        vec3 L = normalize(vec3(-0.05, 0.28, -1.0));
        float spec = pow(max(dot(R, L), 0.0), 240.0) * 3.0 + pow(max(dot(R, L), 0.0), 18.0) * 0.28;
        col += vec3(1.0, 0.9, 0.68) * spec;

        float foam = (1.0 - smoothstep(0.0, 2.2, dEdge)) * (0.5 + 0.5 * sin(p.x * 3.0 + p.y * 2.0 + uTime * 1.5));
        col = mix(col, vec3(0.93, 0.9, 0.8), foam * 0.35);

        float d = length(vWorld - cameraPosition);
        col = mix(col, uFogColor, smoothstep(uFogNear, uFogFar, d));
        float alpha = smoothstep(0.0, 2.5, dEdge);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  })
  const water = new THREE.Mesh(wg, waterMat)
  scene.add(water)

  /* النخيل */
  const variants = makePalmVariants()
  const palmCount = low ? 90 : 210
  const dummy = new THREE.Object3D()
  const r2 = rng(21)
  const mats = variants.map(() => [])
  let placed = 0
  let guard = 0
  while (placed < palmCount && guard++ < 5000) {
    const z = -60 - r2() * (RIVER_LEN - 70)
    const side = r2() < 0.88 ? -1 : 1
    const grove = Math.sin(z * 0.05) * 0.5 + 0.5
    const gap = halfW(z) + 2 + r2() * (4 + 26 * (1 - grove))
    if (r2() > 0.35 + grove * 0.65) continue
    const x = riverX(z) + side * gap
    if (inPort(x, z, riverX(z), halfW(z), 0.001) || (side < 0 && z < -360 && z > -510 && gap < halfW(z) + 60)) continue
    const y = terrainH(x, z) - 0.25
    const sc = 0.8 + r2() * 0.55
    dummy.position.set(x, y, z)
    dummy.rotation.set((r2() - 0.5) * 0.06, r2() * Math.PI * 2, (r2() - 0.5) * 0.06)
    dummy.scale.setScalar(sc)
    dummy.updateMatrix()
    mats[Math.floor(r2() * variants.length)].push(dummy.matrix.clone())
    placed++
  }
  for (let n = 0; n < (low ? 24 : 70); n++) {
    const z = ISL.z + (r2() - 0.5) * ISL.rz * 1.5
    const x = riverX(z) + ISL.off + (r2() - 0.5) * ISL.rx * 1.5
    if (islandK(x, z) < 0.62) continue
    dummy.position.set(x, terrainH(x, z) - 0.25, z)
    dummy.rotation.set((r2() - 0.5) * 0.08, r2() * Math.PI * 2, (r2() - 0.5) * 0.08)
    dummy.scale.setScalar(0.7 + r2() * 0.6)
    dummy.updateMatrix()
    mats[Math.floor(r2() * variants.length)].unshift(dummy.matrix.clone())
  }
  const trunkMat = swayMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), uTime, 0.6)
  const frondMat = swayMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }), uTime, 0.6, true)
  const dateMat = swayMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }), uTime, 0.6)
  const palmMeshes = []
  variants.forEach((v, i) => {
    const list = mats[i]
    if (!list.length) return
    ;[
      [v.trunk, trunkMat],
      [v.fronds, frondMat],
      [v.dates, dateMat],
    ].forEach(([geo, mat]) => {
      const im = new THREE.InstancedMesh(geo, mat, list.length)
      list.forEach((m, j) => im.setMatrixAt(j, m))
      im.castShadow = !low
      im.frustumCulled = false
      palmMeshes.push({ mesh: im, full: list.length })
      scene.add(im)
    })
  })

  /* قصب الضفاف */
  const reedGeo = makeReeds()
  const reedCount = low ? 240 : 620
  const reeds = new THREE.InstancedMesh(reedGeo, swayMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }), uTime, 3.0), reedCount)
  const r4 = rng(555)
  for (let i = 0; i < reedCount; i++) {
    const z = -10 - r4() * (RIVER_LEN + 40)
    const side = r4() < 0.85 ? -1 : 1
    const x = riverX(z) + side * (halfW(z) + 0.2 + r4() * 4.5)
    dummy.position.set(x, terrainH(x, z) - 0.15, z)
    dummy.rotation.set(0, r4() * 6.28, 0)
    dummy.scale.setScalar(inPort(x, z, riverX(z), halfW(z), 0.001) ? 0 : 0.8 + r4() * 1.1)
    dummy.updateMatrix()
    reeds.setMatrixAt(i, dummy.matrix)
  }
  reeds.frustumCulled = false
  scene.add(reeds)

  /* عشب كثيف */
  const grassGeo = makeGrass()
  const grassCount = low ? 3500 : 11000
  const grass = new THREE.InstancedMesh(grassGeo, swayMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }), uTime, 45), grassCount)
  const r5 = rng(909)
  const gc = new THREE.Color()
  for (let i = 0; i < grassCount; i++) {
    const z = 10 - r5() * (RIVER_LEN + 60)
    const side = r5() < 0.5 ? -1 : 1
    const off = halfW(z) + 1.2 + Math.pow(r5(), 1.6) * 62
    let x = riverX(z) + side * off
    let zz = z
    if (i % 11 === 0) {
      zz = ISL.z + (r5() - 0.5) * ISL.rz * 1.7
      x = riverX(zz) + ISL.off + (r5() - 0.5) * ISL.rx * 1.7
    }
    dummy.position.set(x, terrainH(x, zz) - 0.05, zz)
    dummy.rotation.set(0, r5() * 6.28, 0)
    dummy.scale.setScalar(inPort(x, zz, riverX(zz), halfW(zz), 0.001) || (i % 11 === 0 && islandK(x, zz) < 0.5) ? 0 : 0.9 + r5() * 1.4)
    dummy.updateMatrix()
    grass.setMatrixAt(i, dummy.matrix)
    gc.setHSL(0.24 + (r5() - 0.5) * 0.05, 0.55 + r5() * 0.2, 0.62 + r5() * 0.35)
    grass.setColorAt(i, gc)
  }
  grass.frustumCulled = false
  scene.add(grass)

  /* القوارب والسفن */
  const darkMat = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.8, flatShading: true })
  const boats = []
  const yawAt = (z, flip) => Math.atan2(2, riverX(z - 1) - riverX(z + 1)) + (flip ? Math.PI : 0)
  function place(g, { z, off, scale = 1, drift = 0, flip = false, bob = 0.1, yaw = 0, speed = 0, slow = 0, spawnZ = -575 }) {
    const holder = new THREE.Group()
    g.scale.setScalar(scale)
    g.position.y = -0.95 - (g.userData.draft || 0) * scale
    holder.add(g)
    const wk = makeWake(g.userData.L * scale, g.userData.B * scale, g.userData.kind === 'boat' ? 'boat' : 'ship')
    holder.add(wk)
    holder.position.set(riverX(z) + off, 0, z)
    holder.rotation.y = yawAt(z, flip) + yaw
    scene.add(holder)
    boats.push({ h: holder, g, wk, z, off, drift, flip, bob, yaw, speed, slow, spawnZ, phase: Math.random() * 6, prevYaw: holder.rotation.y, waiting: false })
  }
  ;[
    [-116, -84], [-134, -62], [-150, -30], [-178, -92], [-224, -70], [-262, -46], [-420, -80],
  ].forEach(([z, off]) => place(makeMashoof(), { z, off, scale: 1.25, drift: 3, flip: Math.random() < 0.5, slow: 0.28 }))
  ;[
    [-322, -62], [-352, -18], [-372, -88],
  ].forEach(([z, off], i) => place(makeDhow(), { z, off, scale: 1 - i * 0.1, flip: i === 1, speed: i === 1 ? 1.7 : -1.5 - i * 0.2, yaw: [0.34, -0.3, 0.28][i], bob: 0.14 }))
  /* سفن متحرّكة في المسار الأيمن (كلها بالسرعة نفسها كي لا تتصادم) */
  place(makeCargoShip(), { z: -110, off: 24, speed: -2.6, bob: 0.05 })
  place(makeTanker(), { z: -300, off: 24, scale: 0.9, speed: -2.6, bob: 0.05 })
  /* بارجة بقاطرة في المسار الأيسر تصعد النهر قبل منطقة الميناء */
  place(makeBargeTug(), { z: -300, off: -48, flip: true, speed: 1.9, bob: 0.06, spawnZ: -362 })

  /* ميناء أم قصر */
  const port = createPort(scene, { riverX, halfW, low })
  place(makeContainerShip(), { z: -402, off: port.berth(-402, 4.6), bob: 0.04 })
  place(makeTanker(), { z: -472, off: port.berth(-472, 3.9), scale: 0.9, bob: 0.04 })

  /* بيوت الشناشيل والمسجد */
  const latTex = latticeTexture()
  const latMat = new THREE.MeshStandardMaterial({ map: latTex, roughness: 1 })
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf3e9d2, roughness: 1, flatShading: true })
  function house(x, z, s) {
    const g = new THREE.Group()
    const body = new THREE.Mesh(new THREE.BoxGeometry(7, 10, 7), wallMat)
    body.position.y = 5
    g.add(body)
    ;[-1.8, 1.8].forEach((dx) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.2, 1.4), latMat)
      b.position.set(dx, 6.6, 4)
      g.add(b)
      const roof = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 1.8), darkMat)
      roof.position.set(dx, 8.4, 4)
      g.add(roof)
    })
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3, 0.2), darkMat)
    door.position.set(0, 1.5, 3.55)
    g.add(door)
    g.scale.setScalar(s)
    g.position.set(x, terrainH(x, z), z)
    g.rotation.y = x > riverX(z) ? -Math.PI / 2 : Math.PI / 2
    scene.add(g)
  }
  ;[-444, -456, -468].forEach((z, i) => {
    house(riverX(z) + halfW(z) + 9, z - 5, 1.1 - (i % 2) * 0.15)
  })
  const mx = riverX(-486) + halfW(-486) + 18
  const dome = new THREE.Mesh(new THREE.SphereGeometry(5, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf3e9d2, roughness: 0.8, flatShading: true }))
  dome.position.set(mx, terrainH(mx, -486) + 9, -486)
  scene.add(dome)
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.6, 9, 18), wallMat)
  drum.position.set(mx, terrainH(mx, -486) + 4.5, -486)
  scene.add(drum)
  const minaret = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1, 24, 10), wallMat)
  minaret.position.set(mx + 8, terrainH(mx, -486) + 12, -486)
  scene.add(minaret)
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1, 3, 10), darkMat)
  cap.position.set(mx + 8, terrainH(mx, -486) + 25.5, -486)
  scene.add(cap)

  /* غبار ذهبي */
  const pc = low ? 300 : 700
  const pp = new Float32Array(pc * 3)
  const r3 = rng(99)
  for (let i = 0; i < pc; i++) {
    const z = -r3() * RIVER_LEN
    pp[i * 3] = leftBank(z) + r3() * 110
    pp[i * 3 + 1] = r3() * 38
    pp[i * 3 + 2] = z
  }
  const pg = new THREE.BufferGeometry()
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3))
  const motes = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xfffaf0, size: 3, sizeAttenuation: false, transparent: true, opacity: 0.8, depthWrite: false }))
  scene.add(motes)

  /* مراقب الجودة: يخفّف المشهد تلقائياً على الأجهزة الضعيفة كي لا يتجمّد الموقع */
  let quality = 0
  function applyQuality(l) {
    quality = l
    const dpr = window.devicePixelRatio || 1
    renderer.setPixelRatio([Math.min(dpr, low ? 1.4 : 2), Math.min(dpr, 1.25), 1][l])
    const sh = l === 0 && !low
    renderer.shadowMap.enabled = sh
    sun.castShadow = sh
    scene.traverse((o) => {
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true))
    })
    const f = [1, 0.6, 0.35][l]
    palmMeshes.forEach((p) => (p.mesh.count = Math.max(1, Math.ceil(p.full * f))))
    grass.count = Math.ceil(grassCount * [1, 0.5, 0.2][l])
    reeds.count = Math.ceil(reedCount * [1, 0.6, 0.3][l])
    resize()
  }
  try {
    const gl = renderer.getContext()
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
    const weak = /intel|uhd|iris|mali|adreno|apple gpu|swiftshader|llvmpipe|software/i.test(name) && !/arc|rtx|rx |radeon pro/i.test(name)
    if (weak || (navigator.hardwareConcurrency || 8) <= 4) setTimeout(() => applyQuality(1), 0)
  } catch (e) {}
  let accT = 0
  let accN = 0
  let lastT = performance.now()

  /* التحكّم */
  let target = 0
  let current = 0
  let mx2 = 0
  let my2 = 0
  let tmx = 0
  let tmy = 0
  let visible = true
  let raf = 0
  let t0 = performance.now()
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let fovMul = 1
  let lastFov = 0
  function resize() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    fovMul = w / h < 0.8 ? 1.28 : 1
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()

  const onMove = (e) => {
    tmx = (e.clientX / window.innerWidth - 0.5) * 2
    tmy = (e.clientY / window.innerHeight - 0.5) * 2
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 })
  io.observe(canvas)

  const look = new THREE.Vector3()
  let frame = 0
  function tick() {
    raf = requestAnimationFrame(tick)
    if (!visible) return
    const now = performance.now()
    const time = (now - t0) / 1000
    const dtm = now - lastT
    lastT = now
    if (dtm < 500) {
      accT += dtm
      accN++
      if (accN >= 40) {
        if (accT / accN > 42 && quality < 2) applyQuality(quality + 1)
        accT = 0
        accN = 0
      }
    }
    current += (target - current) * (reduce ? 1 : 0.055)
    mx2 += (tmx - mx2) * 0.05
    my2 += (tmy - my2) * 0.05

    const cz = camZ(current)
    camera.position.set(leftBank(cz) + camU(current) + mx2 * 2.5, camY(current) - my2 * 1.0, cz)
    const lzz = lokZ(current)
    look.set(leftBank(lzz) + lokU(current) + mx2 * 1.2, lokY(current), lzz)
    camera.lookAt(look)
    camera.rotateZ((rollT(current) * Math.PI) / 180 - mx2 * 0.012)
    const fv = fovT(current) * fovMul
    if (Math.abs(fv - lastFov) > 0.02) {
      camera.fov = fv
      camera.updateProjectionMatrix()
      lastFov = fv
    }
    if (!low) {
      const fx2 = camera.position.x + (look.x - camera.position.x) * 0.45
      const fz2 = camera.position.z + (look.z - camera.position.z) * 0.45
      sun.target.position.set(fx2, 0, fz2)
      sun.position.set(fx2 - 50, 62, fz2 + 22)
    }

    if (!reduce) {
      waterMat.uniforms.uTime.value = time
      uTime.value = time
      shipUniforms.uTime.value = time
      const dt = Math.min(0.05, dtm / 1000)
      boats.forEach((b, i) => {
        if (b.speed) {
          if (!b.waiting) b.z += b.speed * dt
          if (b.speed < 0 && b.z < -565) b.z = 72
          if (b.speed > 0 && b.z > 72) {
            b.waiting = true
            b.h.visible = false
          }
          if (b.waiting && Math.abs(camera.position.z - b.spawnZ) > 140) {
            b.z = b.spawnZ
            b.waiting = false
            b.h.visible = true
          }
        }
        if (b.waiting) return
        const z = b.z + (b.drift ? Math.sin(time * 0.15 + i) * b.drift : 0)
        const lat = b.off + Math.sin(time * 0.21 + b.phase) * (b.speed ? 0.5 : 0.15)
        b.h.position.set(riverX(z) + lat, Math.sin(time * 1.4 + b.phase) * b.bob, z)
        const yw = yawAt(z, b.flip) + b.yaw
        const yr = (yw - b.prevYaw) / Math.max(dt, 0.001)
        b.prevYaw = yw
        b.h.rotation.y = yw
        const turn = Math.abs(yr) < 3 ? Math.max(-0.06, Math.min(0.06, -yr * (b.speed ? 0.5 : 0.1))) : 0
        b.g.rotation.x = Math.sin(time * 0.62 + b.phase * 1.7) * 0.012 + turn
        b.g.rotation.z = Math.sin(time * 0.85 + b.phase) * 0.012
        const spd = b.speed ? Math.min(1, Math.abs(b.speed) / 3.2) : b.slow * (0.7 + 0.3 * Math.sin(time * 1.4 + b.phase))
        b.wk.userData.setSpeed(spd)
        animateVessel(b.g, time, b.phase, spd)
      })
      port.update(time, dt)
      motes.rotation.y = Math.sin(time * 0.05) * 0.02
    } else {
    }
    renderer.render(scene, camera)
  }
  tick()

  return {
    setProgress(p) {
      target = p
    },
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      renderer.dispose()
    },
  }
}
