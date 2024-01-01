import type * as trpc from '@trpc/server'
import type { CreateNextContextOptions } from '@trpc/server/adapters/next'
import { getServerSession, type Session } from 'next-auth'

import { nextAuthConfig } from './auth/config'
import { db } from './database/client'

interface CreateContextOptions {
  session: Session | null
}

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export function createContextInner(opts: CreateContextOptions) {
  return {
    session: opts.session,
    db,
  }
}

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getServerSession(opts.req, opts.res, nextAuthConfig)

  const contextInner = createContextInner({
    session,
  })

  return {
    ...contextInner,
    res: opts.res,
    req: opts.req,
  }
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>
