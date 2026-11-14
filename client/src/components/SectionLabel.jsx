export default function SectionLabel({ children, dark = false, className = '' }) {
  return <span className={`type-label ${dark ? 'text-clay-light' : 'text-clay'} ${className}`}>{children}</span>
}
