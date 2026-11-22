/* فلكلور البصرة: فيلم يتحرّك مع التمرير، ثم تبويبات بخمس صور لكل باب */
import React, { useEffect, useRef } from 'react'
import FolkloreTabs from './FolkloreTabs.jsx'
import { subscribe, clamp, smooth } from './scroll.js'
import './folklore.css'

const A = (f) => './assets/' + f
const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const span = (p, a, b) => smooth(clamp((p - a) / (b - a)))
const mix = (a, b, t) => a + (b - a) * t

/* مشاهد الفيلم بعد أن تملأ الصورة الشاشة */
const SHOTS = [
  { img: 'f-shanasheel.jpg', line: 'خشبٌ يحفظ الحكايات.', from: 0.36 },
  { img: 'f-ashar-boat.jpg', line: 'ماءٌ يحمل الذاكرة.', from: 0.58 },
  { img: 't-mudhif.jpg', line: 'وبابٌ لا يُغلق.', from: 0.79 },
]
/* الصور المحيطة بالبداية، وكل واحدة تنسحب نحو حافّتها */
const AROUND = [
  { img: 'mirbad-old.jpg', x: 1, y: -0.2 },
  { img: 'fk-swamp-1.jpg', x: 1, y: 0.3 },
  { img: 'fk-mashoof-2.jpg', x: -1, y: 0.3 },
  { img: 'f-basra-1954.jpg', x: -1, y: -0.2 },
]

function Film() {
  const root = useRef(null)
  const title = useRef(null)
  const lens = useRef(null)
  const shade = useRef(null)
  const around = useRef([])
  const shots = useRef([])
  const lines = useRef([])

  useEffect(() => {
    if (still()) return
    return subscribe(() => {
      const r = root.current.getBoundingClientRect()
      const vw = root.current.clientWidth
      const vh = window.innerHeight
      const narrow = vw < 700
      const p = clamp(-r.top / Math.max(1, r.height - vh))
      const arrive = smooth(clamp((vh - r.top) / vh))
      const grow = span(p, 0.02, 0.32)
      const out = span(p, 0, 0.16)

      title.current.style.opacity = arrive * (1 - out)
      title.current.style.transform = `translate3d(0, ${-out * 80}px, 0) scale(${mix(0.86, 1, arrive) + out * 0.12})`

      const side = mix(narrow ? 14 : 36, 0, grow)
      lens.current.style.clipPath = `inset(${mix(44, 0, grow)}% ${side}% ${mix(7, 0, grow)}% ${side}% round ${mix(32, 0, grow)}px)`

      AROUND.forEach((a, i) => {
        const el = around.current[i]
        const lag = (1 - arrive) * (90 + i * 45)
        el.style.transform = `translate3d(${a.x * grow * vw * 0.4}px, ${a.y * grow * vh + lag}px, 0) scale(${1 + grow * 0.35})`
        el.style.opacity = 1 - span(p, 0.14, 0.32)
      })

      shade.current.style.opacity = span(p, 0.28, 0.4)

      SHOTS.forEach((s, i) => {
        const next = SHOTS[i + 1]
        const show = i === 0 ? 1 : span(p, s.from - 0.06, s.from + 0.03)
        const img = shots.current[i]
        img.style.clipPath = `inset(${(1 - show) * 100}% 0 0 0)`
        const zoom = i === 0 ? mix(1.3, 1, grow) + span(p, 0.32, 0.62) * 0.08 : mix(1.22, 1, span(p, s.from - 0.06, s.from + 0.2))
        img.style.transform = `translate3d(0, ${i === 0 ? (1 - grow) * 14 : 0}%, 0) scale(${zoom})`

        const inn = span(p, s.from, s.from + 0.07)
        const off = next ? span(p, next.from - 0.08, next.from - 0.01) : 0
        const line = lines.current[i]
        line.style.opacity = inn * (1 - off)
        line.style.transform = `translate3d(0, ${(1 - inn) * 70 - off * 70}px, 0)`
      })
    }, () => root.current)
  }, [])

  return (
    <div className="fl-film" ref={root}>
      <div className="fl-screen">
        <div className="fl-around" aria-hidden="true">
          {AROUND.map((a, i) => (
            <div key={a.img} className={'fl-a fl-a' + i} ref={(el) => (around.current[i] = el)}>
              <img src={A(a.img)} alt="" draggable="false" />
            </div>
          ))}
        </div>
        <div className="fl-lens" ref={lens} aria-hidden="true">
          {SHOTS.map((s, i) => (
            <img key={s.img} className={'fl-shot fl-shot' + i} src={A(s.img)} alt="" draggable="false" ref={(el) => (shots.current[i] = el)} />
          ))}
          <i className="fl-shade" ref={shade} />
        </div>
        <div className="fl-title" ref={title}>
          <h2>فلكلور البصرة</h2>
          <p>مدينةٌ تُروى بالإيقاع والخشب والماء.</p>
        </div>
        <div className="fl-lines">
          {SHOTS.map((s, i) => <p key={s.img} ref={(el) => (lines.current[i] = el)}>{s.line}</p>)}
        </div>
      </div>
    </div>
  )
}

export default function Folklore() {
  return (
    <section className="fl" id="news" data-scroll-offset="0">
      <Film />
      <FolkloreTabs />
    </section>
  )
}
