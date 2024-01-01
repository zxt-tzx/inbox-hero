import { env } from '~/env.mjs'
import { dayjs } from '~/lib/time/dayjs'

export function getRefreshTokenExpireAt() {
  const googlePublishingStatus = env.NEXT_PUBLIC_GOOGLE_PUBLISHING_STATUS
  const now = dayjs.utc()
  switch (googlePublishingStatus) {
    case 'testing': {
      return now.add(7, 'day').toDate()
    }
    case 'production': {
      return null
    }
    default: {
      googlePublishingStatus satisfies never
      throw new Error('invalid googlePublishingStatus')
    }
  }
}
