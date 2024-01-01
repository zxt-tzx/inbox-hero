import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from 'next'
import { and, eq, gt } from 'drizzle-orm'
import type { NextAuthOptions as NextAuthConfig } from 'next-auth'
import { getServerSession } from 'next-auth'
import Google from 'next-auth/providers/google'

import { env } from '~/env.mjs'
import { getBaseUrl } from '~/lib/env-utils'
import { hasTokenExpired } from '~/lib/gmail/gmail.auth'
import { dayjs } from '~/lib/time/dayjs'
import {
  googleAccountSchema,
  googleAuthGmailAccountSchema,
  googleProfileSchema,
} from '~/schemas/gmail.schema'
import { assert, db } from '~/server/database/client'
import { users } from '~/server/database/model/user.model'
import { emailWhitelistStatus } from '~/server/modules/waitlist/waitlist.service'
import {
  enqueueActivationSuccessfulEmail,
  enqueueNotifyMeEmail,
  enqueueSetWatch,
  enqueueWlRecentlySentSenders,
} from '~/serverless/gmail/sqs'
import { screeners } from '../database/model/screener.model'
import { scheduleNextScreener } from '../modules/screener/screener.service'
import { GoogleAuthGmail } from './GoogleAuthGmail'
import { getRefreshTokenExpireAt } from './refresh-token'

