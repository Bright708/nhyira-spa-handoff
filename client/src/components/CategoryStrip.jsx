import { useEffect, useRef, useState } from 'react'

const CATS = ['Massage', 'Facials', 'Nails', 'Waxing', 'Rituals']

// One line at every width. Under 768px it scrolls sideways (scrollbar hidden);
// it only becomes a tab stop when it actually overflows, so keyboard users can
// scroll it too. The slash sits before every item after the first, so the line
// never starts with "/".
export default function CategoryStrip() {
  const ref = useRef(null)
  const [scrolls, setScrolls] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setScrolls(el.scrollWidth > el.clientWidth + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <section aria-label="What we do" className="border-b border-ink">
      <ul
        ref={ref}
        tabIndex={scrolls ? 0 : undefined}
        aria-label={scrolls ? 'What we do, scrolls sideways' : undefined}
        className="wrap flex list-none flex-nowrap items-center gap-x-4 overflow-x-auto py-7 text-[clamp(28px,3.4vw,48px)] leading-none font-black uppercase [scrollbar-width:none] stretch-70 md:justify-between md:gap-x-8 md:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {CATS.map((c, i) => (
          <li key={c} className="shrink-0 whitespace-nowrap">
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
