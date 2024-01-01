import { now, ZonedDateTime } from '@internationalized/date'
import { rawTimeZones } from '@vvo/tzdb'

import { dayjs } from '~/lib/time/dayjs'

export function getFormattedTimezoneOptions() {
  return rawTimeZones.map((tzObject) => {
    const offsetString = tzObject.rawFormat.split(' ')[0]
    const formattedOffsetString = `(GMT${offsetString})`
    const formattedName = tzObject.name.split('/')[1]?.replace(/_/g, ' ')
    return {
      value: tzObject.name,
      label: `${formattedOffsetString} ${tzObject.alternativeName} - ${formattedName}`,
    }
  })
}

export function getDailyScreenerTimeOptions() {
  // allow user to select 30 minute intervals
  const hours = Array.from(Array(24).keys())
  const mins = [0, 30]
  const timeOptions = hours.flatMap((hour) => {
    const hourString = hour.toString().padStart(2, '0')
    return mins.map((min) => {
      const minString = min.toString().padStart(2, '0')
      return `${hourString}:${minString}`
    })
  })
  return { timeOptions, defaultScreenerTime: '09:00' }
}

export function getNextScreenerTimings(
  dailyScreenerTime: string | null,
  timezone: string | null,
) {
  if (!dailyScreenerTime || !timezone) {
    throw new Error(
      'dailyScreenerTime or timezone is null (or an empty string)',
    )
  }
  const { hour, minute } = validateDailyScreenerTime(dailyScreenerTime)
  const timeNow = now(timezone)
  const candidateScheduledAt = new ZonedDateTime(
    timeNow.year,
    timeNow.month,
    timeNow.day,
    timezone,
    timeNow.offset,
    hour,
    minute,
    0,
    0,
  )
  const scheduledAt =
    candidateScheduledAt.compare(timeNow) <= 0
      ? candidateScheduledAt.add({ days: 1 })
      : candidateScheduledAt
  return {
    scheduledAt,
    expireAt: scheduledAt.add({ days: 1 }),
  }
}

export const validateDailyScreenerTime = (dailyScreenerTime: string) => {
  // format is HH:MM
  const [hour, minute] = dailyScreenerTime.split(':').map(Number)
  if (
    hour === undefined ||
    minute === undefined ||
    isNaN(hour) ||
    isNaN(minute) ||
    dailyScreenerTime.length !== 5 ||
    dailyScreenerTime[2] !== ':' ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error('dailyScreenerTime is not in the correct format')
  }
  return {
    hour,
    minute,
  }
}

// make this dumb since it's just for display
export const formatScheduledAt = (
  scheduledAtDate: Date,
  dailyScreenerTime: string,
  timezone: string,
) => {
  const date = dayjs(scheduledAtDate).tz(timezone)
  const year = date.year()
  const month = date.month()
  const day = date.date()
  const { hour, minute } = validateDailyScreenerTime(dailyScreenerTime)
  return dayjs({
    year,
    month,
    day,
    hour,
    minute,
  })
    .tz(timezone)
    .format('ddd, D MMM YYYY, h:mm a')
}

export const formatDailyScreenerTime = (dailyScreenerTime: string) => {
  return dayjs(dailyScreenerTime, 'HH:mm').format('h:mmA')
}

export const formatTimezoneShort = (timezone: string) => {
  const tzObject = rawTimeZones.find((tz) => tz.name === timezone)
  if (!tzObject) {
    throw new Error('invalid timezone')
  }
  const offsetString = tzObject.rawFormat.split(' ')[0]
  const formattedOffsetString = `(GMT${offsetString})`
  return `${formattedOffsetString} ${tzObject.alternativeName}`
}
