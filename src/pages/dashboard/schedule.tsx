import { NextSeo } from 'next-seo'

import { DashboardLayout } from '~/components/Dashboard/DashboardLayout'
import { PolymorphicScheduleForm } from '~/components/Dashboard/Schedule/ScheduleForm'
import { ScheduleHeader } from '~/components/Dashboard/Schedule/ScheduleHeader'
import { ScheduleProvider } from '~/components/Dashboard/Schedule/ScheduleProvider'

export default function Schedule() {
  return (
    <DashboardLayout>
      <ScheduleProvider>
        <NextSeo title="Schedule" />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <ScheduleHeader />
          <main>
            <div className="flex flex-col justify-center">
              <PolymorphicScheduleForm />
            </div>
          </main>
        </div>
      </ScheduleProvider>
    </DashboardLayout>
  )
}
