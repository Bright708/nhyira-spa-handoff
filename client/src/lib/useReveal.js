import { useEffect } from 'react'

/** Fade up every [data-reveal] element the first time it scrolls into view. */
export function useReveal() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const root = document.documentElement
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0 },
    )
    document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el))
    root.classList.add('reveal-on')
    return () => {
      io.disconnect()
      root.classList.remove('reveal-on')
    }
  }, [])
}
