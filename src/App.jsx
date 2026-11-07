import React, { useEffect, useRef, useState } from 'react'
import { nav, chapters, stats, places, eras, people, tastes, news, credits } from './data.js'
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

/* الشمس والوقت في البصرة */
function sunMinutes(d) {
  const rad = Math.PI / 180
  const lat = 30.51
  const lon = 47.78
  const N = Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5)
  const g = ((2 * Math.PI) / 365) * (N - 1)
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)
  const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl)) / rad
  return [720 - 4 * (lon + ha) - eqt + 180, 720 - 4 * (lon - ha) - eqt + 180]
}

function BasraNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(t)
  }, [])
  const local = new Date(now.getTime() + 3 * 3600e3)
  const mins = local.getUTCHours() * 60 + local.getUTCMinutes()
  const [rise, set] = sunMinutes(local)
  const day = mins >= rise && mins < set
  const target = day ? set : mins < rise ? rise : rise + 1440
  const left = Math.round(target - mins)
  const fmt = (m) => `${ar(pad(Math.floor((m % 1440) / 60)))}:${ar(pad(Math.round(m % 60) % 60))}`
  return (
    <aside className="now" aria-label="الوقت في البصرة">
      <p className="now-label">الآن في البصرة</p>
      <p className="now-time" dir="ltr">
        {ar(pad(local.getUTCHours()))}:{ar(pad(local.getUTCMinutes()))}
      </p>
      <p className="now-line">
        {day ? 'الشمس في السماء' : 'الليل على شطّ العرب'}، {day ? 'الغروب' : 'الشروق'} عند {fmt(day ? set : rise)}، بعد {ar(Math.floor(left / 60))} ساعة و{ar(left % 60)} دقيقة.
      </p>
    </aside>
  )
}

function Nav() {
  return (
    <header className="nav">
      <a className="brand" href="#top" aria-label="البصرة">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">البصرة</span>
      </a>
      <nav aria-label="الأقسام">
        {nav.map((n) => (
          <a key={n.href} href={n.href}>{n.label}</a>
        ))}
      </nav>
      <a className="btn btn-sm" href="#places">ابدأ الرحلة</a>
    </header>
  )
}

/* الرحلة الثلاثية الأبعاد */
function Journey() {
  const sec = useRef(null)
  const canvas = useRef(null)
  const chapRefs = useRef([])
  const dotRefs = useRef([])
  const veil = useRef(null)
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
      const stageH = window.innerHeight - 64
      const p = clamp(-r.top / (r.height - stageH - 0))
      try {
        scene && scene.setProgress(p)
      } catch (e) {}
      /* نص واحد يظهر دائماً: آخر محطة بلغها المتصفح، بلا فراغات بين المحطات */
      let active = 0
      chapters.forEach((c, i) => {
        if (p >= c.from) active = i
      })
      chapRefs.current.forEach((el, i) => el && el.classList.toggle('on', i === active))
      dotRefs.current.forEach((d, i) => d && d.classList.toggle('on', i === active))
      if (veil.current) veil.current.style.opacity = smooth(clamp((p - 0.955) / 0.045))
    })
    return () => {
      unsub()
      scene && scene.dispose()
    }
  }, [])

  return (
    <section className="journey" id="top" ref={sec}>
      <div className="stage">
        {fallback ? <img className="stage-fallback" src="./assets/sunset.jpg" alt="غروب على شطّ العرب في البصرة" /> : <canvas ref={canvas} className="stage-canvas" aria-label="مجسّم ثلاثي الأبعاد لنهر شطّ العرب والنخيل والزوارق" role="img" />}
        <div className="stage-veil" ref={veil} />

        <div className="chap chap-hero on" ref={(el) => (chapRefs.current[0] = el)}>
          <h1 className="hero-title">البصرة، حيث يلتقي النهران</h1>
          <p className="hero-sub">مدينة السندباد والنخيل وشطّ العرب. ابدأ الرحلة لتكتشف وجهاتها وتاريخها وأعلامها وأخبارها.</p>
          <a className="btn" href="#places">اكتشف الوجهات</a>
          <BasraNow />
        </div>

        {chapters.slice(1).map((c, i) => (
          <div key={c.id} className={`chap chap-card ${c.side}`} ref={(el) => (chapRefs.current[i + 1] = el)}>
            <h2 className="chap-title">{c.title}</h2>
            <p className="chap-text">{c.text}</p>
          </div>
        ))}

        <ol className="rail" aria-hidden="true">
          {chapters.map((c, i) => (
            <li key={c.id} ref={(el) => (dotRefs.current[i] = el)} />
          ))}
        </ol>
        <p className="scroll-hint" aria-hidden="true"><span />اسحب للأسفل</p>
      </div>
    </section>
  )
}

