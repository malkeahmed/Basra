/* ألبوم الصور: عنوان في الوسط، أزرار تصفية، ولوحة بلاطات متراصّة بصور المدينة */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import './album.css'

const A = (f) => './assets/' + f
const num = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d])
const pad = (n) => num(String(n).padStart(2, '0'))

/* c و r: أعمدة وصفوف في شبكة من اثني عشر عموداً */
const ALL = [
  { img: 'corniche.jpg', t: 'الكورنيش', k: 'ضفاف النهر', c: 6, r: 4 },
  { img: 'shatt-basra.jpg', t: 'حيث يلتقي النهران', k: 'شطّ العرب', c: 6, r: 2 },
  { img: 'marshes.jpg', t: 'أهوار الجنوب', k: 'الطبيعة', c: 3, r: 2 },
  { img: 'mashoof.jpg', t: 'المشحوف', k: 'الماء', c: 3, r: 2 },
  { img: 'f-shanasheel.jpg', t: 'الشناشيل', k: 'العمارة', c: 3, r: 4 },
  { img: 'imam-ali-basra.jpg', t: 'مئذنة مسجد الإمام علي', k: 'الزبير', c: 6, r: 4 },
  { img: 'f-ashar-boat.jpg', t: 'خليج العشّار', k: 'السوق والماء', c: 3, r: 2 },
  { img: 'qurna-adam-tree.jpg', t: 'شجرة آدم', k: 'القرنة', c: 3, r: 2 },
  { img: 'mirbad-old.jpg', t: 'المربد', k: 'التاريخ', c: 6, r: 3 },
  { img: 'shanasheel.jpg', t: 'شرفات خشبية', k: 'العمارة', c: 6, r: 3 },
]
const CATS = [
  { id: 'all', t: 'الكل' },
  { id: 'water', t: 'الماء', k: ['شطّ العرب', 'الماء', 'السوق والماء', 'ضفاف النهر'] },
  { id: 'arch', t: 'العمارة', k: ['العمارة', 'الزبير'] },
  { id: 'nature', t: 'الطبيعة', k: ['الطبيعة', 'القرنة'] },
  { id: 'past', t: 'التاريخ', k: ['التاريخ', 'ذاكرة'] },
]

export default function Album() {
  const root = useRef(null)
  const hd = useRef(null)
  const [open, setOpen] = useState(-1)
  const [f, setF] = useState('all')
  const cat = CATS.find((c) => c.id === f)
  const tiles = f === 'all' ? ALL : ALL.filter((x) => cat.k.includes(x.k))

  useEffect(() => {
    const el = root.current
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('v'), io.unobserve(e.target))), { threshold: 0.14 })
    el.querySelectorAll('.al-up, .al-t').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [f])

  useEffect(() => {
    const el = hd.current
    const io = new IntersectionObserver(([e]) => el.classList.toggle('v', e.isIntersecting), { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const go = useCallback((d) => setOpen((i) => (i < 0 ? i : (i + d + ALL.length) % ALL.length)), [])
  useEffect(() => {
    if (open < 0) return
    const k = (e) => { if (e.key === 'Escape') setOpen(-1); if (e.key === 'ArrowLeft') go(1); if (e.key === 'ArrowRight') go(-1) }
    addEventListener('keydown', k)
    const ov = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = ov }
  }, [open, go])

  const show = (img) => setOpen(ALL.findIndex((x) => x.img === img))
  const cur = open >= 0 ? ALL[open] : null

  return (
    <section className="al" id="album" ref={root}>
      <div className="al-c" id="al-board">
        <div className="al-hd" ref={hd}>
          <h3 className="al-h" aria-label="ألبوم الصور">
            <span className="al-line" aria-hidden="true">
              <span className="al-wr"><b className="al-w1">ألبوم</b> <b className="al-w2">الصور</b></span>
              <i className="al-pen" />
            </span>
          </h3>
        </div>
        <div className={'al-grid' + (f === 'all' ? '' : ' flt')} key={f}>
          {tiles.map((x, i) => (
            <figure key={x.img} className="al-t" style={{ '--c': x.c, '--r': x.r, '--d': (i % 4) * 80 + 'ms' }}>
              <button type="button" onClick={() => show(x.img)} aria-label={x.t}>
                <img src={A(x.img)} alt={x.t} loading="lazy" decoding="async" draggable="false" />
                <figcaption><b>{x.t}</b><span>{x.k}</span></figcaption>
                <i className="al-plus" aria-hidden="true">+</i>
              </button>
            </figure>
          ))}
        </div>
      </div>

      {cur && (
        <div className="al-lb" role="dialog" aria-modal="true" aria-label={cur.t} onClick={() => setOpen(-1)}>
          <img key={open} src={A(cur.img)} alt={cur.t} onClick={(e) => e.stopPropagation()} />
          <p className="al-lbcap"><b>{cur.t}</b><span>{pad(open + 1)} / {pad(ALL.length)} · {cur.k}</span></p>
          <button type="button" className="al-x" onClick={() => setOpen(-1)} aria-label="إغلاق">×</button>
          <button type="button" className="al-n al-nr" onClick={(e) => { e.stopPropagation(); go(-1) }} aria-label="السابق">›</button>
          <button type="button" className="al-n al-nl" onClick={(e) => { e.stopPropagation(); go(1) }} aria-label="التالي">‹</button>
        </div>
      )}
    </section>
  )
}
