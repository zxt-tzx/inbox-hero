import { relations, sql } from 'drizzle-orm'
import {
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  serial,
  unique,
  varchar,
} from 'drizzle-orm/mysql-core'

import { users } from './user.model'

export const senders = mysqlTable(
  'senders',
  {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    // must ensure all reads and writes are lowercase
    email: varchar('email', { length: 255 }).notNull(),
    // can be null if not provided
    fromName: varchar('from_name', { length: 255 }),
    // if not screened, doesn't exist in table
    // if user has screened, but change their mind, delete row
    screenStatus: mysqlEnum('screen_status', ['in', 'out']).notNull(),

    createdAt: datetime('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    // NB need to manually add ON UPDATE CURRENT_TIMESTAMP
    updatedAt: datetime('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => {
    return {
      // userId + email combo must be unique
      userIdEmailUnique: unique('user_id_email_unique').on(
        table.userId,
        table.email,
      ),
      userIdStatusIdx: index('user_id_status_index').on(
        table.userId,
        table.screenStatus,
      ),
    }
  },
)

export const sendersRelations = relations(senders, ({ one }) => ({
  user: one(users, {
    fields: [senders.userId],
    references: [users.id],
  }),
}))
