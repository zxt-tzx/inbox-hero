import { connect } from '@planetscale/database'
import { and, between, eq, isNotNull } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/planetscale-serverless'
import { google } from 'googleapis'
import pSettle from 'p-settle'
import { Config } from 'sst/node/config'
import { stringify } from 'superjson'

import {
  GmailInvalidCredentialsError,
  RefreshTokenExpiredError,
} from '~/lib/gmail/errors'
import { notifyDevGmail } from '~/lib/gmail/gmail.message'
import { setWatch } from '~/lib/gmail/gmail.watch'
import { dayjs } from '~/lib/time/dayjs'
import { users } from '~/server/database/model/user.model'

const OAuth2 = google.auth.OAuth2
const GOOGLE_CLIENT_ID = Config.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = Config.GOOGLE_CLIENT_SECRET
const env = Config.APP_ENV

const dbConnection = connect({
  url: Config.DATABASE_URL,
})
const db = drizzle(dbConnection)

export async function handler() {
  const usersWithExpiringWatch = await db
    .select({
      accessToken: users.accessToken,
      accessTokenExpireAt: users.accessTokenExpireAt,
      refreshToken: users.refreshToken,
      refreshTokenExpireAt: users.refreshTokenExpireAt,
      scopes: users.gmailScopes,
      gmailId: users.gmailId,
      email: users.email,
    })
    .from(users)
    .where(
      and(
        // have granted us permission
        isNotNull(users.refreshToken),
        //have turned on daily screener
        eq(users.isDailyScreenerOn, true),
        // watchExpireAt is less than 2 days from now (can be in the past)
        between(
          users.watchExpireAt,
          //now
          dayjs.utc().toDate(),
          dayjs.utc().add(2, 'day').toDate(),
        ),
      ),
    )

  const results = await pSettle(
    usersWithExpiringWatch.map((u) =>
      setWatch({
        ...u,
        oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
        db,
        env,
      }),
    ),
    {
      concurrency: 10,
    },
  )

  const failures = results.filter((r) => r.isRejected)
  const unexpectedFailures = results.filter(
    (r) =>
      r.isRejected &&
      !(r.reason instanceof RefreshTokenExpiredError) &&
      !(r.reason instanceof GmailInvalidCredentialsError),
  )
  if (unexpectedFailures.length !== 0) {
    await notifyDevGmail({
      db,
      isError: true,
      oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
      subject: 'Failure while calling watch',
      message: stringify({
        failures: unexpectedFailures,
      }),
    })
  }

  console.log(`Successfully renewed: ${results.length - failures.length}`)
  console.log(`Failures: ${failures.length}`)
  console.log(`Unexpected failures: ${unexpectedFailures.length}`)
}
