import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

import { senders } from '~/server/database/model/sender.model'
import { genericEmailInputSchema } from './gmail.schema'

export const senderScreenStatus = createSelectSchema(senders).pick({
  screenStatus: true,
}).shape.screenStatus

export type SenderScreenStatus = z.infer<typeof senderScreenStatus>

const senderManageStatus = z.enum([...senderScreenStatus.options, 'neither'])

export type SenderManageStatus = z.infer<typeof senderManageStatus>

const MAX_DECISIONS = 100

export const manageSendersSchema = z.object({
  sendersDecision: z
    .map(genericEmailInputSchema, senderManageStatus)
    .refine((map) => {
      const { size } = map
      return size > 0 && size <= MAX_DECISIONS
    }, `Must have at least one sender and no more than ${MAX_DECISIONS}`)
    .transform((map) => {
      const inSenders: string[] = []
      const outSenders: string[] = []
      const neitherSenders: string[] = []
      map.forEach((screenStatus, sender) => {
        switch (screenStatus) {
          case 'in':
            inSenders.push(sender)
            break
          case 'out':
            outSenders.push(sender)
            break
          case 'neither':
            neitherSenders.push(sender)
            break
        }
      })
      return {
        inSenders,
        outSenders,
        neitherSenders,
      }
    }),
})

export const addSendersSchema = z.object({
  senderScreenStatus,
  senders: z.array(z.object({ value: genericEmailInputSchema })).max(20),
})
