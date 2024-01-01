import { GoogleAuthCard } from '../Authorization/GoogleAuthCard'
import { ReauthorizationCard } from '../Authorization/ReauthorizationCard'
import { OnboardingCard } from '../Onboarding/OnboardingCard'
import { EditScheduleForm } from './EditScheduleForm'
import { useSchedule } from './ScheduleProvider'
import { SetScheduleForm } from './SetScheduleForm'

export function PolymorphicScheduleForm() {
  const {
    dailyScreenerInfo: { hasSetSchedule },
    refreshTokenInfo: { hasGrantedPermission, promptUserToRefreshToken },
    hasCompletedOnboarding,
  } = useSchedule()

  return !hasSetSchedule ? (
    <SetScheduleForm />
  ) : !hasGrantedPermission ? (
    <GoogleAuthCard />
  ) : promptUserToRefreshToken ? (
    <ReauthorizationCard />
  ) : !hasCompletedOnboarding ? (
    <OnboardingCard />
  ) : (
    <EditScheduleForm />
  )
}
