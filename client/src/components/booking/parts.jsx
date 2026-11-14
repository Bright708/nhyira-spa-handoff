// Small shared pieces for the booking page.

export function StepHeading({ id, num, children, aside }) {
  return (
    <h2
      id={id}
      className="m-0 flex gap-3.5 border-b border-ink pb-3 text-sm font-extrabold tracking-[0.12em] uppercase"
    >
      <span className="text-clay">{num}</span>
      {children}
      {aside && <span className="ml-auto font-bold text-muted">{aside}</span>}
    </h2>
  )
}

export function FieldError({ id, children }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="m-0 text-sm font-bold text-clay">
      {children}
    </p>
  )
}

export function ChevronLeft() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function Lock() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

/** Toggle-button styling shared by treatment, day and time options. */
export const optionClass = (on) =>
  `cursor-pointer border border-ink transition-colors duration-150 disabled:cursor-not-allowed ${
    on ? 'bg-ink text-paper' : 'bg-transparent text-ink hover:bg-ink hover:text-paper'
  }`
