import { relations, sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  datetime,
  index,
  json,
  mysqlTable,
  varchar,
} from 'drizzle-orm/mysql-core'
import { ulid } from 'ulid'
import type { z } from 'zod'

import type { googleProfileSchema } from '~/schemas/gmail.schema'
import { domains } from './domain.model'
import { screeners } from './screener.model'
import { senders } from './sender.model'

type GmailUserMetadata = Omit<
  z.infer<typeof googleProfileSchema>,
  'sub' | 'email'
>

export const users = mysqlTable(
  'users',
  {
    id: varchar('id', { length: 26 })
      .primaryKey()
      .$defaultFn(() => ulid()),
    // careful: must ensure all reads and writes are lowercase
    email: varchar('email', { length: 255 }).notNull().unique(),
    gmailId: varchar('gmail_id', { length: 255 }).unique(),
    gmailUserMetadata: json('gmail_user_metadata').$type<GmailUserMetadata>(),
    gmailScopes: json('gmail_scopes').$type<string[]>(),
    // if this is null -> user has not granted us additional permission
    refreshToken: varchar('refresh_token', { length: 255 }),
    // during beta/testing, set every 7 days, prompt user to re-auth if 2 days left
    // in prod, null by default, indefinitely valid, but might be revoked under these circumstances: https://developers.google.com/identity/protocols/oauth2#expiration
    // then set to now when we find out that refresh token is invalid
    refreshTokenExpireAt: datetime('refresh_token_expire_at'),
    // in future, can move this to Redis?
    accessToken: varchar('access_token', { length: 255 }),
    // access token is valid for 1 hour; if expired, update using refresh token
    accessTokenExpireAt: datetime('access_token_expire_at'),
    // must re-call every 7 days to subscribe to Gmail account notifications
    // recommended to call once per day
    watchExpireAt: datetime('watch_expire_at'),
    historyId: bigint('history_id', { mode: 'number', unsigned: true }),

    timezone: varchar('timezone', { length: 64 }), // see https://stackoverflow.com/questions/33465054/storing-timezone-in-a-database
    dailyScreenerTime: varchar('daily_screener_time', { length: 5 }),
    isDailyScreenerOn: boolean('is_daily_screener_on').default(false).notNull(),

    hasCompletedOnboarding: boolean('has_completed_onboarding')
      .default(false)
      .notNull(),

    createdAt: datetime('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    // NB need to manually add ON UPDATE CURRENT_TIMESTAMP in migration
    updatedAt: datetime('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => {
    return {
      // cron jobs to query for expiring watches and refresh tokens
      watchExpireAtIdx: index('watch_expire_at_idx').on(table.watchExpireAt),
      refreshTokenExpireAtIdx: index('refresh_token_expire_at_idx').on(
        table.refreshTokenExpireAt,
      ),
      refreshTokenIdx: index('refresh_token_idx').on(table.refreshToken),
      gmailIdIdx: index('gmail_id_idx').on(table.gmailId),
    }
  },
)

export const usersRelations = relations(users, ({ many }) => ({
  screeners: many(screeners),
  senders: many(senders),
  domains: many(domains),
}))
