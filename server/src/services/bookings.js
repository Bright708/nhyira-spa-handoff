import { config } from '../config.js'
import { db, DbError } from '../lib/supabase.js'
import { addDays, addMinutes, hhmm, SLOT_MINUTES, slotStartsForDate, toDateStr, TIMEZONE } from '../lib/hours.js'
import { priceFor, toPesewas } from '../lib/pricing.js'
import { peakOverlap } from '../lib/capacity.js'

export class HttpError extends Error {
  constructor(status, message, extra) {
    super(message)
    this.status = status
    this.extra = extra
  }
}

const LEAD_MINUTES = 60 // a slot must start at least an hour from now to be bookable
const NEXT_SLOT_SEARCH_DAYS = 14

// ---------------------------------------------------------------------------
// Treatments
// ---------------------------------------------------------------------------
export async function listTreatments() {
  const { data, error } = await db.from('treatments').select('*').order('sort')
  if (error) throw new DbError(error, 'list treatments')
  return data
}

export async function getTreatment(id) {
  const { data, error } = await db.from('treatments').select('*').eq('id', id).maybeSingle()
  if (error) throw new DbError(error, 'get treatment')
  return data
}

// ---------------------------------------------------------------------------
// Pending holds
// ---------------------------------------------------------------------------
let lastExpiry = 0
/** Cancel pending holds older than 15 min. Throttled to once every 30s unless forced. */
export async function expireStale({ force = false } = {}) {
  if (!force && Date.now() - lastExpiry < 30_000) return 0
  lastExpiry = Date.now()
  const { data, error } = await db.rpc('expire_stale_bookings')
  if (error) throw new DbError(error, 'expire stale bookings')
  return data
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------
/** Paid bookings + pending holds still inside their 15-minute window, overlapping [fromIso, toIso). */
async function activeBookings(fromIso, toIso) {
  const holdCutoff = new Date(Date.now() - config.pendingHoldMinutes * 60_000).toISOString()
  const { data, error } = await db
    .from('bookings')
    .select('start_at, end_at')
    .lt('start_at', toIso)
    .gt('end_at', fromIso)
    .or(`status.eq.paid,and(status.eq.pending,created_at.gt.${holdCutoff})`)
  if (error) throw new DbError(error, 'read bookings')
  return data.map((b) => [new Date(b.start_at).getTime(), new Date(b.end_at).getTime()])
}

const earliestBookable = () => Date.now() + LEAD_MINUTES * 60_000


/**
 * Slots for one day and one treatment length. Past start times (incl. the 1-hour
 * lead) are left out entirely; a start time is "available" while, at every
 * moment of the treatment, fewer than config.rooms bookings are running.
 */
export async function availabilityFor(dateStr, treatment) {
  await expireStale()
  const duration = treatment?.duration_min ?? SLOT_MINUTES
  const today = toDateStr(new Date())
  const last = addDays(today, NEXT_SLOT_SEARCH_DAYS)
  const rangeStart = dateStr < today ? dateStr : today
  const rangeEnd = addDays(dateStr > last ? dateStr : last, 1)
  const ranges = await activeBookings(`${rangeStart}T00:00:00Z`, `${rangeEnd}T00:00:00Z`)
  const cutoff = earliestBookable()
  const isFree = (d) => peakOverlap(ranges, d.getTime(), addMinutes(d, duration).getTime()) < config.rooms

  const slots = slotStartsForDate(dateStr, duration)
    .filter((d) => d.getTime() >= cutoff)
    .map((d) => ({ start: d.toISOString(), end: addMinutes(d, duration).toISOString(), time: hhmm(d), available: isFree(d) }))

  let nextFreeSlot = null
  for (let i = 0; i <= NEXT_SLOT_SEARCH_DAYS && !nextFreeSlot; i++) {
    const found = slotStartsForDate(addDays(today, i), duration).find((d) => d.getTime() >= cutoff && isFree(d))
    if (found) nextFreeSlot = found.toISOString()
  }

  return { date: dateStr, timezone: TIMEZONE, treatmentId: treatment?.id ?? null, durationMin: duration, slots, nextFreeSlot }
}

export const isBookableStart = (startAt) => startAt.getTime() >= earliestBookable()

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------
/**
 * Atomically hold a room: the database locks the day, re-counts overlapping
 * bookings and inserts only if one of config.rooms is free.
 */
export async function holdSlot({ treatment, startAt, customer, reference }) {
  const { total, deposit } = priceFor(treatment)
  const { data, error } = await db.rpc('hold_slot', {
    p_treatment_id: treatment.id,
    p_start: startAt.toISOString(),
    p_end: addMinutes(startAt, treatment.duration_min).toISOString(),
    p_name: customer.name,
    p_whatsapp: customer.whatsapp,
    p_email: customer.email,
    p_total: total,
    p_deposit: deposit,
    p_reference: reference,
    p_rooms: config.rooms,
    p_hold_minutes: config.pendingHoldMinutes,
  })
  if (error?.message?.includes('SLOT_TAKEN')) {
    throw new HttpError(409, 'That time was just taken. Pick another slot.', { code: 'SLOT_TAKEN' })
  }
  if (error) throw new DbError(error, 'hold slot')
  return data
}

export async function cancelBooking(id) {
  const { error } = await db.from('bookings').update({ status: 'cancelled' }).eq('id', id).eq('status', 'pending')
  if (error) throw new DbError(error, 'cancel booking')
}

export async function getBookingByReference(reference) {
  const { data, error } = await db
    .from('bookings')
    .select('*, treatment:treatments(id, name, duration_min)')
    .eq('paystack_reference', reference)
    .maybeSingle()
  if (error) throw new DbError(error, 'get booking')
  return data
}

/**
 * Mark a booking paid after checking a Paystack transaction really matches it.
 * Idempotent: safe to call from both /verify and the webhook.
 * Returns { outcome: 'paid' | 'already_paid' | 'mismatch' | 'not_successful' | 'slot_conflict', booking }
 */
export async function markPaidFromTransaction(booking, tx) {
  if (booking.status === 'paid') return { outcome: 'already_paid', booking }
  if (tx?.status !== 'success') return { outcome: 'not_successful', booking }

  const expectedAmount = toPesewas(booking.deposit_ghs)
  if (tx.reference !== booking.paystack_reference || tx.currency !== 'GHS' || Number(tx.amount) !== expectedAmount) {
    console.error('[payments] Amount/currency mismatch, NOT marking paid', {
      reference: booking.paystack_reference,
      expected: { amount: expectedAmount, currency: 'GHS' },
      got: { amount: tx.amount, currency: tx.currency, reference: tx.reference },
    })
    return { outcome: 'mismatch', booking }
  }

  // The database locks the day and re-checks capacity if the hold had expired.
  const { data: outcome, error } = await db.rpc('mark_booking_paid', {
    p_reference: booking.paystack_reference,
    p_paid_at: tx.paid_at ?? tx.paidAt ?? null,
    p_rooms: config.rooms,
    p_hold_minutes: config.pendingHoldMinutes,
  })
  if (error) throw new DbError(error, 'mark booking paid')
  if (outcome === 'slot_conflict') {
    console.error('[payments] PAID BUT NO ROOM LEFT. Refund or rebook manually.', { reference: booking.paystack_reference })
    return { outcome, booking }
  }
  const fresh = (await getBookingByReference(booking.paystack_reference)) ?? booking
  return { outcome: outcome === 'already_paid' ? 'already_paid' : 'paid', booking: fresh }
}

/** What the browser is allowed to see about a booking. */
export function publicBooking(b) {
  const { total, deposit, balance } = { total: b.total_ghs, deposit: b.deposit_ghs, balance: b.total_ghs - b.deposit_ghs }
  return {
    id: b.id,
    reference: b.paystack_reference,
    status: b.status,
    treatment: b.treatment ? { id: b.treatment.id, name: b.treatment.name, duration_min: b.treatment.duration_min } : { id: b.treatment_id },
    start_at: b.start_at,
    customer_name: b.customer_name,
    total_ghs: total,
    deposit_ghs: deposit,
    balance_ghs: balance,
  }
}
