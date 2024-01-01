import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import { Queue } from 'sst/node/queue'
import type { z } from 'zod'

import {
  convertEmailToSqsMessageBody,
  type authExpired,
  type waitlistSignup,
  type welcome,
} from '~/serverless/email/sqs'

const sqs = new SQSClient({})

export const enqueueWaitlistEmail = async (to: string) => {
  const sqsMessageBody: z.infer<typeof waitlistSignup> = {
    emailType: 'waitlist_signup',
    to,
  }
  const command = new SendMessageCommand({
    QueueUrl: Queue.resendQueue.queueUrl,
    MessageBody: convertEmailToSqsMessageBody(sqsMessageBody),
  })
  await sqs.send(command)
}

export const enqueueAuthExpiredEmail = async (to: string) => {
  const sqsMessageBody: z.infer<typeof authExpired> = {
    emailType: 'auth_expired',
    to,
  }
  const command = new SendMessageCommand({
    QueueUrl: Queue.resendQueue.queueUrl,
    MessageBody: convertEmailToSqsMessageBody(sqsMessageBody),
  })
  await sqs.send(command)
}

export const enqueueWelcomeEmails = async (emails: string[]) => {
  await Promise.all(
    emails.map(async (email) => {
      const sqsMessageBody: z.infer<typeof welcome> = {
        emailType: 'welcome',
        to: email,
      }
      const command = new SendMessageCommand({
        QueueUrl: Queue.resendQueue.queueUrl,
        MessageBody: convertEmailToSqsMessageBody(sqsMessageBody),
      })
      await sqs.send(command)
    }),
  )
}
