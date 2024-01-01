/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @see https://trpc.io/docs/v10/router
 * @see https://trpc.io/docs/v10/procedures
 */

import { initTRPC } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import superjson from 'superjson'
import { ZodError } from 'zod'

import { trpcAssert } from '~/lib/utils'
import { nextAuthConfig } from './auth/config'
import { type Context } from './context'
import { users } from './database/model/user.model'
import { createBaseLogger } from './logger'

const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/v10/data-transformers
   */
  transformer: superjson,
  /**
   * @see https://trpc.io/docs/v10/error-formatting
   */
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    }
  },
})

// Setting outer context with tRPC will not get us correct path during request batching, only by setting logger context in
// the middleware do we get the exact path to log
const loggerMiddleware = t.middleware(async ({ path, next }) => {
  const start = Date.now()
  const logger = createBaseLogger(path)

  const result = await next({
    ctx: { logger },
  })

  const durationInMs = Date.now() - start

  if (result.ok) {
    logger.info('success', { durationInMs })
  } else {
    logger.error('failure', { durationInMs, error: result.error })
  }

  return result
})

const authMiddleware = t.middleware(async ({ next, ctx }) => {
  const session = await getServerSession(ctx.req, ctx.res, nextAuthConfig)
  trpcAssert(session, 'User is not logged in', 'UNAUTHORIZED')
  const [user] = await ctx.db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
  trpcAssert(user, 'User does not exist', 'UNAUTHORIZED')
  return next({
    ctx: {
      session: {
        user: session.user,
      },
    },
  })
})

/**
 * Create a router
 * @see https://trpc.io/docs/v10/router
 */
export const router = t.router

/**
 * Create an unprotected procedure
 * @see https://trpc.io/docs/v10/procedures
 **/
export const publicProcedure = t.procedure.use(loggerMiddleware)

/**
 * Create a protected procedure
 **/
export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(authMiddleware)

/**
 * @see https://trpc.io/docs/v10/middlewares
 */
export const middleware = t.middleware

/**
 * @see https://trpc.io/docs/v10/merging-routers
 */
export const mergeRouters = t.mergeRouters
