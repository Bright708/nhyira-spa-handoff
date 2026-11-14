import { Link } from 'react-router-dom'
import { SITE } from '../content/site'

const groupLabel = 'text-xs font-extrabold tracking-[0.14em] text-ash uppercase'
const YEAR = new Date().getFullYear()
const link = 'text-paper underline-offset-4 hover:underline'

export default function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="wrap flex flex-col gap-12 pt-[72px] pb-8">
        <div className="flex flex-wrap justify-between gap-8">
          <p className="m-0 max-w-[28ch] text-xl font-bold">Your hour off starts the moment you book.</p>
          <div className="flex flex-wrap gap-12 text-sm">
            <nav aria-label="Book" className="flex flex-col gap-2">
              <span className={groupLabel}>Book</span>
              <Link to="/book" className={link}>Book online</Link>
              <a href="#abroad" className={link}>From abroad</a>
              <a href="#rituals" className={link}>Gift a ritual</a>
            </nav>
            <nav aria-label="Visit" className="flex flex-col gap-2">
              <span className={groupLabel}>Visit</span>
              <a href={SITE.mapsUrl} target="_blank" rel="noreferrer" className={link}>Directions</a>
              <a href={SITE.whatsappUrl} target="_blank" rel="noreferrer" className={link}>WhatsApp</a>
              <a href={SITE.instagramUrl} target="_blank" rel="noreferrer" className={link}>Instagram</a>
            </nav>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="text-[clamp(96px,24vw,360px)] leading-[0.8] font-black tracking-[-0.01em] uppercase select-none stretch-62"
        >
          Nhyira
        </div>
        <div className="flex flex-wrap justify-between gap-3 text-xs tracking-[0.06em] text-ash uppercase">
          <span>&copy; {YEAR} Nhyira Spa, Accra</span>
          <span>Site by {SITE.studio}</span>
        </div>
      </div>
    </footer>
  )
}
