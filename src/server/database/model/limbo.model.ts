import { relations, sql } from 'drizzle-orm'
import {
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
} from 'drizzle-orm/mysql-core'
import { ulid } from 'ulid'

import { users } from './user.model'

export const MAX_TEXT_SIZE_MYSQL = 65535

export const limboEmails = mysqlTable(
  'limbo_emails',
  {
    id: varchar('id', { length: 26 })
      .primaryKey()
      .$defaultFn(() => ulid()),
    userId: varchar('user_id', { length: 26 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    messageId: varchar('message_id', { length: 255 }).notNull(),
    threadId: varchar('thread_id', { length: 255 }).notNull(),
    fromName: varchar('from_name', { length: 255 }),
    subject: varchar('subject', { length: 255 }).notNull(),
    // body can be null if something goes wrong while extracting body
    // not strictly necessary for screening?
    body: text('body'),
    snippet: text('snippet'),
    emailDate: datetime('email_date').notNull(),
    decision: mysqlEnum('decision', ['in', 'out', 'undecided'])
      .default('undecided')
      .notNull(),

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
      // composite index on userId + email
      userIdEmailIdx: index('user_id_email_idx').on(table.userId, table.email),
      // types of queries: (1) get all limbo emails for a given user
      // (2) for emails for a given user + sender, get the most recent one
      // if we really want a unique index, it would be:
      // userId + email + messageId + threadId?
      // but not necessary so far
      // also, we are hard deleting rows after they're processed
    }
  },
)

export const limboEmailsRelations = relations(limboEmails, ({ one }) => ({
  user: one(users, {
    fields: [limboEmails.userId],
    references: [users.id],
  }),
}))
