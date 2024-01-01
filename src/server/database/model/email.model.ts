import { sql } from 'drizzle-orm'
import {
  datetime,
  index,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
} from 'drizzle-orm/mysql-core'
import { ulid } from 'ulid'

// beware of auto-generated migration; might make this NOT NULL
export const emailProvider = mysqlEnum('provider', ['resend', 'gmail'])

export const emails = mysqlTable(
  'emails',
  {
    id: varchar('id', { length: 26 })
      .primaryKey()
      .$defaultFn(() => ulid()),
    emailType: mysqlEnum('email_type', [
      'waitlist_signup',
      'auth_expired',
      'auth_expiring_soon',
      'runtime_error',
      'notify_me',
      'screener',
      'successful_activation',
      'welcome',
    ]).notNull(),
    from: varchar('from', { length: 255 }).notNull(), // in the form of "Inbox Hero <hello@inboxhero.org>"
    to: varchar('to', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 255 }).notNull(),
    ccBcc: json('cc_bcc').$type<{ cc: string[]; bcc: string[] }>(),
    replyTo: varchar('reply_to', { length: 255 }),
    body: text('body').notNull(),
    provider: emailProvider.notNull(),
    // nullable in case we want to create email first and send later?
    providerId: varchar('provider_id', { length: 255 }),
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
      // composite index; to receive webhooks in the future
      providerIdIdx: index('provider_id_idx').on(
        table.provider,
        table.providerId,
      ),
    }
  },
)
