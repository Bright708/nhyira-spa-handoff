import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCatalogStore } from '../store/useCatalogStore'
import { formatDuration, formatGhs } from '../lib/format'
import SectionLabel from './SectionLabel'

export default function Rituals() {
  const { treatments, status, load } = useCatalogStore()
  useEffect(() => {
    load()
  }, [load])
  const rituals = treatments.filter((t) => t.category === 'Rituals')

  return (
    <section id="rituals" className="scroll-mt-4 bg-ink text-paper">
      <div className="wrap grid items-stretch gap-14 py-24 lg:grid-cols-2">
        <div className="relative min-h-[420px] overflow-hidden bg-night sm:min-h-[560px]">
          <img
            src="/images/rituals-stones-1280.webp"
            srcSet="/images/rituals-stones-640.webp 640w, /images/rituals-stones-1280.webp 1280w"
            sizes="(min-width: 1024px) 640px, 100vw"
            width="1280"
            height="1600"
            loading="lazy"
            decoding="async"
            alt="Warm oil poured beside smooth black basalt stones and a rolled white towel."
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center gap-8">
          <SectionLabel dark>/ 002 Rituals</SectionLabel>
          <h2 data-reveal className="type-h2 m-0">
            Make a
            <br />
            day of it.
          </h2>
          <ol className="m-0 flex list-none flex-col p-0" aria-busy={status !== 'ready'}>
            {rituals.map((r, i) => (
              <li key={r.id} className="flex items-baseline gap-5 border-t border-line-dark py-5 last:border-b">
                <span className="font-bold text-ash">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex flex-1 flex-col">
                  <span className="text-[30px] leading-[1.05] font-black uppercase stretch-72">{r.name}</span>
                  <span className="text-ash-light">
                    {r.description} {formatDuration(r.duration_min)}.
                  </span>
                </div>
                <span className="text-lg font-extrabold whitespace-nowrap">{formatGhs(r.price_ghs)}</span>
              </li>
            ))}
          </ol>
          <Link to="/book" className="btn self-start border-paper bg-paper text-ink hover:bg-ink hover:text-paper">
            Book a ritual
          </Link>
        </div>
      </div>
    </section>
  )
}
