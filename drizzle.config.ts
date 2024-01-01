import dotenv from 'dotenv'
import type { Config } from 'drizzle-kit'

export const path = '.env.local'
// export const path = '.env.app'

dotenv.config({ path })

export default {
  schema: './src/server/database/model/*',
  out: './src/server/database/migrations',
  driver: 'mysql2',
  dbCredentials: {
    uri: process.env.DATABASE_URL as string,
  },
} satisfies Config
