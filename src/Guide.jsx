/* الدليل السياحي: مشهد سينمائي بصورة من البصرة خلف كل مكان، وقائمة كبيرة وتفاصيل تظهر بنعومة */
import React, { useEffect, useRef, useState } from 'react'
import './guide.css'

const num = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d])
const pad = (n) => num(String(n).padStart(2, '0'))
const A = (f) => './assets/' + f
const map = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q)

/* bg: صورة جوّ من البصرة خلف المكان، وليست صورة المكان نفسه. إن وُجدت صورة مجازة للمكان ضعها في img */
const ICONS = {
  hotels: 'M3 19V6M3 14h18v5M21 14v-2a3 3 0 0 0-3-3h-8v5M6.5 11.5h.01',
  restaurants: 'M7 3v7M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3M7 10v11M17 21V3c-2.3 1.2-3.5 4-3.5 8H17',
  cafes: 'M4 9h12v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M7 3v2.5M11 3v2.5',
}
const TABS = [
  {
    id: 'hotels',
    label: 'فنادق',
    accent: '#e8c77c',
    line: 'إقامة تليق بالنهر.',
    items: [
      { id: 'grand-millennium', bg: 'corniche.jpg', img: 'guide-grand-millennium.jpg', credit: '© Grand Millennium Al Seef Basra', name: 'غراند ميلينيوم السيف', en: 'Grand Millennium Al Seef Basra', area: 'مناوي باشا', address: 'شارع الوفود، منطقة مناوي باشا، البصرة', desc: 'فندق من فئة الخمس نجوم، فيه مسبح خارجي ونادٍ رياضي ومواقف مجانية، ويضمّ عدّة مطاعم راقية من «ذا فيو» إلى «أوليف» و«سلة الأسماك».', q: 'Grand Millennium Al Seef Basra' },
      { id: 'basra-international', bg: 'shatt-basra.jpg', img: 'guide-intl-hotel.jpg', credit: 'صورة: David Stanly، ويكيميديا كومنز، CC BY 3.0', name: 'فندق البصرة الدولي', en: 'Basra International Hotel', area: 'كورنيش العشار', address: 'كورنيش العشار، شطّ العرب، البصرة', desc: 'يطلّ على شطّ العرب وعلى بُعد دقيقتين سيراً من الكورنيش، ويقدّم خدمة الغرف ومركز أعمال وقاعات اجتماعات.', q: 'Basra International Hotel Ashar Corniche' },
      { id: 'zenat-alhayat', bg: 'sindibad.jpg', name: 'فندق زينة الحياة', en: 'Zenat Al-Hayat Basra Hotel', area: 'البراضعية', address: 'قرب جامعة البصرة، البراضعية، البصرة', desc: 'مسبح داخلي وسبا وساونا ونادٍ رياضي، مع خدمة نقل من المطار وإفطار ومواقف مجانية.', q: 'Zenat Al-Hayat Basra Hotel' },
      { id: 'mnawi-basha', bg: 'port.jpg', img: 'guide-mnawi-basha.jpg', credit: 'صورة: Mnawi Basha Hotel، ويكيميديا كومنز (استخدام حر)', name: 'فندق مناوي باشا', en: 'Mnawi Basha Hotel', area: 'الرباط الصغير', address: 'شارع مناوي باشا، الرباط الصغير، البصرة', desc: 'فندق من فئة الخمس نجوم افتُتح عام ٢٠٠٩، يضمّ ١٣٦ غرفة ومطعماً واحداً.', q: 'Mnawi Basha Hotel Basra' },
      { id: 'airport-hotel', bg: 'sea-wave.jpg', name: 'فندق مطار البصرة الدولي', en: 'Basrah International Airport Hotel', area: 'مطار البصرة', address: 'بجوار مطار البصرة الدولي', desc: 'مسبح خارجي ونادٍ رياضي وحديقة ومواقف مجانية، خيار عملي لمن يصل أو يغادر عبر المطار.', q: 'Basrah International Airport Hotel' },
    ],
  },
  {
    id: 'restaurants',
    label: 'مطاعم',
    accent: '#f2a584',
    line: 'مائدة بنكهة البصرة.',
    items: [
      { id: 'the-view', img: 'guide-grand-millennium.jpg', credit: '© Grand Millennium Al Seef Basra، مبنى الفندق الذي يضمّ المطعم', bg: 't-masgouf.jpg', name: 'ذا فيو', en: 'The View', area: 'غراند ميلينيوم', address: 'داخل غراند ميلينيوم السيف، شارع الوفود، مناوي باشا', desc: 'يصفه الفندق بأنه أرقى مطاعم المدينة وأكثرها حصرية، ويقدّم تجربة طعام فاخرة بإطلالة.', q: 'The View Restaurant Grand Millennium Al Seef Basra' },
      { id: 'olive', img: 'guide-grand-millennium.jpg', credit: '© Grand Millennium Al Seef Basra، مبنى الفندق الذي يضمّ المطعم', bg: 't-dates.jpg', name: 'أوليف', en: 'Olive', area: 'غراند ميلينيوم', address: 'داخل غراند ميلينيوم السيف، شارع الوفود، مناوي باشا', desc: 'مطبخ إيطالي تحت سقف زجاجي وعلى شرفة مفتوحة، بأجواء دافئة وتقديم أنيق.', q: 'Olive Restaurant Grand Millennium Al Seef Basra' },
      { id: 'sallat-asmak', img: 'guide-grand-millennium.jpg', credit: '© Grand Millennium Al Seef Basra، مبنى الفندق الذي يضمّ المطعم', bg: 'mashoof.jpg', name: 'سلة الأسماك', en: 'Sallat Al Asmak', area: 'غراند ميلينيوم', address: 'داخل غراند ميلينيوم السيف، شارع الوفود، مناوي باشا', desc: 'مأكولات عراقية وشامية يُعدّ معظمها أمام الضيوف في مطبخ مكشوف.', q: 'Sallat Al Asmak Grand Millennium Al Seef Basra' },
      { id: 'numi', bg: 't-loomi.jpg', name: 'نومي', en: 'Numi', area: 'شارع السيد حامد', address: 'شارع السيد حامد، البصرة', desc: 'نكهات عراقية تُقدَّم بروح عصرية، حيث يلتقي التقليد بالمائدة الحديثة.', q: 'Numi restaurant Sayed Hamed Street Basra' },
      { id: 'bbq-manqal', bg: 't-mudhif.jpg', name: 'بي بي كيو منقل', en: 'BBQ Manqal', area: 'الحسوية', address: 'الحسوية، البصرة', desc: 'بيت مشويات يجمع خدمة حديثة بوصفات تقليدية، في مكان مريح للجلوس.', q: 'BBQ Manqal Basrah' },
    ],
  },
  {
    id: 'cafes',
    label: 'مقاهي',
    accent: '#b9c8ff',
    line: 'فنجان على مهل.',
    items: [
      { id: 'jirso', bg: 'f-shanasheel.jpg', name: 'مقهى جرسو', en: 'Jirso Cafe', area: 'شارع ١٤ تموز', address: 'شارع ١٤ تموز، وسط البصرة', desc: 'مقهى بديكور مستوحى من حضارات العراق القديمة، وزاوية هادئة وسط شارع مزدحم.', q: 'Jirso Cafe Basra 14 Tammuz Street' },
      { id: 'fairouz', bg: 'shanasheel.jpg', name: 'مقهى ومكتبة فيروز', en: 'Fairouz Cafe & Bookshop', area: 'وسط البصرة', address: 'وسط البصرة (يُرجى التأكد من الموقع على الخريطة)', desc: 'مقهى ومكتبة بحنين شامي على اسم فيروز، ورد ذكره في تقارير عام ٢٠١٩.', q: 'Fairouz Cafe Bookshop Basra' },
      { id: 'rahim-hamid', bg: 'f-ashar-boat.jpg', name: 'مقهى رحيم حميد', en: 'Rahim Hamid Café', area: 'الزبير', address: 'الزبير، البصرة', desc: 'يُعرف بمقهى الرصيف الثقافي. افتُتح عام ٢٠٠٤ ويبقى مفتوحاً حتى ساعات متأخرة من الليل.', q: 'Rahim Hamid Cafe Al-Zubair Basra' },
      { id: 'brocafe', bg: 'mirbad-old.jpg', name: 'برو كافيه', en: 'Brocafe', area: 'شارع الجزائر', address: 'شارع الجزائر، البصرة', desc: 'مقهى عصري لمحبي القهوة المختصة، على شارع الجزائر.', q: 'Brocafe Algeria Street Basra' },
      { id: 'cafe-rest', bg: 'f-basra-1954.jpg', name: 'كافيه ريست', en: 'Café Rest', area: 'البصرة', address: 'رمز الموقع GRC4+5CC، البصرة', desc: 'مقهى حيّ بإيقاع هادئ، مناسب لجلسة طويلة وفنجان على مهل.', q: 'GRC4+5CC Basrah' },
    ],
  },
]

