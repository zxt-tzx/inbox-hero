import { connect } from '@planetscale/database'
import dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/planetscale-serverless'
import { migrate } from 'drizzle-orm/planetscale-serverless/migrator'

import { path } from '../../../drizzle.config'

dotenv.config({ path })

const runMigrate = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined')
  }

  const connection = connect({
    url: process.env.DATABASE_URL,
  })

  const db = drizzle(connection)

  console.log('⏳ Running migrations...')

  const start = Date.now()

  await migrate(db, { migrationsFolder: './src/server/database/migrations' })

  const end = Date.now()

  console.log(`✅ Migrations completed in ${end - start}ms`)

  process.exit(0)
}

runMigrate().catch((err) => {
  console.error('❌ Migration failed')
  console.error(err)
  process.exit(1)
})
