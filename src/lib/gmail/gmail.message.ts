import { render } from '@react-email/render'
import { and, eq, ne, sql } from 'drizzle-orm'
import type { PlanetScaleDatabase } from 'drizzle-orm/planetscale-serverless'
import type { OAuth2Client } from 'google-auth-library'
import type { gmail_v1 } from 'googleapis'
import pSettle from 'p-settle'
import { stringify } from 'superjson'

import {
  GmailApiUnknownError,
  GmailInvalidCredentialsError,
  isInvalidCredentialsError,
  isRequestedEntityNotFoundError,
  RequestedEntityNotFoundError,
} from '~/lib/gmail/errors'
import { setRefreshTokenAsExpiredByEmail } from '~/lib/gmail/gmail.auth'
import {
  historyIdSchema,
  messagesGetSchema,
  messagesImportSchema,
  mimeTypeMultipartPayload,
  mimeTypeTextPayload,
  threadsGetMessagesSchema,
  type Header,
  type MessageFormatFull,
} from '~/schemas/gmail.schema'
import { assert } from '~/server/database/client'
import { emails } from '~/server/database/model/email.model'
import {
  limboEmails,
  MAX_TEXT_SIZE_MYSQL,
} from '~/server/database/model/limbo.model'
import { senders } from '~/server/database/model/sender.model'
import { users } from '~/server/database/model/user.model'
import SuccessfulActivation from '../email/templates/SuccessfulActivation'
import { dayjs } from '../time/dayjs'
import {
  formatDailyScreenerTime,
  formatScheduledAt,
  formatTimezoneShort,
  getNextScreenerTimings,
} from '../time/screener.utils'
import { partition } from '../utils'
import { authGmailClient } from './gmail.auth'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const MailComposer = require('nodemailer/lib/mail-composer')

