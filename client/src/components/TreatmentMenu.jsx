import { useEffect, useState } from 'react'
import { useCatalogStore } from '../store/useCatalogStore'
import SectionLabel from './SectionLabel'
import TreatmentCard from './TreatmentCard'

const FILTERS = ['All', 'Massage', 'Facials', 'Hands & feet', 'Rituals']

const chip =
  'min-h-11 cursor-pointer border border-ink px-[18px] text-[13px] font-extrabold tracking-[0.1em] uppercase transition-colors duration-150'

export default function TreatmentMenu() {
  const { treatments, status, load, retry } = useCatalogStore()
  const [cat, setCat] = useState('All')
  useEffect(() => {
    load()
  }, [load])

  const shown = cat === 'All' ? treatments : treatments.filter((t) => t.category === cat)

  return (
    <section id="menu" className="wrap flex scroll-mt-4 flex-col gap-10 py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <SectionLabel>/ 001 The menu</SectionLabel>
          <h2 data-reveal className="type-h2 m-0">
            Pick your
            <br />
            treatment.
          </h2>
        </div>
        <p className="m-0 max-w-[34ch] text-muted">Prices in Ghana cedis. Pay 30% to book, the rest at the spa.</p>
      </div>

      <div role="group" aria-label="Filter treatments" className="flex flex-wrap gap-2 border-y border-ink py-3.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={cat === f}
            onClick={() => setCat(f)}
            className={`${chip} ${cat === f ? 'bg-ink text-paper' : 'bg-transparent text-ink hover:bg-ink hover:text-paper'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {status === 'error' ? (
        <div className="flex flex-col items-start gap-4 border-b border-ink pb-10">
          <p className="m-0 text-lg">The menu didn't load. Check your connection and try again.</p>
          <button type="button" onClick={retry} className="btn border-ink text-ink hover:bg-ink hover:text-paper">
            Try again
          </button>
        </div>
      ) : (
        <div
          className="grid gap-x-5 gap-y-8 [grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr))]"
          aria-busy={status !== 'ready'}
        >
          {status === 'ready'
            ? shown.map((t) => <TreatmentCard key={t.id} t={t} />)
            : Array.from({ length: 4 }, (_, i) => (
                <div key={i} aria-hidden="true" className="flex flex-col gap-3.5">
                  <div className="aspect-[4/5] bg-stone" />
                  <div className="h-[84px] bg-stone/60" />
                  <div className="h-12 border border-stone" />
                </div>
              ))}
        </div>
      )}
    </section>
  )
}
