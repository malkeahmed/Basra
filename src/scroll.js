/* حلقة تمرير واحدة مشتركة. لكل مشترك اختياري عنصر: لا يُستدعى إلا حين يقترب القسم من الشاشة، فلا تُهدر القياسات على أقسام بعيدة */
const subs = new Set()
let queued = false

function run() {
  queued = false
  subs.forEach((s) => {
    if (s.st && !s.st.near && !s.st.flush) return
    if (s.st) s.st.flush = false
    s.fn()
  })
}
function queue() {
  if (!queued) {
    queued = true
    requestAnimationFrame(run)
  }
}
window.addEventListener('scroll', queue, { passive: true })
window.addEventListener('resize', queue)

export function subscribe(fn, getEl) {
  const s = { fn, st: null, io: null }
  if (getEl && 'IntersectionObserver' in window) {
    const el = typeof getEl === 'function' ? getEl() : getEl
    if (el) {
      s.st = { near: true, flush: false }
      s.io = new IntersectionObserver(
        (es) => {
          const near = es[es.length - 1].isIntersecting
          if (!near && s.st.near) s.st.flush = true /* آخر استدعاء عند المغادرة ليستقرّ الشكل النهائي */
          s.st.near = near
          queue()
        },
        { rootMargin: '60% 0px 60% 0px' }
      )
      s.io.observe(el)
    }
  }
  subs.add(s)
  fn()
  return () => {
    subs.delete(s)
    s.io && s.io.disconnect()
  }
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const smooth = (t) => t * t * (3 - 2 * t)
