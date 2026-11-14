import { config } from '../config.js'
import { db, DbError } from '../lib/supabase.js'
import { addDays, hhmm, slotStartsForDate, toDateStr, TIMEZONE } from '../lib/hours.js'
import { priceFor, toPesewas } from '../lib/pricing.js'

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
async function takenStartTimes(fromIso, toIso) {
  const holdCutoff = new Date(Date.now() - config.pendingHoldMinutes * 60_000).toISOString()
  const { data, error } = await db
    .from('bookings')
    .select('start_at')
    .gte('start_at', fromIso)
    .lt('start_at', toIso)
    .or(`status.eq.paid,and(status.eq.pending,created_at.gt.${holdCutoff})`)
  if (error) throw new DbError(error, 'read bookings')
  return new Set(data.map((b) => new Date(b.start_at).getTime()))
}

const earliestBookable = () => Date.now() + LEAD_MINUTES * 60_000

export async function availabilityFor(dateStr) {
  await expireStale()
  const today = toDateStr(new Date())
  const last = addDays(today, NEXT_SLOT_SEARCH_DAYS)
  const rangeEnd = dateStr > last ? addDays(dateStr, 1) : addDays(last, 1)
  const rangeStart = dateStr < today ? dateStr : today
  const taken = await takenStartTimes(`${rangeStart}T00:00:00Z`, `${rangeEnd}T00:00:00Z`)
  const cutoff = earliestBookable()

  const isFree = (d) => d.getTime() >= cutoff && !taken.has(d.getTime())

  const slots = slotStartsForDate(dateStr).map((d) => ({
    start: d.toISOString(),
    time: hhmm(d),
    available: isFree(d),
  }))

  let nextFreeSlot = null
  for (let i = 0; i <= NEXT_SLOT_SEARCH_DAYS && !nextFreeSlot; i++) {
    const found = slotStartsForDate(addDays(today, i)).find(isFree)
    if (found) nextFreeSlot = found.toISOString()
  }

  return { date: dateStr, timezone: TIMEZONE, slots, nextFreeSlot }
}

export async function isSlotFree(startAt) {
  if (startAt.getTime() < earliestBookable()) return false
  const end = new Date(startAt.getTime() + 1).toISOString()
  const taken = await takenStartTimes(startAt.toISOString(), end)
  return !taken.has(startAt.getTime())
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------
export async function createPendingBooking({ treatment, startAt, customer, reference }) {
  const { total, deposit } = priceFor(treatment)
  const { data, error } = await db
    .from('bookings')
    .insert({
      treatment_id: treatment.id,
      start_at: startAt.toISOString(),
      customer_name: customer.name,
      whatsapp: customer.whatsapp,
      email: customer.email,
      total_ghs: total,
      deposit_ghs: deposit,
      paystack_reference: reference,
      status: 'pending',
    })
    .select()
    .single()
  if (error?.code === '23505') throw new HttpError(409, 'That time was just taken. Pick another slot.', { code: 'SLOT_TAKEN' })
  if (error) throw new DbError(error, 'create booking')
  return data
}

export async function releaseOwnHold(startAt, email) {
  const { error } = await db
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('start_at', startAt.toISOString())
    .eq('status', 'pending')
    .eq('email', email)
  if (error) throw new DbError(error, 'release hold')
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

  // A hold that expired can still be paid late; revive it if nobody else took the slot.
  const { data, error } = await db
    .from('bookings')
    .update({ status: 'paid', paid_at: tx.paid_at ?? new Date().toISOString() })
    .eq('id', booking.id)
    .in('status', ['pending', 'cancelled'])
    .select('*, treatment:treatments(id, name, duration_min)')
    .maybeSingle()

  if (error?.code === '23505') {
    console.error('[payments] PAID BUT SLOT TAKEN. Refund or rebook manually.', { reference: booking.paystack_reference })
    return { outcome: 'slot_conflict', booking }
  }
  if (error) throw new DbError(error, 'mark booking paid')
  if (!data) {
    // Lost a race with the webhook (or /verify); read the current state.
    const fresh = await getBookingByReference(booking.paystack_reference)
    return { outcome: fresh?.status === 'paid' ? 'already_paid' : 'not_successful', booking: fresh ?? booking }
  }
  return { outcome: 'paid', booking: data }
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
