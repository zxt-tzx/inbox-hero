import { useSchedule } from './ScheduleProvider'

export function ScheduleHeader() {
  const {
    refreshTokenInfo: { promptUserToRefreshToken, hasGrantedPermission },
  } = useSchedule()
  return (
    <div className="relative isolate overflow-hidden pt-2 sm:pt-4">
      <header className="py-3 sm:py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 sm:flex-nowrap">
          <h1 className="text-2xl font-semibold leading-7 text-gray-900 sm:text-3xl">
            {!hasGrantedPermission || promptUserToRefreshToken
              ? 'Access'
              : 'Schedule'}
          </h1>
        </div>
      </header>
    </div>
  )
}