function Intro() {
  return (
    <section className="sec intro" id="about">
      <div className="band" style={{ backgroundImage: PAT.lat }} aria-hidden="true" />
      <div className="wrap intro-grid">
        <figure className="intro-pic rv">
          <img src="./assets/sindibad.jpg" alt="شطّ العرب وجزيرة السندباد والنخيل" loading="lazy" />
          <figcaption>شطّ العرب وجزيرة السندباد</figcaption>
        </figure>
        <div className="intro-text">
          <h2 className="h2 rv">مدينة وُلدت من الماء</h2>
          <p className="statement rv" style={{ '--d': '80ms' }}>
            يلتقي دجلة والفرات في القرنة فيصنعان شطّ العرب، النهر الذي يسقي النخيل ويحمل السفن إلى الخليج، وجعل من البصرة بوّابة العراق إلى العالم منذ أكثر من ألف عام.
          </p>
          <p className="body rv" style={{ '--d': '140ms' }}>
            تأسست البصرة سنة ٦٣٦م وصارت مدينة العلماء والشعراء والبحّارة. واليوم يجعلها ميناء أمّ قصر وحقولها النفطية وملعبها الجديد أنشط مدن الجنوب العراقي.
          </p>
        </div>
      </div>
      <div className="wrap stats">
        {stats.map((s, i) => (
          <Tilt key={s.t} className="stat rv" style={{ '--d': `${i * 70}ms`, '--pat': PAT_L[s.pat] }}>
            <p className="stat-n">{s.n}</p>
            <p className="stat-u">{s.u}</p>
            <p className="stat-t">{s.t}</p>
          </Tilt>
        ))}
      </div>
    </section>
  )
}

