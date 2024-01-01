import { eq } from 'drizzle-orm'

import { type db as dbClient } from '~/server/database/client'
import { users } from '~/server/database/model/user.model'
import { waitlist } from '~/server/database/model/waitlist.model'

export async function emailWhitelistStatus(db: typeof dbClient, email: string) {
  const [existingUser] = await db
    .select({
      email: waitlist.email,
      whitelisted: waitlist.whitelisted,
    })
    .from(waitlist)
    .where(eq(waitlist.email, email))
  if (!existingUser) {
    return {
      email,
      whitelistStatus: 'email_not_in_waitlist',
    } as const
  }
  const { whitelisted } = existingUser
  if (whitelisted) {
    const [accountCreated] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
    if (accountCreated) {
      return {
        email,
        whitelistStatus: 'account_created',
      } as const
    }
  }
  return {
    email: existingUser.email,
    whitelistStatus: existingUser.whitelisted
      ? 'whitelisted'
      : 'not_whitelisted',
  } as const
}
