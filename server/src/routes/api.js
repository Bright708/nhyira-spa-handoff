import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { config } from '../config.js'
import { addDays, isGridSlot, isValidDateStr, toDateStr } from '../lib/hours.js'
import { priceFor, toPesewas } from '../lib/pricing.js'
import { initializeTransaction, newReference, verifyTransaction } from '../lib/paystack.js'
import {
  HttpError,
  availabilityFor,
  cancelBooking,
  createPendingBooking,
  expireStale,
  getBookingByReference,
  getTreatment,
  isSlotFree,
  listTreatments,
  markPaidFromTransaction,
  publicBooking,
  releaseOwnHold,
} from '../services/bookings.js'

export const api = Router()

// GET /api/health
api.get('/health', (_req, res) => res.json({ ok: true }))

// ---------------------------------------------------------------------------
// GET /api/treatments
// ---------------------------------------------------------------------------
api.get('/treatments', async (_req, res) => {
  const rows = await listTreatments()
  res.set('Cache-Control', 'public, max-age=300')
  res.json(rows)
})

// ---------------------------------------------------------------------------
// GET /api/availability?date=YYYY-MM-DD   (date optional, defaults to today in Accra)
// ---------------------------------------------------------------------------
api.get('/availability', async (req, res) => {
  const today = toDateStr(new Date())
  const date = req.query.date ?? today
  if (typeof date !== 'string' || !isValidDateStr(date)) throw new HttpError(400, 'date must be YYYY-MM-DD')
  if (date < today || date > addDays(today, config.bookingWindowDays)) {
    throw new HttpError(400, `date must be between today and ${config.bookingWindowDays} days ahead`)
  }
  res.set('Cache-Control', 'no-store')
  res.json(await availabilityFor(date))
})

// ---------------------------------------------------------------------------
// POST /api/bookings/initialize
// ---------------------------------------------------------------------------
const bookingLimiter = rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false })

const InitBody = z.object({
  treatmentId: z.string().trim().min(1).max(64),
  startAt: z.iso.datetime({ offset: true }),
  customer: z.object({
    name: z.string().trim().min(2, 'Enter your full name').max(80),
    whatsapp: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a WhatsApp number with country code')
      .refine((v) => v.replace(/\D/g, '').length >= 9, 'Enter a WhatsApp number with country code'),
    email: z.email('Enter a valid email').max(254).transform((v) => v.toLowerCase()),
  }),
})

api.post('/bookings/initialize', bookingLimiter, async (req, res) => {
  const parsed = InitBody.safeParse(req.body)
  if (!parsed.success) {
    throw new HttpError(400, 'Check your details', {
      code: 'INVALID',
      fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])),
    })
  }
  const { treatmentId, startAt: startIso, customer } = parsed.data

  const treatment = await getTreatment(treatmentId)
  if (!treatment) throw new HttpError(400, 'Unknown treatment', { code: 'UNKNOWN_TREATMENT' })

  const startAt = new Date(startIso)
  const maxDate = addDays(toDateStr(new Date()), config.bookingWindowDays)
  if (!isGridSlot(startAt) || toDateStr(startAt) > maxDate) {
    throw new HttpError(400, 'That is not a bookable time', { code: 'INVALID_SLOT' })
  }

  await expireStale({ force: true })
  // Same person retrying (e.g. closed the popup): release their own earlier hold on this slot.
  await releaseOwnHold(startAt, customer.email)
  if (!(await isSlotFree(startAt))) throw new HttpError(409, 'That time was just taken. Pick another slot.', { code: 'SLOT_TAKEN' })

  // Amounts come from the database, never from the browser.
  const { total, deposit, balance } = priceFor(treatment)
  const reference = newReference()
  const booking = await createPendingBooking({ treatment, startAt, customer, reference })

  let tx
  try {
    tx = await initializeTransaction({
      email: customer.email,
      amount: toPesewas(deposit),
      reference,
      metadata: {
        booking_id: booking.id,
        treatment_id: treatment.id,
        custom_fields: [
          { display_name: 'Treatment', variable_name: 'treatment', value: treatment.name },
          { display_name: 'Start (Accra, GMT)', variable_name: 'start_at', value: startAt.toISOString() },
          { display_name: 'WhatsApp', variable_name: 'whatsapp', value: customer.whatsapp },
        ],
      },
    })
  } catch (err) {
    await cancelBooking(booking.id).catch(() => {})
    throw err
  }

  res.status(201).json({
    accessCode: tx.access_code,
    reference,
    booking: { ...publicBooking({ ...booking, treatment }), total_ghs: total, deposit_ghs: deposit, balance_ghs: balance },
  })
})

// ---------------------------------------------------------------------------
// GET /api/bookings/verify/:reference
// ---------------------------------------------------------------------------
api.get('/bookings/verify/:reference', bookingLimiter, async (req, res) => {
  const { reference } = req.params
  if (!/^NHY-[A-Z0-9-]{6,40}$/.test(reference)) throw new HttpError(400, 'Invalid reference')

  const booking = await getBookingByReference(reference)
  if (!booking) throw new HttpError(404, 'Booking not found')
  if (booking.status === 'paid') return res.json({ status: 'paid', booking: publicBooking(booking) })

  let tx
  try {
    tx = await verifyTransaction(reference)
  } catch (err) {
    if (err.status === 404) return res.json({ status: 'pending', booking: publicBooking(booking) })
    throw err
  }

  const { outcome, booking: updated } = await markPaidFromTransaction(booking, tx)
  if (outcome === 'paid' || outcome === 'already_paid') return res.json({ status: 'paid', booking: publicBooking(updated) })
  if (outcome === 'slot_conflict') {
    throw new HttpError(409, 'Your payment went through but that slot was taken. We will contact you on WhatsApp to rebook or refund.', {
      code: 'PAID_SLOT_CONFLICT',
    })
  }
  if (outcome === 'mismatch') throw new HttpError(402, 'Payment did not match this booking', { code: 'PAYMENT_MISMATCH' })
  // abandoned / failed / ongoing
  res.json({ status: tx.status === 'failed' ? 'failed' : 'pending', paystackStatus: tx.status, booking: publicBooking(updated) })
})
