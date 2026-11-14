// Same shape as rows in the Supabase `treatments` table (see server/supabase migration).
export const TREATMENTS = [
  { id: 'swedish', name: 'Swedish', category: 'Massage', duration_min: 60, price_ghs: 450, description: 'Long, slow strokes. Full switch-off.', image_url: '/images/swedish-960.webp', sort: 1 },
  { id: 'deep-tissue', name: 'Deep tissue', category: 'Massage', duration_min: 60, price_ghs: 550, description: 'Firm pressure for back, neck, shoulders.', image_url: '/images/deep-tissue-960.webp', sort: 2 },
  { id: 'hot-stone', name: 'Hot stone', category: 'Massage', duration_min: 90, price_ghs: 750, description: 'Warm basalt stones, deep release.', image_url: '/images/hot-stone-960.webp', sort: 3 },
  { id: 'glow-facial', name: 'Glow facial', category: 'Facials', duration_min: 60, price_ghs: 500, description: 'Cleanse, exfoliate, mask, massage.', image_url: '/images/glow-facial-960.webp', sort: 4 },
  { id: 'hydrate-facial', name: 'Hydrate', category: 'Facials', duration_min: 45, price_ghs: 380, description: 'For skin tired from sun and harmattan.', image_url: '/images/hydrate-facial-960.webp', sort: 5 },
  { id: 'spa-pedicure', name: 'Spa pedicure', category: 'Hands & feet', duration_min: 60, price_ghs: 250, description: 'Soak, scrub, massage, polish.', image_url: '/images/spa-pedicure-960.webp', sort: 6 },
  { id: 'manicure', name: 'Manicure', category: 'Hands & feet', duration_min: 40, price_ghs: 150, description: 'Shape, cuticle care, polish.', image_url: '/images/manicure-960.webp', sort: 7 },
  { id: 'half-day-ritual', name: 'Half-day ritual', category: 'Rituals', duration_min: 240, price_ghs: 1350, description: 'Hot stone massage, facial, spa pedicure.', image_url: '/images/half-day-ritual-960.webp', sort: 8 },
  { id: 'side-by-side', name: 'Side by side', category: 'Rituals', duration_min: 60, price_ghs: 900, description: 'Two massages in one room.', image_url: '/images/side-by-side-960.webp', sort: 9 },
  { id: 'glow-before-the-party', name: 'Glow before the party', category: 'Rituals', duration_min: 150, price_ghs: 850, description: 'Facial, manicure, pedicure.', image_url: '/images/glow-before-the-party-960.webp', sort: 10 },
]
