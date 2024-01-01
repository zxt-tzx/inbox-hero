import { NextSeo } from 'next-seo'

import { DashboardLayout } from '~/components/Dashboard/DashboardLayout'
import { ManageInAndOut } from '~/components/Dashboard/Screen/ManageInAndOut'
import { ScreenSendersCard } from '~/components/Dashboard/Screen/ScreenSendersCard'
import { VanillaHeader } from '~/components/Dashboard/VanillaHeader'

export default function Screen() {
  return (
    <DashboardLayout>
      <NextSeo title="Screen" noindex={true} nofollow={true} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <VanillaHeader title="Screen" />
        <main>
          <div className="flex flex-col space-y-4">
            <ScreenSendersCard />
            <ManageInAndOut variant="in" />
            <ManageInAndOut variant="out" />
          </div>
        </main>
      </div>
    </DashboardLayout>
  )
}
