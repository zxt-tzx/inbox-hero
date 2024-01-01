import { Turnstile as TurnstileWidget } from '@marsidev/react-turnstile'

import type { TurnstileSize } from './useTurnstile'

interface TurnstileProps {
  siteKey: string
  hasSubmitted: boolean
  onSuccess: (token: string) => void
  onError: () => void
  setSize: (size: TurnstileSize) => void
  size: TurnstileSize
}

export const Turnstile = ({
  siteKey,
  onSuccess,
  onError,
  hasSubmitted,
  size,
  setSize,
}: TurnstileProps) => {
  return (
    !hasSubmitted && (
      <TurnstileWidget
        siteKey={siteKey}
        onSuccess={onSuccess}
        onError={onError}
        onBeforeInteractive={() => setSize('normal')}
        options={{ size }}
      />
    )
  )
}
