import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { trpc } from '~/lib/trpc'

export function ScreenSendersCard() {
  const { data: session } = useSession()
  const userId = session?.user.id
  const [screenerId] = trpc.screener.getScheduledScreenerId.useSuspenseQuery()
  const router = useRouter()
  if (!userId) {
    void router.push('/login')
  }
  return (
    <Link
      href={
        screenerId ? `/screener/${userId}/${screenerId}` : '/dashboard/schedule'
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>
            {screenerId ? 'Screen first-time senders' : 'Activate screener'}
          </CardTitle>
          <CardDescription className="pt-2">
            {screenerId
              ? 'See emails from first-time senders and decide whether they are In or Out.'
              : "Go to the Schedule page to activate Inbox Hero's screening feature."}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
