import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'

import { DashboardLayout } from '~/components/Dashboard/DashboardLayout'
import { DomainTable } from '~/components/Dashboard/Manage/Domain/DomainTable'
import { HeadsUp } from '~/components/Dashboard/Manage/HeadsUp'
import {
  ManageProvider,
  parseInOrOut,
} from '~/components/Dashboard/Manage/ManageProvider'
import { SenderTable } from '~/components/Dashboard/Manage/Sender/SenderTable'
import { VanillaHeader } from '~/components/Dashboard/VanillaHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { toCapitalCase } from '~/lib/utils'

export default function Screen() {
  const router = useRouter()
  const { status: statusRaw } = router.query
  let status: 'in' | 'out'
  try {
    status = parseInOrOut(String(statusRaw))
  } catch (error) {
    void router.push('/dashboard/screen')
    return null
  }
  const title = `Who's ${toCapitalCase(status)}`
  return (
    <DashboardLayout>
      <NextSeo title={title} noindex={true} nofollow={true} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <VanillaHeader title={title} />
        <main>
          <div className="container w-full">
            <Tabs defaultValue="senders" removeParam="status">
              <TabsList className="w-full">
                <TabsTrigger className="w-full" value="senders">
                  Senders
                </TabsTrigger>
                <TabsTrigger className="w-full" value="domains">
                  Domains
                </TabsTrigger>
              </TabsList>
              <ManageProvider>
                <TabsContent value="senders">
                  {status === 'in' && (
                    <HeadsUp infoText="When you send an email, the recipients are automatically added here so you won't miss their replies." />
                  )}
                  {status === 'out' && (
                    <HeadsUp infoText="If you move a sender to your In list, we will move previous emails from that sender in your trash to your inbox so you can see what you might've missed!" />
                  )}
                  <SenderTable />
                </TabsContent>
                <TabsContent value="domains">
                  <HeadsUp infoText="Please note that the more specific rule in Sender will override the more general rule in Domain." />
                  <DomainTable />
                </TabsContent>
              </ManageProvider>
            </Tabs>
          </div>
        </main>
      </div>
    </DashboardLayout>
  )
}
