import Link from 'next/link'
import { useRouter } from 'next/router'
import { signIn, useSession } from 'next-auth/react'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { env } from '~/env.mjs'
import { getBaseUrl } from '~/lib/env-utils'
import { GoogleLoginButton } from '~/lib/gmail/GoogleLoginButton'
import { dayjs } from '~/lib/time/dayjs'
import { useSchedule } from '../Schedule/ScheduleProvider'

export function ReauthorizationCard() {
  const { data: session } = useSession()
  const router = useRouter()
  const {
    refreshTokenInfo: { refreshTokenExpireAt, hasGrantedPermission },
  } = useSchedule()
  const userEmail = session?.user.email
  if (!userEmail) {
    // probably error case, need to redirect
    void router.push('/login')
    return null
  }
  if (!hasGrantedPermission) {
    throw new Error('hasGrantedPermission should be true')
  }
  if (!refreshTokenExpireAt) {
    throw new Error('refreshTokenExpireAt should be defined')
  }
  const expireStatusText = (() => {
    const now = dayjs()
    if (refreshTokenExpireAt < new Date()) {
      return 'Oh no, your previous authorization has expired!'
    } else if (dayjs(refreshTokenExpireAt).subtract(1, 'day').isBefore(now)) {
      return 'Uh oh, your previous authorization will expire in less than a day.'
    } else {
      return 'Note: Your previous authorization will expire in less than two days.'
    }
  })()

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="flex items-center justify-center">
            Reauthorize Inbox Hero
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <text className="font-semibold">{expireStatusText}</text> Inbox Hero
        cannot work without your authorization.
      </CardContent>
      {env.NEXT_PUBLIC_GOOGLE_PUBLISHING_STATUS === 'testing' && (
        <CardContent>
          Due to{' '}
          <Link
            className="text-blue-600 underline"
            href="https://developers.google.com/identity/protocols/oauth2#:~:text=is%20issued%20a%20refresh%20token%20expiring%20in%207%20days"
          >
            a limitation by Google
          </Link>
          , your authorization for Inbox Hero to manage your email is only valid
          for 7 days. This limitation will no longer apply once Inbox Hero is
          out of beta! We appreciate your patience in the meantime 🙏
        </CardContent>
      )}
      <CardContent>
        To ensure a seamless experience, please reauthorize Inbox Hero by
        clicking the button below:
      </CardContent>
      <CardFooter>
        <GoogleLoginButton
          className="mx-auto"
          buttonText="Continue with Google"
          onClick={() =>
            signIn(
              'google-auth-gmail',
              {
                callbackUrl: `${getBaseUrl()}/dashboard/schedule`,
              },
              { login_hint: userEmail },
            )
          }
        />
      </CardFooter>
    </Card>
  )
}
