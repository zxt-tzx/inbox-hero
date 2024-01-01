import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

import { waitlist } from '~/server/database/model/waitlist.model'
import { gmailInputSchema } from './gmail.schema'

export const insertWaitlistSchema = createInsertSchema(waitlist, {
  email: gmailInputSchema,
})
  .pick({
    email: true,
    emailProvider: true,
    otherEmailProvider: true,
    comments: true,
  })
  .augment({
    token: z.string().nonempty(),
  })

export const checkWaitlistSchema = createSelectSchema(waitlist, {
  email: gmailInputSchema,
})
  .pick({
    email: true,
  })
  .augment({
    token: z.string().nonempty(),
  })
