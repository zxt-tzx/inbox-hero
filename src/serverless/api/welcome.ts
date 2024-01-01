import { createHash } from 'crypto'
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
} from 'aws-lambda'
import { stringify } from 'superjson'
import { z } from 'zod'

import { enqueueWelcomeEmails } from '~/lib/email/email.service'
import { gmailInputSchema } from '~/schemas/gmail.schema'

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const res = welcomeEmailEventSchema.safeParse(event)
  if (!res.success) {
    console.error('parsed failed')
    console.log(stringify(event))
    return {
      statusCode: 400,
      body: 'Invalid request body',
    }
  }
  const { emails, secret } = res.data
  if (hashInput(secret) !== HASH_MATCH) {
    console.error('secret mismatch')
    console.log(stringify(event))
    return {
      statusCode: 400,
      body: 'Invalid secret',
    }
  }
  await enqueueWelcomeEmails(emails)
  return {
    statusCode: 200,
    body: 'OK',
  }
}

function hashInput(input: string) {
  return createHash('sha256').update(input).digest('hex')
}

const HASH_MATCH =
  '756bc47cb5215dc3329ca7e1f7be33a2dad68990bb94b76d90aa07f4e44a233a'

const welcomeEmailEventSchema = z.object({
  emails: z.array(gmailInputSchema),
  secret: z.string(),
})
