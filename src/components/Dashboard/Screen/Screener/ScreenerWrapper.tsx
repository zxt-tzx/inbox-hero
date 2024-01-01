import { useRouter } from 'next/router'
import { AlertCircle, Palmtree } from 'lucide-react'
import ConfettiExplosion from 'react-confetti-explosion'

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { RetrieveEmailsToScreen } from './RetrieveEmailsToScreen'
import { useScreener } from './ScreenerProvider'
import { ScreeningTable } from './ScreeningTable/ScreeningTable'

export function ScreenerWrapper() {
  const { userId, sessionUserId, retrieved, showConfetti } = useScreener()
  // if sessionUserId is null -> no session, should not show alert
  const showAlert = !!sessionUserId && userId !== sessionUserId
  if (showAlert) {
    return <UserMismatchAlert />
  }
  return (
    <>
      {!retrieved && <RetrieveEmailsToScreen />}
      {retrieved && <ScreeningTable />}
      {showConfetti && (
        <div className="sticky bottom-0 flex items-center justify-center">
          <ConfettiExplosion
            force={0.4}
            particleCount={100}
            duration={2200}
            width={400}
            height={'200vh'}
          />
        </div>
      )}
    </>
  )
}

function UserMismatchAlert() {
  return (
    <div className="flex h-48 items-center justify-center">
      <Alert variant="destructive" className="mx-auto max-w-sm">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          You are not the intended recipient of this screener. Please check your
          link!
        </AlertDescription>
      </Alert>
    </div>
  )
}

export function ScreenerNotFoundAlert() {
  const router = useRouter()
  return (
    <div className="flex h-48 flex-col items-center justify-center">
      <Alert className="mx-auto max-w-sm">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>
          Please check your link is correct and has not expired!
        </AlertDescription>
      </Alert>
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mx-auto mt-5"
      >
        Go back
      </Button>
    </div>
  )
}

export function NothingToScreen() {
  return (
    <div className="flex h-72 flex-col items-center justify-center">
      <Palmtree className="h-48 w-48" />
      <p className="text-md mt-5">You have no emails to screen!</p>
    </div>
  )
}
