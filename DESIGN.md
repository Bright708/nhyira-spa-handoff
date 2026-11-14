# Nhyira Spa: Design Spec (Option B, "Bold poster")

This is the source of truth for how the site looks. Match it exactly. The two files in
`design-reference/` are the approved mockups (HTML with inline styles). Read them for exact
values. Ignore their `<x-dc>`, `<sc-for>`, `<sc-if>` and `{{ }}` template syntax; that is
mockup tooling, not something to copy.

## Feel in one line

Loud, confident, poster-like. Huge condensed uppercase type, full-bleed photography,
hard black lines, square corners, very short copy. Think streetwear drop site, applied to a spa.

## Hard rules (these are what stop it looking AI-generated)

- **No rounded corners** on buttons, cards, inputs or images. `rounded-none` everywhere.
- **No shadows. No gradients**, except the dark fade over the hero photo so text is readable.
- **No em dashes (—) in any copy.** Use full stops, commas or " / ".
- **No emoji. No icon soup.** Only icons: lock (payment), chevron (back). Inline SVG, stroke 2.
- **No glassmorphism, no blur, no glow, no purple.** No "Welcome to our website" style filler.
- Dividers are **1px solid ink lines**, not cards with padding and soft borders.
- Copy is short. Headlines 1 to 4 words. Body sentences under 15 words.
- Photography carries the design. Every photo slot gets a real photo (see Photos).

## Colour tokens

| Token | Hex | Use |
|---|---|---|
| paper | `#F2F0EB` | Page background |
| ink | `#0F0F0E` | Text, lines, primary buttons, dark sections |
| muted | `#5C5A55` | Secondary text on paper |
| stone | `#DEDAD1` | Image placeholder / loading bg |
| night | `#1C1A17` | Hero bg behind photo |
| ash | `#9C978D` | Secondary text on ink |
| ash-light | `#B5B0A6` | Body text on ink |
| line-dark | `#3A3833` | Divider lines on ink |
| clay | `#B8432B` | The ONE accent: section labels "/ 001", numbers, pay button |
| clay-light | `#E07A5F` | Accent on dark backgrounds |

White `#FFFFFF` only for input backgrounds and text on the clay pay button.

## Typography

One family: **Archivo** (Google Fonts, variable, has a width axis).

```html
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&display=swap" rel="stylesheet">
```

| Style | Size | Weight | Width (`font-stretch`) | Other |
|---|---|---|---|---|
| Hero H1 | `clamp(88px, 14vw, 232px)` | 900 | 68% | uppercase, line-height 0.84 |
| Section H2 | `clamp(56px, 7vw, 112px)` | 900 | 68% | uppercase, line-height 0.86 |
| Card / item title | 26 to 30px | 900 | 72% | uppercase, line-height 1 to 1.05 |
| Big numbers / prices in summary | 40 to 56px | 900 | 70% | |
| Section label ("/ 001 The menu") | 13px | 700 | 100% | uppercase, letter-spacing 0.16em, clay |
| Nav, buttons, chips | 13 to 14px | 800 | 100% | uppercase, letter-spacing 0.08 to 0.12em |
| Body | 16 to 18px | 400 | 100% | line-height 1.5, muted colour |
| Price inline | 18px | 800 | 100% | `white-space: nowrap` |

Wordmark "NHYIRA": 900 weight, 72% width, 30px in header. Footer version: 62% width,
`clamp(96px, 24vw, 360px)`, line-height 0.8.

## Layout

- Container: `max-width: 1360px`, centred, side padding `clamp(16px, 4vw, 40px)`.
- Section vertical padding: 96px (112px for the "Book before you land" section).
- Grids: `repeat(auto-fill, minmax(min(280px, 100%), 1fr))` for cards, gap 32px rows / 20px columns.
- Two-column splits: `repeat(auto-fit, minmax(min(460px, 100%), 1fr))`, gap 56px.
- Mobile first. At phone width everything stacks to one column, H1 stays huge but fits.

## Components

**Buttons** (all square, min-height 56px, padding 0 32px, 14px/800/uppercase/0.1em):
- Primary on paper: bg ink, text paper.
- Primary on dark/photo: bg paper, text ink.
- Secondary: transparent, 1px border in text colour.
- Pay button (booking only): bg clay, text white, min-height 60px.
- Hover: invert colours (ink to paper and back), 150ms. No scale, no shadow.

**Filter chips**: min-height 44px, 1px ink border, uppercase 13px/800. Active = ink fill, paper text.

