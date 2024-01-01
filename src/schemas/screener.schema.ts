import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

import { screeners } from '~/server/database/model/screener.model'
import { users } from '~/server/database/model/user.model'
import { domainInputSchema } from './domain.schema'
import { senderScreenStatus } from './sender.schema'

export const setScheduleSchema = createInsertSchema(users)
  .pick({
    dailyScreenerTime: true,
    timezone: true,
  })
  .required()
  .refine((data) => {
    const dstRegex = /([01]\d|2[0-3]):([0-5]\d)/
    return (
      data.dailyScreenerTime &&
      data.timezone &&
      dstRegex.test(data.dailyScreenerTime)
    )
  }, 'Values cannot be null and dailyScreenerTime must be in the format "HH:MM" in 24-hour format')

export const toggleScheduleSchema = z.object({
  turnOnDailyScreener: z.boolean(),
})

export const onboardingFormSchema = z.object({
  whitelistRecentSenders: z.boolean(), // in the future, can set number of days
  whitelistedDomains: z
    .array(
      // use object array instead of string array so that users can add multiple blank fields
      z.object({
        value: domainInputSchema,
      }),
    )
    // arbitrary max length
    .max(20)
    .optional(),
})

export const queryScreenerSchema = createSelectSchema(screeners).pick({
  id: true,
  userId: true,
})

export const checkScreenerSchema = queryScreenerSchema.augment({
  token: z.string().nonempty(),
})

const MAX_SCREENING_DECISIONS = 100

export const screenSendersSchema = z.object({
  userId: z.string(),
  screenerId: z.string(),
  screeningDecisions: z
    .map(z.string().email(), senderScreenStatus)
    .refine((map) => {
      const { size } = map
      return size > 0 && size <= MAX_SCREENING_DECISIONS
    }, `Screening decisions map cannot be empty and cannot exceed ${MAX_SCREENING_DECISIONS} entries`)
    .transform((map) => {
      // split into two arrays of inSenders and outSenders
      const inSenders: string[] = []
      const outSenders: string[] = []
      map.forEach((screenStatus, sender) => {
        if (screenStatus === 'in') {
          inSenders.push(sender.toLowerCase())
        } else {
          outSenders.push(sender.toLowerCase())
        }
      })
      return {
        inSenders,
        outSenders,
      }
    }),
})
