import { relations, sql } from 'drizzle-orm'
import {
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  varchar,
} from 'drizzle-orm/mysql-core'
import { ulid } from 'ulid'

import { emailProvider } from './email.model'
import { users } from './user.model'

export const screeners = mysqlTable(
  'screeners',
  {
    // this will be used in URL in email; 80 bits should be enough to prevent brute-force attack
    // TODO: supplement with route rate limit?
    id: varchar('id', { length: 26 })
      .primaryKey()
      .$defaultFn(() => ulid()),

    userId: varchar('user_id', { length: 26 }).notNull(),

    status: mysqlEnum('status', ['scheduled', 'enqueued', 'sent', 'delivered'])
      .notNull()
      .default('scheduled'),

    // need to manually specify it's NULLABLE, beware auto-generated migration
    provider: emailProvider,
    providerId: varchar('provider_id', { length: 255 }),

    // must be "rounded" time (i.e. 5pm, 5:30pm etc.)
    scheduledAt: datetime('scheduled_at').notNull(),
    sentAt: datetime('sent_at'),
    // time after which screener link would not work
    expireAt: datetime('expire_at').notNull(),

    createdAt: datetime('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    // NB need to manually add ON UPDATE CURRENT_TIMESTAMP
    updatedAt: datetime('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => {
    return {
      // composite index; query if user has any scheduled screeners at a given point in time
      userIdStatusIdx: index('user_id_status_idx').on(
        table.userId,
        table.status,
      ),
      statusIdx: index('status_idx').on(table.status),
    }
  },
)

// see https://planetscale.com/blog/working-with-related-data-using-drizzle-and-planetscale
export const screenersRelations = relations(screeners, ({ one }) => ({
  user: one(users, {
    fields: [screeners.userId],
    references: [users.id],
  }),
}))
