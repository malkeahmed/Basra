import React, { useEffect, useRef, useState } from 'react'
import { nav, chapters, gateHistory, stats, places, eras, people, tastes, news, credits } from './data.js'
import { PalmGrove, Palm } from './art.jsx'
import { subscribe, clamp, smooth } from './scroll.js'
import { createScene } from './scene.js'

const ar = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d])
const pad = (n) => String(n).padStart(2, '0')
const PAT = {
  lat: 'var(--p-lat-sand)',
  wave: 'var(--p-wave-sand)',
  palm: 'var(--p-palm-sand)',
  mash: 'var(--p-mash-sand)',
}
const PAT_L = {
  lat: 'var(--p-lat-light)',
  wave: 'var(--p-wave-light)',
  palm: 'var(--p-palm-light)',
  mash: 'var(--p-mash-light)',
}

/* ظهور عند التمرير */
function useReveal() {
  useEffect(() => {
    /* كل عنصر يظهر إذا وصل إليه المتصفح أو تجاوزه، حتى لو قفز بالتمرير السريع */
    let pending = [...document.querySelectorAll('.rv')]
    const unsub = subscribe(() => {
      if (!pending.length) return
      const vh = window.innerHeight
      pending = pending.filter((el) => {
        const top = el.getBoundingClientRect().top
        if (top < vh * 0.94) {
          el.classList.add('in')
          return false
        }
        return true
      })
    })
    return unsub
  }, [])
}

