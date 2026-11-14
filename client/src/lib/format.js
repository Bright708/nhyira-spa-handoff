export const formatGhs = (n) => `GH₵ ${Number(n).toLocaleString('en-US')}`

/** 60 -> "60 min", 240 -> "4 hrs", 150 -> "2.5 hrs" */
export function formatDuration(min) {
  if (min < 120) return `${min} min`
  const h = min / 60
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hrs`
}

/** "/images/x-960.webp" -> srcset with the 480, 720 and 960 versions */
export function cardSrcSet(url) {
  if (!/-960\.webp$/.test(url ?? '')) return undefined
  return [480, 720, 960].map((w) => `${url.replace('-960.webp', `-${w}.webp`)} ${w}w`).join(', ')
}
