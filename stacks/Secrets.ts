import { Config, type StackContext } from 'sst/constructs'

export function Secrets({ stack }: StackContext) {
  const RESEND_API_KEY = new Config.Secret(stack, 'RESEND_API_KEY')
  const NEXT_PUBLIC_APP_URL = new Config.Secret(stack, 'NEXT_PUBLIC_APP_URL')
  const DATABASE_URL = new Config.Secret(stack, 'DATABASE_URL')
  const GOOGLE_CLIENT_ID = new Config.Secret(stack, 'GOOGLE_CLIENT_ID')
  const GOOGLE_CLIENT_SECRET = new Config.Secret(stack, 'GOOGLE_CLIENT_SECRET')
  const NEXT_PUBLIC_GOOGLE_PUBLISHING_STATUS = new Config.Secret(
    stack,
    'NEXT_PUBLIC_GOOGLE_PUBLISHING_STATUS',
  )
  const GOOGLE_PUBSUB_SUBSCRIPTION = new Config.Secret(
    stack,
    'GOOGLE_PUBSUB_SUBSCRIPTION',
  )
  const APP_ENV = new Config.Secret(stack, 'APP_ENV')
  return {
    APP_ENV,
    RESEND_API_KEY,
    NEXT_PUBLIC_APP_URL,
    DATABASE_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_GOOGLE_PUBLISHING_STATUS,
    GOOGLE_PUBSUB_SUBSCRIPTION,
  }
}
