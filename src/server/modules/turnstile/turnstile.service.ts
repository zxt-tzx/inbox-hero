import wretch from 'wretch'

import { env } from '~/env.mjs'
import { trpcAssert } from '~/lib/utils'
import { tokenValidationSchema } from '~/schemas/turnstile.schema'

const CLOUDFLARE_VERIFY_ENDPOINT =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export const validateToken = async (token: string) => {
  const data = (await wretch(CLOUDFLARE_VERIFY_ENDPOINT)
    .headers({ 'content-type': 'application/x-www-form-urlencoded' })
    .post(
      `secret=${encodeURIComponent(
        env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
      )}&response=${encodeURIComponent(token)}`,
    )
    .res((res) => res.json())) as unknown

  const validationResult = tokenValidationSchema.safeParse(data)
  trpcAssert(
    validationResult.success,
    'Turnstile token is invalid',
    'INTERNAL_SERVER_ERROR',
  )
  return validationResult.data
}
