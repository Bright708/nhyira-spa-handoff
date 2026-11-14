import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Hero from '../components/Hero'
import CategoryStrip from '../components/CategoryStrip'
import TreatmentMenu from '../components/TreatmentMenu'
import Rituals from '../components/Rituals'
import BookFromAbroad from '../components/BookFromAbroad'
import TrustRow from '../components/TrustRow'
import Faq from '../components/Faq'
import Footer from '../components/Footer'
import SkipLink from '../components/SkipLink'
import { useEffect } from 'react'
import { useReveal } from '../lib/useReveal'

export default function Home() {
  useReveal()
  useEffect(() => {
    document.title = 'Nhyira Spa, Accra / Massage, facials, nails'
  }, [])
  return (
    <>
      <SkipLink />
      <AnnouncementBar />
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <CategoryStrip />
        <TreatmentMenu />
        <Rituals />
        <BookFromAbroad />
        <TrustRow />
        <Faq />
      </main>
      <Footer />
    </>
  )
}
