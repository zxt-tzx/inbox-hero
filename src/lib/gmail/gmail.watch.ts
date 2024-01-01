import { eq } from 'drizzle-orm'
import type { PlanetScaleDatabase } from 'drizzle-orm/planetscale-serverless'
import type { OAuth2Client } from 'google-auth-library'
import { stringify } from 'superjson'

import {
  GmailApiUnknownError,
  GmailInvalidCredentialsError,
  isInvalidCredentialsError,
  RefreshTokenExpiredError,
} from '~/lib/gmail/errors'
import {
  authGmailClient,
  setRefreshTokenAsExpiredByEmail,
  setUserWatchAsExpired,
} from '~/lib/gmail/gmail.auth'
import { dayjs } from '~/lib/time/dayjs'
import { watchResponseSchema } from '~/schemas/gmail.schema'
import { users } from '~/server/database/model/user.model'

export async function setWatchUserId({
  userId,
  db,
  oauth2Client,
  env,
}: {
  userId: string
  db: PlanetScaleDatabase
  oauth2Client: OAuth2Client
  env: string
}) {
  const [user] = await db
    .select({
      accessToken: users.accessToken,
      accessTokenExpireAt: users.accessTokenExpireAt,
      gmailId: users.gmailId,
      refreshToken: users.refreshToken,
      refreshTokenExpireAt: users.refreshTokenExpireAt,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }
  const {
    accessToken,
    accessTokenExpireAt,
    gmailId,
    refreshToken,
    refreshTokenExpireAt,
    email,
  } = user
  await setWatch({
    db,
    oauth2Client,
    accessToken,
    accessTokenExpireAt,
    gmailId,
    refreshToken,
    refreshTokenExpireAt,
    email,
    env,
  })
}

export async function setWatch({
  db,
  oauth2Client,
  accessToken,
  accessTokenExpireAt,
  gmailId,
  refreshToken,
  refreshTokenExpireAt,
  email,
  env,
}: {
  db: PlanetScaleDatabase
  oauth2Client: OAuth2Client
  accessToken: string | null
  accessTokenExpireAt: Date | null
  gmailId: string | null
  refreshToken: string | null
  refreshTokenExpireAt: Date | null
  email: string
  env: string
}) {
  const gmail = await authGmailClient({
    accessToken,
    accessTokenExpireAt,
    refreshToken,
    refreshTokenExpireAt,
    gmailId,
    oauth2Client,
    db,
  }).catch(async (error) => {
    if (error instanceof RefreshTokenExpiredError) {
      await setUserWatchAsExpired({ db, email })
      console.log(`Refresh token expired for ${email}`)
      throw new GmailInvalidCredentialsError(email)
    }
    throw new GmailApiUnknownError(
      stringify({
        action: 'setWatch:authGmailClient',
        email,
        error: stringify(error),
      }),
    )
  })

  const res = await gmail.users
    .watch({
      userId: 'me',
      requestBody: {
        labelIds: ['UNREAD', 'SENT'],
        labelFilterBehavior: 'include',
        topicName:
          env === 'production'
            ? 'projects/inbox-hero-400115/topics/gmail-push-prod'
            : 'projects/inbox-hero-400115/topics/gmail-push-staging',
      },
    })
    .catch(async (error) => {
      if (isInvalidCredentialsError(error)) {
        await Promise.all([
          setUserWatchAsExpired({ db, email }),
          setRefreshTokenAsExpiredByEmail({ db, email }),
        ])
        console.log(`Gmail invalid credentials for ${email}`)
        throw new GmailInvalidCredentialsError(email)
      }
      throw new GmailApiUnknownError(
        stringify({
          action: 'setWatch',
          email,
          error: stringify(error),
        }),
      )
    })
  const { expiration, historyId } = watchResponseSchema.parse(res.data)
  await db
    .update(users)
    .set({
      watchExpireAt: dayjs(expiration).toDate(),
      historyId,
    })
    // gmailId has alr been validated in authGmailClient
    .where(eq(users.gmailId, gmailId as string))
}

export async function stopWatch({
  userId,
  db,
  oauth2Client,
}: {
  userId: string
  db: PlanetScaleDatabase
  oauth2Client: OAuth2Client
}) {
  const [user] = await db
    .select({
      accessToken: users.accessToken,
      accessTokenExpireAt: users.accessTokenExpireAt,
      gmailId: users.gmailId,
      refreshToken: users.refreshToken,
      refreshTokenExpireAt: users.refreshTokenExpireAt,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }
  const {
    accessToken,
    accessTokenExpireAt,
    gmailId,
    refreshToken,
    refreshTokenExpireAt,
    email,
  } = user
  const gmail = await authGmailClient({
    accessToken,
    accessTokenExpireAt,
    refreshToken,
    refreshTokenExpireAt,
    gmailId,
    oauth2Client,
    db,
  })
  await gmail.users
    .stop({
      userId: 'me',
    })
    .catch(async (error) => {
      if (isInvalidCredentialsError(error)) {
        await Promise.all([
          setUserWatchAsExpired({ db, email }),
          setRefreshTokenAsExpiredByEmail({ db, email }),
        ])
        console.log(`Gmail invalid credentials for ${email}`)
        throw new GmailInvalidCredentialsError(email)
      }
      throw new GmailApiUnknownError(
        stringify({
          action: 'setStopWatch',
          email,
          error: stringify(error),
        }),
      )
    })
  await setUserWatchAsExpired({ db, email })
}
