import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

// Server-only client. Uses the secret/service key, which bypasses RLS.
// Never import this from anything that ships to the browser.
export const db = createClient(config.supabaseUrl ?? 'http://invalid.local', config.supabaseKey ?? 'missing', {
  auth: { persistSession: false, autoRefreshToken: false },
})

export class DbError extends Error {
  constructor(error, context) {
    super(`${context}: ${error?.message ?? 'database error'}`)
    this.code = error?.code
    this.status = 500
  }
}
