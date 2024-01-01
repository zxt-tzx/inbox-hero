import { sql } from 'drizzle-orm'
import {
  boolean,
  datetime,
  mysqlEnum,
  mysqlTable,
  serial,
  varchar,
} from 'drizzle-orm/mysql-core'

export const waitlist = mysqlTable('waitlist', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailProvider: mysqlEnum('email_provider', [
    'gmail_personal',
    'gmail_workspace',
    'outlook_personal',
    'outlook_work',
    'apple',
    'yahoo',
    'other',
  ]).notNull(),
  otherEmailProvider: varchar('other_email_provider', { length: 255 }),
  sentWelcomeEmail: boolean('sent_welcome_email').notNull().default(false),
  whitelisted: boolean('whitelisted').notNull().default(false),
  comments: varchar('comments', { length: 1000 }),

  createdAt: datetime('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  // NB need to manually add ON UPDATE CURRENT_TIMESTAMP
  updatedAt: datetime('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})
