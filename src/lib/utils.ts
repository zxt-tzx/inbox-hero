import { TRPCError } from '@trpc/server'
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: string | number): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function removeHttp(url: string) {
  if (url.startsWith('https://')) {
    const https = 'https://'
    return url.slice(https.length)
  }

  if (url.startsWith('http://')) {
    const http = 'http://'
    return url.slice(http.length)
  }

  return url
}

export function trpcAssert<T>(
  condition: T extends Promise<unknown> ? never : T,
  msg: string,
  code: TRPC_ERROR_CODE_KEY = 'INTERNAL_SERVER_ERROR',
): asserts condition {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!condition) {
    throw new TRPCError({
      code,
      message: msg,
    })
  }
}
export function partition<T>(
  array: T[],
  isValid: (element: T) => boolean,
): [T[], T[]] {
  return [array.filter(isValid), array.filter((element) => !isValid(element))]
}

export const INSERT_SUCCESS_MESSAGE = 'insert-success'

export const UPDATE_SUCCESS_MESSAGE = 'update-success'

export function toCapitalCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
