import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAvailability } from '../lib/api'
import { formatSlotLabel } from '../lib/time'

const HERO_SRCSET = [640, 1024, 1600, 2400].map((w) => `/images/hero-${w}.webp ${w}w`).join(', ')

function useNextFreeSlot() {
  const [state, setState] = useState({ status: 'loading', slot: null })
  useEffect(() => {
    const ctrl = new AbortController()
    getAvailability(undefined, { signal: ctrl.signal })
      .then((data) =>
        setState(data?.nextFreeSlot ? { status: 'ready', slot: data.nextFreeSlot } : { status: 'none', slot: null }),
      )
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ status: 'error', slot: null })
      })
    return () => ctrl.abort()
  }, [])
  return state
}

const boxLabel = 'text-[11px] font-bold uppercase tracking-[0.16em] text-ash'
const cellValue = 'text-[28px] leading-[1.1] font-black uppercase stretch-72'
const cellLabel = 'text-xs font-semibold uppercase tracking-[0.1em] text-ash'

export default function Hero() {
  const next = useNextFreeSlot()

  let slotText
  if (next.status === 'ready') slotText = formatSlotLabel(next.slot)
  else if (next.status === 'loading') slotText = null
  else slotText = 'See times' // API down or fully booked this week: point people at /book

  return (
    <section
      id="top"
      aria-label="Welcome"
      className="relative isolate flex min-h-[780px] items-end overflow-hidden bg-night text-paper lg:min-h-[max(780px,85vh)]"
    >
      <img
        src="/images/hero-1600.webp"
        srcSet={HERO_SRCSET}
        sizes="100vw"
        width="2400"
        height="1600"
        alt="A client with curly hair lies face down on a massage table, eyes closed, while a therapist works on her shoulders in soft window light."
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[58%_center]"
      />
      {/* The one allowed gradient: dark fade so the type reads over the photo. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(15,15,14,0.08)_0%,rgba(15,15,14,0.38)_40%,rgba(15,15,14,0.88)_100%)]"
      />

      <div className="wrap flex flex-wrap items-end justify-between gap-10 pt-16 pb-14">
        <div className="flex flex-[999_1_560px] flex-col gap-6">
          <span className="type-label">/ Westlands Blvd, Accra</span>
          <h1 className="type-h1 m-0">
            <span className="block animate-rise">Slow</span>
            <span className="block animate-rise [animation-delay:80ms]">down.</span>
          </h1>
          <p className="m-0 max-w-[40ch] text-lg text-hero-text">
            Massage, facials and nail care off Westlands Boulevard. Book online, pay a small deposit, and walk
            in relaxed.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/book" className="btn border-paper bg-paper text-ink hover:bg-transparent hover:text-paper">
              Book a treatment
            </Link>
            <a href="#menu" className="btn border-paper text-paper hover:bg-paper hover:text-ink">
              See prices
            </a>
          </div>
        </div>

        <div className="flex max-w-[360px] flex-[1_1_280px] flex-col border border-hero-line">
          <div className="flex flex-col gap-0.5 border-b border-hero-line px-5 py-[18px]">
            <span className={boxLabel}>Next free slot</span>
            <span className="min-h-10 text-[40px] leading-none font-black uppercase stretch-72" aria-live="polite">
              {slotText === null ? (
                <span className="sr-only">Checking availability</span>
              ) : next.status === 'ready' ? (
                <Link to="/book" className="text-paper hover:text-clay-light">
                  {slotText}
                </Link>
              ) : (
                <Link to="/book" className="text-paper underline underline-offset-4 hover:no-underline">
                  {slotText}
                </Link>
              )}
            </span>
          </div>
          <div className="grid grid-cols-2">
            <div className="flex flex-col border-r border-hero-line px-5 py-4">
              <span className={cellValue}>7 days</span>
              <span className={cellLabel}>Open weekly</span>
            </div>
            <div className="flex flex-col px-5 py-4">
              <span className={cellValue}>Card + MoMo</span>
              <span className={cellLabel}>Via Paystack</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
