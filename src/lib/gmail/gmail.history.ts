import { eq } from 'drizzle-orm'
import type { PlanetScaleDatabase } from 'drizzle-orm/planetscale-serverless'

import { users } from '~/server/database/model/user.model'

export const updateUserHistoryId = async ({
  db,
  userId,
  currentUserHistoryId,
  webhookHistoryId,
}: {
  db: PlanetScaleDatabase
  userId: string
  currentUserHistoryId: number
  webhookHistoryId: number
}) => {
  if (webhookHistoryId <= currentUserHistoryId) return
  await db
    .update(users)
    .set({ historyId: webhookHistoryId })
    .where(eq(users.id, userId))
}
