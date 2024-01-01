import { eq } from 'drizzle-orm'

import { enqueueWaitlistEmail } from '~/lib/email/email.service'
import {
  INSERT_SUCCESS_MESSAGE,
  trpcAssert,
  UPDATE_SUCCESS_MESSAGE,
} from '~/lib/utils'
import {
  checkWaitlistSchema,
  insertWaitlistSchema,
} from '~/schemas/waitlist.schema'
import { waitlist } from '~/server/database/model/waitlist.model'
import { publicProcedure, router } from '~/server/trpc'
import { validateToken } from '../turnstile/turnstile.service'
import { emailWhitelistStatus } from './waitlist.service'

export const waitlistRouter = router({
  submitInterestForm: publicProcedure
    .input(insertWaitlistSchema)
    .mutation(
      async ({
        ctx,
        input: { token, email, emailProvider, otherEmailProvider, comments },
      }) => {
        const validationResult = await validateToken(token)
        trpcAssert(
          validationResult.success,
          'Please try again later.',
          'BAD_REQUEST',
        )
        const { db } = ctx
        const existingUsers = await db
          .select()
          .from(waitlist)
          .where(eq(waitlist.email, email))
        const userAlreadyExist = existingUsers.length > 0
        if (userAlreadyExist) {
          await db.update(waitlist).set({
            comments,
            emailProvider,
            otherEmailProvider,
          })
        } else {
          await db.insert(waitlist).values({
            email,
            emailProvider,
            otherEmailProvider,
            comments,
            sentWelcomeEmail: false,
          })
          await enqueueWaitlistEmail(email)
        }
        return {
          message: userAlreadyExist
            ? UPDATE_SUCCESS_MESSAGE
            : INSERT_SUCCESS_MESSAGE,
        } as const
      },
    ),
  checkWaitlist: publicProcedure
    .input(checkWaitlistSchema)
    .mutation(async ({ ctx, input: { token, email } }) => {
      const validationResult = await validateToken(token)
      trpcAssert(
        validationResult.success,
        'Please try again later.',
        'BAD_REQUEST',
      )
      const { whitelistStatus, email: emailFromDb } =
        await emailWhitelistStatus(ctx.db, email)
      trpcAssert(
        whitelistStatus !== 'email_not_in_waitlist',
        'Please join the waitlist first, we can only support a limited number of users during beta.',
        'BAD_REQUEST',
      )
      trpcAssert(
        whitelistStatus !== 'not_whitelisted',
        'Please wait for our email informing that you have been included in the beta! Apologies for the wait.',
        'BAD_REQUEST',
      )
      return {
        email: emailFromDb,
      }
    }),
})
