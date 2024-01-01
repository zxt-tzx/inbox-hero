import { useFormContext } from 'react-hook-form'
import { type z } from 'zod'

import { InputField } from '~/components/Fields'
import {
  type checkWaitlistSchema,
  type insertWaitlistSchema,
} from '~/schemas/waitlist.schema'

export const EmailFieldInsert = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<z.infer<typeof insertWaitlistSchema>>()
  return (
    <>
      <InputField
        label="Email address"
        className="text-md py-2"
        placeholder="Enter your email"
        autoComplete="email"
        error={errors.email}
        customErrorMessage="Are you sure that's a valid email?"
        register={register('email')}
      />
    </>
  )
}

// TODO: abstract in the future, don't waste time now

export const EmailFieldCheck = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<z.infer<typeof checkWaitlistSchema>>()
  return (
    <>
      <InputField
        label="Email address"
        className="text-md py-2"
        placeholder="Enter your email"
        autoComplete="email"
        error={errors.email}
        customErrorMessage="Are you sure that's a valid email?"
        register={register('email')}
      />
    </>
  )
}
