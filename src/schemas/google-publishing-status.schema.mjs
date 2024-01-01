import { z } from 'zod'

// this is a self-defined enum
export const googlePublishingStatus = z.enum(['testing', 'production'])
