/* حلقة تمرير واحدة مشتركة */
const subs = new Set()
let queued = false

function run() {
  queued = false
  subs.forEach((f) => f())
}
function queue() {
  if (!queued) {
    queued = true
    requestAnimationFrame(run)
  }
}
window.addEventListener('scroll', queue, { passive: true })
window.addEventListener('resize', queue)

export function subscribe(fn) {
  subs.add(fn)
  fn()
  return () => subs.delete(fn)
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const smooth = (t) => t * t * (3 - 2 * t)
