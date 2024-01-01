import { connect } from '@planetscale/database'
import { render } from '@react-email/render'
import { drizzle } from 'drizzle-orm/planetscale-serverless'
import { google } from 'googleapis'
import pSettle from 'p-settle'
import { Config } from 'sst/node/config'
import { stringify } from 'superjson'

import { enqueueAuthExpiredEmail } from '~/lib/email/email.service'
import AuthExpiringSoon from '~/lib/email/templates/AuthExpiringSoon'
import {
  GmailApiUnknownError,
  GmailInvalidCredentialsError,
  isInvalidCredentialsError,
  RefreshTokenExpiredError,
} from '~/lib/gmail/errors'
import {
  authGmailClient,
  getUsersWithExpiredRefreshTokens,
  getUsersWithExpiringRefreshTokens,
  setRefreshTokenAsExpiredByEmail,
} from '~/lib/gmail/gmail.auth'
import { getRawMimeMessage, notifyDevGmail } from '~/lib/gmail/gmail.message'
import { messagesImportSchema } from '~/schemas/gmail.schema'
import { googlePublishingStatus } from '~/schemas/google-publishing-status.schema.mjs'
import { emails } from '~/server/database/model/email.model'

const OAuth2 = google.auth.OAuth2
const GOOGLE_CLIENT_ID = Config.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = Config.GOOGLE_CLIENT_SECRET

const dbConnection = connect({
  url: Config.DATABASE_URL,
})
const db = drizzle(dbConnection)

const from = 'Inbox Hero <updates@inboxhero.org>'

const authExpiringOneDayHtml = render(
  AuthExpiringSoon({
    baseUrl: Config.NEXT_PUBLIC_APP_URL,
    daysToExpiry: 1,
  }),
)

const authExpiringTwoDaysHtml = render(
  AuthExpiringSoon({
    baseUrl: Config.NEXT_PUBLIC_APP_URL,
    daysToExpiry: 2,
  }),
)

export async function handler() {
  const NEXT_PUBLIC_GOOGLE_PUBLISHING_STATUS = googlePublishingStatus.parse(
    Config.NEXT_PUBLIC_GOOGLE_PUBLISHING_STATUS,
  )
  switch (NEXT_PUBLIC_GOOGLE_PUBLISHING_STATUS) {
    // in testing, we need to send two types of emails:
    // 1. for users whose refresh token expires in <2 days, send a reminder
    // 2. for users whose refresh token that have alr expired, send a reminder
    case 'testing': {
      // sending email type 1
      const [usersOneDay, usersTwoDays] = await Promise.all([
        getUsersWithExpiringRefreshTokens(db, 1),
        getUsersWithExpiringRefreshTokens(db, 2),
      ])
      const results = await pSettle(
        [...usersOneDay, ...usersTwoDays].map((m) =>
          sendAuthExpiringSoonMessage(m),
        ),
        {
          concurrency: 10,
        },
      )
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
          subject: 'Uncaught Gmail API error: auth-reminder.ts',
          message: stringify({
            unexpectedFailures,
          }),
        })
      }
      // sending type 2 email
      const usersWithExpiredRefreshTokens =
        await getUsersWithExpiredRefreshTokens(db)
      await pSettle(
        usersWithExpiredRefreshTokens.map((u) =>
          enqueueAuthExpiredEmail(u.email),
        ),
        {
          concurrency: 10,
        },
      )
      const failures = results.filter((r) => r.isRejected)
      console.log(
        `Sent auth expiring soon emails (successful): ${
          results.length - failures.length
        }`,
      )
      console.log(`Sent auth expiring soon emails (failed): ${failures.length}`)
      console.log(`Unexpected failures: ${unexpectedFailures.length}`)
      console.log(
        `Enqueued auth expired emails: ${usersWithExpiredRefreshTokens.length} `,
      )
      return
    }
    // in production, we only need to send type 2, since tokens should not expire automatically
    case 'production': {
      let numAuthExpiredEnqueued = 0
      const usersWithExpiredRefreshTokens =
        await getUsersWithExpiredRefreshTokens(db)
      await Promise.all(
        usersWithExpiredRefreshTokens.map(async (u) => {
          await enqueueAuthExpiredEmail(u.email)
          numAuthExpiredEnqueued++
        }),
      )
      console.log(`Enqueued ${numAuthExpiredEnqueued} auth expired emails`)
      return
    }
    default:
      NEXT_PUBLIC_GOOGLE_PUBLISHING_STATUS satisfies never
      throw new Error('invalid GOOGLE_PUBLISHING_STATUS')
  }
}

async function sendAuthExpiringSoonMessage(user: {
  email: string
  daysLeft: 1 | 2
  accessToken: string | null
  accessTokenExpireAt: Date | null
  gmailId: string | null
  refreshToken: string | null
  refreshTokenExpireAt: Date | null
}) {
  const {
    email,
    daysLeft,
    accessToken,
    accessTokenExpireAt,
    gmailId,
    refreshToken,
    refreshTokenExpireAt,
  } = user
  const subject = '[Attention] Your Inbox Hero authorization is expiring soon'
  const to = email
  const authExpiringSoonMessage = await getRawMimeMessage({
    to,
    from,
    subject,
    html: daysLeft === 1 ? authExpiringOneDayHtml : authExpiringTwoDaysHtml,
  })
  // send email using Gmail API (since it's still valid)
  // for future extension: perhaps use a queue to manage all Gmail API calls?
  const gmail = await authGmailClient({
    accessToken,
    accessTokenExpireAt,
    refreshToken,
    refreshTokenExpireAt,
    gmailId,
    oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
    db,
  })
  const res = await gmail.users.messages
    // use import so users' own email classification etc. will still run
    .import({
      userId: 'me',
      neverMarkSpam: true,
      requestBody: {
        labelIds: ['INBOX', 'UNREAD'],
        raw: authExpiringSoonMessage,
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
          action: 'sendAuthExpiringSoonMessage',
          email,
          error: stringify(e),
        }),
      )
    })
  const parsed = messagesImportSchema.parse(res.data)
  await db.insert(emails).values({
    to,
    from,
    subject,
    body: daysLeft === 1 ? authExpiringOneDayHtml : authExpiringTwoDaysHtml,
    emailType: 'auth_expiring_soon',
    provider: 'gmail',
    providerId: parsed.id,
  })
}