export const nextAuthConfig = {
  theme: {
    logo: `${getBaseUrl()}/images/android-chrome-192x192.png`,
    colorScheme: 'light',
  },
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    GoogleAuthGmail({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: env.NEXTAUTH_SECRET,
  session: {
    maxAge: 7 * 24 * 60 * 60, // 1 week
  },
  callbacks: {
    async signIn({ account, profile }) {
      // for logging in
      if (account?.provider === 'google') {
        const profileParse = googleProfileSchema.safeParse(profile)
        if (!profileParse.success) {
          console.error(
            'ERROR: google, failed to parse profile',
            profileParse.error,
          )
          return false
        }
        const profileData = profileParse.data
        const accountParse = googleAccountSchema.safeParse(account)
        if (!accountParse.success) {
          console.error(
            'ERROR: google, failed to parse account',
            accountParse.error,
          )
          return false
        }
        const accountData = accountParse.data
        const { whitelistStatus } = await emailWhitelistStatus(
          db,
          profileData.email,
        )
        switch (whitelistStatus) {
          case 'email_not_in_waitlist':
          case 'not_whitelisted': {
            return false
          }
          case 'whitelisted': {
            // account has been whitelisted but not created
            await db.insert(users).values({
              gmailId: profileData.sub,
              email: profileData.email.toLowerCase(),
              gmailScopes: accountData.scope.split(' '),
              gmailUserMetadata: {
                name: profileData.name,
                locale: profileData.locale,
                picture: profileData.picture,
              },
            })
            return true
          }
          case 'account_created': {
            // account has been created; update metadata and scopes
            const [user] = await db
              .select({ scope: users.gmailScopes })
              .from(users)
              .where(eq(users.gmailId, profileData.sub))
            assert(user, 'auth/index.ts, google')
            assert(user.scope, 'auth/index.ts, google')
            // using set to remove duplicates
            const newScopes = new Set(
              [...user.scope, ...accountData.scope.split(' ')].filter((s) => s),
            )
            await db
              .update(users)
              .set({
                gmailScopes: Array.from(newScopes),
                gmailUserMetadata: {
                  name: profileData.name,
                  picture: profileData.picture,
                  locale: profileData.locale,
                },
              })
              .where(eq(users.gmailId, profileData.sub))
            return true
          }
          default: {
            whitelistStatus satisfies never
            return false
          }
        }
      }
      // for granting permission to manage Gmail
      if (account?.provider === 'google-auth-gmail') {
        const parseProfile = googleProfileSchema.safeParse(profile)
        if (!parseProfile.success) {
          console.error('ERROR: failure, google-auth-gmail', parseProfile.error)
          return false
        }
        const profileData = parseProfile.data
        const { whitelistStatus } = await emailWhitelistStatus(
          db,
          profileData.email,
        )
        switch (whitelistStatus) {
          case 'email_not_in_waitlist':
          case 'not_whitelisted':
          case 'whitelisted': {
            // whitelisted not good enough, must have account created
            return false
          }
          case 'account_created': {
            const parseAccount = googleAuthGmailAccountSchema.safeParse(account)
            if (!parseAccount.success) {
              console.error(
                'ERROR: failure, google-auth-gmail, account parse',
                parseAccount.error,
              )
              return false
            }
            const accountData = parseAccount.data
            // account has been created; update metadata and scopes
            const [user] = await db
              .select({
                userId: users.id,
                email: users.email,
                scope: users.gmailScopes,
                isDailyScreenerOn: users.isDailyScreenerOn,
                timezone: users.timezone,
                dailyScreenerTime: users.dailyScreenerTime,
                refreshToken: users.refreshToken,
                refreshTokenExpireAt: users.refreshTokenExpireAt,
              })
              .from(users)
              .where(eq(users.gmailId, profileData.sub))
            // should exist because account was created
            assert(user, 'auth/index.ts, google-auth-gmail')
            // should exist because some scope was set when account was created
            assert(user.scope, 'auth/index.ts, google-auth-gmail')
            const newScopes = new Set(
              [...user.scope, ...accountData.scope.split(' ')].filter((s) => s),
            )
            // if this is true, assume either (1) first-time user or (2) resume after a while
            // send activation successful email + whitelist recent senders + set watch
            const {
              dailyScreenerTime,
              timezone,
              isDailyScreenerOn,
              refreshTokenExpireAt,
              refreshToken,
              userId,
            } = user
            assert(
              timezone && dailyScreenerTime,
              'auth/index.ts, google-auth-gmail',
            )
            if (
              !isDailyScreenerOn ||
              (refreshToken &&
                // if refreshTokenExpireAt is null, it means it's indefinitely valid
                refreshTokenExpireAt &&
                hasTokenExpired(refreshTokenExpireAt))
            ) {
              const baseUrl = getBaseUrl()
              await enqueueSetWatch(userId)
              await enqueueActivationSuccessfulEmail({
                baseUrl,
                userId,
                timezone,
                dailyScreenerTime,
              })
            }
            // check if there are any scheduled screeners in the future, if not schedule one
            const [screener] = await db
              .select()
              .from(screeners)
              .where(
                and(
                  eq(screeners.userId, userId),
                  // scheduledAt is in the future
                  gt(screeners.scheduledAt, dayjs().toDate()),
                ),
              )
            if (!screener) {
              await scheduleNextScreener({
                dailyScreenerTime,
                db,
                timezone,
                userId,
              })
            }
            await enqueueNotifyMeEmail({
              subject: `User ${user.email} has granted Inbox Hero access to Gmail`,
              message: 'Nice',
            })
            await enqueueWlRecentlySentSenders(user.userId)
            await db
              .update(users)
              .set({
                isDailyScreenerOn: true,
                gmailScopes: Array.from(newScopes),
                refreshToken: accountData.refresh_token,
                refreshTokenExpireAt: getRefreshTokenExpireAt(),
                accessToken: accountData.access_token,
                accessTokenExpireAt: dayjs
                  .unix(accountData.expires_at)
                  .toDate(),
                gmailUserMetadata: {
                  name: profileData.name,
                  picture: profileData.picture,
                  locale: profileData.locale,
                },
              })
              .where(eq(users.gmailId, profileData.sub))
            return true
          }
          default: {
            whitelistStatus satisfies never
            return false
          }
        }
      }
      // default path for other providers; not used at the moment
      return false
    },
    jwt: ({ token }) => {
      return token
    },
    async session({ session, token }) {
      if (!token.sub) {
        return session
      }
      const [user] = await db
        .select({
          id: users.id,
        })
        .from(users)
        .where(eq(users.gmailId, token.sub))
      assert(user, 'auth/index.ts')
      session.user.id = user.id
      return session
    },
  },
} satisfies NextAuthConfig

// Helper function to get session without passing config every time
// https://next-auth.js.org/configuration/nextjs#getserversession
export function auth(
  ...args:
    | [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, nextAuthConfig)
}
