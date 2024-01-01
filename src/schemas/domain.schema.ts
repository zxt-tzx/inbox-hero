import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

import { domains } from '~/server/database/model/domain.model'

export const domainScreenStatus = createSelectSchema(domains).pick({
  screenStatus: true,
}).shape.screenStatus

const domainManageStatus = z.enum([...domainScreenStatus.options, 'neither'])

export type DomainManageStatus = z.infer<typeof domainManageStatus>

export const domainInputSchema = z
  .string()
  .min(1)
  .toLowerCase()
  .refine(
    (val) => {
      // rough and ready validation that domain is formatted correctly
      // decided against using a regex or library...
      return (
        val.includes('.') &&
        !val.includes(' ') &&
        val[0] === '@' &&
        val[val.length - 1] !== '.'
      )
    },
    {
      message: 'Please enter a domain in the format "@example.com"',
    },
  )

export const listByScreenStatusSchema = z.object({
  screenStatus: domainScreenStatus,
})

const MAX_DECISIONS = 100
export const manageDomainsSchema = z.object({
  domainsDecision: z
    .map(domainInputSchema, domainManageStatus)
    .refine((map) => {
      const { size } = map
      return size > 0 && size <= MAX_DECISIONS
    }, `Must have at least one domain and no more than ${MAX_DECISIONS}`)
    .transform((map) => {
      const inDomains: string[] = []
      const outDomains: string[] = []
      const neitherDomains: string[] = []
      map.forEach((screenStatus, domain) => {
        switch (screenStatus) {
          case 'in':
            inDomains.push(domain)
            break
          case 'out':
            outDomains.push(domain)
            break
          case 'neither':
            neitherDomains.push(domain)
            break
        }
      })
      return {
        inDomains,
        outDomains,
        neitherDomains,
      }
    }),
})

export const addDomainsSchema = z.object({
  domainScreenStatus,
  domains: z.array(z.object({ value: domainInputSchema })).max(20),
})
