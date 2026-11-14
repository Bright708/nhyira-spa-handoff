import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { api } from './routes/api.js'
import { paystackWebhook } from './routes/webhook.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1) // behind Render/Railway/ngrok, for rate limiting by real IP

  // Webhook first, with the RAW body (the signature is over the exact bytes).
  app.post('/api/paystack/webhook', express.raw({ type: '*/*', limit: '1mb' }), paystackWebhook)

  app.use(cors({ origin: config.clientUrls }))
  app.use(express.json({ limit: '20kb' }))
  app.use('/api', api)

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }))

  // Express 5 forwards async errors here.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status ?? err.statusCode ?? 500
    if (status >= 500) console.error(err)
    res.status(status).json({
      error: status >= 500 && !err.expose && !err.extra ? 'Something went wrong. Try again.' : err.message,
      ...(err.extra ?? {}),
    })
  })

  return app
}
