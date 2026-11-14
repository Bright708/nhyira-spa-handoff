import { Link } from 'react-router-dom'
import SectionLabel from './SectionLabel'

const STEPS = [
  ['01', 'Choose a time', 'All times shown in Accra time (GMT).'],
  ['02', 'Pay 30% deposit', 'UK, US and EU cards work. So does MoMo.'],
  ['03', 'Get it on WhatsApp', 'Confirmation, directions and a reminder.'],
]

export default function BookFromAbroad() {
  return (
    <section id="abroad" className="wrap flex scroll-mt-4 flex-col items-center gap-7 py-28 text-center">
      <SectionLabel>/ 003 Flying in?</SectionLabel>
      <h2 data-reveal className="m-0 text-[clamp(56px,8vw,128px)] leading-[0.86] font-black uppercase stretch-68">
        Book before
        <br />
        you land.
      </h2>
      <p className="m-0 max-w-[46ch] text-lg text-muted">
        Coming home for December? Lock in your time from anywhere. Pay the deposit with your own card and we&rsquo;ll
        have the room ready.
      </p>
      <ol className="mt-4 grid w-full list-none divide-y divide-ink border border-ink p-0 text-left md:grid-cols-3 md:divide-x md:divide-y-0">
        {STEPS.map(([n, title, body]) => (
          <li key={n} className="flex flex-col gap-2 p-7">
            <span className="text-5xl leading-none font-black text-clay stretch-70" aria-hidden="true">
              {n}
            </span>
            <span className="font-extrabold tracking-[0.06em] uppercase">{title}</span>
            <span className="text-muted">{body}</span>
          </li>
        ))}
      </ol>
      <Link to="/book" className="btn border-ink bg-ink px-9 text-paper hover:bg-paper hover:text-ink">
        Reserve my slot
      </Link>
    </section>
  )
}
