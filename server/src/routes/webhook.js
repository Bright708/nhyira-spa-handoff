import { isValidSignature } from '../lib/paystack.js'
import { getBookingByReference, markPaidFromTransaction } from '../services/bookings.js'

/**
 * POST /api/paystack/webhook
 * Mounted with express.raw() so req.body is the exact Buffer Paystack signed.
 */
export async function paystackWebhook(req, res) {
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0)
  if (!isValidSignature(raw, req.get('x-paystack-signature'))) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let event
  try {
    event = JSON.parse(raw.toString('utf8'))
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  if (event.event === 'charge.success') {
    const tx = event.data ?? {}
    const booking = tx.reference ? await getBookingByReference(tx.reference) : null
    if (!booking) {
      console.warn('[webhook] charge.success for unknown reference', tx.reference)
    } else {
      const { outcome } = await markPaidFromTransaction(booking, tx)
      console.log('[webhook] charge.success', tx.reference, outcome)
    }
  }

  // Always 200 for a correctly signed event, so Paystack stops retrying.
  res.sendStatus(200)
}
