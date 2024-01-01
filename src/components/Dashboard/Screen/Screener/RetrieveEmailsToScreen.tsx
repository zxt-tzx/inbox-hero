import { useState } from 'react'
import { Mail } from 'lucide-react'
import { FormProvider } from 'react-hook-form'
import { z } from 'zod'

import { Turnstile } from '~/components/Turnstile/Turnstile'
import { useTurnstile } from '~/components/Turnstile/useTurnstile'
import { Button } from '~/components/ui/button'
import { env } from '~/env.mjs'
import { useZodForm } from '~/lib/form'
import { trpc } from '~/lib/trpc'
import { queryScreenerSchema } from '~/schemas/screener.schema'
import { useScreener } from './ScreenerProvider'
import { ScreenerNotFoundAlert } from './ScreenerWrapper'

export function RetrieveEmailsToScreen() {
  const { userId, screenerId, setSendersData, setRetrieved } = useScreener()
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
    schema: queryScreenerSchema.augment({
      token: z.string().nonempty(),
    }),
    defaultValues: {
      id: String(screenerId),
      userId: String(userId),
    },
  })
  const { setValue } = formProps
  const [isError, setIsError] = useState(false)

  const retrieveForm = trpc.screener.checkScreenerId.useMutation({
    onSuccess({ senders }) {
      setSendersData(senders)
      setRetrieved(true)
    },
    onError() {
      setIsError(true)
    },
  })
  if (isError) {
    return <ScreenerNotFoundAlert />
  }
  const { mutate, status } = retrieveForm
  const isLoading = status === 'loading' || isTokenLoading
  const handleSubmit = formProps.handleSubmit((data) => mutate(data))
  return (
    <FormProvider {...formProps}>
      <form
        onSubmit={handleSubmit}
        className="flex items-center justify-center pt-16"
      >
        <Button
          className="w-full max-w-xs"
          onSubmit={handleSubmit}
          disabled={isTokenError || isLoading}
        >
          {isTokenError ? (
            'Check failed. Try again later'
          ) : isLoading ? (
            'Loading...'
          ) : (
            <ButtonText />
          )}
        </Button>
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
      </form>
    </FormProvider>
  )
}

const ButtonText = () => {
  return (
    <>
      Retrieve Emails
      <Mail className="ml-2 h-4 w-4" />
    </>
  )
}
