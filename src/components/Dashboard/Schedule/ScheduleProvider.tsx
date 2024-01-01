import {
  createContext,
  useContext,
  useMemo,
  useState,
  type FC,
  type PropsWithChildren,
} from 'react'

import { dayjs } from '~/lib/time/dayjs'
import {
  getDailyScreenerTimeOptions,
  getFormattedTimezoneOptions,
} from '~/lib/time/screener.utils'
import { trpc } from '~/lib/trpc'

const useScheduleProvider = () => {
  const [isEditingForm, setIsEditingForm] = useState(false)
  const userTimezone = useMemo(() => {
    return dayjs.tz.guess()
  }, [])
  const timezoneOptions = useMemo(() => {
    return getFormattedTimezoneOptions()
  }, [])
  const { timeOptions, defaultScreenerTime } = useMemo(() => {
    return getDailyScreenerTimeOptions()
  }, [])
  const [data] = trpc.screener.schedule.get.useSuspenseQuery()
  const { dailyScreenerInfo, refreshTokenInfo, hasCompletedOnboarding } = data
  return {
    userTimezone,
    timezoneOptions,
    timeOptions,
    defaultScreenerTime,
    isEditingForm,
    setIsEditingForm,
    dailyScreenerInfo,
    refreshTokenInfo,
    hasCompletedOnboarding,
  }
}

type ScheduleContextReturn = ReturnType<typeof useScheduleProvider> | undefined

const ScheduleContext = createContext<ScheduleContextReturn>(undefined)

export const ScheduleProvider: FC<PropsWithChildren> = ({ children }) => {
  const values = useScheduleProvider()
  return (
    <ScheduleContext.Provider value={values}>
      {children}
    </ScheduleContext.Provider>
  )
}

export const useSchedule = () => {
  const context = useContext(ScheduleContext)
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider')
  }
  return context
}
