import { connect } from '@planetscale/database'
import { render } from '@react-email/render'
import { type SQSEvent, type SQSRecord } from 'aws-lambda'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/planetscale-serverless'
import pSettle from 'p-settle'
import { Resend } from 'resend'
import { Config } from 'sst/node/config'

import AuthExpired from '~/lib/email/templates/AuthExpired'
import WaitlistSignup from '~/lib/email/templates/WaitlistSignup'
import Welcome from '~/lib/email/templates/Welcome'
import { emails } from '~/server/database/model/email.model'
import { waitlist } from '~/server/database/model/waitlist.model'
import { parseSqsEmailMessageBody } from '~/serverless/email/sqs'
import { enqueueRuntimeErrorEmail } from '~/serverless/gmail/sqs'

const RESEND_API_KEY = Config.RESEND_API_KEY
const resend = new Resend(RESEND_API_KEY)

const dbConnection = connect({
  url: Config.DATABASE_URL,
})
const db = drizzle(dbConnection)

const waitlistSignup = WaitlistSignup()

const authExpired = AuthExpired({
  baseUrl: Config.NEXT_PUBLIC_APP_URL,
})

export async function handler(event: SQSEvent) {
  const { Records: records } = event
  // TODO:
  // - handle errors -> return to queue
  // - handle timeout -> return to queue
  // - internal rate limit?
  const results = await pSettle(
    records.map((r) => handleRecord(r)),
    {
      concurrency: 30,
    },
  )
  // see https://github.com/aws-solutions/fhir-works-on-aws/blob/d57e66b9a64b06053adc471521ffeebf31eda621/solutions/smart-deployment/src/subscriptions/restHookLambda/restHook.ts#L102
  const failures = results.flatMap((r, i) => {
    if (r.isRejected) {
      console.log('failed to send email', r.reason)
      return [{ itemIdentifier: event.Records[i]?.messageId }]
    }
    return []
  })
  // TODO: untested code; to verify in the future
  if (failures.length !== 0) {
    await enqueueRuntimeErrorEmail({
      subject: 'Resend consumer failure',
      message: JSON.stringify(failures),
    })
  }
  console.log(`Successfully sent: ${records.length - failures.length}`)
  console.log(`Failed to send: ${failures.length}`)
  // TODO: return failures to queue
}

async function handleRecord(record: SQSRecord) {
  const { body: messageBody } = record
  const parsed = parseSqsEmailMessageBody(messageBody)
  switch (parsed.emailType) {
    case 'waitlist_signup': {
      const { to } = parsed
      const from = 'Inbox Hero <welcome@inboxhero.org>'
      const bcc = 'inboxheroapp@gmail.com'
      const subject = 'You are on the waitlist!'
      const data = await resend.emails.send({
        from,
        to,
        bcc,
        subject,
        react: waitlistSignup,
      })
      await db.transaction(async (tx) => {
        await Promise.all([
          await tx.insert(emails).values({
            to,
            from,
            subject,
            body: render(waitlistSignup),
            ccBcc: { cc: [], bcc: [bcc] },
            emailType: parsed.emailType,
            provider: 'resend',
            providerId: data.id,
          }),
          await tx
            .update(waitlist)
            .set({ sentWelcomeEmail: true })
            .where(eq(waitlist.email, to)),
        ])
      })
      return
    }
    case 'auth_expired': {
      const { to } = parsed
      const from = 'Inbox Hero <updates@inboxhero.org>'
      const bcc = 'inboxheroapp@gmail.com'
      const subject = '[URGENT] Your Inbox Hero authorization has expired'
      const data = await resend.emails.send({
        from,
        to,
        bcc,
        subject,
        react: authExpired,
      })
      await db.insert(emails).values({
        to,
        from,
        subject,
        body: render(authExpired),
        ccBcc: { cc: [], bcc: [bcc] },
        emailType: parsed.emailType,
        provider: 'resend',
        providerId: data.id,
      })
      return
    }
    case 'welcome': {
      const { to } = parsed
      await db
        .update(waitlist)
        .set({ whitelisted: true })
        .where(eq(waitlist.email, to))

      const from = 'Inbox Hero <welcome@inboxhero.org>'
      const subject = "Welcome to Inbox Hero's beta"
      const welcome = Welcome({
        email: to,
      })
      const data = await resend.emails.send({
        from,
        to,
        subject,
        react: welcome,
      })
      await db.insert(emails).values({
        to,
        from,
        subject,
        body: render(welcome),
        emailType: parsed.emailType,
        provider: 'resend',
        providerId: data.id,
      })
      break
    }
    default:
      parsed satisfies never
      throw new Error('Invalid message body')
  }
}
