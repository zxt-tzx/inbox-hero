import { connect } from '@planetscale/database'
import { drizzle } from 'drizzle-orm/planetscale-serverless'

// create the connection
const connection = connect({
  url: process.env.DATABASE_URL,
})

export const db = drizzle(connection)

export function assert<T>(
  condition: T extends Promise<unknown> ? never : T,
  message?: string,
): asserts condition {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!condition) {
    throw new Error(
      message
        ? `${message}: condition is ${String(condition)}`
        : `condition is ${String(condition)}`,
    )
  }
}
