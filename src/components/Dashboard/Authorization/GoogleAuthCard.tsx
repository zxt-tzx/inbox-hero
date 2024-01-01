import { useState } from 'react'
import { useRouter } from 'next/router'
import { signIn, useSession } from 'next-auth/react'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { getBaseUrl } from '~/lib/env-utils'
import { GoogleLoginButton } from '~/lib/gmail/GoogleLoginButton'

export function GoogleAuthCard() {
  const { data: session } = useSession()
  const router = useRouter()
  const userEmail = session?.user.email
  const [selectedLearnMore, setSelectedLearnMore] = useState(false)
  if (!userEmail) {
    // probably error case, need to redirect
    void router.push('/login')
    return null
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="flex items-center justify-center">
            Connect your Gmail account
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>Your email: {session.user.email}</CardContent>
      <CardContent>
        To screen your emails, Inbox Hero needs your permission to read and
        modify your emails.
      </CardContent>
      <CardContent>
        We only process information that is strictly necessary to screen your
        emails. We will never sell your data and you can revoke access at any
        time.&nbsp;
        {!selectedLearnMore && (
          <a
            onClick={() => setSelectedLearnMore(true)}
            className="text-blue-600 underline"
          >
            Learn more.
          </a>
        )}
      </CardContent>
      {/* TODO: */}
      {selectedLearnMore && (
        <CardContent>
          How does Inbox Hero make money? Why can I trust Inbox Hero with my
          data? How do I revoke Inbox Hero&apos;s access to my email? What data
          is processed by Inbox Hero?
        </CardContent>
      )}
      <CardFooter>
        <GoogleLoginButton
          className="mx-auto"
          onClick={() =>
            signIn(
              'google-auth-gmail',
              {
                callbackUrl: `${getBaseUrl()}/dashboard/schedule`,
              },
              { login_hint: userEmail },
            )
          }
          buttonText="Continue with Google"
        />
      </CardFooter>
    </Card>
  )
}
