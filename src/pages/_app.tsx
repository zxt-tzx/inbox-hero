import '~/styles/globals.css'

import type { AppProps, AppType } from 'next/app'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Provider as JotaiProvider } from 'jotai'
import type { Session } from 'next-auth'
import { SessionProvider as AuthProvider } from 'next-auth/react'

import { Suspense } from '~/components/Suspense'
import { Skeleton } from '~/components/ui/skeleton'
import { Toaster } from '~/components/ui/toaster'
import { Meta } from '~/config/Meta'
import { trpc } from '~/lib/trpc'

// import { LoginStateProvider } from '~common/components/Providers/AuthWrappers'

// import { ErrorBoundary } from '~/components/ErrorBoundary'
// import { NextPageWithLayout } from '~/types/layout'

// type AppPropsWithAuthAndLayout = AppProps & {
//   Component: NextPageWithLayout
// }
// })

type AppPropsWithAuthAndLayout = AppProps<{ session: Session }>

const MyApp = (({
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithAuthAndLayout) => {
  return (
    <>
      <JotaiProvider>
        <AuthProvider session={session}>
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            {/* <ErrorBoundary> */}
            {/* <ChildWithLayout {...props} /> */}
            <Meta />
            <Component {...pageProps} />
            {/* </main> */}
            <Toaster />
            {process.env.NODE_ENV !== 'production' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
            {/* </ErrorBoundary> */}
          </Suspense>
        </AuthProvider>
      </JotaiProvider>
    </>
  )
}) as AppType

// This is needed so suspense will be triggered for anything within the LayoutComponents which uses useSuspenseQuery
// const ChildWithLayout = ({
//   Component,
//   pageProps,
// }: AppPropsWithAuthAndLayout) => {
//   const getLayout =
//     Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>)

//   return <>{getLayout(<Component {...pageProps} />)}</>
// }

export default trpc.withTRPC(MyApp)
