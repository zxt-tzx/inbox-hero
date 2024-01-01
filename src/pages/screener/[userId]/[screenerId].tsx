import { NextSeo } from 'next-seo'

import { DashboardLayout } from '~/components/Dashboard/DashboardLayout'
import { ScreenerProvider } from '~/components/Dashboard/Screen/Screener/ScreenerProvider'
import { ScreenerWrapper } from '~/components/Dashboard/Screen/Screener/ScreenerWrapper'
import { VanillaHeader } from '~/components/Dashboard/VanillaHeader'

export default function Screener() {
  return (
    <DashboardLayout>
      <NextSeo noindex={true} nofollow={true} title="Screen Senders" />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <VanillaHeader title="Screen" />
        <main>
          <div className="container w-full">
            <ScreenerProvider>
              <ScreenerWrapper />
            </ScreenerProvider>
          </div>
        </main>
      </div>
    </DashboardLayout>
  )
}