export default function Guide() {
  const [tab, setTab] = useState(0)
  const [idx, setIdx] = useState(0)
  const prevRef = useRef(0)
  const prev = prevRef.current
  useEffect(() => { prevRef.current = idx }, [idx])
  const sec = useRef(null)
  const story = useRef(null)
  const [stage, setStage] = useState(0)
  const t = TABS[tab]

  /* أبل: العنوان الضخم يصغر ويخفت عند التمرير، والصور تنزاح داخل بطاقاتها، والبطاقات تظهر بالتتابع */
  useEffect(() => {
    const el = sec.current
    let raf = 0
    const f = () => {
      raf = 0
      const sr = story.current.getBoundingClientRect()
      const st = Math.max(0, Math.min(1, -sr.top / (sr.height - innerHeight)))
      el.style.setProperty('--st', st.toFixed(3))
      setStage(st < 0.2 ? 0 : st < 0.45 ? 1 : st < 0.7 ? 2 : sr.bottom > innerHeight * 0.3 ? 3 : 4)
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(f) }
    f()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [tab])
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('v'), io.unobserve(e.target))), { threshold: 0.15 })
    sec.current.querySelectorAll('.gd-b, .gd-rv').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [tab])
  useEffect(() => { setIdx(0) }, [tab])

  const n = t.items.length
  const next = () => setIdx((i) => (i + 1) % n)

  return (
    <section className="gd" id="guide" ref={sec} style={{ '--acc': stage > 0 && stage < 4 ? TABS[stage - 1].accent : t.accent }} onPointerMove={(e) => { const b = e.currentTarget.firstChild.style; b.setProperty('--mx', e.clientX + 'px'); b.setProperty('--my', e.clientY + 'px') }}>
      <div className="gd-bg" aria-hidden="true"><i /><i /><i /><u /><b /></div>
      <div className="gd-story" ref={story}>
        <div className="gd-pin">
          <div className="gd-s0">
            <p className="gd-kicker gd-rv">البصرة · ١٥ مكاناً مختاراً</p>
            <h2 className="gd-title gd-rv gd-ti"><span>الدليل</span> <span>السياحي</span></h2>
          </div>
          {TABS.map((x, i) => (
            <div key={x.id} className={'gd-sw' + (stage === i + 1 ? ' on' : stage > i + 1 ? ' past' : '')} style={{ '--c': x.accent }} aria-hidden={stage !== i + 1}>
              <small>{pad(i + 1)} / {pad(TABS.length)}</small>
              <strong>{x.label}</strong>
              <span>{x.line}</span>
              <em>{num(x.items.length)} أماكن مختارة</em>
              <b className="gd-ghost" aria-hidden="true">{x.label}</b>
              <ul className="gd-chips" aria-hidden="true">{x.items.map((it, k) => <li key={it.id} style={{ '--k': k }}>{it.name}</li>)}</ul>
            </div>
          ))}
          <div className={'gd-cue' + (stage === 0 ? ' on' : '')} aria-hidden="true"><span>مرّر للأسفل</span><u /></div>
        </div>
      </div>

      <div className="gd-wrap">
        <div className="gd-lay">
          <aside className="gd-bar">
            <div className="gd-isle" role="tablist" aria-label="الدليل السياحي" style={{ '--i': tab }}>
              <i className="gd-pill" aria-hidden="true" />
              {TABS.map((x, i) => (
                <button key={x.id} type="button" role="tab" aria-selected={i === tab} className={i === tab ? 'on' : ''} onClick={() => setTab(i)}>
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={ICONS[x.id]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span>{x.label}</span>
                  <b className="gd-o" aria-hidden="true">{x.label}</b>
                  <sup>{pad(x.items.length)}</sup>
                </button>
              ))}
            </div>
            <h3 className="gd-line" key={t.id}>{t.line}</h3>
          </aside>
          <div className="gd-main">
          <div className="gd-ed" key={'s' + t.id} style={{ '--n': n }}>
            <div className="gd-edm">
              {t.items.map((it, i) => (
                <figure key={it.id} className={'gd-es' + (i === idx ? ' on' : i === prev ? ' was' : '')} aria-hidden={i !== idx}>
                  <img src={A(it.img || it.bg)} alt="" loading="eager" decoding="async" />
                </figure>
              ))}
              <div className="gd-edshade" />
            {t.items[idx].credit && <span className="gd-credit" key={'c' + idx}>{t.items[idx].credit}</span>}
  
              <div className="gd-edtop">
                <span className="gd-edno"><b key={idx}>{pad(idx + 1)}</b><i /> {pad(n)}</span>
                <span className="gd-edkind" key={'k' + idx}>{t.items[idx].area}</span>
              </div>
  
              <div className="gd-edcard">
                {t.items.map((it, i) => (
                  <div key={it.id} className={'gd-edi' + (i === idx ? ' on' : '')} aria-hidden={i !== idx}>
                    <h4>{it.name}</h4>
                    <span className="gd-fen" dir="ltr">{it.en}</span>
                    <p className="gd-fdesc">{it.desc}</p>
                    <div className="gd-edrow">
                      <a className="gd-map" href={map(it.q)} target="_blank" rel="noopener noreferrer" tabIndex={i === idx ? 0 : -1}>
                        عرض على الخريطة
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </a>
                      <p className="gd-faddr">
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="10" r="2.6" fill="currentColor" /></svg>
                        {it.address}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
  
            </div>
  
            <div className="gd-edbar" role="tablist" aria-label={t.label}>
              {t.items.map((it, i) => (
                <button key={it.id} type="button" role="tab" aria-selected={i === idx} className={i === idx ? 'on' : ''} onClick={() => setIdx(i)}>
                  <i>{pad(i + 1)}</i>
                  <span>{it.name}</span>
                  <u>{i === idx && <b key={t.id + idx} onAnimationEnd={next} />}</u>
                </button>
              ))}
            </div>
          </div>
          </div>
        </div>

        <p className="gd-note gd-rv">صور الخلفية من البصرة للأجواء فقط وليست صور هذه الأماكن. المعلومات من أدلة منشورة، فتحقّق من العنوان وساعات العمل قبل الزيارة.</p>
      </div>

    </section>
  )
}
