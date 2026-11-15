import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCatalogStore } from '../store/useCatalogStore'
import { useBookingStore } from '../store/useBookingStore'
import { getAvailability } from '../lib/api'
import { usePayment } from '../lib/usePayment'
import TreatmentStep from '../components/booking/TreatmentStep'
import { DayStep, TimeStep } from '../components/booking/DayTimeSteps'
import DetailsStep from '../components/booking/DetailsStep'
import SummaryPanel, { MobilePayBar } from '../components/booking/SummaryPanel'
import { ChevronLeft } from '../components/booking/parts'
import SkipLink from '../components/SkipLink'

// Times depend on the treatment's length, so refetch when treatment or day changes.
// If the picked time no longer fits (or was taken), clear it.
function useAvailability(date, treatmentId) {
  const [state, setState] = useState({ status: 'loading', data: null })
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    if (!treatmentId || !date) return
    const ctrl = new AbortController()
    setState({ status: 'loading', data: null })
    getAvailability(date, treatmentId, { signal: ctrl.signal })
      .then((data) => {
        setState({ status: 'ready', data })
        const { time, setTime } = useBookingStore.getState()
        if (time && !data.slots.some((s) => s.available && (s.time ?? s.start.slice(11, 16)) === time)) setTime(null)
      })
      .catch((err) => err.name !== 'AbortError' && setState({ status: 'error', data: null }))
    return () => ctrl.abort()
  }, [date, treatmentId, nonce])
  const refresh = useCallback(() => setNonce((n) => n + 1), [])
  // No treatment picked yet: nothing to fetch, the step shows a prompt instead.
  if (!treatmentId) return { status: 'none', data: null, retry: refresh, refresh }
  return { ...state, retry: refresh, refresh }
}

export default function Book() {
  const [params] = useSearchParams()
  const loadCatalog = useCatalogStore((s) => s.load)
  const treatments = useCatalogStore((s) => s.treatments)
  const { date, treatmentId, status, setTreatment, setDate, reset } = useBookingStore()

  useEffect(() => {
    document.title = 'Book a treatment / Nhyira Spa, Accra'
    loadCatalog()
    // Coming back after a finished booking starts fresh.
    const s = useBookingStore.getState()
    if (s.status === 'confirmed' || s.status === 'failed') s.reset()
  }, [loadCatalog])

  // ?treatment=<id> preselects, once the list has loaded and only if the id is real.
  const wanted = params.get('treatment')
  useEffect(() => {
    if (wanted && treatments.some((t) => t.id === wanted)) setTreatment(wanted)
  }, [wanted, treatments, setTreatment])

  // Start on the day of the next free slot.
  useEffect(() => {
    if (date) return
    const ctrl = new AbortController()
    getAvailability(undefined, undefined, { signal: ctrl.signal })
      .then((a) => setDate((a.nextFreeSlot ?? new Date().toISOString()).slice(0, 10)))
      .catch((err) => err.name !== 'AbortError' && setDate(new Date().toISOString().slice(0, 10)))
    return () => ctrl.abort()
  }, [date, setDate])

  const availability = useAvailability(date, treatmentId)
  const pay = usePayment(availability.refresh)
  const locked = status === 'paying' || status === 'verifying' || status === 'confirmed'

  const another = () => {
    reset()
    availability.refresh()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <SkipLink />
      <header className="border-b border-ink">
        <div className="wrap flex min-h-[72px] flex-wrap items-center justify-between gap-4">
          <Link to="/" className="text-[30px] leading-none font-black tracking-[0.02em] text-ink stretch-72">
            NHYIRA
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 text-[13px] font-extrabold tracking-[0.1em] text-ink uppercase underline-offset-4 hover:underline"
          >
            <ChevronLeft />
            Back to site
          </Link>
        </div>
      </header>

      <div className="wrap flex flex-wrap items-start gap-14 pt-16 pb-36 lg:pb-24">
        <main id="main" tabIndex={-1} className="flex min-w-0 outline-none flex-[999_1_600px] flex-col gap-12">
          <div className="flex flex-col gap-4">
            <span className="type-label text-clay">/ Book online</span>
            <h1 className="m-0 text-[clamp(64px,8vw,120px)] leading-[0.86] font-black uppercase stretch-68">
              Lock in
              <br />
              your time.
            </h1>
          </div>
          <TreatmentStep locked={locked} />
          <DayStep locked={locked} />
          <TimeStep availability={availability} locked={locked} />
          <DetailsStep locked={locked} />
        </main>

        <SummaryPanel onPay={pay} onAnother={another} />
      </div>

      <MobilePayBar onPay={pay} />
    </>
  )
}
