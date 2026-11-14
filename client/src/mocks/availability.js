// Mock of GET /api/availability: opening-hours grid only, no bookings.
// Accra is GMT all year, so UTC getters give Accra wall-clock time.
const HOURS = { 0: [12, 20] } // Sunday; Mon to Sat default below
const DEFAULT_HOURS = [8, 20]
const STEP_MIN = 90

export function slotsForDate(dateStr) {
  const day = new Date(`${dateStr}T00:00:00Z`)
  const [open, close] = HOURS[day.getUTCDay()] ?? DEFAULT_HOURS
  const out = []
  for (let m = open * 60; m + STEP_MIN <= close * 60; m += STEP_MIN) {
    out.push(new Date(day.getTime() + m * 60_000).toISOString())
  }
  return out
}

export function mockAvailability(dateStr) {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const date = dateStr ?? today
  const slots = slotsForDate(date).map((start) => ({ start, available: new Date(start).getTime() > now.getTime() + 3_600_000 }))
  let nextFreeSlot = null
  for (let i = 0; i < 8 && !nextFreeSlot; i++) {
    const d = new Date(now.getTime() + i * 86_400_000).toISOString().slice(0, 10)
    nextFreeSlot = slotsForDate(d).find((s) => new Date(s).getTime() > now.getTime() + 3_600_000) ?? null
  }
  return { date, slots, nextFreeSlot }
}
