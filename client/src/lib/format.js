export const formatGhs = (n) => `GH₵ ${Number(n).toLocaleString('en-US')}`

/** 60 -> "60 min", 240 -> "4 hrs", 150 -> "2.5 hrs" */
export function formatDuration(min) {
  if (min < 120) return `${min} min`
  const h = min / 60
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hrs`
}

/** Screen-reader form: 90 -> "90 minutes", 240 -> "4 hours", 150 -> "2.5 hours" */
export function spokenDuration(min) {
  if (min < 120) return `${min} minutes`
  const h = min / 60
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hours`
}

/** "/images/x-960.webp" -> srcset with the true 480, 960 and 1440 wide versions (all 4:5) */
export function cardSrcSet(url) {
  if (!/-960\.webp$/.test(url ?? '')) return undefined
  return [480, 960, 1440].map((w) => `${url.replace('-960.webp', `-${w}.webp`)} ${w}w`).join(', ')
}
