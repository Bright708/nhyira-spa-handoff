import { Link } from 'react-router-dom'
import { cardSrcSet, formatDuration, formatGhs } from '../lib/format'

export default function TreatmentCard({ t }) {
  return (
    <article className="flex flex-col gap-3.5">
      <div className="relative aspect-[4/5] overflow-hidden bg-stone">
        <img
          src={t.image_url}
          srcSet={cardSrcSet(t.image_url)}
          sizes="(min-width: 1360px) 310px, (min-width: 640px) 50vw, 100vw"
          width="960"
          height="1200"
          loading="lazy"
          decoding="async"
          alt={`${t.name}: ${t.description}`}
          className="h-full w-full object-cover"
        />
        <span className="absolute top-3 left-3 bg-ink px-2.5 py-1.5 text-[11px] font-extrabold tracking-[0.12em] text-paper uppercase">
          {formatDuration(t.duration_min)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold tracking-[0.14em] text-muted uppercase">{t.category}</span>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="m-0 text-[30px] leading-none font-black uppercase stretch-72">{t.name}</h3>
          <span className="text-lg font-extrabold whitespace-nowrap">{formatGhs(t.price_ghs)}</span>
        </div>
        <p className="m-0 text-[15px] text-muted">{t.description}</p>
      </div>
      <Link
        to={`/book?treatment=${encodeURIComponent(t.id)}`}
        className="inline-flex min-h-12 items-center justify-center border border-ink text-[13px] font-extrabold tracking-[0.12em] text-ink uppercase transition-colors duration-150 hover:bg-ink hover:text-paper"
      >
        Book this<span className="sr-only">: {t.name}</span>
      </Link>
    </article>
  )
}
