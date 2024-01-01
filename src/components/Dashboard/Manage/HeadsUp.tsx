import { RocketLaunchIcon } from '@heroicons/react/24/outline'

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'

interface HeadsUpProps {
  infoText: string
}
export function HeadsUp({ infoText }: HeadsUpProps) {
  return (
    <Alert>
      <RocketLaunchIcon className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>{infoText}</AlertDescription>
    </Alert>
  )
}
