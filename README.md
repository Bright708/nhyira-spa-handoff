# Nhyira Spa

Demo booking site for a fictional spa in Accra. Bold poster design (see `DESIGN.md`), online
booking with a 30% deposit taken through Paystack in Ghana cedis.

```
client/   Vite + React 19, Tailwind 4, Zustand, React Router   -> Vercel
server/   Node + Express 5, Supabase (Postgres), Paystack       -> Render (or Railway)
render.yaml   Render blueprint for the API
```

## How booking works

1. The browser asks `GET /api/availability?date=…&treatmentId=…` for open slots (Mon to Sat 8am
   to 8pm, Sun 12pm to 8pm, starts every 90 minutes, Accra time = GMT). Only starts where the
   treatment finishes by closing are offered, and past times today are hidden.
2. `POST /api/bookings/initialize` checks the input, prices it **from the database** (amounts
   sent by the browser are ignored), re-checks capacity, saves a `pending` booking that holds
   the slot for 15 minutes, and opens a Paystack transaction for the deposit in pesewas.
3. The browser opens the Paystack popup with the returned `access_code`.
4. On success the browser calls `GET /api/bookings/verify/:reference`. The server asks Paystack,
   checks status, amount and currency, and marks the booking `paid`.
5. Paystack also calls `POST /api/paystack/webhook` (HMAC SHA512 signature checked against the
   raw body). Either path can mark the booking paid; both are safe to repeat.

Unpaid holds expire after 15 minutes. The spa has `ROOMS` treatment rooms (default 2). Each
booking stores its start and end, and a time is free only if, at every moment of the treatment,
fewer than `ROOMS` paid or live pending bookings are running. The check runs inside the database
under a per-day lock (`hold_slot`, `mark_booking_paid` in `002_capacity.sql`), so two people
racing for the last room can't both get it.

## Run it locally

Needs Node 20+ (22 recommended), a Supabase project and a Paystack account (test mode is fine).

```bash
# 1. API
cd server
npm install
cp .env.example .env        # fill in the values, see below
npm run migrate             # creates tables + seeds the 10 treatments (needs DATABASE_URL)
npm run dev                 # http://localhost:4000

# 2. Website (second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173, /api is proxied to :4000
```

No database yet? Set `VITE_USE_MOCKS=true` in `client/.env.development` to run the site on mock
data with a simulated payment.

Instead of `npm run migrate` you can paste `server/supabase/migrations/001_init.sql` into
Supabase > SQL Editor and run it. It is safe to run more than once.

### Server environment (`server/.env`)

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page. The secret key (`sb_secret_...`) or legacy `service_role` key. Server only. |
| `PAYSTACK_SECRET_KEY` | Paystack > Settings > API Keys & Webhooks. Use the **test** key (`sk_test_...`). |
| `CLIENT_URL` | Site origin(s) allowed by CORS, comma-separated |
| `DATABASE_URL` | Only for `npm run migrate`. Supabase > Connect > Session pooler URI. |
| `ROOMS` | Optional. Treatment rooms, i.e. how many bookings may overlap. Default `2`. |

The secret keys never go in `client/`. The browser never talks to Supabase directly; RLS is on
with no policies, so the public keys can read nothing.

### Client environment

| Variable | Value |
|---|---|
| `VITE_API_URL` | Empty locally (Vite proxy). In production, the API URL, e.g. `https://nhyira-api.onrender.com` |
| `VITE_USE_MOCKS` | `false` (or `true` for mock data) |

### Test payments

In the Paystack popup (test mode) choose **Success** to complete a payment, or **Declined** to see
the failure path. To receive webhooks locally, run `ngrok http 4000` and set the Test Webhook URL
in Paystack to `https://<id>.ngrok-free.app/api/paystack/webhook` (free ngrok URLs change on
every restart).

### Tests

```bash
cd server && npm test       # slot grid, room capacity, deposit maths, webhook signature
```

## Deploy

Deploy the API first, so you have its URL for the website.

### 1. API on Render

1. Push this repo to GitHub.
2. Render > **New > Blueprint** > pick the repo. It reads `render.yaml` (root dir `server`,
   `npm ci`, `npm start`, health check `/api/health`).
3. Fill in the env vars it asks for: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `PAYSTACK_SECRET_KEY`, and `CLIENT_URL` (put a placeholder for now, fix it after step 2).
4. Note the URL, e.g. `https://nhyira-api.onrender.com`, and check
   `https://nhyira-api.onrender.com/api/treatments` returns the menu.

Render's free plan sleeps after 15 minutes idle; the first request then takes 30 to 60 seconds,
and the hero's "Next free slot" waits for it. For pitching, use a paid instance or Railway.

**Railway instead:** New Project > Deploy from GitHub > set the service root directory to
`server`, start command `npm start`, add the same variables, then Settings > Networking >
Generate Domain.

### 2. Website on Vercel

1. Vercel > **Add New > Project** > import the repo.
2. **Root Directory: `client`**. Framework preset Vite (build `npm run build`, output `dist`).
3. Environment variables: `VITE_API_URL` = your API URL, `VITE_USE_MOCKS` = `false`.
4. Deploy. `client/vercel.json` handles SPA routing (so `/book` works on refresh) and caching.

### 3. Connect the two

1. On Render/Railway set `CLIENT_URL` to the Vercel URL, e.g. `https://nhyira-spa.vercel.app`
   (add a custom domain too, comma-separated). Redeploy.
2. Paystack > Settings > API Keys & Webhooks > Webhook URL:
   `https://nhyira-api.onrender.com/api/paystack/webhook`.
3. Book something with the test card and check the row in Supabase > Table Editor > bookings.

### Going live (a real client)

Swap in the spa's own photos (`client/public/images`, same names and sizes), update
`client/src/content/site.js` (address, WhatsApp, policies), switch to `sk_live_` keys after
Paystack business verification, and set the live webhook URL.

## Project map

```
client/src/
  pages/Home.jsx, Book.jsx         routes
  components/                      homepage sections (Header, Hero, TreatmentMenu, ...)
  components/booking/              booking steps, summary panel, mobile pay bar
  store/useBookingStore.js         booking state + derived total/deposit/balance
  store/useCatalogStore.js         treatments, fetched once
  lib/api.js, usePayment.js        API calls, Paystack popup + verify flow
  content/site.js                  business details to swap per client
  mocks/                           mock API for VITE_USE_MOCKS=true
server/src/
  routes/api.js                    treatments, availability, initialize, verify
  routes/webhook.js                Paystack webhook (raw body + signature)
  services/bookings.js             availability, holds, mark-paid rules
  lib/hours.js, pricing.js         opening hours grid, deposit maths
server/supabase/migrations/        SQL schema + seed
```
