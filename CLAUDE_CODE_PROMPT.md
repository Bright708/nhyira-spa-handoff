# Prompt to paste into Claude Code

Put this folder (`DESIGN.md`, `design-reference/`) in the root of a new, empty project folder,
open it in VS Code, start Claude Code, and paste everything below the line.

---

Build a demo website for a fictional spa in Accra, Ghana called **Nhyira Spa**. It's a portfolio
piece I'll show to real spas and salons, so the design quality matters more than anything.

**Read `DESIGN.md` first, then the two mockups in `design-reference/`.** Match them exactly:
colours, Archivo font with condensed widths, sizes, spacing, square corners, section order and
copy. Follow every rule in "Hard rules". Don't add sections, gradients, rounded corners, shadows,
emoji or em dashes that aren't in the design. If something isn't specified, choose the option that
fits the bold poster style and tell me what you chose.

## Stack

- Frontend: Vite + React (JavaScript), Tailwind CSS, Zustand, React Router.
- Backend: Node.js + Express.
- Database: Supabase (Postgres).
- Payments: Paystack (GHS), using a server-side initialize + Paystack Inline popup + server-side verify.

Structure:
```
/client   React app
/server   Express API
```

## Tailwind setup

Put the colour tokens from DESIGN.md into Tailwind as named colours (paper, ink, muted, stone,
night, ash, ash-light, line-dark, clay, clay-light) and set Archivo as the sans font. Add a
utility for condensed widths (`font-stretch: 68%`, `70%`, `72%`). Check which Tailwind version
gets installed and configure it the right way for that version.

## Pages and components

- `/`: homepage with the 10 sections from DESIGN.md. Components such as `AnnouncementBar`,
  `Header` (with full-screen mobile menu), `Hero`, `CategoryStrip`, `TreatmentMenu` (filter chips +
  `TreatmentCard`), `Rituals`, `BookFromAbroad`, `TrustRow`, `Faq`, `Footer`.
- `/book`: booking page. `?treatment=<id>` preselects a treatment.
- `/book/confirmed`: or the in-panel confirmed state from the mockup.
- Treatments come from the API, not hard-coded in components.

## Zustand store (`useBookingStore`)

State: `treatmentId`, `date`, `time`, `customer {name, whatsapp, email}`, `status`
(`idle | paying | verifying | confirmed | failed`), `booking`.
Derived helpers: selected treatment, total, deposit (30%, rounded to whole cedis), balance.

## Database (Supabase)

Write a SQL migration file I can run in the Supabase SQL editor:

- `treatments`: id (text pk), name, category, duration_min, price_ghs (int), description, image_url, sort.
  Seed it with every treatment and ritual shown in the mockups (no duplicates).
- `bookings`: id (uuid), treatment_id, start_at (timestamptz, Accra is GMT), customer_name,
  whatsapp, email, total_ghs, deposit_ghs, paystack_reference (unique), status
  (`pending | paid | cancelled`), created_at.
- Prevent double-booking the same `start_at` for paid bookings (unique partial index).
- Enable RLS. The browser never talks to Supabase directly for bookings; only the server does,
  using the service role key.

## API (Express)

- `GET /api/treatments`
- `GET /api/availability?date=YYYY-MM-DD`: open slots from opening hours
  (Mon to Sat 8am to 8pm, Sun 12pm to 8pm, slots every 90 min) minus paid/pending bookings.
  Also return `nextFreeSlot` for the hero.
- `POST /api/bookings/initialize`: validate input, recompute price and deposit on the server
  (never trust amounts from the browser), create a `pending` booking, call Paystack
  `POST https://api.paystack.co/transaction/initialize` with amount in pesewas
  (deposit × 100), currency `GHS`, the customer's email and a unique reference. Return the
  `access_code` and reference.
- `GET /api/bookings/verify/:reference`: call Paystack `GET /transaction/verify/:reference`,
  check status is `success` and the amount and currency match, then mark the booking `paid`.
- `POST /api/paystack/webhook`: verify the `x-paystack-signature` header (HMAC SHA512 of the raw
  body with the secret key) and mark bookings paid on `charge.success`. Use the raw body for this route.
- Frontend: use `@paystack/inline-js` and `resumeTransaction(access_code)`, then call verify
  when it succeeds and show the confirmed state.

Expire `pending` bookings older than 15 minutes so they don't block slots.

## Env

`client/.env.example` and `server/.env.example` with: `PAYSTACK_SECRET_KEY`,
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLIENT_URL`, `VITE_API_URL`. Use Paystack **test
keys**. Never put the secret key or service role key in the client.

## Quality bar

- Mobile first. Test at 375px, 768px and 1440px. The hero H1 must fit on a phone.
- Accessible: real buttons and links, labels on inputs, `aria-pressed` on chips and options,
  visible focus styles (2px clay outline), alt text on every photo, contrast AA.
- Lighthouse 90+ on performance: WebP images, lazy-load below the fold, preload the hero
  image and the font.
- Photos: follow the Photos section of DESIGN.md.

## How to work

Work in phases and stop after each one so I can check it:

1. Project setup, Tailwind tokens, fonts, Header + Hero. **Stop and show me.**
2. Rest of the homepage.
3. Booking page UI with Zustand (mock data).
4. Supabase migration + Express API.
5. Paystack integration end to end with test keys.
6. Polish: motion, mobile menu, accessibility, README with setup + deploy steps
   (frontend on Vercel, backend on Render or Railway).
