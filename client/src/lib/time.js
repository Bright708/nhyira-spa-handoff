// Accra runs on GMT all year (no daylight saving), so UTC == Accra time.
export const ACCRA_TZ = 'Africa/Accra'

const dayKey = (d) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ACCRA_TZ }).format(d) // YYYY-MM-DD

const clock = (d) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: ACCRA_TZ,
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)

/** "Today 2:30 PM", "Tomorrow 8:00 AM", "Sat 12:00 PM" */
export function formatSlotLabel(iso, now = new Date()) {
  const d = new Date(iso)
  const tomorrow = new Date(now.getTime() + 86_400_000)
  let day
  if (dayKey(d) === dayKey(now)) day = 'Today'
  else if (dayKey(d) === dayKey(tomorrow)) day = 'Tomorrow'
  else day = new Intl.DateTimeFormat('en-US', { timeZone: ACCRA_TZ, weekday: 'short' }).format(d)
  return `${day} ${clock(d)}`
}

const DAY_MS = 86_400_000
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** 'YYYY-MM-DD' for today in Accra (GMT). */
export const todayAccra = () => new Date().toISOString().slice(0, 10)

/** The next n days starting today: [{ date, dow: 'Tue', num: 17, month: 'November', year: 2026 }] */
export function nextDays(n = 7, from = new Date()) {
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(start + i * DAY_MS)
    return {
      date: d.toISOString().slice(0, 10),
      dow: DOW[d.getUTCDay()],
      num: d.getUTCDate(),
      month: MONTHS[d.getUTCMonth()],
      year: d.getUTCFullYear(),
    }
  })
}

/** '14:30' -> '2:30 PM' */
export function formatClock(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

/** '2026-11-19' -> 'Thu 19 Nov' */
export function formatDayShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00Z`)
  return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`
}

/** ISO -> 'HH:MM' in Accra (GMT) */
export const isoToHhmm = (iso) => new Date(iso).toISOString().slice(11, 16)
