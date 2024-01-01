/**
 * This file contains the root router of your tRPC-backend
 */
import { publicProcedure, router } from '../trpc'
import { manageRouter } from './in-n-out/manage.router'
import { screenerRouter } from './screener/screener.router'
import { waitlistRouter } from './waitlist/waitlist.router'

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),
  waitlist: waitlistRouter,
  screener: screenerRouter,
  manage: manageRouter,
})

export type AppRouter = typeof appRouter
