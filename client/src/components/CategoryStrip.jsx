const CATS = ['Massage', 'Facials', 'Nails', 'Waxing', 'Rituals']

// Each slash sticks to the word after it, so wrapped lines never end on a dangling "/".
export default function CategoryStrip() {
  return (
    <section aria-label="What we do" className="overflow-hidden border-b border-ink">
      <ul className="wrap flex list-none flex-wrap items-center justify-start gap-x-4 md:justify-between md:gap-x-8 gap-y-3 py-7 text-[clamp(28px,3.4vw,48px)] leading-none font-black uppercase stretch-70">
        {CATS.map((c, i) => (
          <li key={c} className="whitespace-nowrap">
            {i > 0 && (
              <span aria-hidden="true" className="mr-[0.6em] text-clay">
                /
              </span>
            )}
            {c}
          </li>
        ))}
      </ul>
    </section>
  )
}
