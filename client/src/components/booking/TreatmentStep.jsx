import { useCatalogStore } from '../../store/useCatalogStore'
import { useBookingStore } from '../../store/useBookingStore'
import { formatGhs, spokenDuration } from '../../lib/format'
import { FieldError, StepHeading, optionClass } from './parts'

export default function TreatmentStep({ locked }) {
  const { treatments, status, retry } = useCatalogStore()
  const treatmentId = useBookingStore((s) => s.treatmentId)
  const setTreatment = useBookingStore((s) => s.setTreatment)
  const error = useBookingStore((s) => s.fieldErrors.treatment)

  return (
    <section aria-labelledby="b1" className="flex flex-col gap-4">
      <StepHeading id="b1" num="01">
        Treatment
      </StepHeading>
      <div
        id="step-treatment"
        tabIndex={-1}
        role="group"
        aria-labelledby="b1"
        aria-describedby={error ? 'e-treatment' : undefined}
        className="grid gap-2.5 outline-offset-4 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]"
      >
        {status === 'error' && (
          <div className="flex flex-col items-start gap-3">
            <p className="m-0">Treatments didn&rsquo;t load.</p>
            <button type="button" onClick={retry} className="btn border-ink text-ink hover:bg-ink hover:text-paper">
              Try again
            </button>
          </div>
        )}
        {status !== 'ready' && status !== 'error' &&
          Array.from({ length: 6 }, (_, i) => <div key={i} aria-hidden="true" className="min-h-[76px] bg-stone" />)}
        {treatments.map((t) => {
          const on = t.id === treatmentId
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              aria-label={`${t.name}, ${spokenDuration(t.duration_min)}, ${formatGhs(t.price_ghs)}`}
              disabled={locked}
              onClick={() => setTreatment(t.id)}
              className={`flex min-h-[76px] w-full items-center justify-between gap-4 px-5 py-4 text-left ${optionClass(on)}`}
            >
              <span className="flex flex-col">
                <span className="text-[26px] leading-[1.05] font-black uppercase stretch-72">{t.name}</span>{' '}
                <span className={`text-[13px] ${on ? 'text-ash-light' : 'text-muted'}`}>{spokenDuration(t.duration_min)}</span>
              </span>{' '}
              <span className="font-extrabold whitespace-nowrap">{formatGhs(t.price_ghs)}</span>
            </button>
          )
        })}
      </div>
      <FieldError id="e-treatment">{error}</FieldError>
    </section>
  )
}
