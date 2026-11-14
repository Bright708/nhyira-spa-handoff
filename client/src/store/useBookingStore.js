import { create } from 'zustand'
import { useCatalogStore } from './useCatalogStore'

export const DEPOSIT_RATE = 0.3

const emptyCustomer = { name: '', whatsapp: '', email: '' }

export const useBookingStore = create((set) => ({
  treatmentId: null,
  date: null, // 'YYYY-MM-DD' (Accra = GMT)
  time: null, // 'HH:MM'
  customer: emptyCustomer,
  status: 'idle', // idle | paying | verifying | confirmed | failed
  booking: null, // the server's booking after verify
  error: null, // message shown in the summary panel
  fieldErrors: {}, // { treatment, time, name, whatsapp, email }

  setTreatment: (treatmentId) =>
    set((s) => ({ treatmentId, error: null, fieldErrors: { ...s.fieldErrors, treatment: undefined } })),
  setDate: (date) => set({ date, time: null, error: null }),
  setTime: (time) => set((s) => ({ time, error: null, fieldErrors: { ...s.fieldErrors, time: undefined } })),
  setCustomerField: (key, value) =>
    set((s) => ({ customer: { ...s.customer, [key]: value }, fieldErrors: { ...s.fieldErrors, [key]: undefined } })),
  setFieldErrors: (fieldErrors) => set({ fieldErrors }),
  setStatus: (status, extra = {}) => set({ status, ...extra }),

  /** "Book another": keep who they are, clear what and when. */
  reset: () => set({ treatmentId: null, time: null, status: 'idle', booking: null, error: null, fieldErrors: {} }),
}))

// ---------------------------------------------------------------------------
// Derived helpers (display only; the server recomputes every amount)
// ---------------------------------------------------------------------------
export const depositFor = (price) => Math.round(price * DEPOSIT_RATE)

export function useSelectedTreatment() {
  const id = useBookingStore((s) => s.treatmentId)
  return useCatalogStore((s) => s.treatments.find((t) => t.id === id) ?? null)
}

export function useTotals() {
  const t = useSelectedTreatment()
  if (!t) return { total: null, deposit: null, balance: null }
  const deposit = depositFor(t.price_ghs)
  return { total: t.price_ghs, deposit, balance: t.price_ghs - deposit }
}

export const startAtIso = (date, time) => (date && time ? `${date}T${time}:00.000Z` : null)
