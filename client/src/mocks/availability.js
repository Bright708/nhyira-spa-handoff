// Mock of GET /api/availability: opening-hours grid only, no bookings.
// Mirrors the server: starts every 90 minutes, only where the treatment
// finishes by closing, past times (and the next hour) hidden.
// Accra is GMT all year, so UTC getters give Accra wall-clock time.
import { TREATMENTS } from './treatments.js'

const HOURS = { 0: [12, 20] } // Sunday; Mon to Sat default below
const DEFAULT_HOURS = [8, 20]
const STEP_MIN = 90
const LEAD_MS = 3_600_000

export function slotsForDate(dateStr, durationMin = STEP_MIN) {
  const day = new Date(`${dateStr}T00:00:00Z`)
  const [open, close] = HOURS[day.getUTCDay()] ?? DEFAULT_HOURS
  const out = []
  for (let m = open * 60; m + durationMin <= close * 60; m += STEP_MIN) {
    out.push(new Date(day.getTime() + m * 60_000))
  }
  return out
}

export function mockAvailability(dateStr, treatmentId) {
  const now = Date.now()
  const date = dateStr ?? new Date(now).toISOString().slice(0, 10)
  const durationMin = TREATMENTS.find((t) => t.id === treatmentId)?.duration_min ?? STEP_MIN
  const slots = slotsForDate(date, durationMin)
    .filter((s) => s.getTime() > now + LEAD_MS)
    .map((s) => ({
      start: s.toISOString(),
      end: new Date(s.getTime() + durationMin * 60_000).toISOString(),
      time: s.toISOString().slice(11, 16),
      available: true,
    }))
  let nextFreeSlot = null
  for (let i = 0; i < 14 && !nextFreeSlot; i++) {
    const d = new Date(now + i * 86_400_000).toISOString().slice(0, 10)
    nextFreeSlot = slotsForDate(d, durationMin).find((s) => s.getTime() > now + LEAD_MS)?.toISOString() ?? null
  }
  return { date, timezone: 'Africa/Accra', treatmentId: treatmentId ?? null, durationMin, slots, nextFreeSlot }
}
