import { eq, sql } from 'drizzle-orm'

import { onboardingFormSchema } from '~/schemas/screener.schema'
import { domains } from '~/server/database/model/domain.model'
import { users } from '~/server/database/model/user.model'
import { protectedProcedure, router } from '~/server/trpc'
import { enqueueWlRecentlyReadSenders } from '~/serverless/gmail/sqs'

export const onboardingRouter = router({
  skip: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.update(users).set({
      hasCompletedOnboarding: true,
    })
    return {
      success: true,
    } as const
  }),

  submit: protectedProcedure
    .input(onboardingFormSchema)
    .mutation(
      async ({
        ctx,
        input: { whitelistRecentSenders, whitelistedDomains },
      }) => {
        await ctx.db.transaction(async (tx) => {
          if (whitelistedDomains && whitelistedDomains.length > 0) {
            await tx
              .insert(domains)
              .values(
                whitelistedDomains.map(
                  ({ value }) =>
                    ({
                      userId: ctx.session.user.id,
                      domain: value,
                      screenStatus: 'in',
                    }) as const,
                ),
              )
              // equivalent to do nothing
              .onDuplicateKeyUpdate({ set: { id: sql`id` } })
          }
          if (whitelistRecentSenders) {
            await enqueueWlRecentlyReadSenders(ctx.session.user.id)
          }
          await tx
            .update(users)
            .set({
              hasCompletedOnboarding: true,
            })
            .where(eq(users.id, ctx.session.user.id))
        })
      },
    ),
})
