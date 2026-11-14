// Central config. Node loads .env via --env-file in `npm run dev`; hosts like
// Render/Railway inject real env vars.

const env = process.env

export const config = {
  port: Number(env.PORT) || 4000,
  // One or more allowed site origins, comma-separated (e.g. production + a Vercel preview).
  clientUrls: (env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((u) => u.trim().replace(/\/$/, ''))
    .filter(Boolean),
  supabaseUrl: env.SUPABASE_URL,
  // Supabase's newer "secret key" (sb_secret_...) and the legacy service_role JWT both work.
  supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY,
  paystackSecret: env.PAYSTACK_SECRET_KEY,
  depositRate: 0.3,
  pendingHoldMinutes: 15,
  bookingWindowDays: 60, // how far ahead people can book
}

const problems = []
if (!config.supabaseUrl) problems.push('SUPABASE_URL is missing')
if (!config.supabaseKey) problems.push('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) is missing')
if (!config.paystackSecret) problems.push('PAYSTACK_SECRET_KEY is missing')
else if (!/^sk_(test|live)_/.test(config.paystackSecret))
  problems.push('PAYSTACK_SECRET_KEY should start with sk_test_ (or sk_live_). Check you pasted the Paystack key, not another one')
else if (config.paystackSecret.startsWith('sk_live_') && env.NODE_ENV !== 'production')
  problems.push('PAYSTACK_SECRET_KEY is a LIVE key outside production. Use your sk_test_ key for the demo')

export const configProblems = problems
