import { create } from 'zustand'
import { getTreatments } from '../lib/api'

// Treatments are fetched once and shared by the homepage and booking page.
export const useCatalogStore = create((set, get) => ({
  treatments: [],
  status: 'idle', // idle | loading | ready | error
  load: async () => {
    if (get().status === 'loading' || get().status === 'ready') return
    set({ status: 'loading' })
    try {
      const rows = await getTreatments()
      set({ treatments: [...rows].sort((a, b) => a.sort - b.sort), status: 'ready' })
    } catch (err) {
      console.error(err)
      set({ status: 'error' })
    }
  },
  retry: () => {
    set({ status: 'idle' })
    get().load()
  },
}))
