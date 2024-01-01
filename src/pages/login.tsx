import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { signIn, useSession } from 'next-auth/react'
import { NextSeo } from 'next-seo'
import { FormProvider } from 'react-hook-form'

import { Button } from '~/components/Button'
import { ErrorMessageText } from '~/components/Fields'
import { AuthLayout } from '~/components/LandingPage/AuthLayout'
import { EmailFieldCheck } from '~/components/LandingPage/WaitlistForm/EmailField'
import { Logo } from '~/components/Logo'
import { Turnstile } from '~/components/Turnstile/Turnstile'
import { useTurnstile } from '~/components/Turnstile/useTurnstile'
import { env } from '~/env.mjs'
import { getBaseUrl } from '~/lib/env-utils'
import { useZodForm } from '~/lib/form'
import { GoogleLoginButton } from '~/lib/gmail/GoogleLoginButton'
import { trpc } from '~/lib/trpc'
import { checkWaitlistSchema } from '~/schemas/waitlist.schema'

export default function Waitlist() {
  const {
    isTokenError,
    isTokenLoading,
    onTokenError,
    onTokenSuccess,
    hasSubmitted,
    setSize,
    size,
  } = useTurnstile()
  const formProps = useZodForm({
    schema: checkWaitlistSchema,
  })
  const router = useRouter()
  const { data: session } = useSession()
  useEffect(() => {
    if (session) {
      void router.push('/dashboard/schedule')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])
  const { setValue } = formProps

  const [showGoogleButton, setShowGoogleButton] = useState(false)
  const checkWaitlistForm = trpc.waitlist.checkWaitlist.useMutation({
    onSuccess() {
      setShowGoogleButton(true)
    },
  })
  const { mutate: checkWaitlist, status, error } = checkWaitlistForm
  const handleSubmit = formProps.handleSubmit((data) => checkWaitlist(data))
  const isLoading = status === 'loading' || isTokenLoading
  return (
    <>
      <NextSeo title="Log In" />
      <AuthLayout>
        <div className="flex flex-col">
          <Link href="/" aria-label="Home">
            <Logo className="h-10 w-auto" />
          </Link>
          <div className="mt-20">
            <h2 className="text-3xl font-semibold text-gray-900">
              {!showGoogleButton ? 'Log In' : 'Almost there...'}
            </h2>
          </div>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-y-8">
          {!showGoogleButton && (
            <FormProvider {...formProps}>
              <form onSubmit={handleSubmit}>
                <EmailFieldCheck />
                <div className={size === 'invisible' ? 'hidden' : ''}>
                  <Turnstile
                    siteKey={env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY}
                    onError={onTokenError}
                    onSuccess={(t) => {
                      setValue('token', t)
                      onTokenSuccess(t)
                    }}
                    hasSubmitted={hasSubmitted}
                    size={size}
                    setSize={setSize}
                  />
                </div>
                <Button
                  type="submit"
                  variant="solid"
                  className="mx-auto w-full"
                  disabled={isTokenError || isLoading}
                >
                  {isTokenError
                    ? 'Check failed. Try again later'
                    : isLoading
                    ? 'Loading...'
                    : status === 'success'
                    ? 'You have been waitlisted!'
                    : 'Log In'}
                </Button>
                <StatusMessage status={status} errorMessage={error?.message} />
              </form>
            </FormProvider>
          )}
          {showGoogleButton && (
            <GoogleLoginButton
              className="mx-auto"
              buttonText="Continue with Google"
              onClick={() =>
                signIn(
                  'google',
                  { callbackUrl: `${getBaseUrl()}/dashboard/schedule` },
                  { login_hint: formProps.watch('email') },
                )
              }
            />
          )}
        </div>
      </AuthLayout>
    </>
  )
}

interface StatusMessageProps {
  status: 'error' | 'idle' | 'loading' | 'success'
  errorMessage: string | undefined
}

const StatusMessage = ({ status, errorMessage }: StatusMessageProps) => {
  return (
    <div className="text-center">
      {status === 'error' ? (
        <ErrorMessageText className="text-sm font-semibold">
          {errorMessage}
        </ErrorMessageText>
      ) : null}
    </div>
  )
}
