import { useBookingStore } from '../../store/useBookingStore'
import { FieldError, StepHeading } from './parts'

const FIELDS = [
  { key: 'name', label: 'Full name', type: 'text', placeholder: 'Ama Mensah', autoComplete: 'name' },
  { key: 'whatsapp', label: 'WhatsApp number', type: 'tel', placeholder: '+44 7700 900123', autoComplete: 'tel', hint: 'With country code' },
  { key: 'email', label: 'Email for receipt', type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
]

export default function DetailsStep({ locked }) {
  const customer = useBookingStore((s) => s.customer)
  const setField = useBookingStore((s) => s.setCustomerField)
  const errors = useBookingStore((s) => s.fieldErrors)

  return (
    <section aria-labelledby="b4" className="flex flex-col gap-4">
      <StepHeading id="b4" num="04">
        Your details
      </StepHeading>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))]">
        {FIELDS.map((f) => {
          const err = errors[f.key]
          const describedBy = [f.hint && `h-${f.key}`, err && `e-${f.key}`].filter(Boolean).join(' ') || undefined
          return (
            <div key={f.key} className="flex flex-col gap-2">
              <label htmlFor={`f-${f.key}`} className="text-xs font-extrabold tracking-[0.12em] uppercase">
                {f.label}
                {f.hint && (
                  <span id={`h-${f.key}`} className="sr-only">
                    , {f.hint}
                  </span>
                )}
              </label>
              <input
                id={`f-${f.key}`}
                name={f.key}
                type={f.type}
                inputMode={f.type === 'tel' ? 'tel' : undefined}
                autoComplete={f.autoComplete}
                placeholder={f.placeholder}
                value={customer[f.key]}
                disabled={locked}
                required
                aria-invalid={err ? true : undefined}
                aria-describedby={describedBy}
                onChange={(e) => setField(f.key, e.target.value)}
                className={`min-h-[52px] rounded-none border bg-white px-4 text-base text-ink placeholder:text-[#77746D] disabled:opacity-60 ${
                  err ? 'border-clay border-2' : 'border-ink'
                }`}
              />
              <FieldError id={`e-${f.key}`}>{err}</FieldError>
            </div>
          )
        })}
      </div>
    </section>
  )
}
