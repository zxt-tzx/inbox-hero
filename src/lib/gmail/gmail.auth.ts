import assert from 'assert'
import { and, between, eq, isNotNull } from 'drizzle-orm'
import type { PlanetScaleDatabase } from 'drizzle-orm/planetscale-serverless'
import type { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import { stringify } from 'superjson'

import { users } from '~/server/database/model/user.model'
import { dayjs } from '../time/dayjs'
import { RefreshTokenExpiredError } from './errors'

async function getValidAccessToken({
  oauth2Client,
  db,
  accessToken,
  accessTokenExpireAt,
  refreshToken,
  gmailId,
}: {
  oauth2Client: OAuth2Client
  db: PlanetScaleDatabase
  accessToken: string
  accessTokenExpireAt: Date
  refreshToken: string
  gmailId: string
}) {
  const hasAccessTokenExpired = hasTokenExpired(accessTokenExpireAt)
  if (!hasAccessTokenExpired) {
    return accessToken
  }
  return await getAndStoreNewAccessToken({
    oauth2Client,
    db,
    refreshToken,
    gmailId,
  })
}

export function hasTokenExpired(tokenExpireAt: Date) {
  return dayjs.utc().isAfter(dayjs.utc(tokenExpireAt))
}

export async function getUsersWithExpiringRefreshTokens(
  db: PlanetScaleDatabase,
  daysLeft: 1 | 2,
) {
  const res = await db
    .select({
      email: users.email,
      gmailId: users.gmailId,
      refreshToken: users.refreshToken,
      refreshTokenExpireAt: users.refreshTokenExpireAt,
      accessToken: users.accessToken,
      accessTokenExpireAt: users.accessTokenExpireAt,
    })
    .from(users)
    .where(
      and(
        // only users that have granted us permission
        isNotNull(users.refreshToken),
        between(
          users.refreshTokenExpireAt,
          // expiry must be between X days - 1 hour and X days
          dayjs
            .utc()
            .startOf('hour')
            .add(daysLeft, 'day')
            .subtract(1, 'hour')
            .toDate(),
          dayjs.utc().startOf('hour').add(daysLeft, 'day').toDate(),
        ),
      ),
    )
  return res.map((r) => {
    return {
      ...r,
      daysLeft,
    }
  })
}

async function getAndStoreNewAccessToken({
  oauth2Client,
  db,
  refreshToken,
  gmailId,
}: {
  oauth2Client: OAuth2Client
  db: PlanetScaleDatabase
  refreshToken: string
  gmailId: string
}) {
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })
  const {
    credentials: {
      access_token: newAccessToken,
      expiry_date: newAccessTokenExpireAt,
    },
  } = await oauth2Client.refreshAccessToken()
  assert(newAccessToken && newAccessTokenExpireAt, 'getAndStoreNewAccessToken')
  await db
    .update(users)
    .set({
      accessToken: newAccessToken,
      accessTokenExpireAt: dayjs(newAccessTokenExpireAt).toDate(),
    })
    .where(eq(users.gmailId, gmailId))
  return newAccessToken
}

export async function getUsersWithExpiredRefreshTokens(
  db: PlanetScaleDatabase,
) {
  return await db
    .select({
      email: users.email,
    })
    .from(users)
    .where(
      and(
        isNotNull(users.refreshToken),
        // cron job run hourly, we only want to send once
        between(
          users.refreshTokenExpireAt,
          // expired between between 1 hour ago and now; use startOf to remove runtime diff (minutes and seconds)
          dayjs.utc().startOf('hour').subtract(1, 'hour').toDate(),
          dayjs.utc().startOf('hour').toDate(),
        ),
      ),
    )
}

export async function setUserWatchAsExpired({
  db,
  email,
}: {
  db: PlanetScaleDatabase
  email: string
}) {
  await db
    .update(users)
    .set({
      watchExpireAt: dayjs.utc().startOf('minute').toDate(),
    })
    .where(eq(users.email, email))
}

export async function authGmailClient({
  accessToken,
  accessTokenExpireAt,
  refreshToken,
  refreshTokenExpireAt,
  gmailId,
  oauth2Client,
  db,
}: {
  accessToken: string | null
  accessTokenExpireAt: Date | null
  refreshToken: string | null
  refreshTokenExpireAt: Date | null
  gmailId: string | null
  oauth2Client: OAuth2Client
  db: PlanetScaleDatabase
}) {
  assert(
    accessToken &&
      accessTokenExpireAt &&
      refreshToken &&
      refreshTokenExpireAt &&
      gmailId,
    `User is missing required fields: ${stringify({
      accessToken,
      accessTokenExpireAt,
      refreshToken,
      refreshTokenExpireAt,
      gmailId,
    })}`,
  )
  if (hasTokenExpired(refreshTokenExpireAt)) {
    throw new RefreshTokenExpiredError(gmailId)
  }
  const validAccessToken = await getValidAccessToken({
    oauth2Client,
    db,
    accessToken,
    accessTokenExpireAt,
    refreshToken,
    gmailId,
  })
  oauth2Client.setCredentials({
    access_token: validAccessToken,
  })
  const gmail = google.gmail({
    version: 'v1',
    auth: oauth2Client,
  })
  return gmail
}

export async function setRefreshTokenAsExpiredByEmail({
  db,
  email,
}: {
  db: PlanetScaleDatabase
  email: string
}) {
  await db
    .update(users)
    .set({
      refreshTokenExpireAt: dayjs.utc().startOf('minute').toDate(),
    })
    .where(eq(users.email, email))
}

export async function setRefreshTokenAsExpiredByUserId({
  db,
  userId,
}: {
  db: PlanetScaleDatabase
  userId: string
}) {
  await db
    .update(users)
    .set({
      refreshTokenExpireAt: dayjs.utc().startOf('minute').toDate(),
    })
    .where(eq(users.id, userId))
}

export async function setRefreshTokenAsExpiredByGmailId({
  db,
  gmailId,
}: {
  db: PlanetScaleDatabase
  gmailId: string
}) {
  await db
    .update(users)
    .set({
      refreshTokenExpireAt: dayjs.utc().startOf('minute').toDate(),
    })
    .where(eq(users.gmailId, gmailId))
}
