import { z } from 'zod'

export const tokenValidationSchema = z
  .object({
    success: z.boolean(),
  })
  .strip()
