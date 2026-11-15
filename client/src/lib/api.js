const BASE = import.meta.env.VITE_API_URL ?? ''
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `Request failed (${status})`)
    this.status = status
    this.code = body?.code
    this.fields = body?.fields
  }
}

async function request(method, path, { body, signal } = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(0, { error: 'Could not reach the server. Check your connection and try again.' })
  }
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, json)
  return json
}

export const apiGet = (path, opts) => request('GET', path, opts)
export const apiPost = (path, body, opts) => request('POST', path, { ...opts, body })

export async function getTreatments(opts) {
  if (USE_MOCKS) return (await import('../mocks/treatments.js')).TREATMENTS
  return apiGet('/api/treatments', opts)
}

/** Start times for a day. With a treatmentId, only starts where that treatment fits before closing. */
export async function getAvailability(date, treatmentId, opts) {
  if (USE_MOCKS) return (await import('../mocks/availability.js')).mockAvailability(date, treatmentId)
  const q = new URLSearchParams()
  if (date) q.set('date', date)
  if (treatmentId) q.set('treatmentId', treatmentId)
  const qs = q.toString()
  return apiGet(`/api/availability${qs ? `?${qs}` : ''}`, opts)
}

export async function initializeBooking(payload) {
  if (USE_MOCKS) return (await import('../mocks/payments.js')).mockInitialize(payload)
  return apiPost('/api/bookings/initialize', payload)
}

export async function verifyBooking(reference) {
  if (USE_MOCKS) return (await import('../mocks/payments.js')).mockVerify(reference)
  return apiGet(`/api/bookings/verify/${encodeURIComponent(reference)}`)
}