/* الوجهات: معرض أفقي بعمق ثلاثي الأبعاد */
function Places() {
  const sec = useRef(null)
  const track = useRef(null)
  const cards = useRef([])

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
      cards.current.forEach((c) => {
        if (!c) return
        const b = c.getBoundingClientRect()
        const k = (b.left + b.width / 2 - vw / 2) / vw
        const a = Math.abs(k)
        c.style.transform = `rotateY(${clamp(k, -1, 1) * -26}deg) translateZ(${-a * 160}px) scale(${1 - Math.min(a, 1) * 0.1})`
        c.style.opacity = 1 - Math.min(a, 1.2) * 0.35
      })
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
        <div className="places-head">
          <h2 className="h2">وجهات لا تفوّتها</h2>
          <p className="places-hint">تابع التمرير لتسير على ضفاف البصرة</p>
        </div>
        <div className="places-view">
          <div className="places-track" ref={track}>
            {places.map((p, i) => (
              <article key={p.id} className="pcard" ref={(el) => (cards.current[i] = el)}>
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
      <div className="wrap">
        <h2 className="h2 rv">ثلاثة عشر قرناً من الحكايات</h2>
      </div>
      <div className="wrap era-stack" ref={wrap}>
        {eras.map((e, i) => (
          <article key={e.year} className={`era tone-${e.tone}`} style={{ '--i': i, '--pat': e.tone === 'ink' ? 'var(--p-mash-ink)' : e.tone === 'sand' ? PAT_L[e.pat] : PAT[e.pat] }}>
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
        <h2 className="h2">أعلام أنجبتهم البصرة</h2>
        <div className="ring-view">
          <div className="ring" ref={ring}>
            {people.map((p, i) => (
              <div key={p.ar} className="rcard" ref={(el) => (cardRefs.current[i] = el)} style={{ transform: `rotateY(${(i * 360) / people.length}deg) translateZ(var(--R))` }}>
                <p className="rcard-name">{p.ar}</p>
                <p className="rcard-years">{p.years}</p>
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

function Culture() {
  const pic = useRef(null)
  useEffect(() => {
    return subscribe(() => {
      const r = pic.current.getBoundingClientRect()
      const t = clamp(1 - r.top / window.innerHeight)
      const img = pic.current.querySelector('img')
      pic.current.style.clipPath = `inset(${(1 - smooth(clamp(t * 2.2))) * 24}% ${(1 - smooth(clamp(t * 2.2))) * 18}% ${(1 - smooth(clamp(t * 2.2))) * 24}% ${(1 - smooth(clamp(t * 2.2))) * 18}%)`
      img.style.transform = `translate3d(0, ${(t - 0.5) * -60}px, 0) scale(1.18)`
    })
  }, [])
  return (
    <section className="sec culture" id="culture" style={{ backgroundImage: PAT.palm }}>
      <div className="wrap culture-grid">
        <div className="culture-copy">
          <h2 className="h2 rv">طعم الجنوب وحِرفه</h2>
          <ul className="tastes">
            {tastes.map((t, i) => (
              <li key={t.t} className="taste rv" style={{ '--d': `${i * 60}ms` }}>
                <h3 className="taste-t">{t.t}</h3>
                <p>{t.d}</p>
              </li>
            ))}
          </ul>
        </div>
        <figure className="culture-pic" ref={pic}>
          <img src="./assets/mashoof.jpg" alt="زورق مشحوف تقليدي على النهر" loading="lazy" />
        </figure>
      </div>
    </section>
  )
}

function News() {
  const [feat, ...rest] = news
  return (
    <section className="sec news" id="news">
      <div className="wrap">
        <h2 className="h2 rv">آخر أخبار البصرة</h2>
        <div className="news-grid">
          <Tilt className="news-feat rv" max={5}>
            <img src={feat.img} alt="رافعة ميناء وجسر على شطّ العرب" loading="lazy" />
            <div className="news-feat-copy">
              <p className="news-tag">{feat.tag}</p>
              <h3 className="h3">{feat.title}</h3>
              <p>{feat.text}</p>
            </div>
          </Tilt>
          <ul className="news-list">
            {rest.map((n, i) => (
              <li key={n.title} className="rv" style={{ '--d': `${i * 70}ms` }}>
                <Tilt className="news-item" max={6}>
                  <p className="news-tag">{n.tag}</p>
                  <h3 className="news-title">{n.title}</h3>
                  <p className="news-text">{n.text}</p>
                </Tilt>
              </li>
            ))}
          </ul>
        </div>
        <p className="news-note">هذا القسم تجريبي، وسيُربط بمصدر أخبار حيّ بعد الإطلاق.</p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer" style={{ backgroundImage: PAT.lat }}>
      <PalmGrove />
      <div className="footer-body">
        <p className="footer-word" aria-hidden="true">البصرة</p>
        <div className="wrap footer-cols">
          <p className="footer-line">البصرة، حيث يلتقي النهران.</p>
          <nav aria-label="روابط" className="footer-nav">
            {nav.map((n) => (
              <a key={n.href} href={n.href}>{n.label}</a>
            ))}
          </nav>
        </div>
        <p className="wrap credits">{credits.join(' · ')}</p>
      </div>
    </footer>
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