/* إمالة ثلاثية الأبعاد عند مرور الفأرة */
function Tilt({ children, className = '', max = 9, ...rest }) {
  const ref = useRef(null)
  const move = (e) => {
    const el = ref.current
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg) translateZ(0)`
  }
  const leave = () => (ref.current.style.transform = '')
  return (
    <div ref={ref} className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave} {...rest}>
      {children}
    </div>
  )
}

const NAVIMG = ['corniche.jpg', 'imam-ali-basra.jpg', 'p-haytham.jpg', 't-masgouf.jpg', 'port.jpg']
function Nav() {
  const head = useRef(null)
  const wrap = useRef(null)
  const ink = useRef(null)
  const active = useRef(-1)
  const lastY = useRef(0)
  const [on, setOn] = useState(-1)

  useEffect(() => {
    const moveInk = (el) => {
      const i = ink.current
      if (!i) return
      if (!el) {
        i.style.opacity = '0'
        return
      }
      i.style.opacity = '1'
      i.style.width = el.offsetWidth + 'px'
      i.style.transform = `translate3d(${el.offsetLeft}px, 0, 0)`
    }
    const links = () => Array.from(wrap.current ? wrap.current.querySelectorAll('a') : [])
    const place = () => moveInk(links()[active.current])
    const unsub = subscribe(() => {
      const h = head.current
      if (!h) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      h.style.setProperty('--np', max > 0 ? (window.scrollY / max).toFixed(4) : '0')
      h.classList.toggle('scrolled', window.scrollY > 12)
      let onLight = false
      ;['about', 'history', 'culture'].forEach((id) => {
        const el = document.getElementById(id)
        if (!el) return
        const r = el.getBoundingClientRect()
        if (r.top <= 32 && r.bottom >= 32) onLight = true
      })
      h.classList.toggle('on-light', onLight)
      const y = window.scrollY
      const dy = y - lastY.current
      if (Math.abs(dy) > 6) {
        h.classList.toggle('hide', dy > 0 && y > 260)
        lastY.current = y
      }
      let cur = -1
      nav.forEach((n, i) => {
        const el = document.querySelector(n.href)
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.42) cur = i
      })
      if (cur !== active.current) {
        active.current = cur
        setOn(cur)
        place()
      }
    })
    const ro = () => place()
    window.addEventListener('resize', ro)
    const enter = (e) => moveInk(e.currentTarget)
    const leave = () => place()
    const ls = links()
    ls.forEach((a) => {
      a.addEventListener('mouseenter', enter)
      a.addEventListener('focus', enter)
      a.addEventListener('mouseleave', leave)
      a.addEventListener('blur', leave)
    })
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place)
    place()
    return () => {
      unsub()
      window.removeEventListener('resize', ro)
      ls.forEach((a) => {
        a.removeEventListener('mouseenter', enter)
        a.removeEventListener('focus', enter)
        a.removeEventListener('mouseleave', leave)
        a.removeEventListener('blur', leave)
      })
    }
  }, [])

  const [open, setOpen] = useState(false)
  const [hv, setHv] = useState(0)
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    const k = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open])

  return (
    <>
    <header className={'nav' + (open ? ' menu-open' : '')} ref={head}>
      <div className="nav-in">
        <a className="brand" href="#top" aria-label="البصرة">
          <span className="brand-mark" aria-hidden="true" />
          <b className="brand-name">البصرة</b>
        </a>
        <nav aria-label="الأقسام" ref={wrap}>
          <i className="nav-ink" ref={ink} aria-hidden="true" />
          {nav.map((n, i) => (
            <a key={n.href} href={n.href} className={i === on ? 'on' : ''}>
              <sup>{ar(pad(i + 1))}</sup><span>{n.label}</span>
              <em className="nv-pv" aria-hidden="true"><img src={'./assets/' + NAVIMG[i]} alt="" /><b>{n.label}</b></em>
            </a>
          ))}
        </nav>
        <button className={'nav-menu' + (open ? ' on' : '')} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="القائمة">
          <span>{open ? 'إغلاق' : 'القائمة'}</span><i><u /><u /></i>
        </button>
        <i className="nav-prog" aria-hidden="true" />
      </div>
    </header>
    <div className={'mn' + (open ? ' open' : '')} aria-hidden={!open}>
      <div className="mn-strips" aria-hidden="true">{[0, 1, 2, 3, 4].map((k) => (<i key={k} style={{ '--k': k }} />))}</div>
      <div className="mn-imgs" aria-hidden="true">
        {nav.map((n, i) => (<img key={n.href} className={hv === i ? 'on' : ''} src={'./assets/' + NAVIMG[i]} alt="" />))}
      </div>
      <div className="mn-shade" aria-hidden="true" />
      <ul className="mn-list">
        {nav.map((n, i) => (
          <li key={n.href} style={{ '--i': i }} onMouseEnter={() => setHv(i)}>
            <a href={n.href} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              <small>{ar(pad(i + 1))}</small><span>{n.label}</span><i aria-hidden="true">←</i>
            </a>
          </li>
        ))}
      </ul>
      <p className="mn-foot" dir="ltr">Basra · 30.51°N 47.78°E</p>
    </div>
    </>
  )
}

const GN_X = [87.5, 62.5, 37.5, 12.5, 12.5, 37.5, 62.5, 87.5, 87.5, 62.5, 37.5, 12.5]
const GN_TOP = [14, 14, 14, 14, 42, 42, 42, 42, 70, 70, 70, 70]
const GLYPH = {
  tent: <path d="M4 26 L20 6 L36 26 Z M20 6 V26 M13 26 L20 16 L27 26" />,
  swords: <path d="M7 7 L31 31 M33 7 L9 31 M5 31 L11 25 M35 31 L29 25" />,
  book: <path d="M6 9 C13 6 17 8 20 11 C23 8 27 6 34 9 V30 C27 27 23 29 20 32 C17 29 13 27 6 30 Z M20 11 V32" />,
  ship: <path d="M5 24 H35 L30 31 H10 Z M20 24 V6 M20 8 L31 22 H20 M20 11 L11 22 H20" />,
  chain: <path d="M13 12 a6 6 0 1 1 0 12 h-2 M27 28 a6 6 0 1 1 0 -12 h2 M15 20 H25" />,
  eye: <path d="M4 20 C11 9 29 9 36 20 C29 31 11 31 4 20 Z M20 14 a6 6 0 1 0 0.01 0 M20 18 a2 2 0 1 0 0.01 0" />,
  crescent: <path d="M27 8 a13 13 0 1 0 5 20 a10 10 0 1 1 -5 -20 Z M31 10 l1.5 3 3 .5 -2.2 2.2 .6 3 -2.9 -1.5 -2.9 1.5 .6 -3 -2.2 -2.2 3 -.5 Z" />,
  flag: <path d="M10 5 V35 M10 8 H31 L26 14 L31 20 H10" />,
  drop: <path d="M20 5 C26 14 31 19 31 25 a11 11 0 0 1 -22 0 C9 19 14 14 20 5 Z M15 25 a5 5 0 0 0 5 5" />,
  derrick: <path d="M20 5 L9 35 H31 Z M14 22 H26 M11 30 H29 M20 5 V35 M31 12 q4 4 0 8" />,
  reeds: <path d="M6 32 q4 -4 8 0 t8 0 t8 0 M12 28 V10 M20 28 V6 M28 28 V12 M12 10 q-3 -3 -5 -1 M20 6 q3 -3 5 -1 M28 12 q3 -2 5 0" />,
  trophy: <path d="M12 7 H28 V16 a8 8 0 0 1 -16 0 Z M12 10 H6 q0 8 7 9 M28 10 H34 q0 8 -7 9 M20 24 V30 M13 33 H27 M15 30 H25" />,
}

/* الرحلة الثلاثية الأبعاد */
function Journey() {
  const sec = useRef(null)
  const canvas = useRef(null)
  const chapRefs = useRef([])
  const dotRefs = useRef([])
  const veil = useRef(null)
  const layer = useRef(null)
  const stageRef = useRef(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    let scene = null
    try {
      const low = window.innerWidth < 800
      scene = createScene(canvas.current, { low })
    } catch (e) {
      setFallback(true)
    }
    const lost = () => setFallback(true)
    canvas.current && canvas.current.addEventListener('webglcontextlost', lost)
    const unsub = subscribe(() => {
      const r = sec.current.getBoundingClientRect()
      const stageH = window.innerHeight
      /* آخر شاشة من الرحلة يغطّيها القسم الثاني كورقة بيضاء تصعد من الأسفل فوق المشهد المثبّت */
      const p = clamp(-r.top / (r.height - stageH * 2))
      const itEl = document.getElementById('about')
      const q = itEl ? clamp(1 - itEl.getBoundingClientRect().top / stageH) : 0
      const L = stageRef.current
      const pm = p
      if (L) {
        const e = smooth(q)
        L.style.setProperty('--e', e.toFixed(4))
        L.style.setProperty('--jp', clamp(p / 0.95).toFixed(4))
        L.classList.toggle('ending', q > 0.02)
      }
      try {
        scene && scene.setProgress(p)
      } catch (e) {}
      /* نص واحد يظهر دائماً: آخر محطة بلغها المتصفح، بلا فراغات بين المحطات */
      let active = 0
      chapters.forEach((c, i) => {
        if (p >= c.from) active = i
      })
      chapRefs.current.forEach((el, i) => el && el.classList.toggle('on', i === active))
      dotRefs.current.forEach((d, i) => { if (!d) return; d.classList.toggle('on', i === active); d.classList.toggle('near', Math.abs(i - active) === 1) })
    })
    return () => {
      unsub()
      scene && scene.dispose()
    }
  }, [])

  return (
    <section className="journey" id="top" ref={sec}>
      <div className="stage" ref={stageRef}>
        {fallback ? <img className="stage-fallback" src="./assets/sunset.jpg" alt="غروب على شطّ العرب في البصرة" /> : <canvas ref={canvas} className="stage-canvas" aria-label="مجسّم ثلاثي الأبعاد لنهر شطّ العرب والنخيل والزوارق" role="img" />}
        <div className="stage-veil" ref={veil} />

        <div className="chap chap-hero on" ref={(el) => (chapRefs.current[0] = el)}>
          <div className="h3b">
            <h1 className="hero-title" aria-label="البصرة، حيث يلتقي النهران"><i className="dp" /><i className="dp" /><i className="dp" /><span>البصرة</span><span>حيث يلتقي النهران</span></h1>
            <p className="h3b-sub">ثغر العراق منذ ٦٣٦م</p>
          </div>
        </div>

        {chapters.slice(1).map((c, i) => (
          <div key={c.id} className={`chap chap-card ${c.side}`} ref={(el) => (chapRefs.current[i + 1] = el)}>
            <h2 className="chap-title">{c.title}</h2>
            <p className="chap-text">{c.text}</p>
          </div>
        ))}

        <ol className="rail" aria-hidden="true">
          <i className="rail-fill" />
          {chapters.map((c, i) => (
            <li key={c.id} ref={(el) => (dotRefs.current[i] = el)}>
              <span className="rl-lab"><b>{ar(pad(i + 1))}</b>{c.title || 'البداية'}</span>
            </li>
          ))}
        </ol>
        <a className="scroll-hint" href="#about" aria-label="اسحب للأسفل"><em>اسحب للأسفل</em><span className="sh-line"><i /></span></a>
        <div className="stage-fade" aria-hidden="true" />
        <div className="stage-cap" aria-hidden="true">
          <span>الفصل الثاني</span>
          <strong>وجهات البصرة وتاريخها وأعلامها</strong>
        </div>
      </div>
    </section>
  )
}

const toNum = (str) => parseInt(String(str).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d]/g, ''), 10) || 0
const ST_IMG = ['imam-ali-basra.jpg', 'sunset.jpg', 'marshes.jpg', 'stadium-real.jpg']
const ST_CAP = ['مسجد الإمام علي ومئذنته القديمة · البصرة', 'شطّ العرب عند الغروب', 'أهوار جنوب العراق', 'ملعب البصرة الدولي ليلة الافتتاح']
const TODAY = [
  { t: 'غروب على شطّ العرب', d: 'عند المساء يتوهّج النهر بلون الذهب، وتعبر السفن والقوارب بين النخيل والضفاف الخضراء.', img: 'sunset.jpg', c: 'شطّ العرب عند الغروب' },
  { t: 'أهوار الجنوب', d: 'ماء وقصب وقوارب خشبية في أرض نشأت فيها أولى الحضارات، وهي اليوم من مواقع التراث العالمي.', img: 'marshes.jpg', c: 'أهوار جنوب العراق' },
  { t: 'قوارب الصيّادين', d: 'زوارق خشبية ملوّنة يقودها صيّادو الشطّ، وعلى الضفاف هياكل سفن قديمة صارت مشهداً يقصده المصوّرون.', img: 'mashoof.jpg', c: 'قارب صيد عند مصبّ شطّ العرب' },
]
const HIMG = ['imam-ali-basra.jpg', 'era-camel.jpg', 'era-jahiz.jpg', 'era-ship.jpg', 'shanasheel.jpg', 'era-1914.jpg', 'era-oil.jpg', 'stadium-outside.jpg']
const PIMG = ['p-haytham.jpg', 'era-jahiz.jpg', null, 'p-rabia.jpg', 'sayyab.jpg']
const KEYS = ['دجلة', 'الفرات', 'شطّ', 'العرب', 'البصرة', 'بوّابة', 'النخيل']
const SCRUB = 'يلتقي دجلة والفرات في القرنة فيصنعان شطّ العرب، النهر الذي يسقي النخيل ويحمل السفن إلى الخليج، وجعل من البصرة بوّابة العراق إلى العالم منذ أكثر من ألف عام.'.split(' ')

function Intro() {
  const scrub = useRef(null)
  const pin = useRef(null)
  const media = useRef(null)
  const img = useRef(null)
  const words = useRef([])
  const nums = useRef([])
  const stagesRef = useRef(null)
  const [td, setTd] = useState(0)
  const tdRows = useRef([])
  const tdLast = useRef(0)
  const slides = useRef([])
  const dots = useRef([])

  useEffect(() => {
    const unsub = subscribe(() => {
      const vh = window.innerHeight
      /* النص مثبّت ويتجلّى كلمة كلمة مع التمرير */
      const sr = scrub.current && scrub.current.getBoundingClientRect()
      if (sr) {
        const pr = clamp((-sr.top + vh * 0.06) / (sr.height - vh * 0.9))
        const n = words.current.length
        scrub.current.style.setProperty('--pp', pr.toFixed(4))
        words.current.forEach((el, i) => {
          if (el) el.style.setProperty('--o', clamp(pr * (n + 4) - i).toFixed(3))
        })
      }
      /* الدخول عبر الحروف: الكلمة نافذة على الصورة، تتضخّم حتى نعبر إلى داخلها */
      const pr0 = pin.current && pin.current.getBoundingClientRect()
      if (pr0) {
        const p = clamp(-pr0.top / (pr0.height - vh))
        const z = smooth(clamp(p / 0.6))
        pin.current.style.setProperty('--z', Math.exp(Math.log(1.08) * z).toFixed(3))
        pin.current.style.setProperty('--veil', (1 - smooth(clamp((p - 0.38) / 0.28))).toFixed(3))
        pin.current.style.setProperty('--hint', (1 - clamp(p / 0.08)).toFixed(3))
        pin.current.style.setProperty('--fin', smooth(clamp((p - 0.7) / 0.22)).toFixed(3))
        pin.current.style.setProperty('--ph', (1.28 - 0.28 * smooth(clamp(p / 0.8))).toFixed(3))
      }
      /* قائمة بصرة اليوم: الصف الأقرب لمنتصف الشاشة هو النشط */
      let best = tdLast.current
      let bd = 1e9
      tdRows.current.forEach((el, i) => {
        if (!el) return
        const b = el.getBoundingClientRect()
        const d = Math.abs(b.top + b.height / 2 - vh * 0.5)
        if (d < bd) { bd = d; best = i }
      })
      if (best !== tdLast.current) { tdLast.current = best; setTd(best) }
      /* الأرقام: شرائح بملء الشاشة، كل رقم يعدّ ويتبدّل بالتمرير */
      const tr = stagesRef.current && stagesRef.current.getBoundingClientRect()
      if (tr) {
        const N = stats.length
        const p = clamp(-tr.top / (tr.height - vh))
        stagesRef.current.style.setProperty('--sp', p.toFixed(4))
        slides.current.forEach((el, i) => {
          if (!el) return
          const d = p * N - i - 0.5
          el.style.opacity = clamp(1.35 - Math.abs(d) * 2.7).toFixed(3)
          el.style.setProperty('--sd', d.toFixed(3))
          const num = nums.current[i]
          if (num) {
            const e = smooth(clamp((p * N - i + 0.3) / 0.55))
            num.textContent = ar(Math.round(Number(num.dataset.to) * e)) + (num.dataset.suffix || '')
          }
        })
        dots.current.forEach((el, i) => el && el.classList.toggle('on', Math.floor(Math.min(p * N, N - 0.001)) === i))
      }
    })
    return unsub
  }, [])

  return (
    <section className="sec intro ap" id="about">
      <div className="sheet-tab" aria-hidden="true">
        <i />
      </div>
      <div className="zt" ref={pin}>
        <div className="zt-stage">
          <img className="zt-img" src="./assets/sindibad.jpg" alt="شطّ العرب وجزيرة السندباد والنخيل" />
          <div className="zt-scrim" />
          <div className="zt-veil" aria-hidden="true">
            <span className="zt-word">البصرة</span>
          </div>
          <p className="zt-kick">الفصل الثاني</p>
          <p className="zt-hint"><i />مدينةٌ وُلدت من الماء</p>
          <div className="zt-fin">
            <h2>مدينةٌ وُلدت<br />من الماء.</h2>
            <p>شطّ العرب، حيث يلتقي دجلة والفرات<br />ويمتدّ النهر نحو الخليج</p>
          </div>
        </div>
      </div>
      <div className="ap-scrub" ref={scrub}>
        <div className="as-stage">
          <div className="as-lat" aria-hidden="true" />
          <figure className="as-ph l1"><img src="./assets/corniche.jpg" alt="" loading="lazy" /><figcaption>الكورنيش</figcaption></figure>
          <figure className="as-ph l2"><img src="./assets/port.jpg" alt="" loading="lazy" /><figcaption>الميناء</figcaption></figure>
          <figure className="as-ph l3"><img src="./assets/sayyab.jpg" alt="" loading="lazy" /><figcaption>السيّاب</figcaption></figure>
          <figure className="as-ph r1"><img src="./assets/sunset.jpg" alt="" loading="lazy" /><figcaption>شطّ العرب</figcaption></figure>
          <figure className="as-ph r2"><img src="./assets/mashoof.jpg" alt="" loading="lazy" /><figcaption>المشحوف</figcaption></figure>
          <figure className="as-ph r3"><img src="./assets/marshes.jpg" alt="" loading="lazy" /><figcaption>الأهوار</figcaption></figure>
          <p className="as-kick"><b>٠١</b><i />النهر الذي صنع المدينة</p>
          <p className="as-text">
            {SCRUB.map((w, i) => (
              <span key={i} className={KEYS.some((k) => w.includes(k)) ? 'k' : ''} ref={(el) => (words.current[i] = el)}>{w} </span>
            ))}
          </p>
          <div className="as-bar"><i /></div>
        </div>
      </div>
      <div className="st" ref={stagesRef}>
        <div className="st-stage">
          {stats.map((st, i) => {
            const to = toNum(st.n)
            const suffix = String(st.n).replace(/[٠-٩\s]/g, '') ? ' ' + String(st.n).replace(/[٠-٩\s]/g, '') : ''
            return (
              <div key={st.t} className="st-slide" ref={(el) => (slides.current[i] = el)}>
                <img src={'./assets/' + ST_IMG[i]} alt="" />
                <div className="st-scrim" />
                <span className="st-ghost" aria-hidden="true">{st.n}</span>
                <p className="st-cap"><i />{ST_CAP[i]}</p>
                <div className="st-copy">
                  <p className="st-u">{st.u}</p>
                  <p className="st-n"><b ref={(el) => (nums.current[i] = el)} data-to={to} data-suffix={suffix}>{ar(0)}</b></p>
                  <i className="st-rule" />
                  <p className="st-t">{st.t}</p>
                </div>
              </div>
            )
          })}
          <p className="st-kick"><b>٠٢</b><i />البصرة بالأرقام</p>
          <div className="st-line">
            <div className="st-track"><i /></div>
            <ol>
              {stats.map((st, i) => (
                <li key={i} ref={(el) => (dots.current[i] = el)}><b>{st.n}</b><span>{st.u}</span></li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <div className="wrap td">
        <div className="td-head">
          <p className="rv"><b>٠٣</b><i />مشاهد من البصرة</p>
          <h3 className="rv" style={{ '--d': '80ms' }}>ثلاثة مشاهد<br />لا تُنسى</h3>
        </div>
        <div className="td-grid">
          <div className="td-list">
            {TODAY.map((r, i) => (
              <div key={r.t} className={'td-row' + (td === i ? ' on' : '')} ref={(el) => (tdRows.current[i] = el)} onMouseEnter={() => { tdLast.current = i; setTd(i) }}>
                <span className="td-i">{ar('0' + (i + 1))}</span>
                <div className="td-tx">
                  <h4>{r.t}</h4>
                  <p>{r.d}</p>
                </div>
                <span className="td-ar" aria-hidden="true">←</span>
              </div>
            ))}
          </div>
          <div className="td-view" aria-hidden="true">
            {TODAY.map((r, i) => (
              <figure key={r.t} className={td === i ? 'on' : ''}>
                <img src={'./assets/' + r.img} alt="" />
                <figcaption>{r.c}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* الوجهات: معرض أفقي بعمق ثلاثي الأبعاد */
function Places() {
  const sec = useRef(null)
  const track = useRef(null)
  const cards = useRef([])
  const bgs = useRef([])
  const bgAct = useRef(-1)

  useEffect(() => {
    let trackW = 0
    const measure = () => {
      const vw = window.innerWidth
      trackW = track.current.scrollWidth
      const travel = Math.max(0, trackW - vw)
      sec.current.style.height = `${travel + window.innerHeight * 1.1}px`
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('load', measure)
    const unsub = subscribe(() => {
      const vw = window.innerWidth
      const r = sec.current.getBoundingClientRect()
      const travel = Math.max(0, trackW - vw)
      const p = clamp(-r.top / (r.height - window.innerHeight))
      const x = p * travel
      track.current.style.transform = `translate3d(${x}px,0,0)`
      sec.current.style.setProperty('--pp', p.toFixed(4))
      let bestA = 9
      let bestI = 0
      cards.current.forEach((c) => {
        if (!c) return
        const b = c.getBoundingClientRect()
        const k = (b.left + b.width / 2 - vw / 2) / vw
        const a = Math.abs(k)
        c.style.transform = `rotateY(${clamp(k, -1, 1) * -26}deg) translateZ(${-a * 160}px) scale(${1 - Math.min(a, 1) * 0.1})`
        c.style.opacity = 1 - Math.min(a, 1.2) * 0.35
        if (a < bestA) { bestA = a; bestI = cards.current.indexOf(c) }
      })
      if (bestI !== bgAct.current) {
        bgAct.current = bestI
        bgs.current.forEach((el, i) => el && el.classList.toggle('on', i === bestI))
      }
    })
    return () => {
      unsub()
      window.removeEventListener('resize', measure)
      window.removeEventListener('load', measure)
    }
  }, [])

  return (
    <section className="places" id="places" ref={sec}>
      <div className="places-stage" style={{ backgroundImage: PAT.mash }}>
        <div className="pl-bg" aria-hidden="true">
          {places.map((pl, i) => (
            <div key={pl.id} className={'pl-bgi' + (i === 0 ? ' on' : '')} ref={(el) => (bgs.current[i] = el)} style={pl.img ? { backgroundImage: `url(${pl.img})` } : undefined} />
          ))}
          <i className="pl-dust" />
        </div>
        <div className="places-head">
          <div className="pl-title">
            <p className="pl-kick"><b>٠٤</b><i />وجهات</p>
            <h2 className="h2">وجهات لا تفوّتها</h2>
          </div>
          <div className="pl-side">
            <p className="places-hint">تابع التمرير لتسير على ضفاف البصرة</p>
            <div className="pl-bar"><i /></div>
          </div>
        </div>
        <div className="places-view">
          <div className="places-track" ref={track}>
            {places.map((p, i) => (
              <article key={p.id} className="pcard" ref={(el) => (cards.current[i] = el)}>
                <span className="pcard-n">{ar(pad(i + 1))}</span>
                <div className="pcard-art" style={p.img ? undefined : { backgroundImage: PAT_L[p.pat] }}>
                  {p.img ? <img src={p.img} alt={p.title} loading="lazy" draggable="false" /> : <span className="pcard-word" aria-hidden="true">{p.word}</span>}
                </div>
                <div className="pcard-body">
                  <h3 className="h3">{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* التاريخ: بطاقات متراكبة */
function History() {
  const wrap = useRef(null)
  useEffect(() => {
    const els = [...wrap.current.querySelectorAll('.era')]
    return subscribe(() => {
      const vh = window.innerHeight
      els.forEach((el, i) => {
        const next = els[i + 1]
        if (!next) return
        const t = clamp(1 - next.getBoundingClientRect().top / vh)
        el.style.transform = `scale(${1 - t * 0.07}) rotateX(${t * 6}deg)`
        el.style.filter = `brightness(${1 - t * 0.12})`
      })
    })
  }, [])
  return (
    <section className="sec history" id="history">
      <div className="wrap hs-head">
        <p className="rv"><b>٠٥</b><i />تاريخ البصرة</p>
        <h2 className="h2 rv" style={{ '--d': '80ms' }}>ثلاثة عشر قرناً<br />من الحكايات</h2>
      </div>
      <div className="wrap era-stack" ref={wrap}>
        {eras.map((e, i) => (
          <article key={e.year} className={`era tone-${e.tone}`} style={{ '--i': i, '--pat': e.tone === 'ink' ? 'var(--p-mash-ink)' : e.tone === 'sand' ? PAT_L[e.pat] : PAT[e.pat] }}>
            <img className="era-bg" src={'./assets/' + HIMG[i]} alt="" loading="lazy" />
            <span className="era-n">{ar(pad(i + 1))} / {ar(pad(eras.length))}</span>
            <div className="era-year">{e.year}</div>
            <div className="era-body">
              <h3 className="era-title">{e.title}</h3>
              <p>{e.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

/* الأعلام: حلقة ثلاثية الأبعاد تدور مع التمرير */
function People() {
  const sec = useRef(null)
  const ring = useRef(null)
  const cardRefs = useRef([])
  const [front, setFront] = useState(0)
  useEffect(() => {
    const n = people.length
    const unsub = subscribe(() => {
      const r = sec.current.getBoundingClientRect()
      const p = clamp(-r.top / (r.height - window.innerHeight))
      const pos = p * (n - 1)
      const fl = Math.min(Math.floor(pos), n - 2)
      const rot = (fl + smooth(clamp((pos - fl - 0.22) / 0.56))) * (360 / n)
      ring.current.style.transform = `translateZ(calc(var(--R) * -1)) rotateY(${rot}deg)`
      let best = 0
      let bestV = -2
      cardRefs.current.forEach((c, i) => {
        if (!c) return
        const ang = ((i * 360) / n + rot) * (Math.PI / 180)
        const v = Math.cos(ang)
        c.style.opacity = 0.35 + 0.65 * ((v + 1) / 2)
        if (v > bestV) {
          bestV = v
          best = i
        }
      })
      setFront(best)
    })
    return unsub
  }, [])
  return (
    <section className="people" id="people" ref={sec}>
      <div className="people-stage" style={{ backgroundImage: 'var(--p-lat-ink)' }}>
        <div className="pp-bg" aria-hidden="true">
          {people.map((p, i) => (
            <div key={p.ar} className={'pp-bgi' + (front === i ? ' on' : '')} style={PIMG[i] ? { backgroundImage: `url(./assets/${PIMG[i]})` } : undefined} />
          ))}
        </div>
        <div className="pp-head">
          <p><b>٠٦</b><i />أعلام</p>
          <h2 className="h2">أعلام أنجبتهم البصرة</h2>
        </div>
        <div className="ring-view">
          <div className="ring" ref={ring}>
            {people.map((p, i) => (
              <div key={p.ar} className="rcard" ref={(el) => (cardRefs.current[i] = el)} style={{ transform: `rotateY(${(i * 360) / people.length}deg) translateZ(var(--R))` }}>
                {PIMG[i] ? <img className="rcard-img" src={'./assets/' + PIMG[i]} alt="" draggable="false" /> : <span className="rcard-letter" aria-hidden="true">ع</span>}
                <span className="rcard-n">{ar(pad(i + 1))}</span>
                <div className="rcard-tx">
                  <p className="rcard-name">{p.ar}</p>
                  <p className="rcard-years">{p.years}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="people-detail" aria-live="polite">
          <h3 className="people-name">{people[front].ar}</h3>
          <p>{people[front].text}</p>
        </div>
      </div>
    </section>
  )
}

const TIMG = ['t-dates.jpg', 't-masgouf.jpg', 't-loomi.jpg', 'mashoof.jpg', 't-mudhif.jpg']
function Culture() {
  const [tc, setTc] = useState(0)
  return (
    <section className="sec culture" id="culture">
      <div className="wrap cu-head">
        <p className="rv"><b>٠٧</b><i />الذوق والحِرَف</p>
        <h2 className="h2 rv" style={{ '--d': '80ms' }}>طعم الجنوب وحِرفه</h2>
      </div>
      <div className="wrap cu-row" onMouseLeave={() => setTc(tc)}>
        {tastes.map((t, i) => (
          <article key={t.t} className={'cu-p' + (tc === i ? ' on' : '')} onMouseEnter={() => setTc(i)} onClick={() => setTc(i)} tabIndex={0} onFocus={() => setTc(i)}>
            <img src={'./assets/' + TIMG[i]} alt={t.t} loading="lazy" draggable="false" />
            <span className="cu-n">{ar(pad(i + 1))}</span>
            <h3 className="cu-v">{t.t}</h3>
            <div className="cu-tx">
              <h3>{t.t}</h3>
              <p>{t.d}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

const NIMG = ['port.jpg', 'stadium-real.jpg', 't-dates.jpg', 'marshes.jpg', 'mirbad-old.jpg']
function News() {
  return (
    <section className="sec news" id="news">
      <div className="nw-bg" aria-hidden="true">
        <i className="nw-b1" /><i className="nw-b2" /><i className="nw-b3" />
        <span className="nw-ghost">الأخبار</span>
        <i className="nw-grid-bg" />
        <i className="nw-dust" />
        <i className="nw-beam" />
      </div>
      <div className="wrap">
        <div className="nw-head">
          <p className="rv"><b>٠٨</b><i />الأخبار</p>
          <h2 className="h2 rv" style={{ '--d': '80ms' }}>آخر أخبار البصرة</h2>
        </div>
        <div className="nw-grid">
          {news.map((n, i) => (
            <article key={n.title} className={'nw-card nw-' + i + ' rv'} style={{ '--d': `${i * 90}ms` }}>
              <img src={'./assets/' + NIMG[i]} alt="" loading="lazy" draggable="false" />
              <div className="nw-top">
                <span className="nw-tag">{n.tag}</span>
                {i === 0 ? <span className="nw-star">الأبرز</span> : <span className="nw-no">{ar(pad(i + 1))}</span>}
              </div>
              <div className="nw-body">
                <h3>{n.title}</h3>
                <p>{n.text}</p>
                <span className="nw-ar" aria-hidden="true">←</span>
              </div>
            </article>
          ))}
        </div>
        <p className="news-note">هذا القسم تجريبي، وسيُربط بمصدر أخبار حيّ بعد الإطلاق.</p>
      </div>
    </section>
  )
}

const MQ = ['البصرة', 'شطّ العرب', 'ثغر العراق', 'فينيسيا الشرق', 'مدينة السندباد', 'أرض النخيل']
const MQ2 = ['النهران', 'النخيل', 'الأهوار', 'الشناشيل', 'المشحوف', 'الغروب']

function Footer() {
  return (
    <>
      <div className="ft-spacer" aria-hidden="true" />
      <footer className="ft">
        <div className="ft-photo" aria-hidden="true" style={{ backgroundImage: "url(./assets/sunset.jpg)" }} />
        <div className="ft-shade" aria-hidden="true" />
        <div className="ft-wrap">
          <div className="ft-top">
            <p className="ft-kick"><b>٠٩</b><i />إلى اللقاء</p>
            <h2 className="ft-h">لنُكمل<br />الرحلة معاً<span>.</span></h2>
          </div>
          <div className="ft-mid">
            <nav aria-label="روابط" className="ft-links">
              {nav.map((n, i) => (
                <a key={n.href} href={n.href}>
                  <small>{ar(pad(i + 1))}</small>
                  <span>{n.label}</span>
                  <i aria-hidden="true">←</i>
                </a>
              ))}
            </nav>
            <div className="ft-side">
              <p className="ft-line">البصرة، حيث يلتقي النهران وتبدأ الحكايات. تأسست سنة ٦٣٦م، وما زال شطّ العرب يحمل أسماءها إلى الخليج.</p>
              <a className="ft-up" href="#top"><i aria-hidden="true">↑</i><span>عُد إلى بداية الرحلة</span></a>
            </div>
          </div>
          <figure className="ft-poem">
            <blockquote>عيناكِ غابتا نخيلٍ ساعةَ السَّحَر</blockquote>
            <figcaption><i />بدر شاكر السيّاب · أنشودة المطر<i /></figcaption>
          </figure>
          <div className="ft-bot">
            <p className="ft-made">Made by Iraqi hands</p>
            <a className="ft-dj" href="https://dijlah.org/" target="_blank" rel="noopener noreferrer">dijlah</a>
          </div>
        </div>
      </footer>
    </>
  )
}

export default function App() {
  useReveal()
  return (
    <>
      <Nav />
      <main>
        <Journey />
        <Intro />
        <Places />
        <History />
        <People />
        <Culture />
        <News />
      </main>
      <Footer />
    </>
  )
}
