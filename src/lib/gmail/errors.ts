import { GaxiosError } from 'gaxios'

export class RefreshTokenExpiredError extends Error {
  constructor(gmailId: string) {
    super(`RefreshTokenExpiredError: ${gmailId}`)
  }
}

export class GmailInvalidCredentialsError extends Error {
  constructor(email: string) {
    super(`GmailInvalidCredentialsError: ${email}.`)
  }
}

export class GmailApiUnknownError extends Error {
  constructor(e: string) {
    super(`GmailApiUnknownError:  ${e}`)
  }
}

export function isInvalidCredentialsError(e: unknown) {
  return (
    e instanceof GaxiosError &&
    (e.message.match('Invalid Credentials') || e.message.match('invalid_grant'))
  )
}

export function isRequestedEntityNotFoundError(e: unknown) {
  return e instanceof Error && e.message.match('Requested entity was not found')
}

// TODO: if run into this error, stop calling Gmail APIs
export function isQuotaMetricExceededError(e: unknown) {
  return (
    e instanceof Error && e.message.match('Quota exceeded for quota metric')
  )
}

export function isTooManyConcurrentRequestsError(e: unknown) {
  return (
    e instanceof Error &&
    e.message.match('Too many concurrent requests for user')
  )
}

export class RequestedEntityNotFoundError extends Error {
  constructor(message: string) {
    super('RequestedEntityNotFoundError: ' + message)
  }
}
