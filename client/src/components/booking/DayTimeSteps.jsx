import { useBookingStore } from '../../store/useBookingStore'
import { formatClock, isoToHhmm, nextDays } from '../../lib/time'
import { FieldError, StepHeading, optionClass } from './parts'

export function DayStep({ locked }) {
  const date = useBookingStore((s) => s.date)
  const setDate = useBookingStore((s) => s.setDate)
  const days = nextDays(7)
  const shown = days.find((d) => d.date === date) ?? days[0]

  return (
    <section aria-labelledby="b2" className="flex flex-col gap-4">
      <StepHeading id="b2" num="02" aside={`${shown.month} ${shown.year}`}>
        Day
      </StepHeading>
      <div role="group" aria-labelledby="b2" className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {days.map((d) => {
          const on = d.date === date
          return (
            <button
              key={d.date}
              type="button"
              aria-pressed={on}
              disabled={locked}
              onClick={() => setDate(d.date)}
              className={`flex min-h-[84px] flex-col items-center px-2 py-3 ${optionClass(on)}`}
            >
              <span className={`text-xs font-extrabold tracking-[0.14em] uppercase ${on ? '' : 'text-muted'}`}>{d.dow}</span>
              {' '}
              <span className="text-[40px] leading-none font-black stretch-70">{d.num}</span>
              <span className="sr-only"> {d.month}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function TimeStep({ availability, locked }) {
  const time = useBookingStore((s) => s.time)
  const setTime = useBookingStore((s) => s.setTime)
  const error = useBookingStore((s) => s.fieldErrors.time)
  const { status, data, retry } = availability
  const slots = data?.slots ?? []
  const anyFree = slots.some((s) => s.available)

  return (
    <section aria-labelledby="b3" className="flex flex-col gap-4">
      <StepHeading id="b3" num="03" aside="Accra time (GMT)">
        Time
      </StepHeading>
      <div
        id="step-time"
        tabIndex={-1}
        role="group"
        aria-labelledby="b3"
        aria-describedby={error ? 'e-time' : undefined}
        aria-busy={status === 'loading'}
        className="grid gap-2 outline-offset-4 [grid-template-columns:repeat(auto-fill,minmax(120px,1fr))]"
      >
        {status === 'loading' &&
          Array.from({ length: 6 }, (_, i) => <div key={i} aria-hidden="true" className="min-h-[52px] bg-stone" />)}
        {status === 'error' && (
          <div className="col-span-full flex flex-col items-start gap-3">
            <p className="m-0">Times didn&rsquo;t load.</p>
            <button type="button" onClick={retry} className="btn border-ink text-ink hover:bg-ink hover:text-paper">
              Try again
            </button>
          </div>
        )}
        {status === 'ready' &&
          slots.map((s) => {
            const hhmm = s.time ?? isoToHhmm(s.start)
            const on = hhmm === time
            const label = formatClock(hhmm)
            return (
              <button
                key={s.start}
                type="button"
                aria-pressed={on}
                aria-label={s.available ? label : `${label}, taken`}
                disabled={!s.available || locked}
                onClick={() => setTime(hhmm)}
                className={`min-h-[52px] text-[15px] font-extrabold tracking-[0.06em] uppercase ${
                  s.available ? optionClass(on) : 'cursor-not-allowed border border-stone text-muted line-through'
                }`}
              >
                {label}
              </button>
            )
          })}
      </div>
      {status === 'ready' && !anyFree && <p className="m-0 text-muted">Fully booked. Try another day.</p>}
      <FieldError id="e-time">{error}</FieldError>
    </section>
  )
}
