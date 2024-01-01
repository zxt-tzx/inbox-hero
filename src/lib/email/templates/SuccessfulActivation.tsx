import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
} from '@react-email/components'

import {
  anchor,
  box,
  container,
  hr,
  main,
  Paragraph,
  StandardFooter,
  StandardHeader,
} from '../components/reuse'

export const SuccessfulActivation = ({
  baseUrl = 'http://localhost:3000',
  nextScreenerScheduledAt = 'Sat, 25 Nov 2023, 9:00 am',
  dailyScreenerTimeFormatted = '9:00AM',
  timezoneFormatted = '(GMT+08:00) Singapore Time',
  userEmail = 'inboxheroapp@gmail.com',
}: {
  baseUrl: string
  nextScreenerScheduledAt: string
  dailyScreenerTimeFormatted: string
  timezoneFormatted: string
  userEmail: string
}) => {
  return (
    <Html>
      <Head />
      <Preview>You have successfully activated Inbox Hero!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <StandardHeader />
            <Heading as="h2">
              You have successfully activated Inbox Hero!
            </Heading>
            <Paragraph>Thank you for activating Inbox Hero!</Paragraph>
            <Paragraph>
              From now, emails from first-time senders will be moved out of your
              inbox and you will receive an email with a link to screen these
              senders each day at {dailyScreenerTimeFormatted}{' '}
              {timezoneFormatted}.
            </Paragraph>
            <Paragraph>
              To ensure you won&apos;t miss any emails, anyone you sent an email
              to in the past 7 days and or while Inbox Hero&apos;s screening is
              activated will also pass screening automatically.
            </Paragraph>
            <Paragraph>
              Based on your current schedule, you will receive your next
              screener on <u>{nextScreenerScheduledAt}</u>.
            </Paragraph>
            <Paragraph>
              If you wish to access these emails ahead of the screening
              schedule, you can find them in the{' '}
              <Link
                style={anchor}
                href={`https://mail.google.com/mail/u/${userEmail}/#all`}
              >
                All Mail folder
              </Link>
              . You can also log into Inbox Hero to{' '}
              <Link style={anchor} href={`${baseUrl}/dashboard/screen`}>
                screen your emails
              </Link>{' '}
              ahead of schedule.
            </Paragraph>
            {/* TODO: remove when we are out of beta */}
            <Paragraph>
              Please note that as we are currently in beta, there is a Google
              OAuth limitation that requires you to re-grant authorization every
              7 days. The app will send a reminder email a couple of days before
              the expiry, so this is just a heads-up! You can always revoke the
              authorization via your Google account settings at any time.
            </Paragraph>
            <Paragraph>
              In the meantime, feel free to reply to this email with any
              questions or feedback. Thank you once again and stay zen in the
              meantime! 📨
            </Paragraph>
            <Paragraph>— The Inbox Hero team</Paragraph>
            <Hr style={hr} />
            <StandardFooter />
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default SuccessfulActivation
