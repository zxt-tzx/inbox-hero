import { and, eq, sql } from 'drizzle-orm'
import { getServerSession } from 'next-auth'

import { trpcAssert } from '~/lib/utils'
import {
  checkScreenerSchema,
  queryScreenerSchema,
  screenSendersSchema,
} from '~/schemas/screener.schema'
import { nextAuthConfig } from '~/server/auth/config'
import { limboEmails } from '~/server/database/model/limbo.model'
import { protectedProcedure, publicProcedure, router } from '~/server/trpc'
import { enqueueUpdateScreeningResults } from '~/serverless/gmail/sqs'
import { validateToken } from '../turnstile/turnstile.service'
import { onboardingRouter } from './onboarding.router'
import { scheduleRouter } from './schedule.router'
import {
  getScheduledScreeners,
  getSortedSendersToScreen,
  isScreenerIdValid,
} from './screener.service'

export const screenerRouter = router({
  schedule: scheduleRouter,
  onboarding: onboardingRouter,
  getScheduledScreenerId: protectedProcedure.query(async ({ ctx }) => {
    const prevScheduledScreeners = await getScheduledScreeners({
      db: ctx.db,
      userId: ctx.session.user.id,
    })
    if (prevScheduledScreeners.length > 1) {
      console.error(
        `ERROR: there should only be one scheduled screener at a time, instead found ${prevScheduledScreeners.length}`,
      )
    }
    if (!prevScheduledScreeners[0]) {
      return null
    }
    return prevScheduledScreeners[0].id
  }),
  checkScreenerId: publicProcedure
    .input(checkScreenerSchema)
    .mutation(async ({ ctx, input: { id: screenerId, userId, token } }) => {
      const validationResult = await validateToken(token)
      trpcAssert(validationResult.success, 'Validation failed', 'BAD_REQUEST')
      const isValid = await isScreenerIdValid({
        userId,
        db: ctx.db,
        screenerId,
      })
      trpcAssert(isValid, 'screener id is invalid', 'NOT_FOUND')
      return await getSortedSendersToScreen({
        userId,
        db: ctx.db,
      })
    }),
  // publicly available, but must be logged in to get useful data
  queryScreenerId: publicProcedure
    .input(queryScreenerSchema)
    .query(async ({ ctx, input: { id: screenerId, userId } }) => {
      const session = await getServerSession(ctx.req, ctx.res, nextAuthConfig)
      if (!session) {
        return {
          senders: [],
          success: false,
        }
      }
      if (session.user.id !== userId) {
        return {
          senders: [],
          success: false,
        }
      }
      const isValid = await isScreenerIdValid({
        screenerId,
        userId: session.user.id,
        db: ctx.db,
      })
      if (!isValid) {
        return {
          senders: [],
          success: false,
        }
      }
      return await getSortedSendersToScreen({
        userId: session.user.id,
        db: ctx.db,
      })
    }),
  screenSenders: publicProcedure.input(screenSendersSchema).mutation(
    async ({
      ctx,
      input: {
        userId,
        screenerId,
        screeningDecisions: { inSenders, outSenders },
      },
    }) => {
      const isValid = await isScreenerIdValid({
        screenerId,
        userId,
        db: ctx.db,
      })
      trpcAssert(isValid, 'screenerId is not valid', 'NOT_FOUND')
      await ctx.db.transaction(async (trx) => {
        if (inSenders.length > 0) {
          await trx
            .update(limboEmails)
            .set({
              decision: 'in',
            })
            .where(
              and(
                eq(limboEmails.userId, userId),
                sql`${limboEmails.email} IN ${inSenders}`,
              ),
            )
        }
        if (outSenders.length > 0) {
          await trx
            .update(limboEmails)
            .set({
              decision: 'out',
            })
            .where(
              and(
                eq(limboEmails.userId, userId),
                sql`${limboEmails.email} IN ${outSenders}`,
              ),
            )
        }
      })
      await enqueueUpdateScreeningResults(userId)
    },
  ),
})
