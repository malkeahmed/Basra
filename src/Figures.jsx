/* شخصيات البصرة: عكس مركزي، لوحة تعريف، وفهرس سفلي يتبدّل مع التمرير */
import React, { useEffect, useRef, useState } from 'react'
import './figures.css'

const A = (f) => './assets/' + f
const num = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d])
const pad = (n) => num(String(n).padStart(2, '0'))

const FIGURES = [
  { name: 'ابن الهيثم', field: 'البصريات', years: 'نحو ٩٦٥ – ١٠٤٠م', img: 'p-haytham.jpg', text: 'وُلد في البصرة، وهو أبو علم البصريات. كتابه «المناظر» مهّد للكاميرا وللمنهج العلمي الحديث.' },
  { name: 'الجاحظ', field: 'الأدب', years: 'نحو ٧٧٦ – ٨٦٨م', img: 'era-jahiz.jpg', text: 'صاحب «الحيوان» و«البخلاء». نثره ما زال يحمل رائحة سوق المربد وضحكة أهله.' },
  { name: 'الخليل الفراهيدي', field: 'اللغة والعروض', years: 'القرن ٨م', img: 'p-farahidi.jpg', text: 'واضع علم العروض وصاحب أول معجم عربي: «العين». سمع الإيقاع في طرق الصفّارين فصاغه علماً.' },
  { name: 'رابعة العدوية', field: 'التصوّف', years: 'القرن ٨م', img: 'p-rabia.jpg', text: 'عابدة بصرية صاغت الحبّ الإلهي بكلمات بسيطة عميقة، تتردّد منذ اثني عشر قرناً.' },
  { name: 'بدر شاكر السيّاب', field: 'الشعر', years: '١٩٢٦ – ١٩٦٤م', img: 'sayyab.jpg', text: 'رائد الشعر الحر العربي وصاحب «أنشودة المطر»، ابن جيكور وقرى النخيل على شطّ العرب.' },
  { name: 'الحسن البصري', field: 'الزهد والخطابة', years: '٢١ – ١١٠هـ', text: 'من أئمة التابعين. نشأ في البصرة وجعل حلقته في مسجدها مدرسةً للوعظ والزهد.' },
  { name: 'سيبويه', field: 'النحو', years: 'القرن ٨م', text: 'إمام النحاة. تعلّم في حلقات البصرة وكتب «الكتاب» الذي بقي عمدة العربية قروناً.' },
  { name: 'واصل بن عطاء', field: 'الفكر والكلام', years: '٨٠ – ١٣١هـ', text: 'أسّس مدرسة المعتزلة من حلقة الحسن البصري في البصرة، وفتح باب الجدل العقلي.' },
]

/* نقش هندسي إسلامي: نجمة ثمانية وصليب، بلاطة واحدة تتكرّر. طبقتان: حبر هادئ وذهب يتجوّل */
const TILE = (
  <>
    <path d="M26 26H74V74H26Z M50 16.1L83.9 50L50 83.9L16.1 50Z" />
    <path d="M26 26L12 12M74 26L88 12M74 74L88 88M26 74L12 88" />
    <path d="M50 0V16.1M50 100V83.9M0 50H16.1M100 50H83.9" />
    <path d="M0 12V88M100 12V88M12 0H88M12 100H88" />
    <path d="M0 0H12V0M0 0V12M88 0H100V12M100 88V100H88M0 88V100H12" />
  </>
)
function Geo({ id, cls }) {
  return (
    <svg className={'fg-geo ' + cls} aria-hidden="true">
      <defs>
        <pattern id={id} width="76" height="76" viewBox="0 0 100 100" patternUnits="userSpaceOnUse" x="-20" y="-6">
          <g fill="none" strokeLinejoin="round">{TILE}</g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

export default function Figures() {
  const sec = useRef(null)
  const [at, setAt] = useState(0)
  const n = FIGURES.length

  /* التبديل بالنقر على الفهرس أو بأسهم لوحة المفاتيح، لا بالتمرير */
  const go = (i) => setAt((i + n) % n)
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') go(at + 1)
    if (e.key === 'ArrowRight') go(at - 1)
  }

  const onMove = (e) => {
    const b = e.currentTarget.getBoundingClientRect()
    e.currentTarget.dataset.hov = '1'
    e.currentTarget.style.setProperty('--mx', e.clientX - b.left + 'px')
    e.currentTarget.style.setProperty('--my', e.clientY - b.top + 'px')
  }

  const f = FIGURES[at]
  return (
    <section className="fg" id="figures" ref={sec} style={{ '--n': n, '--at': at, '--q': 0.5 }} onKeyDown={onKey}>
      <div className="fg-stage">
        <header className="fg-top">
          <span>شخصيات البصرة</span>
          <span className="fg-count"><b>{pad(at + 1)}</b> / {pad(n)}</span>
        </header>

        <div className="fg-body" onPointerMove={onMove} onPointerLeave={(e) => e.currentTarget.removeAttribute('data-hov')}>
          <div className="fg-geos">
            <Geo id="fgg1" cls="base" />
            <Geo id="fgg2" cls="lit" />
          </div>
          <div className="fg-plate">
            {FIGURES.map((x, i) => (
              <div key={x.name} className={'fg-pl' + (i === at ? ' on' : '')} aria-hidden={i !== at}>
                <p className="fg-field">{x.field}</p>
                <p className="fg-yrs">
                  {x.years.split(' – ').map((y, j) => (
                    <React.Fragment key={j}>
                      {j > 0 && <i aria-hidden="true" />}
                      <bdi>{y}</bdi>
                    </React.Fragment>
                  ))}
                </p>
              </div>
            ))}
          </div>

          <figure className="fg-fig">
            <div className="fg-frame">
              {FIGURES.map((x, i) => (
                <div key={x.name} className={'fg-ph' + (i === at ? ' on' : '')} aria-hidden={i !== at}>
                  {x.img ? <img src={A(x.img)} alt="" decoding="async" /> : <span className="fg-letter">{x.name.replace(/^ال/, '').charAt(0)}</span>}
                </div>
              ))}
            </div>
          </figure>

          <h2 className="fg-sr" aria-live="polite">{f.name}</h2>
          <div className="fg-tx">
            {FIGURES.map((x, i) => (
              <p key={x.name} className={'fg-t' + (i === at ? ' on' : '')} aria-hidden={i !== at}>{x.text}</p>
            ))}
          </div>
        </div>

        <nav className="fg-index" aria-label="شخصيات البصرة">
          {FIGURES.map((x, i) => (
            <button key={x.name} type="button" className={i === at ? 'on' : i < at ? 'past' : ''} onClick={() => go(i)} aria-current={i === at}>
              <i>{pad(i + 1)}</i>
              <span>{x.name}</span>
            </button>
          ))}
          <u className="fg-line" aria-hidden="true" />
        </nav>
      </div>
    </section>
  )
}
