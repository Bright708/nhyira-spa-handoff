import { useCallback } from 'react'
import { ApiError, initializeBooking, verifyBooking } from './api'
import { startAtIso, useBookingStore } from '../store/useBookingStore'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/

export function validate(s) {
  const e = {}
  if (!s.treatmentId) e.treatment = 'Pick a treatment.'
  if (!s.date || !s.time) e.time = 'Pick a day and time.'
  if (s.customer.name.trim().length < 2) e.name = 'Enter your full name.'
  const wa = s.customer.whatsapp.trim()
  if (!PHONE_RE.test(wa) || wa.replace(/\D/g, '').length < 9) e.whatsapp = 'Enter a WhatsApp number with country code.'
  if (!EMAIL_RE.test(s.customer.email.trim())) e.email = 'Enter a valid email.'
  return e
}

// Which on-page element to move focus to for each error
const FOCUS_TARGET = {
  treatment: '#step-treatment',
  time: '#step-time',
  name: '#f-name',
  whatsapp: '#f-whatsapp',
  email: '#f-email',
}

function focusFirst(errors) {
  const key = ['treatment', 'time', 'name', 'whatsapp', 'email'].find((k) => errors[k])
  const el = key && document.querySelector(FOCUS_TARGET[key])
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.focus({ preventScroll: true })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** After the popup says success, ask our server. Retry a little in case Paystack is slow to settle. */
async function verifyWithRetry(reference) {
  const delays = [0, 1500, 3000, 5000]
  let last
  for (const d of delays) {
    if (d) await sleep(d)
    last = await verifyBooking(reference)
    if (last.status === 'paid' || last.status === 'failed') return last
  }
  return last
}

function openPaystack(accessCode) {
  return new Promise((resolve, reject) => {
    import('@paystack/inline-js')
      .then(({ default: PaystackPop }) => {
        const popup = new PaystackPop()
        popup.resumeTransaction(accessCode, {
          onSuccess: (tx) => resolve({ outcome: 'success', tx }),
          onCancel: () => resolve({ outcome: 'cancel' }),
          onError: (err) => reject(new Error(err?.message || 'Paystack could not start the payment.')),
        })
      })
      .catch(() => reject(new Error('Could not load Paystack. Check your connection and try again.')))
  })
}

export function usePayment(onSlotTaken) {
  return useCallback(async () => {
    const store = useBookingStore.getState()
    if (store.status === 'paying' || store.status === 'verifying') return

    const errors = validate(store)
    if (Object.keys(errors).length) {
      store.setFieldErrors(errors)
      store.setStatus('idle', { error: 'A few details are missing.' })
      focusFirst(errors)
      return
    }

    store.setStatus('paying', { error: null, fieldErrors: {} })
    try {
      const init = await initializeBooking({
        treatmentId: store.treatmentId,
        startAt: startAtIso(store.date, store.time),
        customer: {
          name: store.customer.name.trim(),
          whatsapp: store.customer.whatsapp.trim(),
          email: store.customer.email.trim(),
        },
      })

      if (!init.accessCode.startsWith('mock_')) {
        const result = await openPaystack(init.accessCode)
        if (result.outcome === 'cancel') {
          store.setStatus('idle', { error: 'Payment cancelled. Your slot is held for 15 minutes if you want to try again.' })
          return
        }
      }

      store.setStatus('verifying')
      const v = await verifyWithRetry(init.reference)
      if (v.status === 'paid') {
        store.setStatus('confirmed', { booking: v.booking, error: null })
      } else if (v.status === 'failed') {
        store.setStatus('failed', { error: 'The payment did not go through. No money was taken. Try again.' })
      } else {
        store.setStatus('failed', {
          error: `We are still waiting for Paystack to confirm. Keep your reference ${init.reference} and message us on WhatsApp.`,
        })
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SLOT_TAKEN') {
        store.setStatus('idle', { error: err.message, time: null })
        onSlotTaken?.()
        focusFirst({ time: true })
        return
      }
      if (err instanceof ApiError && err.fields) {
        const fe = {}
        for (const [k, v] of Object.entries(err.fields)) fe[k.replace('customer.', '')] = v
        store.setStatus('idle', { error: err.message, fieldErrors: fe })
        focusFirst(fe)
        return
      }
      store.setStatus('failed', { error: err.message || 'Something went wrong. Try again.' })
    }
  }, [onSlotTaken])
}
