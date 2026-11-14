import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const NAV = [
  { href: '#menu', label: 'Treatments' },
  { href: '#rituals', label: 'Rituals' },
  { href: '#abroad', label: 'Book from abroad' },
  { href: '#faq', label: 'Visit' },
]

const navText = 'text-[13px] font-bold uppercase tracking-[0.08em]'

export default function Header() {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef(null)
  const menuRef = useRef(null)

  // Lock page scroll, close on Escape, keep Tab inside the open menu.
  useEffect(() => {
    if (!open) return
    const toggle = toggleRef.current
    document.body.style.overflow = 'hidden'
    menuRef.current?.querySelector('a, button')?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key !== 'Tab') return
      const items = menuRef.current.querySelectorAll('a, button')
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
      toggle?.focus()
    }
  }, [open])

  // Close the menu if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (e) => e.matches && setOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const close = () => setOpen(false)

  return (
    <header className="border-b border-ink">
      <div className="wrap flex min-h-[72px] items-center justify-between gap-4">
        <a
          href="#top"
          className="text-[30px] leading-none font-black tracking-[0.02em] stretch-72 text-ink no-underline"
        >
          NHYIRA
        </a>

        {/* Desktop nav */}
        <nav aria-label="Main" className={`hidden items-center gap-x-7 lg:flex ${navText}`}>
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="py-3 text-ink underline-offset-4 hover:underline">
              {item.label}
            </a>
          ))}
          <Link
            to="/book"
            className="inline-flex min-h-11 items-center border border-ink bg-ink px-5 text-paper transition-colors duration-150 hover:bg-paper hover:text-ink"
          >
            Book now
          </Link>
        </nav>

        {/* Mobile: Book now stays visible, everything else lives in the menu */}
        <div className={`flex items-center gap-2 lg:hidden ${navText}`}>
          <Link
            to="/book"
            className="inline-flex min-h-11 items-center border border-ink bg-ink px-4 text-paper transition-colors duration-150 hover:bg-paper hover:text-ink"
          >
            Book now
          </Link>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
            className={`inline-flex min-h-11 cursor-pointer items-center border border-ink px-4 text-ink transition-colors duration-150 hover:bg-ink hover:text-paper ${navText} font-extrabold`}
          >
            Menu
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="menu-in fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ink text-paper lg:hidden"
        >
          <div className="wrap flex min-h-[72px] items-center justify-between gap-4 border-b border-line-dark">
            <a
              href="#top"
              onClick={close}
              className="text-[30px] leading-none font-black tracking-[0.02em] stretch-72 text-paper"
            >
              NHYIRA
            </a>
            <button
              type="button"
              onClick={close}
              className={`inline-flex min-h-11 cursor-pointer items-center border border-paper px-4 text-paper transition-colors duration-150 hover:bg-paper hover:text-ink ${navText} font-extrabold`}
            >
              Close
            </button>
          </div>

          <nav aria-label="Main" className="wrap flex flex-1 flex-col justify-center py-10">
            <ol className="flex flex-col">
              {NAV.map((item, i) => (
                <li
                  key={item.href}
                  className="menu-link border-t border-line-dark last:border-b"
                  style={{ animationDelay: `${60 + i * 60}ms` }}
                >
                  <a
                    href={item.href}
                    onClick={close}
                    className="flex items-baseline gap-4 py-4 text-paper hover:text-clay-light"
                  >
                    <span className="text-sm font-bold text-ash">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-[clamp(48px,14vw,96px)] leading-[0.86] font-black uppercase stretch-68">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="wrap pb-8">
            <Link
              to="/book"
              onClick={close}
              className="btn w-full border-paper bg-paper text-ink hover:bg-ink hover:text-paper"
            >
              Book a treatment
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
