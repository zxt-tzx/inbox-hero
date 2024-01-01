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

export const domains = mysqlTable(
  'domains',
  {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    // careful: must ensure all reads and writes are lowercase
    domain: varchar('domain', { length: 255 }).notNull(),

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
      // userId + domain combo must be unique
      userIdDomainUnique: unique('user_id_domain_unique').on(
        table.userId,
        table.domain,
      ),
      userIdStatusIdx: index('user_id_status_index').on(
        table.userId,
        table.screenStatus,
      ),
    }
  },
)

export const domainsRelations = relations(domains, ({ one }) => ({
  user: one(users, {
    fields: [domains.userId],
    references: [users.id],
  }),
}))
