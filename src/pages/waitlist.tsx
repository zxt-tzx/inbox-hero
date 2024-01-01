import { useState } from 'react'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { FormProvider } from 'react-hook-form'

import { Button } from '~/components/Button'
import {
  ErrorMessageText,
  InputField,
  Label,
  Textarea,
} from '~/components/Fields'
import { AuthLayout } from '~/components/LandingPage/AuthLayout'
import { EmailFieldInsert } from '~/components/LandingPage/WaitlistForm/EmailField'
import { EmailProviderSelect } from '~/components/LandingPage/WaitlistForm/EmailProviderSelect'
import { Logo } from '~/components/Logo'
import { Turnstile } from '~/components/Turnstile/Turnstile'
import { useTurnstile } from '~/components/Turnstile/useTurnstile'
import { env } from '~/env.mjs'
import { useZodForm } from '~/lib/form'
import { trpc } from '~/lib/trpc'
import { INSERT_SUCCESS_MESSAGE, UPDATE_SUCCESS_MESSAGE } from '~/lib/utils'
import { insertWaitlistSchema } from '~/schemas/waitlist.schema'

export default function Waitlist() {
  const {
    isTokenError,
    isTokenLoading,
    onTokenError,
    onTokenSuccess,
    onSubmit,
    hasSubmitted,
    setSize,
    size,
    forceRender,
  } = useTurnstile()
  const formProps = useZodForm({
    schema: insertWaitlistSchema,
    defaultValues: {
      emailProvider: 'gmail_personal',
    },
  })
  const {
    reset,
    register,
    watch,
    formState: { errors },
    setValue,
  } = formProps
  const emailProviderValue = watch('emailProvider')
  const [insertSuccess, setInsertSuccess] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const submitInterestForm = trpc.waitlist.submitInterestForm.useMutation({
    onSuccess(data) {
      switch (data.message) {
        case INSERT_SUCCESS_MESSAGE:
          setInsertSuccess(true)
          setUpdateSuccess(false)
          break
        case UPDATE_SUCCESS_MESSAGE:
          setUpdateSuccess(true)
          setInsertSuccess(false)
          break
        default:
          data.message satisfies never
          break
      }
      // Turnstile disappears, form cannot be validly submitted
      onSubmit()
      // clear form values and reset turnstile, so new token can be fetched
      setTimeout(() => {
        reset()
        forceRender()
      }, 100)
    },
  })
  const { mutate: insertWaitlist, error, status } = submitInterestForm
  const handleSubmit = formProps.handleSubmit((data) => insertWaitlist(data))
  const isLoading = status === 'loading' || isTokenLoading
  return (
    <>
      <NextSeo title="Join the Waitlist" />
      <AuthLayout>
        <div className="flex flex-col">
          <Link href="/" aria-label="Home">
            <Logo className="h-10 w-auto" />
          </Link>
          <div className="mt-20">
            <h2 className="text-3xl font-semibold text-gray-900">
              Join the Waitlist
            </h2>
          </div>
        </div>
        <FormProvider {...formProps}>
          <form
            onSubmit={handleSubmit}
            className="mt-10 grid grid-cols-1 gap-y-8"
          >
            <EmailFieldInsert />
            <EmailProviderSelect />
            {emailProviderValue === 'other' ? (
              <>
                <InputField
                  error={errors.otherEmailProvider}
                  label="Your email provider"
                  placeholder="Your email provider"
                  register={register('otherEmailProvider')}
                />
              </>
            ) : null}
            <div>
              <Label>Anything else we should know?</Label>
              <Textarea
                className="mt-2"
                register={register('comments')}
                placeholder="Leave your comments here!"
              />
            </div>
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
                : 'Submit'}
            </Button>
            <StatusMessage
              status={status}
              insertSuccess={insertSuccess}
              updateSuccess={updateSuccess}
              errorMessage={error?.message}
            />
          </form>
        </FormProvider>
      </AuthLayout>
    </>
  )
}

interface StatusMessageProps {
  status: 'error' | 'idle' | 'loading' | 'success'
  insertSuccess: boolean
  updateSuccess: boolean
  errorMessage: string | undefined
}

const StatusMessage = ({
  status,
  insertSuccess,
  updateSuccess,
  errorMessage,
}: StatusMessageProps) => {
  return (
    <div className="text-center">
      {status === 'success' && insertSuccess ? (
        <div className="text-sm font-semibold">
          You&apos;ve joined the waitlist, stay tuned!
        </div>
      ) : null}
      {status === 'success' && updateSuccess ? (
        <div className="text-sm font-semibold">
          Your details have been updated!
        </div>
      ) : null}
      {status === 'error' ? (
        <ErrorMessageText className="text-sm font-semibold">
          {errorMessage}
        </ErrorMessageText>
      ) : null}
    </div>
  )
}
