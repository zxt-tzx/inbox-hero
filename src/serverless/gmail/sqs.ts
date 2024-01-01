import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import { Queue } from 'sst/node/queue'
import SuperJSON from 'superjson'
import { z } from 'zod'

import { checkSqsMessageBodySize } from '../email/sqs'

type GmailJobType = z.infer<
  | typeof wlRecentlyReadSenders
  | typeof wlRecentlySentSenders
  | typeof sendRuntimeErrorEmail
  | typeof sendNotifyMeEmail
  | typeof moveLimboEmailsToInbox
  | typeof updateScreeningResults
  | typeof sendActivationSuccessfulEmail
  | typeof setWatch
  | typeof stopWatch
  | typeof moveTrashedEmailsToInbox
>['gmailJobType']

type Input = {
  gmailJobType: GmailJobType
  [key: string]: unknown
}

const wlRecentlyReadSenders = z.object({
  gmailJobType: z.literal('wlRecentlyReadSenders'),
  userId: z.string(),
  recencyInDays: z.number(),
})

const wlRecentlySentSenders = z.object({
  gmailJobType: z.literal('wlRecentlySentSenders'),
  userId: z.string(),
  recencyInDays: z.number(),
})

const moveTrashedEmailsToInbox = z.object({
  gmailJobType: z.literal('moveTrashedEmailsToInbox'),
  userId: z.string(),
  senders: z.array(z.string().email()),
})

const sendRuntimeErrorEmail = z.object({
  gmailJobType: z.literal('sendRuntimeErrorEmail'),
  subject: z.string(),
  message: z.string(),
})

const sendNotifyMeEmail = z.object({
  gmailJobType: z.literal('sendNotifyMeEmail'),
  subject: z.string(),
  message: z.string(),
})

const moveLimboEmailsToInbox = z.object({
  gmailJobType: z.literal('moveLimboEmailsToInbox'),
  userId: z.string(),
})

const updateScreeningResults = z.object({
  gmailJobType: z.literal('updateScreeningResults'),
  userId: z.string(),
})

const sendActivationSuccessfulEmail = z.object({
  gmailJobType: z.literal('sendActivationSuccessfulEmail'),
  userId: z.string(),
  timezone: z.string(),
  dailyScreenerTime: z.string(),
  baseUrl: z.string(),
})

const setWatch = z.object({
  gmailJobType: z.literal('setWatch'),
  userId: z.string(),
})

const stopWatch = z.object({
  gmailJobType: z.literal('stopWatch'),
  userId: z.string(),
})

export const convertGmailJobToSqsMessageBody = (input: Input) => {
  const messageBody = SuperJSON.stringify(input)
  checkSqsMessageBodySize(messageBody)
  const { gmailJobType } = input
  switch (gmailJobType) {
    case 'wlRecentlyReadSenders':
      wlRecentlyReadSenders.parse(input)
      break
    case 'wlRecentlySentSenders':
      wlRecentlySentSenders.parse(input)
      break
    case 'sendRuntimeErrorEmail':
      sendRuntimeErrorEmail.parse(input)
      break
    case 'sendNotifyMeEmail':
      sendNotifyMeEmail.parse(input)
      break
    case 'moveLimboEmailsToInbox':
      moveLimboEmailsToInbox.parse(input)
      break
    case 'updateScreeningResults':
      updateScreeningResults.parse(input)
      break
    case 'sendActivationSuccessfulEmail':
      sendActivationSuccessfulEmail.parse(input)
      break
    case 'setWatch': {
      setWatch.parse(input)
      break
    }
    case 'stopWatch': {
      stopWatch.parse(input)
      break
    }
    case 'moveTrashedEmailsToInbox': {
      moveTrashedEmailsToInbox.parse(input)
      break
    }
    default:
      gmailJobType satisfies never
      throw new Error('Invalid message body')
  }
  return messageBody
}

export const parseSqsGmailJobMessageBody = (messageBody: string) => {
  const parsed = SuperJSON.parse<Input>(messageBody)

  const { gmailJobType } = parsed
  switch (gmailJobType) {
    case 'wlRecentlyReadSenders':
      return wlRecentlyReadSenders.parse(parsed)
    case 'wlRecentlySentSenders':
      return wlRecentlySentSenders.parse(parsed)
    case 'sendRuntimeErrorEmail':
      return sendRuntimeErrorEmail.parse(parsed)
    case 'sendNotifyMeEmail':
      return sendNotifyMeEmail.parse(parsed)
    case 'moveLimboEmailsToInbox':
      return moveLimboEmailsToInbox.parse(parsed)
    case 'updateScreeningResults':
      return updateScreeningResults.parse(parsed)
    case 'sendActivationSuccessfulEmail':
      return sendActivationSuccessfulEmail.parse(parsed)
    case 'setWatch':
      return setWatch.parse(parsed)
    case 'stopWatch':
      return stopWatch.parse(parsed)
    case 'moveTrashedEmailsToInbox':
      return moveTrashedEmailsToInbox.parse(parsed)
    default:
      gmailJobType satisfies never
      throw new Error('Invalid message body')
  }
}

