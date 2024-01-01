import { z } from 'zod'

export const genericEmailInputSchema = z.string().email()

export const gmailInputSchema = genericEmailInputSchema.transform((email) =>
  normalizeGmail(email, false),
)

export function normalizeGmail(email: string, strict: boolean) {
  // remove any +string before the @
  email = email.toLowerCase().replace(/\+.*(?=@)/g, '')
  if (!strict) {
    return email
  }
  // remove any dots from username
  const [username, domain] = email.split('@')
  const normalizedUsername = (username as string).replace(/\./g, '')
  return `${normalizedUsername}@${domain}`
}

export const historyIdSchema = z.coerce.number()

// requested scope: "openid email profile"
export const googleProfileSchema = z.object({
  email: gmailInputSchema,
  name: z.string(),
  sub: z.string(),
  picture: z.string().url().optional(), // not all users will make this available
  locale: z.string().optional(), // not sure, but making it optional so it's not on critical path
})

export const googleAccountSchema = z.object({
  scope: z.string(),
  access_token: z.string(),
  expires_at: z.number(), // unix timestamp in seconds
  // leaving unused fields optional
  providerAccountId: z.string().optional(),
})

export const googleAuthGmailAccountSchema = googleAccountSchema.extend({
  refresh_token: z.string(),
})

export const watchResponseSchema = z.object({
  historyId: historyIdSchema,
  expiration: z.coerce.number(), // when the watch expires in ms since epoch
})

export const messagesImportSchema = z.object({
  id: z.string(),
  // strictly, these are mandatory, but leaving it optional since we're not directly using it
  threadId: z.string().optional(),
  labelIds: z.array(z.string()).optional(), // can convert into enum
})

export const headerSchema = z.object({
  name: z.string(),
  value: z.string(),
})

export type Header = z.infer<typeof headerSchema>

export const messagesGetSchema = z
  // plenty more fields, but only using these FOR NOW
  .object({
    headers: z.array(headerSchema),
  })
  .strip()

const eventBodyMessageDataSchema = z
  .string()
  .transform((data) => Buffer.from(data, 'base64').toString())
  .transform((data) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-restricted-syntax
    const parsed = JSON.parse(data)
    return z
      .object({
        emailAddress: gmailInputSchema,
        historyId: historyIdSchema,
      })
      .parse(parsed)
  })

export const eventBodyMessageSchema = z.object({
  data: eventBodyMessageDataSchema,
  // not using these fields; they are Pub/Sub fields
  messageId: z.string(),
  publishTime: z.string(),
})

const historyListMessageSchema = z.object({
  message: z.object({
    // message in historyList typically only has id and threadId
    // to get full message, need to call messages.get
    id: z.string(),
    threadId: z.string(),
    // probably always exist, but leaving it optional since not using
    labelIds: z.array(z.string()).optional(), // in messagesAdded, but not using at the moment
  }),
})

export const messagesAddedHistorySchema = z.object({
  messagesAdded: z.array(historyListMessageSchema),
})

export const mimeTypeTextPayload = z.object({
  mimeType: z.custom<`text/${string}`>((val: unknown) =>
    String(val).startsWith('text/'),
  ),
  body: z.object({
    size: z.number(),
    data: z.string(),
  }),
  headers: z.array(headerSchema),
})

const mimeTypeMultipartPayloadBase = z.object({
  mimeType: z.string(),
  body: z.object({
    size: z.number(),
    // if size is 0, data field doesn't exist
    data: z.string().optional(),
  }),
  headers: z.array(headerSchema).optional(),
})

type Part = z.infer<typeof mimeTypeMultipartPayloadBase> & {
  parts?: Part[]
}

export const mimeTypeMultipartPayload: z.ZodType<Part> =
  mimeTypeMultipartPayloadBase.extend({
    parts: z.lazy(() => z.array(mimeTypeMultipartPayload)).optional(),
  })

// intentionally vague; actual parsing of payload is done in extractEmailBody
const payloadSchema = z
  .object({
    mimeType: z.string(),
    headers: z.array(headerSchema),
  })
  // passthrough so that we can retain fields
  .passthrough()

export const messageFullFormatSchema = z.object({
  internalDate: z.coerce.number(),
  historyId: historyIdSchema,
  snippet: z.string(),
  payload: payloadSchema,
  labelIds: z.array(z.string()).optional(), // might not exist! unused anyway
})

// no clear documentation by Google on object shape to expect
export const getMessageFormatFullSchema = z.object({
  data: messageFullFormatSchema,
})

export type MessageFormatFull = z.infer<typeof getMessageFormatFullSchema>

export const threadsGetMessagesSchema = z.array(messageFullFormatSchema)
