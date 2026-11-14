import { useId, useState } from 'react'
import { SITE } from '../content/site'
import { useMediaQuery } from '../lib/useMediaQuery'
import SectionLabel from './SectionLabel'

const QA = [
  ['How much is the deposit?', '30% of the treatment price. You pay the rest at the spa.'],
  ['Can I pay with a foreign card?', 'Yes. Visa and Mastercard from anywhere, plus Mobile Money in Ghana.'],
  ['My flight changed. Can I move my booking?', SITE.reschedulePolicy],
  ['Is there parking?', SITE.parking],
]

function Chevron({ open }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className="border-t border-ink last:border-b">
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 py-5 text-left text-lg font-extrabold"
        >
          {q}
          <Chevron open={open} />
        </button>
      </h3>
      <div id={id} hidden={!open} className="-mt-2 pb-5 text-muted">
        {a}
      </div>
    </div>
  )
}

export default function Faq() {
  // Desktop: everything visible. Phone and tablet: accordions.
  const desktop = useMediaQuery('(min-width: 1024px)')

  return (
    <section id="faq" className="wrap grid scroll-mt-4 gap-14 py-24 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <SectionLabel>/ 004 Good to know</SectionLabel>
        <h2 data-reveal className="type-h2 m-0">Questions.</h2>
        <p className="mt-2 mb-0 text-lg font-bold">{SITE.address}</p>
        <a
          href={SITE.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[52px] items-center self-start border border-ink px-7 text-[13px] font-extrabold tracking-[0.1em] text-ink uppercase transition-colors duration-150 hover:bg-ink hover:text-paper"
        >
          Chat on WhatsApp
        </a>
      </div>

      {desktop ? (
        <dl className="m-0 flex flex-col">
          {QA.map(([q, a]) => (
            <div key={q} className="flex flex-col gap-1.5 border-t border-ink py-[22px] last:border-b">
              <dt className="text-lg font-extrabold">{q}</dt>
              <dd className="m-0 text-muted">{a}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div>
          {QA.map(([q, a]) => (
            <AccordionItem key={q} q={q} a={a} />
          ))}
        </div>
      )}
    </section>
  )
}
