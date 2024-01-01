import { connect } from '@planetscale/database'
import type { SQSEvent } from 'aws-lambda'
import { drizzle } from 'drizzle-orm/planetscale-serverless'
import { google } from 'googleapis'
import { Config } from 'sst/node/config'
import { stringify } from 'superjson'

import {
  moveLimboEmailsToInbox,
  moveTrashedEmailsToInbox,
  notifyDevGmail,
  sendActivationSuccessfulEmail,
  updateScreeningResults,
  whitelistRecentSenders,
} from '~/lib/gmail/gmail.message'
import { setWatchUserId, stopWatch } from '~/lib/gmail/gmail.watch'
import { parseSqsGmailJobMessageBody } from './sqs'

const OAuth2 = google.auth.OAuth2
const GOOGLE_CLIENT_ID = Config.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = Config.GOOGLE_CLIENT_SECRET
const env = Config.APP_ENV

const dbConnection = connect({
  url: Config.DATABASE_URL,
})
const db = drizzle(dbConnection)

export async function handler(event: SQSEvent) {
  try {
    const { Records: records } = event
    // due to queue batchSize: 1, we only have one record at a time
    for (const record of records) {
      const parsed = parseSqsGmailJobMessageBody(record.body)
      const { gmailJobType } = parsed
      switch (gmailJobType) {
        case 'wlRecentlyReadSenders': {
          const { userId, recencyInDays } = parsed
          await whitelistRecentSenders({
            db,
            oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
            userId,
            recencyInDays,
            senderType: 'read',
          })
          return
        }
        case 'wlRecentlySentSenders': {
          const { userId, recencyInDays } = parsed
          await whitelistRecentSenders({
            db,
            oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
            userId,
            recencyInDays,
            senderType: 'sent',
          })
          return
        }
        // only used by resend-consumer at the moment
        // others just send directly without queuing
        case 'sendRuntimeErrorEmail': {
          const { message, subject } = parsed
          await notifyDevGmail({
            db,
            isError: true,
            oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
            subject,
            message: message,
          })
          return
        }
        case 'moveLimboEmailsToInbox': {
          await moveLimboEmailsToInbox({
            db,
            oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
            userId: parsed.userId,
          })
          return
        }
        case 'updateScreeningResults': {
          await updateScreeningResults({
            db,
            oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
            userId: parsed.userId,
          })
          return
        }
        case 'sendNotifyMeEmail': {
          const { message, subject } = parsed
          await notifyDevGmail({
            db,
            oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
            subject,
            isError: false,
            message,
          })
          return
        }
        case 'sendActivationSuccessfulEmail': {
          const { dailyScreenerTime, timezone, userId, baseUrl } = parsed
          await sendActivationSuccessfulEmail({
            db,
            oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
            dailyScreenerTime,
            timezone,
            userId,
            baseUrl,
          })
          return
        }
        case 'setWatch': {
          const { userId } = parsed
          await setWatchUserId({
            db,
            oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
            userId,
            env,
          })
          return
        }
        case 'stopWatch': {
          const { userId } = parsed
          await stopWatch({
            db,
            oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
            userId,
          })
          return
        }
        case 'moveTrashedEmailsToInbox': {
          const { userId, senders } = parsed
          await moveTrashedEmailsToInbox({
            db,
            oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
            userId,
            senders,
          })
          return
        }
        default:
          gmailJobType satisfies never
          throw new Error(`Unknown gmailJobType: ${gmailJobType as string}`)
      }
    }
  } catch (error) {
    await notifyDevGmail({
      db,
      isError: true,
      oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
      subject: 'Unknown error in gmail-consumer',
      message: stringify(error),
    })
  }
}
