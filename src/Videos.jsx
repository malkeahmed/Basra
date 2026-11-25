/* قسم الفيديو بأسلوب آبل: عنوان كبير، شريط أفقي من البطاقات الكبيرة، ومؤشر تقدّم كحبة */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import './videos.css'

const A = (f) => './assets/' + f
const num = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d])
const pad = (n) => num(String(n).padStart(2, '0'))

/* yt: معرّف مقطع يوتيوب. اتركه فارغاً وستظهر عبارة «قريباً» حتى تضيف الفيديو */
const VIDEOS = [
  { img: 'shatt-basra.jpg', t: 'حيث يلتقي النهران', k: 'شطّ العرب', d: '٣:٤٠', yt: '' },
  { img: 'corniche.jpg', t: 'كورنيش البصرة ليلاً', k: 'ضفاف النهر', d: '٢:١٥', yt: '' },
  { img: 'marshes.jpg', t: 'رحلة في الأهوار عند الفجر', k: 'الطبيعة', d: '٤:٠٢', yt: '' },
  { img: 'f-shanasheel.jpg', t: 'الشناشيل البصرية', k: 'العمارة', d: '١:٥٨', yt: '' },
  { img: 'mashoof.jpg', t: 'صناعة المشحوف', k: 'الحِرف', d: '٢:٣٠', yt: '' },
]
const AUTO = 6500

export default function Videos() {
  const root = useRef(null)
  const track = useRef(null)
  const hd = useRef(null)
  const cards = useRef([])
  const [cur, setCur] = useState(0)
  const [open, setOpen] = useState(false)
  const [play, setPlay] = useState(true)
  const [seen, setSeen] = useState(false)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 })
    io.observe(root.current)
    return () => io.disconnect()
  }, [])

  /* تقدّم العنوان مرتبط بالتمرير: يظهر النص تدريجياً كلما صعد إلى الشاشة */
  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = 0
      const el = hd.current
      if (!el) return
      const r = el.getBoundingClientRect(), vh = innerHeight
      const p = Math.min(1, Math.max(0, (vh * 0.95 - r.top) / (vh * 0.55)))
      el.style.setProperty('--p', p.toFixed(3))
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(tick) }
    tick()
    addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [])

  /* البطاقة الأقرب إلى منتصف الشريط هي النشطة */
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setCur(+e.target.dataset.i)),
      { root: track.current, threshold: 0.6 }
    )
    cards.current.forEach((c) => c && io.observe(c))
    return () => io.disconnect()
  }, [])

  const go = useCallback((i) => {
    const n = (i + VIDEOS.length) % VIDEOS.length
    setCur(n)
    cards.current[n]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [])

  useEffect(() => {
    if (!open) return
    const k = (e) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'ArrowLeft') go(cur + 1)
      if (e.key === 'ArrowRight') go(cur - 1)
    }
    addEventListener('keydown', k)
    const ov = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = ov }
  }, [open, cur, go])

  const v = VIDEOS[cur]
  const run = seen && play && !hover && !open

  return (
    <section className={'vx' + (seen ? ' in' : '')} id="videos" ref={root}>
      <div className="vx-bg" aria-hidden="true">
        {VIDEOS.map((x, i) => <img key={x.img} src={A(x.img)} alt="" className={i === cur ? "on" : ""} />)}
        <i className="vx-glow" />
        <i className="vx-grain" />
      </div>

      <header className="vx-hd" ref={hd}>
        <h2><b>فيديوهات</b></h2>
      </header>

      <div className="vx-track" ref={track} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
        {VIDEOS.map((x, i) => (
          <article
            key={x.t}
            ref={(el) => (cards.current[i] = el)}
            data-i={i}
            className={'vx-card' + (i === cur ? ' on' : '')}
            onClick={() => (i === cur ? setOpen(true) : go(i))}
          >
            <img src={A(x.img)} alt="" loading={i < 2 ? 'eager' : 'lazy'} draggable="false" />
            <div className="vx-txt">
              <p>{x.k}</p>
              <h3>{x.t}</h3>
            </div>
            <span className="vx-dur">{x.d}</span>
            <button className="vx-btn" tabIndex={i === cur ? 0 : -1} onClick={(e) => { e.stopPropagation(); setOpen(true) }} aria-label={'تشغيل: ' + x.t}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
            </button>
          </article>
        ))}
      </div>

      <div className="vx-ctl">
        <div className="vx-bar">
          <button className="vx-ar" onClick={() => go(cur - 1)} aria-label="السابق">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>

          <div className="vx-now" aria-live="polite">
            <span className="vx-no"><b key={cur}>{pad(cur + 1)}</b><i>/</i>{pad(VIDEOS.length)}</span>
            <span className="vx-nm" key={'t' + cur}>{v.t}</span>
          </div>

          <div className="vx-pager" role="tablist" aria-label="المقاطع">
            {VIDEOS.map((x, i) => (
              <button key={x.t} role="tab" aria-selected={i === cur} aria-label={x.t} className={i === cur ? 'on' : i < cur ? 'done' : ''} onClick={() => go(i)}>
                {i === cur && <u key={cur + (run ? 'r' : 'p')} style={{ animationDuration: AUTO + 'ms', animationPlayState: run ? 'running' : 'paused' }} onAnimationEnd={() => go(cur + 1)} />}
              </button>
            ))}
          </div>

          <button className="vx-pp" onClick={() => setPlay((p) => !p)} aria-label={play ? 'إيقاف التقدّم التلقائي' : 'تشغيل التقدّم التلقائي'}>
            {play
              ? <svg viewBox="0 0 24 24" width="15" height="15"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
              : <svg viewBox="0 0 24 24" width="15" height="15"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>}
          </button>

          <button className="vx-ar" onClick={() => go(cur + 1)} aria-label="التالي">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="vx-lb" role="dialog" aria-modal="true" aria-label={v.t} onClick={() => setOpen(false)}>
          <div className="vx-wrap" onClick={(e) => e.stopPropagation()}>
            {v.yt ? (
              <iframe src={`https://www.youtube-nocookie.com/embed/${v.yt}?autoplay=1&rel=0`} title={v.t} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            ) : (
              <div className="vx-soon" style={{ backgroundImage: `url(${A(v.img)})` }}><span>الفيديو قريباً</span></div>
            )}
            <p className="vx-mc"><b>{v.t}</b> {v.k}</p>
          </div>
          <button className="vx-x" onClick={() => setOpen(false)} aria-label="إغلاق">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </button>
        </div>
      )}
    </section>
  )
}
