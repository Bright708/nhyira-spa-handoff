import crypto from 'node:crypto'
import { config } from '../config.js'

const API = 'https://api.paystack.co'

export class PaystackError extends Error {
  constructor(message, status = 502) {
    super(message)
    this.status = status
  }
}

async function call(method, path, body) {
  if (!config.paystackSecret) throw new PaystackError('Paystack is not configured', 503)
  let res
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${config.paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    })
  } catch (err) {
    throw new PaystackError(`Could not reach Paystack: ${err.message}`)
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.status !== true) {
    throw new PaystackError(json.message || `Paystack ${method} ${path} failed (${res.status})`, res.status === 404 ? 404 : 502)
  }
  return json.data
}

/** POST /transaction/initialize. amount is in pesewas. */
export const initializeTransaction = ({ email, amount, reference, metadata }) =>
  call('POST', '/transaction/initialize', {
    email,
    amount,
    currency: 'GHS',
    reference,
    metadata,
    channels: ['card', 'mobile_money'],
  })

/** GET /transaction/verify/:reference */
export const verifyTransaction = (reference) => call('GET', `/transaction/verify/${encodeURIComponent(reference)}`)

/** Webhook signature: HMAC SHA512 of the raw body, keyed with the secret key. */
export function isValidSignature(rawBody, signature) {
  if (!config.paystackSecret || typeof signature !== 'string') return false
  const expected = crypto.createHmac('sha512', config.paystackSecret).update(rawBody).digest('hex')
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(signature, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export const newReference = () => `NHY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
