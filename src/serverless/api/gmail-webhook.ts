import { connect } from '@planetscale/database'
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
} from 'aws-lambda'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/planetscale-serverless'
import type { PlanetScaleDatabase } from 'drizzle-orm/planetscale-serverless'
import { google } from 'googleapis'
import type { gmail_v1 } from 'googleapis'
import pSettle from 'p-settle'
import { Config } from 'sst/node/config'
import { stringify } from 'superjson'
import { z } from 'zod'

import {
  isInvalidCredentialsError,
  RefreshTokenExpiredError,
} from '~/lib/gmail/errors'
import {
  authGmailClient,
  hasTokenExpired,
  setRefreshTokenAsExpiredByUserId,
} from '~/lib/gmail/gmail.auth'
import { updateUserHistoryId } from '~/lib/gmail/gmail.history'
import {
  extractMessageFormatFull,
  extractMessageRecipients,
  getFullFormatMessage,
  notifyDevGmail,
  tryMoveMessageToLimbo,
  tryTrashMessage,
} from '~/lib/gmail/gmail.message'
import { checkEmailScreenStatus } from '~/lib/screener/screen-status'
import {
  eventBodyMessageSchema,
  getMessageFormatFullSchema,
  messagesAddedHistorySchema,
} from '~/schemas/gmail.schema'
import { assert } from '~/server/database/client'
import {
  limboEmails,
  MAX_TEXT_SIZE_MYSQL,
} from '~/server/database/model/limbo.model'
import { senders } from '~/server/database/model/sender.model'
import { users } from '~/server/database/model/user.model'

const OAuth2 = google.auth.OAuth2

const GOOGLE_CLIENT_ID = Config.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = Config.GOOGLE_CLIENT_SECRET

const dbConnection = connect({
  url: Config.DATABASE_URL,
})
const db = drizzle(dbConnection)

const GOOGLE_PUBSUB_SUBSCRIPTION = Config.GOOGLE_PUBSUB_SUBSCRIPTION

let webhookHistoryId: number | undefined
let currentUserHistoryId: number | undefined
let currentUserId: string | undefined

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  // return {
  //   statusCode: 200,
  //   body: 'OK',
  // }
  try {
    const res = watchWebhookEventBodySchema.parse(event.body)
    const {
      message: {
        data: { emailAddress, historyId },
      },
    } = res
    webhookHistoryId = historyId
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, emailAddress))
    assert(user, 'user not found, gmail-webhook')
    const {
      id: userId,
      historyId: retrievedUserHistoryId,
      email: userEmail,
    } = user
    assert(retrievedUserHistoryId, 'retrievedUserHistoryId is null')
    currentUserId = userId
    currentUserHistoryId = retrievedUserHistoryId
    if (!user.isDailyScreenerOn) {
      console.log(
        `user ${emailAddress} has turned off daily screener, skipping`,
      )
      await updateUserHistoryId({
        db,
        userId: currentUserId,
        currentUserHistoryId,
        webhookHistoryId,
      })
      return {
        statusCode: 200,
        body: 'OK',
      }
    }
    if (
      user.refreshTokenExpireAt &&
      hasTokenExpired(user.refreshTokenExpireAt)
    ) {
      console.log(`user ${emailAddress} refresh token has expired, skipping`)
      await updateUserHistoryId({
        db,
        userId: currentUserId,
        currentUserHistoryId,
        webhookHistoryId,
      })
      return {
        statusCode: 200,
        body: 'OK',
      }
    }
    if (currentUserHistoryId >= webhookHistoryId) {
      console.log('exiting because webhookHistoryId is outdated:', user.email)
      return {
        statusCode: 200,
        body: 'OK',
      }
    }
    const gmail = await authGmailClient({
      db,
      oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
      ...user,
    })
    await processWebhook({
      webhookHistoryId,
      userHistoryId: currentUserHistoryId,
      gmail,
      db,
      userId,
      userEmail,
    })
    console.log('successfully processed webhook', user.email)
    return {
      statusCode: 200,
      body: 'OK',
    }
  } catch (error) {
    if (currentUserHistoryId && webhookHistoryId && currentUserId) {
      // this helps to prevent infinite loop
      // basically, even on error, user's historyId will be updated
      await updateUserHistoryId({
        db,
        userId: currentUserId,
        webhookHistoryId,
        currentUserHistoryId,
      })
    }
    if (
      error instanceof RefreshTokenExpiredError ||
      isInvalidCredentialsError(error)
    ) {
      if (currentUserId) {
        await setRefreshTokenAsExpiredByUserId({ db, userId: currentUserId })
      }
      return {
        statusCode: 200,
        body: 'OK',
      }
    }
    // only notify if it's not an expected error
    await notifyDevGmail({
      db,
      oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
      subject: 'Gmail Webhook Error: catch',
      isError: true,
      message: stringify({
        webhookHistoryId,
        currentUserHistoryId,
        currentUserId,
        error,
        body: event.body,
      }),
    })
    // always return 200 so webhook will not be retried
    // we can handle unexpected errors by receiving the emails
    console.log(
      'ERROR',
      stringify({
        currentUserId,
        error,
      }),
    )
    return {
      statusCode: 200,
      body: 'OK',
    }
  }
}

