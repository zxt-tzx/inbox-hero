import { createInsertSchema } from 'drizzle-zod'

import { emails } from '~/server/database/model/email.model'

export const emailInsertSchema = createInsertSchema(emails)
