// Opening hours and the slot grid. Accra is GMT (UTC+0) all year with no
// daylight saving, so UTC getters give Accra wall-clock time directly.

export const TIMEZONE = 'Africa/Accra'
export const SLOT_MINUTES = 90 // grid step between start times, and default length

// [openHour, closeHour] by UTC day (0 = Sunday)
const HOURS = { 0: [12, 20], 1: [8, 20], 2: [8, 20], 3: [8, 20], 4: [8, 20], 5: [8, 20], 6: [8, 20] }

const DAY_MS = 86_400_000
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const toDateStr = (d) => d.toISOString().slice(0, 10)

export function isValidDateStr(s) {
  if (!DATE_RE.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && toDateStr(d) === s
}

/**
 * Start times for a YYYY-MM-DD day, every 90 minutes from opening, keeping only
 * those where start + durationMin finishes at or before closing.
 */
export function slotStartsForDate(dateStr, durationMin = SLOT_MINUTES) {
  const day = new Date(`${dateStr}T00:00:00Z`)
  const [open, close] = HOURS[day.getUTCDay()]
  const out = []
  for (let m = open * 60; m + durationMin <= close * 60; m += SLOT_MINUTES) {
    out.push(new Date(day.getTime() + m * 60_000))
  }
  return out
}

/** True if `date` is a grid start time on its day that fits a booking of durationMin. */
export function isGridSlot(date, durationMin = SLOT_MINUTES) {
  return slotStartsForDate(toDateStr(date), durationMin).some((s) => s.getTime() === date.getTime())
}

export const addMinutes = (date, min) => new Date(date.getTime() + min * 60_000)

export const hhmm = (d) => d.toISOString().slice(11, 16)

export const addDays = (dateStr, n) => toDateStr(new Date(new Date(`${dateStr}T00:00:00Z`).getTime() + n * DAY_MS))
