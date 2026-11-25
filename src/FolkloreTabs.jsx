/* أبواب الفلكلور: سبعة تبويبات، خمس صور لكل باب على مسرح ثلاثي الأبعاد */
import React, { useEffect, useRef, useState } from 'react'
import { folklore } from './folklore.js'
import { subscribe, clamp, smooth } from './scroll.js'
import './folkloreTabs.css'

const A = (f) => './assets/' + f
const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const COUNT = folklore.length
const num = (n) => String(n).padStart(2, '0').replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d])
/* موضع الصورة من المنتصف، في حلقة من خمس: ‎-2 إلى 2 */
const offset = (i, at, n) => ((i - at + n + Math.floor(n / 2)) % n) - Math.floor(n / 2)

function Icon({ d }) {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d={d} /></svg>
}

/* تمويه بلا مرشّحات: الصورة تُرسم في ١٦×١٠ بكسل ويكبّرها المتصفّح، فلا تكلّف شيئاً في كل إطار */
function Glow({ file, entering }) {
  const cv = useRef(null)
  useEffect(() => {
    const im = new Image()
    im.onload = () => cv.current?.getContext('2d').drawImage(im, 0, 0, 16, 10)
    im.src = A(file)
    return () => { im.onload = null }
  }, [file])
  return <canvas ref={cv} width="16" height="10" className={entering ? 'in' : undefined} />
}

