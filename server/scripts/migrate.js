// Runs every .sql file in supabase/migrations against DATABASE_URL, in name order.
// Usage: npm run migrate   (DATABASE_URL in server/.env)
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is missing. Add it to server/.env (Supabase > Connect > Session pooler URI).')
  process.exit(1)
}

const dir = path.resolve(import.meta.dirname, '../supabase/migrations')
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  for (const f of files) {
    process.stdout.write(`Running ${f} ... `)
    await client.query(fs.readFileSync(path.join(dir, f), 'utf8'))
    console.log('ok')
  }
  await client.query(`notify pgrst, 'reload schema'`)
  const { rows } = await client.query('select count(*)::int as n from public.treatments')
  console.log(`Done. treatments has ${rows[0].n} rows.`)
} catch (err) {
  console.error(`\nMigration failed: ${err.message}`)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
