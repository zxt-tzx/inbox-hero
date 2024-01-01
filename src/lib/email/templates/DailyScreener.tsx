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
  Button,
  container,
  hr,
  main,
  Paragraph,
  StandardFooter,
  StandardHeader,
} from '../components/reuse'

export const screenerSubject = (numDistinctFirstTimeSenders: number) => {
  if (numDistinctFirstTimeSenders === 1) {
    return 'You have received email from a first-time sender'
  }
  return `You have received emails from ${numDistinctFirstTimeSenders} first-time senders`
}

export const DailyScreener = ({
  baseUrl = 'http://localhost:3000',
  uniquePath = '[userId]/[screenerId]',
  numDistinctFirstTimeSenders = 14,
}: {
  baseUrl: string
  uniquePath: string
  numDistinctFirstTimeSenders: number
}) => (
  <Html>
    <Head />
    <Preview>Use the link in this email to screen first-time senders</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <StandardHeader />
          <Heading as="h2">
            {screenerSubject(numDistinctFirstTimeSenders)}
          </Heading>
          <Paragraph>
            You are receiving this email because you have subscribed to Inbox
            Hero and emails from first-time senders are being moved out of your
            inbox.
          </Paragraph>
          <Paragraph>
            Click the button below to decide whether to hear from these senders
            again. Yes and their email is back in your inbox. No and you&apos;ll
            never hear from them again.
          </Paragraph>
          <Button href={`${baseUrl}/screener/${uniquePath}`}>Screen now</Button>
          <Paragraph>
            P.S. This link is unique to you and will expire in 24 hours. Please
            do not share it with anyone!
          </Paragraph>
          <Paragraph>
            If you would like to receive this daily screener at a different
            time, you can update your schedule preferences{' '}
            <Link style={anchor} href={`${baseUrl}/dashboard/schedule`}>
              at this link
            </Link>
            . Thank you for using Inbox Hero!
          </Paragraph>
          <Paragraph>— The Inbox Hero team</Paragraph>
          <Hr style={hr} />
          <StandardFooter />
        </Section>
      </Container>
    </Body>
  </Html>
)

export default DailyScreener
