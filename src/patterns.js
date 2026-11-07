/* زخارف مرتبطة بالبصرة، كلها أشكال ممتلئة بلا خطوط رفيعة */
const uri = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

/* نجمة ثمانية وشبكة الشناشيل */
export const lattice = (fg, bg) =>
  uri(`<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><rect width='64' height='64' fill='${bg}'/><g fill='${fg}'><rect x='16' y='16' width='32' height='32'/><rect x='16' y='16' width='32' height='32' transform='rotate(45 32 32)'/><path d='M0 0h9L0 9zM64 0v9l-9-9zM0 64v-9l9 9zM64 64h-9l9-9z'/></g><circle cx='32' cy='32' r='8' fill='${bg}'/><circle cx='32' cy='32' r='3.5' fill='${fg}'/></svg>`)

/* نسيج سعف النخيل */
export const palmweave = (fg, bg) =>
  uri(`<svg xmlns='http://www.w3.org/2000/svg' width='48' height='24' viewBox='0 0 48 24'><rect width='48' height='24' fill='${bg}'/><g fill='${fg}'><path id='c' d='M0 24L24 0l24 24v10L24 10 0 34z'/><path d='M0 0L24 -24l24 24v10L24 -14 0 10z'/><path d='M0 48L24 24l24 24v10L24 34 0 58z'/></g></svg>`)

/* قشور الماء */
export const waves = (fg, bg) => {
  const ring = (x, y) =>
    `<circle cx='${x}' cy='${y}' r='15' fill='${fg}'/><circle cx='${x}' cy='${y}' r='11' fill='${bg}'/><circle cx='${x}' cy='${y}' r='7' fill='${fg}'/><circle cx='${x}' cy='${y}' r='3' fill='${bg}'/>`
  return uri(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='30' viewBox='0 0 60 30'><rect width='60' height='30' fill='${bg}'/>${[0, 30, 60].map((x) => ring(x, 30)).join('')}${[15, 45].map((x) => ring(x, 15)).join('')}${[0, 30, 60].map((x) => ring(x, 0)).join('')}</svg>`
  )
}

/* معيّنات المشربية */
export const mashrabiya = (fg, bg) =>
  uri(`<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><rect width='40' height='40' fill='${bg}'/><path d='M20 2l18 18-18 18L2 20z' fill='${fg}'/><path d='M20 12l8 8-8 8-8-8z' fill='${bg}'/></svg>`)

export const SAND = '#BF9E66'
export const SAND_D = '#A98748'
export const SAND_L = '#EBDDBE'
export const PAPER = '#F7F0E2'
export const INK = '#2A1F12'

export function installPatterns() {
  const r = document.documentElement.style
  r.setProperty('--p-lat-sand', lattice('#B5944F', SAND))
  r.setProperty('--p-lat-light', lattice('#F4ECDA', '#ffffff'))
  r.setProperty('--p-lat-ink', lattice('#3A2C19', INK))
  r.setProperty('--p-palm-sand', palmweave('#B5944F', SAND))
  r.setProperty('--p-palm-light', palmweave('#F4ECDA', '#ffffff'))
  r.setProperty('--p-wave-sand', waves('#B5944F', SAND))
  r.setProperty('--p-wave-light', waves('#F4ECDA', '#ffffff'))
  r.setProperty('--p-mash-sand', mashrabiya('#B5944F', SAND))
  r.setProperty('--p-mash-light', mashrabiya('#F4ECDA', '#ffffff'))
  r.setProperty('--p-mash-ink', mashrabiya('#3A2C19', INK))
}
