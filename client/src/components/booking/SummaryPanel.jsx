import { useEffect, useRef, useState } from 'react'
import { useBookingStore, useSelectedTreatment, useTotals } from '../../store/useBookingStore'
import { formatDuration, formatGhs } from '../../lib/format'
import { formatClock, formatDayShort, isoToHhmm } from '../../lib/time'
import { SITE } from '../../content/site'
import { Lock } from './parts'

const dt = 'text-ash'
const dd = 'm-0 text-right'
const notPicked = <span className="text-ash">Not picked</span>

export function PayButton({ onPay, deposit, className = '' }) {
  const status = useBookingStore((s) => s.status)
  const busy = status === 'paying' || status === 'verifying'
  const label =
    status === 'paying'
      ? 'Opening payment...'
      : status === 'verifying'
        ? 'Confirming payment...'
        : deposit != null
          ? `Pay ${formatGhs(deposit)} deposit`
          : 'Pay deposit'
  return (
    <button
      type="button"
      onClick={onPay}
      aria-disabled={busy || undefined}
      className={`min-h-[60px] w-full cursor-pointer border-0 bg-clay px-4 text-[15px] font-extrabold tracking-[0.1em] text-white uppercase transition-colors duration-150 hover:bg-paper hover:text-ink aria-disabled:cursor-wait aria-disabled:hover:bg-clay aria-disabled:hover:text-white ${className}`}
    >
      {label}
    </button>
  )
}

function Confirmed({ booking, onAnother }) {
  const headingRef = useRef(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])
  const hhmm = isoToHhmm(booking.start_at)
  const day = formatDayShort(booking.start_at.slice(0, 10))
  return (
    <div className="flex flex-col gap-5">
      <span className="type-label text-clay-light">/ Confirmed</span>
      <h2 ref={headingRef} tabIndex={-1} className="m-0 text-[64px] leading-[0.86] font-black uppercase outline-none stretch-68">
        You&rsquo;re
        <br />
        booked.
      </h2>
      <p className="m-0 text-hero-text">
        {booking.treatment?.name}, {day} at {formatClock(hhmm)}. Deposit of {formatGhs(booking.deposit_ghs)} paid. We&rsquo;ll
        confirm on WhatsApp shortly.
      </p>
      <p className="m-0 text-sm text-ash">Reference {booking.reference}</p>
      <div className="flex justify-between border-t border-line-dark pt-4 text-[15px]">
        <span className="text-ash">Left to pay at the spa</span>
        <span className="font-extrabold">{formatGhs(booking.balance_ghs)}</span>
      </div>
      <button
        type="button"
        onClick={onAnother}
        className="btn w-full border-paper bg-transparent text-paper hover:bg-paper hover:text-ink"
      >
        Book another
      </button>
    </div>
  )
}

export default function SummaryPanel({ onPay, onAnother }) {
  const { date, time, status, booking, error } = useBookingStore()
  const t = useSelectedTreatment()
  const { total, deposit, balance } = useTotals()

  return (
    <aside
      aria-label="Booking summary"
      className="flex min-w-0 flex-[1_1_360px] flex-col bg-ink px-6 py-9 text-paper sm:px-8 lg:sticky lg:top-6"
    >
      <div className="contents">
        {status === 'confirmed' && booking ? (
          <Confirmed booking={booking} onAnother={onAnother} />
        ) : (
          <div className="flex flex-col gap-6">
            <h2 className="m-0 text-[52px] leading-[0.9] font-black uppercase stretch-68">Your booking</h2>
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-[15px]">
              <dt className={dt}>Treatment</dt>
              <dd className={`${dd} font-extrabold uppercase`}>{t ? t.name : notPicked}</dd>
              <dt className={dt}>Length</dt>
              <dd className={dd}>{t ? formatDuration(t.duration_min) : notPicked}</dd>
              <dt className={dt}>Date</dt>
              <dd className={dd}>{date ? formatDayShort(date) : notPicked}</dd>
              <dt className={dt}>Time</dt>
              <dd className={dd}>{time ? `${formatClock(time)} GMT` : notPicked}</dd>
            </dl>
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 border-t border-line-dark pt-5 text-[15px]">
              <dt className={dt}>Total</dt>
              <dd className={dd}>{total != null ? formatGhs(total) : notPicked}</dd>
              <dt className={dt}>Pay at the spa</dt>
              <dd className={dd}>{balance != null ? formatGhs(balance) : notPicked}</dd>
            </dl>
            <div className="flex items-end justify-between gap-4 border-t border-line-dark pt-5">
              <span className="text-xs font-extrabold tracking-[0.14em] uppercase">
                Deposit today
                <br />
                30%
              </span>
              <span className="text-[56px] leading-[0.9] font-black whitespace-nowrap stretch-70">
                {deposit != null ? formatGhs(deposit) : 'GH₵ 0'}
              </span>
            </div>

            {error && (
              <p role="alert" className="m-0 border border-clay-light px-4 py-3 text-sm text-paper">
                {error}
              </p>
            )}

            <PayButton onPay={onPay} deposit={deposit} />
            <p className="m-0 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.1em] text-ash-light uppercase">
              <Lock />
              Card or MoMo. Secured by Paystack
            </p>
            <p className="m-0 text-center text-[13px] text-ash">{SITE.reschedulePolicyShort}</p>
          </div>
        )}
      </div>
    </aside>
  )
}

/** Phone and tablet: deposit + Pay pinned to the bottom of the screen. */
export function MobilePayBar({ onPay }) {
  const status = useBookingStore((s) => s.status)
  const { deposit } = useTotals()
  const [panelVisible, setPanelVisible] = useState(false)

  // Hide the bar once the full summary (with its own Pay button) is on screen.
  useEffect(() => {
    const panel = document.querySelector('aside[aria-label="Booking summary"]')
    if (!panel) return
    const io = new IntersectionObserver(([e]) => setPanelVisible(e.isIntersecting), { threshold: 0.15 })
    io.observe(panel)
    return () => io.disconnect()
  }, [])

  if (status === 'confirmed' || panelVisible) return null
  return (
    <aside aria-label="Pay deposit" className="fixed inset-x-0 bottom-0 z-40 border-t border-line-dark bg-ink text-paper lg:hidden">
      <div className="wrap flex items-center gap-4 py-3">
        <div className="flex shrink-0 flex-col">
          <span className="text-[11px] font-extrabold tracking-[0.14em] text-ash uppercase">Deposit 30%</span>
          <span className="text-[28px] leading-none font-black stretch-70">{deposit != null ? formatGhs(deposit) : 'GH₵ 0'}</span>
        </div>
        <PayButton onPay={onPay} deposit={null} className="min-h-[52px] flex-1 text-sm" />
      </div>
    </aside>
  )
}
