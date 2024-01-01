import { connect } from '@planetscale/database'
import { render } from '@react-email/render'
import { and, between, eq, gt } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/planetscale-serverless'
import { google } from 'googleapis'
import pSettle from 'p-settle'
import { Config } from 'sst/node/config'
import { stringify } from 'superjson'

import DailyScreener, {
  screenerSubject,
} from '~/lib/email/templates/DailyScreener'
import {
  GmailApiUnknownError,
  GmailInvalidCredentialsError,
  isInvalidCredentialsError,
  RefreshTokenExpiredError,
} from '~/lib/gmail/errors'
import {
  authGmailClient,
  setRefreshTokenAsExpiredByEmail,
} from '~/lib/gmail/gmail.auth'
import { getRawMimeMessage, notifyDevGmail } from '~/lib/gmail/gmail.message'
import { dayjs } from '~/lib/time/dayjs'
import { messagesImportSchema } from '~/schemas/gmail.schema'
import { assert } from '~/server/database/client'
import { emails } from '~/server/database/model/email.model'
import { limboEmails } from '~/server/database/model/limbo.model'
import { screeners } from '~/server/database/model/screener.model'
import { users } from '~/server/database/model/user.model'
import { scheduleNextScreener } from '~/server/modules/screener/screener.service'

const OAuth2 = google.auth.OAuth2
const GOOGLE_CLIENT_ID = Config.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = Config.GOOGLE_CLIENT_SECRET

const dbConnection = connect({
  url: Config.DATABASE_URL,
})
const db = drizzle(dbConnection)

const from = 'Daily Screener <screener@inboxhero.org>'

export async function handler() {
  const isOnHour = dayjs.utc().minute() < 30
  // honestly, not a bad idea to simply query for all scheduled screeners?
  const betweenStartInterval = isOnHour
    ? dayjs.utc().startOf('hour').subtract(1, 'hour')
    : dayjs.utc().startOf('hour').add(30, 'minute').subtract(1, 'hour')
  const betweenEndInterval = isOnHour
    ? dayjs.utc().startOf('hour')
    : dayjs.utc().startOf('hour').add(30, 'minute')

  const screenersToSend = await db
    .select({
      screenerId: screeners.id,
      userId: screeners.userId,
    })
    .from(screeners)
    .where(
      and(
        eq(screeners.status, 'scheduled'),
        between(
          screeners.scheduledAt,
          betweenStartInterval.toDate(),
          betweenEndInterval.toDate(),
        ),
      ),
    )
    .innerJoin(
      users,
      and(
        eq(screeners.userId, users.id),
        // only send to users whose refresh token is not expired and daily screener is on
        gt(users.refreshTokenExpireAt, dayjs.utc().toDate()),
        eq(users.isDailyScreenerOn, true),
      ),
    )
  const results = await pSettle(
    screenersToSend.map((s) => sendScreener(s)),
    {
      concurrency: 10,
    },
  )
  const failures = results.filter((r) => r.isRejected)
  const unexpectedFailures = results.filter(
    (r) =>
      r.isRejected &&
      !(r.reason instanceof GmailInvalidCredentialsError) &&
      !(r.reason instanceof RefreshTokenExpiredError),
  )
  if (unexpectedFailures.length !== 0) {
    await notifyDevGmail({
      db,
      isError: true,
      oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
      subject: 'Uncaught Gmail API error: screener.ts',
      message: stringify({
        unexpectedFailures,
      }),
    })
  }
  console.log(`Supposed to send ${screenersToSend.length} screeners`)
  console.log(`Sent ${screenersToSend.length - failures.length}`)
  console.log(`Unexpected failures are ${stringify(unexpectedFailures)}`)
}

async function sendScreener({
  // passing in userId because we don't want to query the db again
  // potential for weird behavior if userId is not the same as the one in screener
  screenerId,
  userId,
}: {
  screenerId: string
  userId: string
}) {
  const numDistinctFirstTimeSenders = (
    await db
      .selectDistinct({
        email: limboEmails.email,
      })
      .from(limboEmails)
      .where(
        and(
          eq(limboEmails.userId, userId),
          eq(limboEmails.decision, 'undecided'),
        ),
      )
      .innerJoin(
        users,
        and(
          eq(limboEmails.userId, users.id),
          eq(users.isDailyScreenerOn, true),
        ),
      )
  ).length
  const [user] = await db
    .select({
      email: users.email,
      accessToken: users.accessToken,
      accessTokenExpireAt: users.accessTokenExpireAt,
      refreshToken: users.refreshToken,
      refreshTokenExpireAt: users.refreshTokenExpireAt,
      gmailId: users.gmailId,
      timezone: users.timezone,
      dailyScreenerTime: users.dailyScreenerTime,
    })
    .from(users)
    .where(eq(users.id, userId))

  assert(user, 'user not found, screener')
  const {
    email,
    accessToken,
    accessTokenExpireAt,
    refreshToken,
    refreshTokenExpireAt,
    gmailId,
    timezone,
    dailyScreenerTime,
  } = user
  assert(timezone && dailyScreenerTime, 'timezone or dailyScreenerTime is null')
  if (numDistinctFirstTimeSenders === 0) {
    await scheduleNextScreener({
      dailyScreenerTime,
      db,
      timezone,
      userId,
    })
    return
  }
  const screenerHtml = render(
    DailyScreener({
      baseUrl: Config.NEXT_PUBLIC_APP_URL,
      uniquePath: `${userId}/${screenerId}`,
      numDistinctFirstTimeSenders,
    }),
  )
  const subject = screenerSubject(numDistinctFirstTimeSenders)
  const gmail = await authGmailClient({
    accessToken,
    accessTokenExpireAt,
    refreshToken,
    refreshTokenExpireAt,
    gmailId,
    oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
    db,
  })

  const to = email
  const screenerEmail = await getRawMimeMessage({
    to,
    from,
    subject,
    html: screenerHtml,
  })
  await db
    .update(screeners)
    .set({ status: 'enqueued' })
    .where(
      and(
        eq(screeners.id, screenerId),
        eq(screeners.userId, userId),
        eq(screeners.status, 'scheduled'),
      ),
    )
  const res = await gmail.users.messages
    // use import so users' own email classification etc. will still run
    .import({
      userId: 'me',
      neverMarkSpam: true,
      requestBody: {
        labelIds: ['INBOX', 'UNREAD'],
        raw: screenerEmail,
      },
    })
    .catch(async (e) => {
      if (isInvalidCredentialsError(e)) {
        await setRefreshTokenAsExpiredByEmail({ db, email })
        console.log(`Gmail invalid credentials for ${email}`)
        throw new GmailInvalidCredentialsError(email)
      }
      throw new GmailApiUnknownError(
        stringify({
          action: 'sendScreener',
          email,
          error: stringify(e),
        }),
      )
    })
  const parsed = messagesImportSchema.parse(res.data)
  await db.transaction(async (tx) => {
    await tx.insert(emails).values({
      to,
      from,
      subject,
      body: screenerHtml,
      emailType: 'screener',
      provider: 'gmail',
      providerId: parsed.id,
    })
    await tx
      .update(screeners)
      .set({
        status: 'sent',
        provider: 'gmail',
        providerId: parsed.id,
        sentAt: dayjs.utc().toDate(),
      })
      .where(
        and(
          eq(screeners.id, screenerId),
          eq(screeners.userId, userId),
          eq(screeners.status, 'enqueued'),
        ),
      )
    await scheduleNextScreener({
      dailyScreenerTime,
      db: tx,
      timezone,
      userId,
    })
  })
}
