const ITEMS = [
  ['Secure payment', 'Every deposit is processed by Paystack.'],
  ['Instant confirmation', 'Your booking lands on WhatsApp in seconds.'],
  ['Open 7 days', 'Mon to Sat 8am to 8pm. Sun 12pm to 8pm.'],
]

export default function TrustRow() {
  return (
    <section aria-label="Why book with us" className="border-y border-ink">
      <ul className="wrap grid list-none gap-8 py-10 md:grid-cols-3">
        {ITEMS.map(([title, body]) => (
          <li key={title} className="flex flex-col gap-1.5">
            <span className="text-[26px] leading-[1.1] font-black uppercase stretch-72">{title}</span>
            <span className="text-muted">{body}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
