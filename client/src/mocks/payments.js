// Mock of the payment endpoints for VITE_USE_MOCKS=true. No Paystack popup:
// usePayment skips the popup when the access code starts with "mock_".
import { TREATMENTS } from './treatments.js'

const store = new Map()
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export async function mockInitialize({ treatmentId, startAt, customer }) {
  await wait(500)
  const t = TREATMENTS.find((x) => x.id === treatmentId)
  const deposit = Math.round(t.price_ghs * 0.3)
  const reference = `NHY-MOCK-${Date.now().toString(36).toUpperCase()}`
  const booking = {
    id: crypto.randomUUID(),
    reference,
    status: 'pending',
    treatment: { id: t.id, name: t.name, duration_min: t.duration_min },
    start_at: startAt,
    customer_name: customer.name,
    total_ghs: t.price_ghs,
    deposit_ghs: deposit,
    balance_ghs: t.price_ghs - deposit,
  }
  store.set(reference, booking)
  return { accessCode: `mock_${reference}`, reference, booking }
}

export async function mockVerify(reference) {
  await wait(700)
  const b = store.get(reference)
  return { status: 'paid', booking: { ...b, status: 'paid' } }
}