// this is located here so we can compare with GOOGLE_PUBSUB_SUBSCRIPTION
const watchWebhookEventBodySchema = z.string().transform((data) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-restricted-syntax
  const parsed = JSON.parse(data)
  return z
    .object({
      message: eventBodyMessageSchema,
      // need to verify that subscription is correct to ensure I'm not processing
      // webhooks sent by others
      subscription: z.string().refine(
        (subscription) => {
          return subscription === GOOGLE_PUBSUB_SUBSCRIPTION
        },
        {
          message: 'subscription is not correct',
        },
      ),
    })
    .parse(parsed)
})

export async function processWebhook({
  webhookHistoryId,
  userHistoryId,
  gmail,
  db,
  userId,
  userEmail,
}: {
  gmail: gmail_v1.Gmail
  db: PlanetScaleDatabase
  webhookHistoryId: number
  userHistoryId: number
  userId: string
  userEmail: string
}) {
  type MessageAdded = ReturnType<
    typeof messagesAddedHistorySchema.parse
  >['messagesAdded'][number]

  async function processMessageAdded(m: MessageAdded) {
    const {
      message: { id, threadId },
    } = m
    const message = await getFullFormatMessage({
      messageId: id,
      threadId,
      gmail,
      userEmail,
    })
    const parsedMessage = getMessageFormatFullSchema.parse(message)
    const {
      fromEmail,
      fromName,
      historyId,
      subject,
      body,
      emailDate,
      snippet,
      labelIds,
    } = extractMessageFormatFull(parsedMessage)
    if (historyId <= userHistoryId) {
      console.log(
        `user's historyId ${userHistoryId} is more recent than the message's ${historyId}, skipping`,
      )
      return
    }
    // if it is not an UNREAD or a SENT message, return early and update user's historyId
    const isUnread = !!labelIds?.includes('UNREAD')
    const isSentByUser = !!labelIds?.includes('SENT')
    if (!isUnread && !isSentByUser) {
      console.log('message is not UNREAD or SENT, skipping')
      await updateUserHistoryId({
        db,
        userId,
        webhookHistoryId,
        currentUserHistoryId: userHistoryId,
      })
      return
    }
    if (isSentByUser) {
      const { toEmails, toNames, ccEmails, ccNames, bccEmails, bccNames } =
        extractMessageRecipients(parsedMessage)
      const recipientEmails = [...toEmails, ...ccEmails, ...bccEmails]
      const recipientNames = [...toNames, ...ccNames, ...bccNames]
      await db
        .insert(senders)
        .values(
          recipientEmails.map(
            (email, index) =>
              ({
                userId,
                email,
                fromName: recipientNames[index] ?? null,
                screenStatus: 'in',
              }) as const,
          ),
        )
        .onDuplicateKeyUpdate({
          set: {
            screenStatus: 'in',
            fromName: sql`VALUES(${senders.fromName})`,
          },
        })
      await updateUserHistoryId({
        db,
        userId,
        webhookHistoryId,
        currentUserHistoryId: userHistoryId,
      })
      return
    }
    // email is received by user; determine whether to move out of inbox
    const screenStatus = await checkEmailScreenStatus({
      userId,
      senderEmail: fromEmail,
      db,
      subject,
      snippet,
      body,
    })
    switch (screenStatus) {
      case 'in': {
        // do nothing, since email is already in inbox
        // for future extension: keep a counter of how many emails we screen in for users?
        break
      }
      case 'out': {
        // for future extension: keep a counter of how many emails we screen out for users?
        const res = await tryTrashMessage({
          gmail,
          userId,
          messageId: id,
        })
        if (!res) {
          console.log('try to trash, message not found, skipping')
        }
        break
      }
      case 'to_screen': {
        const res = await tryMoveMessageToLimbo({
          gmail,
          userId,
          messageId: id,
        })
        if (!res) {
          console.log('try to screen, message not found, skipping')
          break
        }
        await db.insert(limboEmails).values({
          userId,
          messageId: id,
          threadId,
          subject,
          email: fromEmail,
          fromName,
          body: body && body.length < MAX_TEXT_SIZE_MYSQL ? body : undefined,
          snippet,
          emailDate,
        })
        break
      }
      default: {
        screenStatus satisfies never
        throw new Error('unsupported screenStatus')
      }
    }
    await updateUserHistoryId({
      db,
      userId,
      webhookHistoryId,
      currentUserHistoryId: userHistoryId,
    })
  }

  const startHistoryId = userHistoryId.toString()
  let pageToken: string | undefined
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
  while (true) {
    const {
      data: { history: histories, nextPageToken },
    } = await gmail.users.history.list({
      userId: 'me',
      startHistoryId,
      // messageAdded will include both UNREAD and SENT messages, per watch
      historyTypes: ['messageAdded'],
      pageToken,
    })
    if (!histories) {
      // watch call cannot filter for messageAdded, so it's possible that the historyId is updated but no new unread messages are added
      // as such, event will be triggered, but we will return early and update the user's historyId
      console.log(
        'no need to process this webhook; no new unread message added',
      )
      await updateUserHistoryId({
        db,
        userId,
        webhookHistoryId,
        currentUserHistoryId: userHistoryId,
      })
      return
    }

    for (const h of histories) {
      const { messagesAdded } = messagesAddedHistorySchema.parse(h)
      const results = await pSettle(
        messagesAdded.map((m) => processMessageAdded(m)),
        {
          concurrency: 3,
        },
      )
      const failures = results.filter((r) => r.isRejected)
      if (failures.length !== 0) {
        console.log('failure in processWebhook', stringify(failures))
        if (
          currentUserHistoryId &&
          webhookHistoryId &&
          currentUserId &&
          currentUserHistoryId < webhookHistoryId
        ) {
          // this helps to prevent infinite loop
          // basically, even on error, user's historyId will be updated
          await updateUserHistoryId({
            db,
            userId,
            webhookHistoryId,
            currentUserHistoryId: userHistoryId,
          })
        }
        await notifyDevGmail({
          db,
          isError: true,
          oauth2Client: new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
          subject: 'Gmail Webhook Error: processWebhook',
          message: stringify({
            userId,
            webhookHistoryId,
            currentUserHistoryId,
            failures,
          }),
        })
      }
    }
    if (!nextPageToken) {
      break
    } else {
      pageToken = nextPageToken
    }
  }
}
