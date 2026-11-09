/*
  تمرير انسيابي لكامل الموقع: عجلة الفأرة تُحرّك هدفاً، والصفحة تلحق به بتسارع ناعم مستقل عن معدّل الإطارات.
  اللمس والكيبورد والمؤشّر الجانبي تبقى طبيعية، ويتزامن الهدف معها تلقائياً.
*/
export function installSmoothScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (window.matchMedia('(pointer: coarse)').matches) return
  const root = document.documentElement
  let target = window.scrollY
  let raf = 0
  let last = 0
  let self = false
  const max = () => root.scrollHeight - window.innerHeight
  const clampT = (v) => Math.max(0, Math.min(max(), v))
  const locked = () => root.style.overflow === 'hidden' || !!document.querySelector('.menu-open')

  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
    last = now
    const cur = window.scrollY
    const diff = target - cur
    if (Math.abs(diff) < 0.3) {
      self = true
      window.scrollTo(0, target)
      raf = 0
      return
    }
    self = true
    window.scrollTo(0, cur + diff * (1 - Math.exp(-dt * 6.5)))
    raf = requestAnimationFrame(tick)
  }
  const kick = () => {
    if (!raf) {
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
  }

  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || e.defaultPrevented) return
      if (locked() || e.target.closest?.('.mn, textarea, [data-native-scroll]')) {
        target = window.scrollY
        return
      }
      e.preventDefault()
      let dy = e.deltaY
      if (e.deltaMode === 1) dy *= 32
      else if (e.deltaMode === 2) dy *= window.innerHeight
      target = clampT((raf ? target : window.scrollY) + dy)
      kick()
    },
    { passive: false }
  )
  window.addEventListener(
    'scroll',
    () => {
      if (self) {
        self = false
        return
      }
      if (!raf) target = window.scrollY
    },
    { passive: true }
  )
  window.addEventListener('resize', () => (target = clampT(target)))
  /* الروابط الداخلية تنزلق بالطريقة نفسها */
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href^="#"]')
    if (!a || a.getAttribute('href') === '#') return
    const el = document.querySelector(a.getAttribute('href'))
    if (!el) return
    e.preventDefault()
    target = clampT(el.getBoundingClientRect().top + window.scrollY - 20)
    kick()
  })
}
