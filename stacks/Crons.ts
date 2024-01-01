import { Cron, use, type StackContext } from 'sst/constructs'

import { Queues } from './Queues'
import { Secrets } from './Secrets'

export function Crons({ stack }: StackContext) {
  const { resendQueue, gmailQueue } = use(Queues)
  const {
    APP_ENV,
    DATABASE_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_GOOGLE_PUBLISHING_STATUS,
    RESEND_API_KEY,
    NEXT_PUBLIC_APP_URL,
    GOOGLE_PUBSUB_SUBSCRIPTION,
  } = use(Secrets)

  const sendScreenerCron = new Cron(stack, 'sendScreenerCron', {
    schedule: 'cron(0/30 * * * ? *)', // run every 30 minutes
    job: {
      function: {
        handler: 'src/serverless/cron/screener.handler',
        bind: [
          DATABASE_URL,
          GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET,
          NEXT_PUBLIC_APP_URL,
        ],
        timeout: '15 minutes',
      },
    },
  })
  const gmailWatchCron = new Cron(stack, 'gmailWatchCron', {
    schedule: 'cron(0 0/12 * * ? *)', // run every 12 hours
    job: {
      function: {
        handler: 'src/serverless/cron/watch.handler',
        bind: [APP_ENV, DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET],
        timeout: '15 minutes',
      },
    },
  })

  const refreshTokenReminderCron = new Cron(stack, 'refreshTokenCron', {
    schedule: 'cron(0 * * * ? *)', // run every hour
    job: {
      function: {
        handler: 'src/serverless/cron/auth-expiry.handler',
        bind: [
          DATABASE_URL,
          GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET,
          NEXT_PUBLIC_GOOGLE_PUBLISHING_STATUS,
          RESEND_API_KEY,
          NEXT_PUBLIC_APP_URL,
          resendQueue,
        ],
        timeout: '15 minutes',
      },
    },
  })
  // this is only used for development
  new Cron(stack, 'devCron', {
    // cron that will only run in 2199
    schedule: 'cron(0 0 1 1 ? 2199)',
    job: {
      function: {
        handler: 'src/serverless/cron/dev.handler',
        bind: [
          DATABASE_URL,
          GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET,
          RESEND_API_KEY,
          NEXT_PUBLIC_APP_URL,
          gmailQueue,
          GOOGLE_PUBSUB_SUBSCRIPTION,
        ],
        timeout: '15 minutes',
      },
    },
  })
  return {
    gmailWatchCron,
    refreshTokenReminderCron,
    sendScreenerCron,
  }
}
