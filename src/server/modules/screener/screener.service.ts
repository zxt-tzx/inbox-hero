import { and, desc, eq, gt } from 'drizzle-orm'

import { getNextScreenerTimings } from '~/lib/time/screener.utils'
import { assert, type db as dbClient } from '~/server/database/client'
import { limboEmails } from '~/server/database/model/limbo.model'
import { screeners } from '~/server/database/model/screener.model'
import { users } from '~/server/database/model/user.model'

export const getScheduledScreeners = async ({
  db,
  userId,
}: {
  db: typeof dbClient
  userId: string
}) => {
  const scheduledScreeners = await db
    .select()
    .from(screeners)
    .where(and(eq(screeners.userId, userId), eq(screeners.status, 'scheduled')))
  return scheduledScreeners
}

export const scheduleNextScreener = async ({
  db,
  userId,
  dailyScreenerTime,
  timezone,
}: {
  db: typeof dbClient
  userId: string
  dailyScreenerTime: string
  timezone: string
}) => {
  const { scheduledAt, expireAt } = getNextScreenerTimings(
    dailyScreenerTime,
    timezone,
  )
  const prevScheduledScreeners = await getScheduledScreeners({ db, userId })
  if (prevScheduledScreeners.length > 1) {
    console.error(
      `ERROR: there should only be one scheduled screener at a time, instead found ${prevScheduledScreeners.length}`,
    )
  }
  if (prevScheduledScreeners.length > 0) {
    await deleteAllScheduledScreeners({ db, userId })
  }
  await db.insert(screeners).values({
    userId,
    scheduledAt: new Date(scheduledAt.toAbsoluteString()),
    expireAt: new Date(expireAt.toAbsoluteString()),
    status: 'scheduled',
  })
  return
}

export const deleteAllScheduledScreeners = async ({
  db,
  userId,
}: {
  db: typeof dbClient
  userId: string
}) => {
  await db
    .delete(screeners)
    .where(and(eq(screeners.userId, userId), eq(screeners.status, 'scheduled')))
}

export const isScreenerIdValid = async ({
  screenerId,
  userId,
  db,
}: {
  screenerId: string
  userId: string
  db: typeof dbClient
}) => {
  const [screener] = await db
    .select({
      id: screeners.id,
    })
    .from(screeners)
    .where(
      and(
        eq(screeners.id, screenerId),
        eq(screeners.userId, userId),
        gt(screeners.expireAt, new Date()),
        // NB valid screener's status can be either scheduled or sent; checking by expireAt is sufficient
      ),
    )
  return !!screener
}

export const getSortedSendersToScreen = async ({
  userId,
  db,
}: {
  userId: string
  db: typeof dbClient
}) => {
  const emails = await db
    .select({
      id: limboEmails.id,
      senderEmail: limboEmails.email,
      fromName: limboEmails.fromName,
      subject: limboEmails.subject,
      body: limboEmails.body,
      snippet: limboEmails.snippet,
      emailDate: limboEmails.emailDate,
    })
    .from(limboEmails)
    .where(
      and(
        eq(limboEmails.userId, userId),
        eq(limboEmails.decision, 'undecided'),
      ),
    )
    .orderBy(desc(limboEmails.emailDate))
  type Email = (typeof emails)[number]
  interface Sender extends Email {
    numEmails: number
  }
  const groupedSendersMap = new Map<string, Sender>()
  for (const e of emails) {
    const sender = groupedSendersMap.get(e.senderEmail)
    if (!sender) {
      groupedSendersMap.set(e.senderEmail, { ...e, numEmails: 1 })
    } else {
      // safe to always overwrite because we want most OLDEST email for each sender
      // and original emails are sorted in descending order of date
      groupedSendersMap.set(e.senderEmail, {
        ...e,
        numEmails: sender.numEmails + 1,
      })
    }
  }
  const [user] = await db
    .select({
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
  assert(user, 'user not found')

  const senders = Array.from(groupedSendersMap.values()).map((v) => {
    return {
      ...v,
      userEmail: user.email,
    }
  })
  return {
    senders,
    success: true,
  }
}
