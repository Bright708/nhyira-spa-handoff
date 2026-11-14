import { config, configProblems } from './config.js'
import { createApp } from './app.js'
import { expireStale } from './services/bookings.js'

for (const p of configProblems) console.warn(`[config] ${p}`)

const app = createApp()
app.listen(config.port, () => {
  console.log(`Nhyira API on http://localhost:${config.port} (CORS: ${config.clientUrls.join(', ')})`)
})

// Free up abandoned 15-minute holds every 5 minutes.
setInterval(() => {
  expireStale({ force: true })
    .then((n) => n && console.log(`[holds] expired ${n} pending booking(s)`))
    .catch((err) => console.error('[holds]', err.message))
}, 5 * 60_000).unref()
