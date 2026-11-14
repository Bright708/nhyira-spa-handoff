import { Link } from 'react-router-dom'

export default function AnnouncementBar() {
  return (
    <aside aria-label="Announcement" className="bg-ink text-paper text-xs font-semibold uppercase tracking-[0.12em]">
      <div className="wrap flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-2.5 text-center">
        <span>Flying into Accra? Book now, 30% deposit holds your slot</span>
        <Link to="/book" className="underline underline-offset-4 hover:no-underline">
          Book ahead
        </Link>
      </div>
    </aside>
  )
}