const encodeMessage = (message: string) => {
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export const getRawMimeMessage = async (
  {
    to,
    from,
    subject,
    text,
    html,
    replyTo,
    cc,
    bcc,
  }: {
    to: string
    from: string
    subject: string
    text?: string
    html?: string
    replyTo?: string
    cc?: string[]
    bcc?: string[]
  },
  // other supported args: text, attachments, textEncoding
  // can extend in the future
) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const mailComposer = new MailComposer({
    to,
    from,
    subject,
    replyTo,
    cc,
    bcc,
    html,
    text,
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const message: string = await mailComposer.compile().build()
  return encodeMessage(message)
}

export async function notifyDevGmail({
  db,
  oauth2Client,
  subject,
  message,
  isError,
}: {
  db: PlanetScaleDatabase
  oauth2Client: OAuth2Client
  subject: string
  message: string
  isError: boolean
}) {
  const [user] = await db
    .select({
      email: users.email,
      gmailId: users.gmailId,
      refreshToken: users.refreshToken,
      refreshTokenExpireAt: users.refreshTokenExpireAt,
      accessToken: users.accessToken,
      accessTokenExpireAt: users.accessTokenExpireAt,
    })
    .from(users)
    .where(eq(users.email, 'inboxheroapp@gmail.com'))
  assert(user, 'User not found for email')

  const gmail = await authGmailClient({
    accessToken: user.accessToken,
    accessTokenExpireAt: user.accessTokenExpireAt,
    refreshToken: user.refreshToken,
    refreshTokenExpireAt: user.refreshTokenExpireAt,
    gmailId: user.gmailId,
    oauth2Client,
    db,
  })
  const to = 'inboxheroapp@gmail.com'
  const from = `Runtime ${isError ? 'Error' : 'Alert'} <inboxheroapp@gmail.com>`
  const messageTrunc = message.slice(0, MAX_TEXT_SIZE_MYSQL)
  const raw = await getRawMimeMessage({
    to,
    from,
    subject,
    text: messageTrunc,
  })

  await Promise.all([
    // use insert because this is a notification and should always be important
    gmail.users.messages.insert({
      userId: 'me',
      requestBody: {
        labelIds: ['INBOX', 'UNREAD', 'IMPORTANT'],
        raw,
      },
    }),
    // insert concurrently; alternatively, could insert sequentially
    // which would include id
    db.insert(emails).values({
      to,
      from,
      subject,
      body: messageTrunc,
      emailType: isError ? 'runtime_error' : 'notify_me',
      provider: 'gmail',
    }),
  ])
}

export async function sendActivationSuccessfulEmail({
  db,
  oauth2Client,
  dailyScreenerTime,
  timezone,
  userId,
  baseUrl,
}: {
  db: PlanetScaleDatabase
  oauth2Client: OAuth2Client
  userId: string
  dailyScreenerTime: string
  timezone: string
  baseUrl: string
}) {
  const [user] = await db
    .select({
      email: users.email,
      gmailId: users.gmailId,
      refreshToken: users.refreshToken,
      refreshTokenExpireAt: users.refreshTokenExpireAt,
      accessToken: users.accessToken,
      accessTokenExpireAt: users.accessTokenExpireAt,
    })
    .from(users)
    .where(eq(users.id, userId))
  assert(user, 'User not found for email')

  const gmail = await authGmailClient({
    ...user,
    oauth2Client,
    db,
  })
  const { scheduledAt } = getNextScreenerTimings(dailyScreenerTime, timezone)
  const nextScreenerScheduledAt = formatScheduledAt(
    scheduledAt.toDate(),
    dailyScreenerTime,
    timezone,
  )
  const dailyScreenerTimeFormatted = formatDailyScreenerTime(dailyScreenerTime)
  const timezoneFormatted = formatTimezoneShort(timezone)
  const successfulActivationHtml = render(
    SuccessfulActivation({
      baseUrl,
      dailyScreenerTimeFormatted,
      nextScreenerScheduledAt,
      timezoneFormatted,
      userEmail: user.email,
    }),
  )
  const to = user.email
  const from = 'Inbox Hero <updates@inboxhero.org>'
  const subject = 'Inbox Hero activated'
  const raw = await getRawMimeMessage({
    to,
    from,
    subject,
    html: successfulActivationHtml,
  })

  const res = await gmail.users.messages
    .import({
      userId: 'me',
      neverMarkSpam: true,
      requestBody: {
        labelIds: ['INBOX', 'UNREAD'],
        raw,
      },
    })
    .catch(async (e) => {
      const { email } = user
      if (isInvalidCredentialsError(e)) {
        await setRefreshTokenAsExpiredByEmail({ db, email })
        console.log(`Gmail invalid credentials for ${email}`)
        throw new GmailInvalidCredentialsError(email)
      }
      throw new GmailApiUnknownError(
        stringify({
          action: 'sendActivationSuccessfulEmail',
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
    body: successfulActivationHtml,
    emailType: 'successful_activation',
    provider: 'gmail',
    providerId: parsed.id,
  })
}

export async function moveTrashedEmailsToInbox({
  db,
  oauth2Client,
  userId,
  senders,
}: {
  db: PlanetScaleDatabase
  oauth2Client: OAuth2Client
  userId: string
  senders: string[]
}) {
  const [user] = await db
    .select({
      email: users.email,
      gmailId: users.gmailId,
      refreshToken: users.refreshToken,
      refreshTokenExpireAt: users.refreshTokenExpireAt,
      accessToken: users.accessToken,
      accessTokenExpireAt: users.accessTokenExpireAt,
    })
    .from(users)
    .where(eq(users.id, userId))
  assert(user, 'User not found for email')

  const gmail = await authGmailClient({
    ...user,
    oauth2Client,
    db,
  })
  const { email } = user
  const messageIdSet = new Set<string>()
  for (const sender of senders) {
    let pageToken: string | undefined
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
    while (true) {
      const {
        data: { messages, nextPageToken },
      } = await gmail.users.messages
        .list({
          userId: 'me',
          maxResults: 500,
          q: `from:${sender} (in:trash OR in:spam)`,
          pageToken,
        })
        .catch(async (e) => {
          if (isInvalidCredentialsError(e)) {
            await setRefreshTokenAsExpiredByEmail({ db, email })
            throw new GmailInvalidCredentialsError(email)
          }
          throw new GmailApiUnknownError(
            stringify({
              action: 'moveTrashedEmailsToInbox',
              email,
              error: stringify(e),
            }),
          )
        })
      messages
        ?.map((m) => m.id)
        .filter((m): m is string => m !== null && m !== undefined)
        .map((m) => messageIdSet.add(m))
      if (!nextPageToken) {
        break
      } else {
        pageToken = nextPageToken
      }
    }
  }
  if (messageIdSet.size === 0) {
    return
  }
  await tryBatchMoveMessagesToInbox({
    userId,
    gmail,
    messageIds: Array.from(messageIdSet),
    removeFromTrashAndSpam: true,
  })
}

export async function whitelistRecentSenders({
  db,
  oauth2Client,
  userId,
  recencyInDays,
  senderType,
}: {
  db: PlanetScaleDatabase
  oauth2Client: OAuth2Client
  userId: string
  recencyInDays: number
  // senders whose emails user has read vs senders whom user has sent emails to
  senderType: 'read' | 'sent'
}) {
  const [user] = await db
    .select({
      refreshToken: users.refreshToken,
      refreshTokenExpireAt: users.refreshTokenExpireAt,
      accessToken: users.accessToken,
      accessTokenExpireAt: users.accessTokenExpireAt,
      gmailId: users.gmailId,
      email: users.email,
      historyId: users.historyId,
    })
    .from(users)
    .where(eq(users.id, userId))
  assert(user, `User not found for id: ${userId}`)
  const {
    accessToken,
    accessTokenExpireAt,
    gmailId,
    refreshToken,
    refreshTokenExpireAt,
    email,
    historyId,
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
  const messageIdSet = new Set<string>()
  let pageToken: string | undefined
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
  while (true) {
    const {
      data: { messages, nextPageToken },
    } = await gmail.users.messages
      .list({
        userId: 'me',
        maxResults: 500,
        includeSpamTrash: false,
        q: `is:${senderType} newer_than:${recencyInDays.toString()}d`,
        pageToken,
      })
      .catch(async (e) => {
        if (isInvalidCredentialsError(e)) {
          await setRefreshTokenAsExpiredByEmail({ db, email })
          throw new GmailInvalidCredentialsError(email)
        }
        throw new GmailApiUnknownError(
          stringify({
            action: 'wlRecentlyReadSenders',
            email,
            error: stringify(e),
          }),
        )
      })
    messages
      ?.map((m) => m.id)
      .filter((m): m is string => m !== null && m !== undefined)
      .map((m) => messageIdSet.add(m))
    if (!nextPageToken) {
      break
    } else {
      pageToken = nextPageToken
    }
  }
  type FromName = string | null
  const senderMap = new Map<string, FromName>()
  let largestHistoryId = 0
  async function processMessageId(id: string) {
    const {
      data: { payload, historyId },
    } = await gmail.users.messages.get({
      userId: 'me',
      id,
    })
    const historyIdNum = historyIdSchema.parse(historyId)
    if (historyIdNum > largestHistoryId) {
      largestHistoryId = historyIdNum
    }
    const { headers } = messagesGetSchema.parse(payload)
    const { fromEmail, fromName } = processFromHeader(headers)
    senderMap.set(fromEmail, fromName)
  }
  const results = await pSettle(
    Array.from(messageIdSet).map((id) => processMessageId(id)),
    {
      concurrency: 2,
    },
  )
  const updateHistoryId = !historyId || largestHistoryId > historyId
  if (updateHistoryId) {
    await db
      .update(users)
      .set({ historyId: largestHistoryId })
      .where(eq(users.id, userId))
  }
  const failures = results.filter((r) => r.isRejected)
  if (failures.length !== 0) {
    // sending here because error not thrown
    await notifyDevGmail({
      db,
      oauth2Client,
      subject: 'Failure while processing recent senders message id',
      isError: true,
      message: stringify({
        userId,
        email,
        gmailId,
        failures,
      }),
    })
  }
  console.log(
    `Successfully fetched senders: ${results.length - failures.length}`,
  )
  console.log('Failures:', failures.length)
  if (senderMap.size > 0) {
    const senderList = Array.from(senderMap.keys())
    await db
      .insert(senders)
      .values(
        senderList.map(
          (email) =>
            ({
              userId,
              email,
              fromName: senderMap.get(email),
              screenStatus: 'in',
            }) as const,
        ),
      )
      .onDuplicateKeyUpdate({
        set: {
          // don't override existing screenStatus
          fromName: sql`VALUES(${senders.fromName})`,
        },
      })
  }
}

function extractEmailAndName(singleFromOrTo: string) {
  const regex = /<(.*)>/
  const matches = singleFromOrTo.match(regex)
  const email = matches
    ? (matches[1] as string).toLowerCase()
    : singleFromOrTo.toLowerCase()
  const name = matches
    ? // truncate at 255 characters because that's the max length of the column
      singleFromOrTo
        .substring(0, matches.index)
        .trim()
        .slice(0, 255)
        // remove surrounding "" if it exists
        .replace(/^"|"$/g, '')
    : null
  return { email, name }
}

function processFromHeader(headers: Header[]) {
  const fromHeader = headers.find((h) => h.name.toLowerCase() === 'from')
  if (!fromHeader) {
    throw new Error('From header not found')
  }
  const from = fromHeader.value
  const { email: fromEmail, name: fromName } = extractEmailAndName(from)
  return {
    fromEmail,
    fromName,
  }
}

function processCcHeader(headers: Header[]) {
  const ccHeader = headers.find((h) => h.name.toLowerCase() === 'cc')
  if (!ccHeader) {
    return {
      ccEmails: [],
      ccNames: [],
    }
  }
  const cc = ccHeader.value
  // NB cc can be either a string or an array of strings
  // check if cc contains comma, if so, split by comma
  if (cc.includes(',')) {
    const ccArray = cc.split(',')
    const [ccEmails, ccNames] = ccArray.reduce(
      (acc, c) => {
        const { email, name } = extractEmailAndName(c)
        acc[0].push(email)
        acc[1].push(name)
        return acc
      },
      [[] as string[], [] as Array<string | null>],
    )
    return {
      ccEmails,
      ccNames,
    }
  }
  const { email: ccEmail, name: ccName } = extractEmailAndName(cc)
  return {
    ccEmails: [ccEmail],
    ccNames: [ccName],
  }
}

function processBccHeader(headers: Header[]) {
  const bccHeader = headers.find((h) => h.name.toLowerCase() === 'bcc')
  if (!bccHeader) {
    return {
      bccEmails: [],
      bccNames: [],
    }
  }
  const bcc = bccHeader.value
  // NB bcc can be either a string or an array of strings
  // check if bcc contains comma, if so, split by comma
  if (bcc.includes(',')) {
    const bccArray = bcc.split(',')
    const [bccEmails, bccNames] = bccArray.reduce(
      (acc, b) => {
        const { email, name } = extractEmailAndName(b)
        acc[0].push(email)
        acc[1].push(name)
        return acc
      },
      [[] as string[], [] as Array<string | null>],
    )
    return {
      bccEmails,
      bccNames,
    }
  }
  const { email: bccEmail, name: bccName } = extractEmailAndName(bcc)
  return {
    bccEmails: [bccEmail],
    bccNames: [bccName],
  }
}

function processToHeader(headers: Header[]) {
  const toHeader = headers.find((h) => h.name.toLowerCase() === 'to')
  if (!toHeader) {
    return {
      toEmails: [],
      toNames: [],
    }
  }
  const to = toHeader.value
  // NB to can be either a string or an array of strings
  // check if to contains comma, if so, split by comma
  if (to.includes(',')) {
    const toArray = to.split(',')
    const [toEmails, toNames] = toArray.reduce(
      (acc, t) => {
        const { email, name } = extractEmailAndName(t)
        acc[0].push(email)
        acc[1].push(name)
        return acc
      },
      [[] as string[], [] as Array<string | null>],
    )
    return {
      toEmails,
      toNames,
    }
  }
  const { email: toEmail, name: toName } = extractEmailAndName(to)
  return {
    toEmails: [toEmail],
    toNames: [toName],
  }
}

function processSubjectHeader(headers: Header[]) {
  const subjectHeader = headers.find((h) => h.name.toLowerCase() === 'subject')
  if (!subjectHeader) {
    throw new Error('Subject header not found')
  }
  const subject = subjectHeader.value
  return {
    subject,
  }
}

export function extractMessageRecipients(message: MessageFormatFull) {
  const {
    data: {
      payload: { headers },
    },
  } = message
  const { toNames, toEmails } = processToHeader(headers)
  const { ccNames, ccEmails } = processCcHeader(headers)
  const { bccNames, bccEmails } = processBccHeader(headers)
  return {
    toNames,
    toEmails,
    ccEmails,
    ccNames,
    bccEmails,
    bccNames,
  }
}

export function extractMessageFormatFull(message: MessageFormatFull) {
  const {
    data: {
      internalDate,
      historyId,
      payload: { headers },
      snippet,
      labelIds,
    },
  } = message
  const { fromEmail, fromName } = processFromHeader(headers)
  const { subject } = processSubjectHeader(headers)
  const { body } = extractEmailBody(message.data.payload)
  const emailDate = dayjs(internalDate).utc().toDate()
  return {
    labelIds,
    historyId,
    snippet,
    body,
    fromEmail,
    fromName,
    emailDate,
    subject,
  }
}

function extractEmailBody(payload: MessageFormatFull['data']['payload']) {
  const { mimeType } = payload
  if (mimeType.startsWith('multipart/')) {
    let numLayers = 0
    let textHtml: string | undefined
    let textPlain: string | undefined
    let { parts } = mimeTypeMultipartPayload.parse(payload)
    do {
      numLayers++
      const textHtmlPart =
        parts && parts.find((p) => p.mimeType === 'text/html')
      textHtml =
        textHtmlPart?.body.data && textHtmlPart.body.size < MAX_TEXT_SIZE_MYSQL
          ? Buffer.from(textHtmlPart.body.data, 'base64').toString()
          : undefined
      const textPlainPart =
        parts && parts.find((p) => p.mimeType === 'text/plain')
      textPlain =
        textPlainPart?.body.data &&
        textPlainPart.body.size < MAX_TEXT_SIZE_MYSQL
          ? Buffer.from(textPlainPart.body.data, 'base64').toString()
          : undefined
      if (textHtml || textPlain) {
        return {
          body: textHtml || textPlain,
        }
      }
      parts =
        (parts &&
          parts.find((p) => p.mimeType.startsWith('multipart/'))?.parts) ||
        []
    } while (numLayers < 5)
    return {
      body: undefined,
    }
  }
  if (mimeType.startsWith('text/')) {
    const res = mimeTypeTextPayload.safeParse(payload)
    if (!res.success) {
      console.log('error parsing text payload', res.error)
      return {
        body: undefined,
      }
    }
    const {
      body: { data, size },
    } = res.data
    // could be text/plain or text/html
    if (size > MAX_TEXT_SIZE_MYSQL) {
      return {
        body: undefined,
      }
    }
    const text = Buffer.from(data, 'base64').toString()
    return {
      body: text,
    }
  }
  // could be image, audio, video, application, or other?
  console.log('unknown mime type', mimeType)
  console.log('payload is', stringify(payload))
  return {
    body: undefined,
  }
}

export async function moveLimboEmailsToInbox({
  db,
  oauth2Client,
  userId,
}: {
  db: PlanetScaleDatabase
  oauth2Client: OAuth2Client
  userId: string
}) {
  const userLimboEmails = await db
    .select({
      messageId: limboEmails.messageId,
    })
    .from(limboEmails)
    .where(
      and(
        eq(limboEmails.userId, userId),
        // in the unlikely event that this is triggered after the user has screened but before the job has been run
        eq(limboEmails.decision, 'undecided'),
      ),
    )
  const messageIds = userLimboEmails.map((e) => e.messageId)
  if (messageIds.length === 0) {
    return
  }
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  assert(user, `user not found for userId ${userId}`)
  const {
    accessToken,
    accessTokenExpireAt,
    refreshToken,
    refreshTokenExpireAt,
    gmailId,
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
  await tryBatchMoveMessagesToInbox({ userId, gmail, messageIds })
  await db
    .delete(limboEmails)
    .where(sql`message_id IN ${messageIds} AND user_id = ${userId}`)
}

// this is necessary because sometimes messageId is mutable
// so to use threadId to locate the message instead
export async function getFullFormatMessage({
  messageId,
  threadId,
  gmail,
  userEmail,
}: {
  messageId: string
  threadId: string
  gmail: gmail_v1.Gmail
  userEmail: string
}) {
  try {
    return await gmail.users.messages
      .get({
        userId: 'me',
        id: messageId,
        format: 'full',
      })
      .catch(async (error) => {
        if (isRequestedEntityNotFoundError(error)) {
          const thread = await gmail.users.threads.get({
            userId: 'me',
            id: threadId,
            format: 'full',
          })
          const { messages } = thread.data
          const res = threadsGetMessagesSchema.safeParse(messages)
          if (!res.success) {
            throw new RequestedEntityNotFoundError(
              `Unable to parse messages from thread: ${stringify(thread)}`,
            )
          }
          const { data: parsedMessages } = res
          assert(parsedMessages[0], 'parsedMessages[0] is undefined')
          return { data: parsedMessages[0] }
        }
        throw new GmailApiUnknownError(
          stringify({
            action: 'getFullFormatMessage',
            userEmail,
            messageId,
            threadId,
            error: stringify(error),
          }),
        )
      })
  } catch (error) {
    throw new GmailApiUnknownError(
      stringify({
        action: 'getFullFormatMessage',
        userEmail,
        messageId,
        threadId,
        error: stringify(error),
      }),
    )
  }
}

export async function tryMoveMessageToLimbo({
  gmail,
  userId,
  messageId,
}: {
  gmail: gmail_v1.Gmail
  userId: string
  messageId: string
}) {
  return await gmail.users.messages
    .modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['INBOX'],
      },
    })
    .catch((error) => {
      if (isRequestedEntityNotFoundError(error)) {
        return null
      }
      throw new GmailApiUnknownError(
        stringify({
          action: 'tryMoveMessageToLimbo',
          userId,
          messageId,
          error: stringify(error),
        }),
      )
    })
}

export async function tryTrashMessage({
  gmail,
  userId,
  messageId,
}: {
  gmail: gmail_v1.Gmail
  userId: string
  messageId: string
}) {
  return await gmail.users.messages
    .trash({
      userId: 'me',
      id: messageId,
    })
    .catch((error) => {
      if (isRequestedEntityNotFoundError(error)) {
        console.log('some messages not found')
        console.log(stringify(error))
        return null
      }
      throw new GmailApiUnknownError(
        stringify({
          action: 'tryTrashMessage',
          userId,
          messageId,
          error: stringify(error),
        }),
      )
    })
}

export async function updateScreeningResults({
  db,
  oauth2Client,
  userId,
}: {
  db: PlanetScaleDatabase
  oauth2Client: OAuth2Client
  userId: string
}) {
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  assert(user, `user not found for userId ${userId}`)
  const {
    accessToken,
    accessTokenExpireAt,
    refreshToken,
    refreshTokenExpireAt,
    gmailId,
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
  const userLimboEmails = await db
    .select({
      messageId: limboEmails.messageId,
      threadId: limboEmails.threadId,
      decision: limboEmails.decision,
      email: limboEmails.email,
      fromName: limboEmails.fromName,
    })
    .from(limboEmails)
    .where(
      and(
        eq(limboEmails.userId, userId),
        ne(limboEmails.decision, 'undecided'),
      ),
    )
  const [inEmails, outEmails] = partition(userLimboEmails, (e) => {
    // this only works because decision is binary after excluding undecided
    return e.decision === 'in'
  })
  // call Gmail API to move inEmails into inbox
  if (inEmails.length > 0) {
    try {
      await tryBatchMoveMessagesToInbox({
        gmail,
        messageIds: inEmails.map((e) => e.messageId),
        userId,
      })
      await db.transaction(async (tx) => {
        await tx
          .delete(limboEmails)
          .where(
            and(
              eq(limboEmails.userId, userId),
              sql`message_id IN ${inEmails.map((e) => e.messageId)}`,
            ),
          )
        await tx
          .insert(senders)
          .values(
            inEmails.map(
              (e) =>
                ({
                  userId,
                  email: e.email,
                  fromName: e.fromName,
                  screenStatus: 'in',
                }) as const,
            ),
          )
          .onDuplicateKeyUpdate({
            set: {
              // override existing screenStatus
              screenStatus: 'in',
              fromName: sql`VALUES(${senders.fromName})`,
            },
          })
      })
    } catch (error) {
      await notifyDevGmail({
        db,
        oauth2Client,
        isError: true,
        subject: 'Error while moving messages to inbox',
        message: stringify({
          userId,
          error: stringify(error),
        }),
      })
    }
  }
  // call Gmail API to trash outEmails
  if (outEmails.length > 0) {
    try {
      await tryBatchTrashMessages({
        gmail,
        messageIds: outEmails.map((e) => e.messageId),
        userId,
      })
      await db.transaction(async (tx) => {
        await tx
          .delete(limboEmails)
          .where(
            and(
              eq(limboEmails.userId, userId),
              sql`message_id IN ${outEmails.map((e) => e.messageId)}`,
            ),
          )
        await tx
          .insert(senders)
          .values(
            outEmails.map(
              (e) =>
                ({
                  userId,
                  email: e.email,
                  fromName: e.fromName,
                  screenStatus: 'out',
                }) as const,
            ),
          )
          .onDuplicateKeyUpdate({
            set: {
              // override existing screenStatus
              screenStatus: 'out',
              fromName: sql`VALUES(${senders.fromName})`,
            },
          })
      })
    } catch (error) {
      await notifyDevGmail({
        db,
        oauth2Client,
        isError: true,
        subject: 'Error while trashing messages',
        message: stringify({
          userId,
          error: stringify(error),
        }),
      })
    }
  }
}

export async function tryBatchMoveMessagesToInbox({
  gmail,
  messageIds,
  userId,
  removeFromTrashAndSpam = false,
}: {
  gmail: gmail_v1.Gmail
  messageIds: string[]
  userId: string
  removeFromTrashAndSpam?: boolean
}) {
  await gmail.users.messages
    .batchModify({
      userId: 'me',
      requestBody: {
        ids: messageIds,
        addLabelIds: ['INBOX'],
        removeLabelIds: removeFromTrashAndSpam ? ['TRASH', 'SPAM'] : [],
      },
    })
    .catch((error) => {
      if (isRequestedEntityNotFoundError(error)) {
        console.log('some messages not found')
        console.log(stringify(error))
      }
      throw new GmailApiUnknownError(
        stringify({
          action: 'tryBatchMoveMessagesToInbox',
          userId,
          messageIds,
          error: stringify(error),
        }),
      )
    })
}

export async function tryBatchTrashMessages({
  gmail,
  messageIds,
  userId,
}: {
  gmail: gmail_v1.Gmail
  messageIds: string[]
  userId: string
}) {
  const results = await pSettle(
    messageIds.map(
      (messageId) => () => tryTrashMessage({ gmail, userId, messageId }),
    ),
    {
      concurrency: 2,
    },
  )
  const failures = results.filter((r) => r.isRejected)
  if (failures.length !== 0) {
    throw new GmailApiUnknownError(
      stringify({
        action: 'tryBatchTrashMessages',
        userId,
        messageIds,
        error: stringify(failures),
      }),
    )
  }
}
