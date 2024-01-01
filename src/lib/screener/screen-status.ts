import { and, eq } from 'drizzle-orm'
import type { PlanetScaleDatabase } from 'drizzle-orm/planetscale-serverless'

import { domains } from '~/server/database/model/domain.model'
import { senders } from '~/server/database/model/sender.model'

export async function checkEmailScreenStatus({
  userId,
  senderEmail,
  db,
  subject,
  body,
  snippet,
}: {
  userId: string
  senderEmail: string
  db: PlanetScaleDatabase
  body: string | undefined
  subject: string
  snippet: string
}) {
  // specific rule in sender table should override general rule in domain table
  const sendersTableStatus = await checkSendersTable({
    userId,
    senderEmail,
    db,
  })
  if (sendersTableStatus !== 'not_in_senders_table') {
    return sendersTableStatus
  }
  const domainsTableStatus = await checkDomainsTable({
    userId,
    senderEmail,
    db,
  })
  if (domainsTableStatus !== 'not_in_domains_table') {
    return domainsTableStatus
  }
  if (exceptionAllow({ subject, body, snippet })) {
    return 'in'
  }
  // not found in either table, not an OTP
  return 'to_screen'
}

function exceptionAllow({
  subject,
  body,
  snippet,
}: {
  subject: string
  body: string | undefined
  snippet: string
}) {
  if (
    containsOTPRelatedString(subject) ||
    containsPasswordResetRelatedString(subject) ||
    subject.toLowerCase().includes('otp')
  ) {
    return true
  }
  if (
    (containsOTPRelatedString(snippet) && containsSixDigitOtp(snippet, true)) ||
    (containsMagicLinkRelatedString(snippet) && containsMagicLink(snippet))
  ) {
    return true
  }
  if (body) {
    if (
      (containsOTPRelatedString(body) && containsSixDigitOtp(body, false)) ||
      (containsMagicLinkRelatedString(body) && containsMagicLink(body))
    ) {
      return true
    }
  }
  return false
}

function containsOTPRelatedString(text: string) {
  text = text.toLowerCase()
  return (
    text.includes('confirmation code') ||
    text.includes('login code') ||
    text.includes('one-time code') ||
    text.includes('one time code') ||
    text.includes('one-time password') ||
    text.includes('one time password') ||
    text.includes('one time passcode') ||
    text.includes('one-time passcode') ||
    text.includes('one-time pin') ||
    text.includes('one time pin') ||
    text.includes('verification code')
  )
}

function containsPasswordResetRelatedString(text: string) {
  text = text.toLowerCase()
  const includesReset = text.includes('reset')
  return (
    includesReset &&
    (text.includes('password') ||
      text.includes('passcode') ||
      text.includes('passphrase'))
  )
}

function containsMagicLinkRelatedString(text: string) {
  text = text.toLowerCase()
  return (
    text.includes('login link') ||
    text.includes('passwordless login') ||
    text.includes('magic link') ||
    text.includes('magic login')
  )
}

function containsMagicLink(text: string) {
  const regex = /https?:\/\/([\w.-]+\.)+[\w.-]+\/[\w/?/%&=_.-]{30,}/g
  return regex.test(text)
}

function containsSixDigitOtp(text: string, strict: boolean) {
  const regex = strict ? /\b\d{3}\s?\d{3}\b/g : /(?<!\d)\d{3}\s?\d{3}(?!\d)/g
  return regex.test(text)
}

async function checkSendersTable({
  userId,
  senderEmail,
  db,
}: {
  userId: string
  senderEmail: string
  db: PlanetScaleDatabase
}) {
  const [sender] = await db
    .select()
    .from(senders)
    .where(and(eq(senders.email, senderEmail), eq(senders.userId, userId)))
  if (!sender) {
    return 'not_in_senders_table'
  }
  return sender.screenStatus
}

async function checkDomainsTable({
  userId,
  senderEmail,
  db,
}: {
  userId: string
  senderEmail: string
  db: PlanetScaleDatabase
}) {
  const senderDomain = '@' + senderEmail.split('@').pop()
  if (senderDomain === '@inboxhero.org') {
    return 'in'
  }
  const [domain] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.domain, senderDomain), eq(domains.userId, userId)))
  if (!domain) {
    return 'not_in_domains_table'
  }
  return domain.screenStatus
}
