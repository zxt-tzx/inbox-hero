import { type NextPageContext } from 'next'
import {
  httpBatchLink,
  loggerLink,
  TRPCClientError,
  type TRPCLink,
} from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server'
import { observable } from '@trpc/server/observable'
import { type TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc'
import superjson from 'superjson'

import { HOME } from '~/lib/constants/routes'
import type { AppRouter } from '~/server/modules/appRouter'
import { REDIRECT_URL_KEY } from './constants/params'
import { getBaseUrl } from './env-utils'
import { TRPCWithErrorCodeSchema } from './error'

const NON_RETRYABLE_ERROR_CODES = new Set<TRPC_ERROR_CODE_KEY>([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
])

export const custom401Link: TRPCLink<AppRouter> = () => {
  // here we just got initialized in the app - this happens once per app
  // useful for storing cache for instance
  return ({ next, op }) => {
    // this is when passing the result to the next link
    // each link needs to return an observable which propagates results
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) {
          observer.next(value)
        },
        // Handle 401 errors
        error(err) {
          observer.error(err)
        },
        complete() {
          observer.complete()
        },
      })
      return unsubscribe
    })
  }
}

const isErrorRetryableOnClient = (error: unknown): boolean => {
  if (typeof window === 'undefined') return true
  if (!(error instanceof TRPCClientError)) return true
  const res = TRPCWithErrorCodeSchema.safeParse(error)
  if (res.success && NON_RETRYABLE_ERROR_CODES.has(res.data)) return false
  return true
}

/**
 * Extend `NextPageContext` with meta data that can be picked up by `responseMeta()` when server-side rendering
 */
export interface SSRContext extends NextPageContext {
  /**
   * Set HTTP Status code
   * @example
   * const utils = trpc.useContext();
   * if (utils.ssrContext) {
   *   utils.ssrContext.status = 404;
   * }
   */
  status?: number
}

const handleRedirectToSignInPage = () => {
  if (typeof window === 'undefined') {
    return
  }

  if (window.location.pathname === '/login') {
    return
  }

  const redirectUrl =
    window.location.pathname + window.location.search + window.location.hash
  const encodedRedirectUrl = encodeURIComponent(redirectUrl)

  // The choice to not redirect via next's router was intentional to handle ErrorBoundary for the app root
  // Using next's router.push('/login') will not render the SignIn component as it won't be mounted in the app root as the ErrorBoundary fallback component will be rendered instead
  // Using vanilla location redirecting will prompt a full page reload of /login page, which will never trigger the root ErrorBoundary, thus rendering the full component correctly
  window.location.href =
    redirectUrl === HOME
      ? `/login`
      : `/login?${REDIRECT_URL_KEY}=${encodedRedirectUrl}`
}

/**
 * A set of strongly-typed React hooks from your `AppRouter` type signature with `createReactQueryHooks`.
 * @link https://trpc.io/docs/react#3-create-trpc-hooks
 */
export const trpc = createTRPCNext<
  AppRouter,
  SSRContext,
  'ExperimentalSuspense'
>({
  config({ ctx }) {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @link https://trpc.io/docs/ssr
     */
    return {
      /**
       * @link https://trpc.io/docs/data-transformers
       */
      transformer: superjson,
      /**
       * @link https://trpc.io/docs/links
       */
      links: [
        custom401Link,
        // adds pretty logs to your console in development and logs errors in production
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          /**
           * Set custom request headers on every request from tRPC
           * @link https://trpc.io/docs/ssr
           */
          headers() {
            if (ctx?.req) {
              // To use SSR properly, you need to forward the client's headers to the server
              // This is so you can pass through things like cookies when we're server-side rendering

              // If you're using Node 18, omit the "connection" header
              const { connection: _connection, ...headers } = ctx.req.headers
              return {
                ...headers,
                // Optional: inform server that it's an SSR request
                'x-ssr': '1',
              }
            }
            return {}
          },
        }),
      ],
      /**
       * @link https://react-query.tanstack.com/reference/QueryClient
       */
      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: 1000 * 10, // 10 seconds
            retry: (failureCount, error) => {
              if (!isErrorRetryableOnClient(error)) {
                return false
              }
              return failureCount < 3
            },
          },
          mutations: {
            retry: (_, error) => {
              if (error instanceof TRPCClientError) {
                const res = TRPCWithErrorCodeSchema.safeParse(error)
                if (
                  (res.success && res.data === 'UNAUTHORIZED') ||
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  error.data?.code === 'UNAUTHORIZED'
                ) {
                  handleRedirectToSignInPage()
                }
              }

              return false
            },
          },
        },
      },
    }
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: false,
  /**
   * Set headers or status code when doing SSR
   */
  // responseMeta(opts) {
  //   const ctx = opts.ctx as SSRContext;

  //   if (ctx.status) {
  //     // If HTTP status set, propagate that
  //     return {
  //       status: ctx.status,
  //     };
  //   }

  //   const error = opts.clientErrors[0];
  //   if (error) {
  //     // Propagate http first error from API calls
  //     return {
  //       status: error.data?.httpStatus ?? 500,
  //     };
  //   }

  //   // for app caching with SSR see https://trpc.io/docs/caching

  //   return {};
  // },
})

export type RouterInput = inferRouterInputs<AppRouter>
export type RouterOutput = inferRouterOutputs<AppRouter>