const sqs = new SQSClient({})

export const enqueueMoveTrashedEmailsToInbox = async ({
  userId,
  senders,
}: {
  userId: string
  senders: string[]
}) => {
  const sqsMessageBody: z.infer<typeof moveTrashedEmailsToInbox> = {
    gmailJobType: 'moveTrashedEmailsToInbox',
    userId,
    senders,
  }
  const command = new SendMessageCommand({
    QueueUrl: Queue.gmailQueue.queueUrl,
    MessageBody: convertGmailJobToSqsMessageBody(sqsMessageBody),
  })
  await sqs.send(command)
}

export const enqueueWlRecentlySentSenders = async (userId: string) => {
  const sqsMessageBody: z.infer<typeof wlRecentlySentSenders> = {
    gmailJobType: 'wlRecentlySentSenders',
    userId,
    recencyInDays: 7,
  }
  const command = new SendMessageCommand({
    QueueUrl: Queue.gmailQueue.queueUrl,
    MessageBody: convertGmailJobToSqsMessageBody(sqsMessageBody),
  })
  await sqs.send(command)
}

export const enqueueWlRecentlyReadSenders = async (userId: string) => {
  const sqsMessageBody: z.infer<typeof wlRecentlyReadSenders> = {
    gmailJobType: 'wlRecentlyReadSenders',
    userId,
    recencyInDays: 7,
  }
  const command = new SendMessageCommand({
    QueueUrl: Queue.gmailQueue.queueUrl,
    MessageBody: convertGmailJobToSqsMessageBody(sqsMessageBody),
  })
  await sqs.send(command)
}

export const enqueueRuntimeErrorEmail = async ({
  subject,
  message,
}: {
  subject: string
  message: string
}) => {
  const sqsMessageBody: z.infer<typeof sendRuntimeErrorEmail> = {
    gmailJobType: 'sendRuntimeErrorEmail',
    subject,
    message,
  }
  const command = new SendMessageCommand({
    QueueUrl: Queue.gmailQueue.queueUrl,
    MessageBody: convertGmailJobToSqsMessageBody(sqsMessageBody),
  })
  await sqs.send(command)
}

export const enqueueNotifyMeEmail = async ({
  subject,
  message,
}: {
  subject: string
  message: string
}) => {
  const sqsMessageBody: z.infer<typeof sendNotifyMeEmail> = {
    gmailJobType: 'sendNotifyMeEmail',
    subject,
    message,
  }
  const command = new SendMessageCommand({
    QueueUrl: Queue.gmailQueue.queueUrl,
    MessageBody: convertGmailJobToSqsMessageBody(sqsMessageBody),
  })
  await sqs.send(command)
}

export const enqueueMoveLimboEmailsToInbox = async (userId: string) => {
  const sqsMessageBody: z.infer<typeof moveLimboEmailsToInbox> = {
    gmailJobType: 'moveLimboEmailsToInbox',
    userId,
  }
  const command = new SendMessageCommand({
    QueueUrl: Queue.gmailQueue.queueUrl,
    MessageBody: convertGmailJobToSqsMessageBody(sqsMessageBody),
  })
  await sqs.send(command)
}

export const enqueueUpdateScreeningResults = async (userId: string) => {
  const sqsMessageBody: z.infer<typeof updateScreeningResults> = {
    gmailJobType: 'updateScreeningResults',
    userId,
  }
  const command = new SendMessageCommand({
    QueueUrl: Queue.gmailQueue.queueUrl,
    MessageBody: convertGmailJobToSqsMessageBody(sqsMessageBody),
  })
  await sqs.send(command)
}

export const enqueueActivationSuccessfulEmail = async ({
  baseUrl,
  userId,
  timezone,
  dailyScreenerTime,
}: {
  baseUrl: string
  userId: string
  timezone: string
  dailyScreenerTime: string
}) => {
  const sqsMessageBody: z.infer<typeof sendActivationSuccessfulEmail> = {
    gmailJobType: 'sendActivationSuccessfulEmail',
    baseUrl,
    userId,
    timezone,
    dailyScreenerTime,
  }
  const command = new SendMessageCommand({
    QueueUrl: Queue.gmailQueue.queueUrl,
    MessageBody: convertGmailJobToSqsMessageBody(sqsMessageBody),
  })
  await sqs.send(command)
}

export const enqueueSetWatch = async (userId: string) => {
  const sqsMessageBody: z.infer<typeof setWatch> = {
    gmailJobType: 'setWatch',
    userId,
  }
  const command = new SendMessageCommand({
    QueueUrl: Queue.gmailQueue.queueUrl,
    MessageBody: convertGmailJobToSqsMessageBody(sqsMessageBody),
  })
  await sqs.send(command)
}

export const enqueueStopWatch = async (userId: string) => {
  const sqsMessageBody: z.infer<typeof stopWatch> = {
    gmailJobType: 'stopWatch',
    userId,
  }
  const command = new SendMessageCommand({
    QueueUrl: Queue.gmailQueue.queueUrl,
    MessageBody: convertGmailJobToSqsMessageBody(sqsMessageBody),
  })
  await sqs.send(command)
}
