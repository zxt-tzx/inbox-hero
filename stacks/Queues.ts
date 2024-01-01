import { Duration } from 'aws-cdk-lib/core'
import { Queue, use, type StackContext } from 'sst/constructs'

import { Secrets } from './Secrets'

export function Queues({ stack }: StackContext) {
  const {
    APP_ENV,
    DATABASE_URL,
    NEXT_PUBLIC_APP_URL,
    RESEND_API_KEY,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
  } = use(Secrets)
  const resendQueue = new Queue(stack, 'resendQueue', {
    consumer: {
      function: {
        handler: 'src/serverless/email/resend-consumer.handler',
        timeout: 100,
        bind: [DATABASE_URL, NEXT_PUBLIC_APP_URL, RESEND_API_KEY],
        // currentVersionOptions: {
        //   provisionedConcurrentExecutions: 1,
        // },
        // deadLetterQueue: queue.cdk.queue,
        // deadLetterQueueEnabled: true,
      },
      // cdk: {
      //   eventSource: {
      //     batchSize: 5,
      //     maxConcurrency: 1,
      //   },
      // },
    },
    cdk: {
      queue: {
        // from AWS docs: To allow your function time to process each batch of records
        // set the source queue's visibility timeout to at least six times the timeout that you configure on your function
        visibilityTimeout: Duration.seconds(600),
      },
    },
  })

  const gmailQueue = new Queue(stack, 'gmailQueue', {
    consumer: {
      function: {
        handler: 'src/serverless/gmail/gmail-consumer.handler',
        timeout: '15 minutes', // need maximum in case job takes a long time?
        bind: [APP_ENV, DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET],
      },
      cdk: {
        eventSource: {
          batchSize: 1, // work on one job at a time
        },
      },
    },
    cdk: {
      queue: {
        visibilityTimeout: Duration.minutes(18),
      },
    },
  })

  resendQueue.bind([gmailQueue]) // needed to send error emails via gmailQueue

  return { resendQueue, gmailQueue }
}
