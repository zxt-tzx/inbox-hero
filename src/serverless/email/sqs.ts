import SuperJSON from 'superjson'
import { z } from 'zod'

import { emailInsertSchema } from '~/schemas/email.schema'

export const checkSqsMessageBodySize = (messageBody: string) => {
  if (messageBody.length > 256 * 1024) {
    throw new Error('Message body must be smaller than 256 KB')
  }
}

const emailMessageBase = emailInsertSchema.pick({
  emailType: true,
})

type EmailType = z.infer<typeof emailMessageBase>['emailType']
type Input = {
  emailType: EmailType
  [key: string]: unknown
}

export const waitlistSignup = emailMessageBase.extend({
  emailType: z.literal('waitlist_signup'),
  to: z.string().email(),
})

export const authExpired = emailMessageBase.extend({
  emailType: z.literal('auth_expired'),
  to: z.string().email(),
})

export const welcome = emailMessageBase.extend({
  emailType: z.literal('welcome'),
  to: z.string().email(),
})

export const convertEmailToSqsMessageBody = (input: Input) => {
  const messageBody = SuperJSON.stringify(input)
  checkSqsMessageBodySize(messageBody)
  const { emailType } = input
  switch (emailType) {
    case 'waitlist_signup':
      waitlistSignup.parse(input)
      break
    case 'auth_expired':
      authExpired.parse(input)
      break
    case 'welcome':
      welcome.parse(input)
      break
    case 'runtime_error':
      // this should be sent via Gmail API
      throw new Error('Not implemented')
    case 'auth_expiring_soon':
      // this should be sent via Gmail API
      throw new Error('Not implemented')
    case 'screener':
      // this should be sent via Gmail API
      throw new Error('Not implemented')
    case 'successful_activation':
      // this should be sent via Gmail API
      throw new Error('Not implemented')
    case 'notify_me':
      // this should be sent via Gmail API
      throw new Error('Not implemented')
    default:
      emailType satisfies never
      throw new Error('Invalid message body')
  }
  return messageBody
}

export const parseSqsEmailMessageBody = (messageBody: string) => {
  const parsed = SuperJSON.parse<Input>(messageBody)
  const { emailType } = parsed
  switch (emailType) {
    case 'waitlist_signup':
      return waitlistSignup.parse(parsed)
    case 'auth_expired':
      return authExpired.parse(parsed)
    case 'welcome':
      return welcome.parse(parsed)
    case 'runtime_error':
      // this should be sent via Gmail API
      throw new Error('Not implemented')
    case 'auth_expiring_soon':
      // this should be sent via Gmail API
      throw new Error('Not implemented')
    case 'screener':
      // this should be sent via Gmail API
      throw new Error('Not implemented')
    case 'successful_activation':
      // this should be sent via Gmail API
      throw new Error('Not implemented')
    case 'notify_me':
      // this should be sent via Gmail API
      throw new Error('Not implemented')
    default:
      emailType satisfies never
      throw new Error('Invalid message body')
  }
}
