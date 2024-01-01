import { eq } from 'drizzle-orm'

import { dayjs } from '~/lib/time/dayjs'
import {
  getNextScreenerTimings,
  validateDailyScreenerTime,
} from '~/lib/time/screener.utils'
import { trpcAssert } from '~/lib/utils'
import {
  setScheduleSchema,
  toggleScheduleSchema,
} from '~/schemas/screener.schema'
import { users } from '~/server/database/model/user.model'
import { protectedProcedure, router } from '~/server/trpc'
import {
  enqueueMoveLimboEmailsToInbox,
  enqueueSetWatch,
  enqueueStopWatch,
} from '~/serverless/gmail/sqs'
import {
  deleteAllScheduledScreeners,
  getScheduledScreeners,
  scheduleNextScreener,
} from './screener.service'

export const scheduleRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({
        dailyScreenerTime: users.dailyScreenerTime,
        timezone: users.timezone,
        isDailyScreenerOn: users.isDailyScreenerOn,
        refreshTokenExpireAt: users.refreshTokenExpireAt,
        refreshToken: users.refreshToken,
        hasCompletedOnboarding: users.hasCompletedOnboarding,
      })
      .from(users)
      .where(eq(users.id, ctx.session.user.id))
    trpcAssert(user, 'user not found', 'NOT_FOUND')
    const {
      dailyScreenerTime,
      timezone,
      isDailyScreenerOn,
      hasCompletedOnboarding,
      refreshTokenExpireAt,
      refreshToken, // ALERT: never send this to client
    } = user
    const hasGrantedPermission = !!refreshToken
    const promptUserToRefreshToken =
      !!refreshTokenExpireAt &&
      dayjs(refreshTokenExpireAt).subtract(2, 'day').isBefore(dayjs())
    const refreshTokenInfo = hasGrantedPermission
      ? ({
          hasGrantedPermission,
          refreshTokenExpireAt,
          promptUserToRefreshToken,
        } as const)
      : ({
          hasGrantedPermission,
          refreshTokenExpireAt: null,
          promptUserToRefreshToken: false,
        } as const)

    const dailyScreenerInfo = await (async (isDailyScreenerOn) => {
      const hasSetSchedule = !!(dailyScreenerTime && timezone)
      if (!hasSetSchedule) {
        return {
          // force user to set schedule, don't send any info down
          hasSetSchedule,
          dailyScreenerTime: null,
          timezone: null,
          isDailyScreenerOn: false,
          nextScreenerScheduledAt: null,
        } as const
      } else {
        if (!isDailyScreenerOn) {
          return {
            hasSetSchedule,
            dailyScreenerTime,
            timezone,
            isDailyScreenerOn,
            nextScreenerScheduledAt: null,
          } as const
        }
        const prevScheduledScreeners = await getScheduledScreeners({
          db: ctx.db,
          userId: ctx.session.user.id,
        })
        if (prevScheduledScreeners.length > 1) {
          ctx.logger.error(
            `ERROR: there should only be one scheduled screener at a time, instead found ${prevScheduledScreeners.length}`,
          )
        }
        if (prevScheduledScreeners.length === 0) {
          console.error('scheduled screener not found, this should not happen')
        }
        const scheduledAt =
          prevScheduledScreeners[0]?.scheduledAt ??
          // fallback value, should not happen
          new Date(
            getNextScreenerTimings(
              dailyScreenerTime,
              timezone,
            ).scheduledAt.toAbsoluteString(),
          )
        return {
          isDailyScreenerOn,
          dailyScreenerTime,
          timezone,
          hasSetSchedule,
          nextScreenerScheduledAt: scheduledAt,
        } as const
      }
    })(isDailyScreenerOn)

    return {
      refreshTokenInfo,
      hasCompletedOnboarding,
      dailyScreenerInfo,
    }
  }),
  set: protectedProcedure
    .input(setScheduleSchema)
    .mutation(async ({ ctx, input }) => {
      const { dailyScreenerTime, timezone } = input
      trpcAssert(
        timezone && dailyScreenerTime,
        'timezone and dailyScreenerTime cannot be null',
        'BAD_REQUEST',
      )
      validateDailyScreenerTime(dailyScreenerTime)
      await ctx.db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({
            dailyScreenerTime: dailyScreenerTime,
            timezone: timezone,
          })
          .where(eq(users.id, ctx.session.user.id))
        await scheduleNextScreener({
          db: tx,
          userId: ctx.session.user.id,
          dailyScreenerTime,
          timezone,
        })
      })
      return {
        success: true,
      } as const
    }),

  toggle: protectedProcedure
    .input(toggleScheduleSchema)
    .mutation(async ({ input: { turnOnDailyScreener }, ctx }) => {
      switch (turnOnDailyScreener) {
        case false: {
          await Promise.all([
            ctx.db.transaction(async (tx) => {
              await tx
                .update(users)
                .set({
                  isDailyScreenerOn: false,
                })
                .where(eq(users.id, ctx.session.user.id))
              await deleteAllScheduledScreeners({
                db: tx,
                userId: ctx.session.user.id,
              })
            }),
            enqueueStopWatch(ctx.session.user.id),
            enqueueMoveLimboEmailsToInbox(ctx.session.user.id),
          ])
          return {
            success: true,
            dailyScreenerOn: false,
          } as const
        }
        case true: {
          const [user] = await ctx.db
            .select({
              dailyScreenerTime: users.dailyScreenerTime,
              timezone: users.timezone,
            })
            .from(users)
            .where(eq(users.id, ctx.session.user.id))
          trpcAssert(user, 'user not found', 'NOT_FOUND')
          const { dailyScreenerTime, timezone } = user
          trpcAssert(
            dailyScreenerTime && timezone,
            'user has not set schedule',
            'NOT_FOUND',
          )
          await ctx.db.transaction(async (tx) => {
            await tx
              .update(users)
              .set({
                isDailyScreenerOn: true,
              })
              .where(eq(users.id, ctx.session.user.id))
            await scheduleNextScreener({
              db: tx,
              userId: ctx.session.user.id,
              dailyScreenerTime,
              timezone,
            })
          })
          await enqueueSetWatch(ctx.session.user.id)
          return {
            success: true,
            dailyScreenerOn: true,
          } as const
        }
        default:
          turnOnDailyScreener satisfies never
          throw new Error('impossible')
      }
    }),
})
