import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

process.env.PAYSTACK_SECRET_KEY = 'sk_test_unit_only'
const { slotStartsForDate, isGridSlot, isValidDateStr, hhmm } = await import('../src/lib/hours.js')
const { priceFor, toPesewas } = await import('../src/lib/pricing.js')
const { isValidSignature } = await import('../src/lib/paystack.js')

test('Mon to Sat: 8am to 8pm, every 90 min, last slot ends by close', () => {
  const s = slotStartsForDate('2026-11-16').map(hhmm) // Monday
  assert.deepEqual(s, ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30'])
})

test('Sunday: 12pm to 8pm', () => {
  const s = slotStartsForDate('2026-11-15').map(hhmm) // Sunday
  assert.deepEqual(s, ['12:00', '13:30', '15:00', '16:30', '18:00'])
})

test('isGridSlot accepts grid times only', () => {
  assert.equal(isGridSlot(new Date('2026-11-16T09:30:00Z')), true)
  assert.equal(isGridSlot(new Date('2026-11-16T09:31:00Z')), false)
  assert.equal(isGridSlot(new Date('2026-11-15T08:00:00Z')), false) // Sunday 8am closed
})

test('date validation', () => {
  assert.equal(isValidDateStr('2026-02-28'), true)
  assert.equal(isValidDateStr('2026-02-30'), false)
  assert.equal(isValidDateStr('26-1-1'), false)
})

test('deposit is 30% rounded to whole cedis, amount in pesewas', () => {
  assert.deepEqual(priceFor({ price_ghs: 750 }), { total: 750, deposit: 225, balance: 525 })
  assert.deepEqual(priceFor({ price_ghs: 1350 }), { total: 1350, deposit: 405, balance: 945 })
  assert.deepEqual(priceFor({ price_ghs: 380 }), { total: 380, deposit: 114, balance: 266 })
  assert.equal(toPesewas(225), 22500)
})

test('webhook signature: HMAC SHA512 of raw body', () => {
  const body = Buffer.from('{"event":"charge.success"}')
  const sig = crypto.createHmac('sha512', 'sk_test_unit_only').update(body).digest('hex')
  assert.equal(isValidSignature(body, sig), true)
  assert.equal(isValidSignature(Buffer.from('{"event":"charge.success" }'), sig), false)
  assert.equal(isValidSignature(body, 'abc'), false)
  assert.equal(isValidSignature(body, undefined), false)
})

test('capacity: peak concurrency, not raw overlap count', async () => {
  const { peakOverlap } = await import('../src/lib/capacity.js')
  const h = (x) => x * 3_600_000
  // 15-16 and 18-19 both overlap a 15-19 ritual but never each other: one room in use at a time.
  assert.equal(peakOverlap([[h(15), h(16)], [h(18), h(19)]], h(15), h(19)), 1)
  // 08-12 and 09:30-10:30 run together: two rooms in use.
  assert.equal(peakOverlap([[h(8), h(12)], [h(9.5), h(10.5)]], h(9.5), h(11)), 2)
  // back-to-back is not an overlap
  assert.equal(peakOverlap([[h(8), h(9)]], h(9), h(10)), 0)
})
