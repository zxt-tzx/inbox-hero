import { useState } from 'react'

export type TurnstileSize = 'normal' | 'compact' | 'invisible'

export const useTurnstile = () => {
  const [isTokenLoading, setIsTokenLoading] = useState(true)
  const [token, setToken] = useState<string>()
  const [isTokenError, setIsTokenError] = useState<boolean>()
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)
  const [size, setSize] = useState<TurnstileSize>('invisible')

  const onTokenSuccess = (token: string) => {
    setIsTokenLoading(false)
    setToken(token)
  }

  const onTokenError = () => {
    setIsTokenLoading(false)
    setIsTokenError(true)
  }

  const onSubmit = () => {
    setHasSubmitted(true)
  }

  const forceRender = () => {
    setHasSubmitted(false)
  }

  return {
    isTokenLoading,
    token,
    isTokenError,
    onTokenSuccess,
    onTokenError,
    forceRender,
    onSubmit,
    hasSubmitted,
    size,
    setSize,
  }
}