function Deck({ topic, at, dir, leaving, onPick, onOpen }) {
  return (
    <div className={'ft7-deck' + (leaving ? ' leaving' : '')} style={{ '--dir': dir }} aria-hidden={leaving || undefined}>
      {topic.items.map((it, i) => {
        const o = offset(i, at, topic.items.length)
        return (
          <div className="ft7-slot" key={it.img} style={{ '--o': o, '--a': Math.abs(o), zIndex: 5 - Math.abs(o) }}>
            <div className="ft7-deal" style={{ '--i': Math.abs(o), '--side': Math.sign(o) }}>
              <button type="button" className={'ft7-photo' + (o === 0 ? ' on' : '')} tabIndex={leaving || o !== 0 ? -1 : 0}
                aria-label={o === 0 ? `تكبير: ${it.cap}` : it.cap} onClick={(e) => (o === 0 ? onOpen(e.currentTarget) : onPick(i))}>
                <img src={A(it.img)} alt="" draggable="false" className={it.bg && 'whole'} style={{ objectPosition: it.pos, background: it.bg }} />
                <i className="ft7-dim" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* الصورة تنفتح من مكانها حتى تملأ الشاشة */
function Viewer({ topic, at, from, onStep, onClose }) {
  const box = useRef(null)
  const item = topic.items[at]
  useEffect(() => {
    const dialog = box.current
    const root = document.documentElement
    /* التمرير الانسيابي للموقع يتوقّف حين تكون الصفحة مقفلة */
    root.style.overflow = 'hidden'
    dialog.showModal()
    if (from && !still()) {
      const r = from.getBoundingClientRect()
      const right = Math.max(0, dialog.clientWidth - r.right)
      const bottom = Math.max(0, dialog.clientHeight - r.bottom)
      dialog.animate(
        [{ clipPath: `inset(${Math.max(0, r.top)}px ${right}px ${bottom}px ${Math.max(0, r.left)}px round 28px)` }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }],
        { duration: 750, easing: 'cubic-bezier(.16, 1, .3, 1)' }
      )
    }
    return () => {
      root.style.overflow = ''
      dialog.close()
      from?.focus?.({ preventScroll: true })
    }
  }, [from])

  return (
    <dialog ref={box} className="ft7-view" aria-label={item.cap} data-native-scroll onCancel={(e) => { e.preventDefault(); onClose() }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onStep(1)
        if (e.key === 'ArrowRight') onStep(-1)
      }}>
      <img key={item.img} src={A(item.img)} alt={item.cap} />
      <button type="button" className="ft7-round ft7-x" onClick={onClose} aria-label="إغلاق" autoFocus><Icon d="M5 5l10 10M15 5L5 15" /></button>
      <div className="ft7-view-bar">
        <button type="button" className="ft7-round" onClick={() => onStep(-1)} aria-label="الصورة السابقة"><Icon d="M8 4l6 6-6 6" /></button>
        <div className="ft7-view-text">
          <strong>{item.cap}</strong>
          <span>{item.place}</span>
        </div>
        <button type="button" className="ft7-round" onClick={() => onStep(1)} aria-label="الصورة التالية"><Icon d="M12 4l-6 6 6 6" /></button>
      </div>
    </dialog>
  )
}

export default function FolkloreTabs() {
  const root = useRef(null)
  const rise = useRef(null)
  const ambient = useRef(null)
  const stage = useRef(null)
  const tabs = useRef(null)
  const pill = useRef(null)
  const drag = useRef(null)
  const swiped = useRef(false)
  const [now, setNow] = useState({ t: 0, at: 0, dir: 1, prev: null })
  const [inView, setInView] = useState(false)
  const [seen, setSeen] = useState(false)
  const [playing, setPlaying] = useState(() => !still())
  const [viewFrom, setViewFrom] = useState(null)

  const { t, at, dir, prev } = now
  const topic = folklore[t]
  const item = topic.items[at]
  const running = playing && inView && !viewFrom

  const openTab = (i, wanted) => setNow((s) => {
    const to = (i + COUNT) % COUNT
    if (to === s.t) return s
    return { t: to, at: 0, dir: wanted ?? (to > s.t ? 1 : -1), prev: { t: s.t, at: s.at, dir: s.dir } }
  })
  const pick = (i) => setNow((s) => ({ ...s, at: i }))
  const step = (d) => setNow((s) => {
    const n = folklore[s.t].items.length
    return { ...s, at: (s.at + d + n) % n }
  })
  /* بعد الصورة الخامسة ينتقل العرض إلى الباب التالي */
  const advance = () => (at === topic.items.length - 1 ? openTab(t + 1, 1) : step(1))

  /* الباب القديم يبقى حتى يطير خارج المسرح */
  useEffect(() => {
    if (!prev) return
    const id = setTimeout(() => setNow((s) => ({ ...s, prev: null })), 850)
    return () => clearTimeout(id)
  }, [prev])

  useEffect(() => {
    /* يبدأ التوزيع قبل أن تصل الصور، والتشغيل التلقائي حين يظهر المسرح */
    const first = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.2 })
    const view = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.5 })
    first.observe(stage.current)
    view.observe(stage.current)
    return () => { first.disconnect(); view.disconnect() }
  }, [])

  /* المسرح ينهض مع التمرير */
  useEffect(() => {
    if (still()) return
    return subscribe(() => {
      const top = root.current.getBoundingClientRect().top
      const p = smooth(clamp((window.innerHeight - top) / window.innerHeight))
      ambient.current.style.opacity = p ** 4
      rise.current.style.transform = p === 1 ? 'none' : `perspective(1400px) rotateX(${(1 - p) * 22}deg) scale(${0.8 + p * 0.2})`
    }, () => root.current)
  }, [])

  /* الحبّة البيضاء تنزلق تحت التبويب المختار */
  useEffect(() => {
    const list = tabs.current
    const place = () => {
      const b = list.querySelectorAll('[role="tab"]')[t]
      pill.current.style.width = b.offsetWidth + 'px'
      pill.current.style.height = b.offsetHeight + 'px'
      pill.current.style.transform = `translate3d(${b.offsetLeft}px, ${b.offsetTop}px, 0)`
    }
    place()
    if (list.scrollWidth > list.clientWidth) {
      const b = list.querySelectorAll('[role="tab"]')[t].getBoundingClientRect()
      const r = list.getBoundingClientRect()
      list.scrollBy({ left: b.left + b.width / 2 - (r.left + r.width / 2), behavior: still() ? 'auto' : 'smooth' })
    }
    const ro = new ResizeObserver(place)
    ro.observe(list)
    list.querySelectorAll('[role="tab"]').forEach((b) => ro.observe(b))
    return () => ro.disconnect()
  }, [t])

  /* صور الباب التالي تُحمَّل مسبقاً */
  useEffect(() => {
    if (!inView) return
    folklore[(t + 1) % COUNT].items.forEach((it) => { new Image().src = A(it.img) })
  }, [t, inView])

  /* التمرير الأفقي بلوحة اللمس: صورة واحدة لكل حركة */
  useEffect(() => {
    let last = 0
    let sum = 0
    const el = stage.current
    const wheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      e.stopPropagation()
      if (e.timeStamp - last < 650) return
      sum += e.deltaX
      if (Math.abs(sum) < 40) return
      step(sum < 0 ? 1 : -1)
      sum = 0
      last = e.timeStamp
    }
    const list = tabs.current
    const pass = (e) => Math.abs(e.deltaX) > Math.abs(e.deltaY) && e.stopPropagation()
    el.addEventListener('wheel', wheel, { passive: false })
    list.addEventListener('wheel', pass, { passive: true })
    return () => {
      el.removeEventListener('wheel', wheel)
      list.removeEventListener('wheel', pass)
    }
  }, [])

  const onTabKey = (e) => {
    const to = { ArrowLeft: t + 1, ArrowRight: t - 1 + COUNT, Home: 0, End: COUNT - 1 }[e.key]
    if (to === undefined) return
    e.preventDefault()
    openTab(to % COUNT)
    tabs.current.querySelectorAll('[role="tab"]')[to % COUNT].focus({ preventScroll: true })
  }

  const onDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY }
    swiped.current = false
  }
  /* الصورة الوسطى تميل نحو المؤشّر */
  const onMove = (e) => {
    if (e.pointerType !== 'mouse' || still()) return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    e.currentTarget.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
  }
  const onUp = (e) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(e.clientY - d.y)) return
    swiped.current = true
    /* يُلغي نقرة السحب وحدها، لا الضغطة التالية */
    setTimeout(() => { swiped.current = false })
    step(dx > 0 ? 1 : -1)
  }
  const onLeave = (e) => {
    e.currentTarget.style.setProperty('--mx', 0)
    e.currentTarget.style.setProperty('--my', 0)
  }
  const openView = (el) => {
    if (!swiped.current) setViewFrom(el)
  }

  return (
    <div className={'ft7' + (seen ? ' seen' : '') + (running ? ' running' : '')} id="folklore-tabs" ref={root}>
      <div className="ft7-ambient" ref={ambient} aria-hidden="true">
        {prev && <Glow key={'p' + prev.t} file={folklore[prev.t].items[prev.at].img} />}
        <Glow key={t + '-' + at} file={item.img} entering />
      </div>

      <div className="ft7-inner">
        <div className="ft7-marquee" aria-hidden="true" key={'m' + t}>
          <span>{Array(6).fill(topic.short).join(' ✦ ')} ✦ </span><span>{Array(6).fill(topic.short).join(' ✦ ')} ✦ </span>
        </div>
        <div className="ft7-tabs" ref={tabs} role="tablist" aria-label="أبواب الفلكلور" onKeyDown={onTabKey}>
          <i className="ft7-pill" ref={pill} aria-hidden="true" />
          {folklore.map((f, i) => (
            <button key={f.id} id={'ft7-tab-' + f.id} type="button" role="tab" aria-selected={i === t} aria-controls="ft7-panel"
              tabIndex={i === t ? 0 : -1} className={i === t ? 'on' : ''} onClick={() => openTab(i)}>{f.short}</button>
          ))}
        </div>

        <div className="ft7-panel" id="ft7-panel" role="tabpanel" aria-labelledby={'ft7-tab-' + topic.id}>
          <div className="ft7-head" key={'h' + t}>
            <h3>
              {topic.title.split(' ').map((w, i) => (
                <React.Fragment key={i}><span style={{ '--i': i }}>{w}</span>{' '}</React.Fragment>
              ))}
            </h3>
            <p>{topic.intro}</p>
          </div>

          <div className="ft7-rise" ref={rise}>
            <div className="ft7-stage" ref={stage} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
              onPointerCancel={() => { drag.current = null }} onPointerLeave={onLeave}>
              {prev && <Deck key={'deck' + prev.t} topic={folklore[prev.t]} at={prev.at} dir={dir} leaving onPick={() => {}} onOpen={() => {}} />}
              <Deck key={'deck' + t} topic={topic} at={at} dir={dir} onPick={pick} onOpen={openView} />
            </div>
          </div>

          <div className="ft7-foot">
            <div className="ft7-cap" key={'c' + t + '-' + at}>
              <p className="ft7-meta"><b>{num(at + 1)}</b><i />{num(topic.items.length)}<span>{item.place}</span></p>
              <p className="ft7-note">{item.note}</p>
            </div>
            <div className="ft7-controls">
              <ol className="ft7-index">
                {topic.items.map((it, i) => (
                  <li key={it.img}>
                    <button type="button" className={i === at ? 'on' : ''} onClick={() => pick(i)} aria-current={i === at || undefined}>
                      <i>{num(i + 1)}</i><span>{it.cap}</span>
                      {i === at && playing && <u key={t + '-' + at} onAnimationEnd={advance} />}
                    </button>
                  </li>
                ))}
              </ol>
              <button type="button" className="ft7-round ft7-play" onClick={() => setPlaying(!playing)} aria-label={playing ? 'إيقاف العرض' : 'تشغيل العرض'}>
                <Icon d={playing ? 'M7 4v12M13 4v12' : 'M7 4l8 6-8 6z'} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewFrom && <Viewer topic={topic} at={at} from={viewFrom} onStep={step} onClose={() => setViewFrom(null)} />}
    </div>
  )
}