**Treatment card**: photo (aspect 4:5) with a black duration tag in the top-left corner
(`11px/800/uppercase`, padding 6px 10px). Below: category label (muted, uppercase), then a row
with the condensed name on the left and the price on the right, then one short description line,
then a full-width secondary "BOOK THIS" button. No card border or background.

**Section label**: `/ 001 The menu` style, clay, always above an H2.

**Numbered list rows** (rituals, steps): number in ash, condensed title, short detail, price right,
1px divider lines between rows.

## Page sections (homepage, in order)

1. **Announcement bar**: ink bg, 12px uppercase. "Flying into Accra? Book now, 30% deposit holds your slot" + link "Book ahead".
2. **Header**: wordmark left; nav right: Treatments, Rituals, Book from abroad, Visit, [Book now] button. 1px ink bottom border. Mobile: hamburger opening a full-screen ink menu with huge condensed links.
3. **Hero**: full-bleed photo, min-height 780px (85vh on desktop is fine), dark fade at the bottom. Bottom-left: "/ Westlands Blvd, Accra", H1 "SLOW / DOWN." (two lines), one-line subhead, [Book a treatment] [See prices]. Bottom-right: bordered info box: "Next free slot / TODAY 2:30 PM", then two cells "7 DAYS / Open weekly" and "CARD + MOMO / Via Paystack". Next free slot should come from the API.
4. **Category strip**: MASSAGE / FACIALS / NAILS / WAXING / RITUALS, condensed 900, slashes in clay, 1px bottom border.
5. **/ 001 The menu**: H2 "PICK YOUR / TREATMENT.", note "Prices in Ghana cedis. Pay 30% to book, the rest at the spa." Filter chips (All, Massage, Facials, Hands & feet, Rituals). Card grid. Clicking BOOK THIS goes to `/book?treatment=<id>`.
6. **/ 002 Rituals**: ink section. Photo left, right: H2 "MAKE A / DAY OF IT.", 3 numbered rituals with prices, [Book a ritual].
7. **/ 003 Flying in?**: centred. H2 "BOOK BEFORE / YOU LAND.", one paragraph, a 3-cell bordered strip (01 Choose a time / 02 Pay 30% deposit / 03 Get it on WhatsApp), [Reserve my slot].
8. **Trust row**: 3 columns: Secure payment / Instant confirmation / Open 7 days.
9. **/ 004 Good to know**: left: H2 "QUESTIONS.", address, [Chat on WhatsApp]. Right: 4 Q&As separated by ink lines (make them accordions on mobile).
10. **Footer**: ink. Tagline "Your hour off starts the moment you book.", link groups (Book / Visit), giant NHYIRA wordmark, copyright + "Site by [Your studio]".

## Booking page (`/book`)

Header (wordmark + "Back to site"). Two columns: left steps, right ink summary panel
(summary stacks under the steps on mobile and becomes a sticky bottom bar with the deposit amount
and Pay button).

- H1 "LOCK IN / YOUR TIME." with label "/ Book online".
- Steps, each with an uppercase heading row `01 TREATMENT` and a 1px ink line under it:
  01 Treatment (selectable rows: condensed name, duration, price), 02 Day (next 7 open days,
  big condensed date numbers), 03 Time ("Accra time (GMT)" shown on the right; taken slots disabled
  and struck through), 04 Your details (Full name, WhatsApp number with country code, Email).
- Summary panel: "YOUR BOOKING", treatment / length / date / time rows, total, pay at spa,
  "DEPOSIT TODAY 30%" with the deposit in 56px condensed, clay [Pay GH₵ X deposit] button,
  "Card or MoMo. Secured by Paystack", rescheduling policy line.
- After payment is verified: panel switches to "/ Confirmed", "YOU'RE / BOOKED.", the summary
  sentence, amount left to pay, [Book another].

## Photos

Every placeholder in the mockups becomes a real photo. While building the demo, use free
Unsplash or Pexels photos (spa room, massage, hot stones, facial, manicure, pedicure, towels,
tea). Pick **warm, natural-light photos with Black women and men as clients** so it fits Accra.
Avoid cheesy stock (candles + orchid + smiling model looking at camera).
Store them in `src/assets/` (or `/public/images`), serve as WebP, `loading="lazy"` except the hero.
When pitching a real client, swap in their own photos.

## Motion (keep it subtle)

- Hero H1 lines slide up 24px and fade in, staggered 80ms, on load.
- Section headings fade up once when scrolled into view.
- Buttons: colour invert on hover, 150ms.
- Respect `prefers-reduced-motion`.
