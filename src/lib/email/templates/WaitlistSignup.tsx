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

export const WaitlistSignup = () => (
  <Html>
    <Head />
    <Preview>You have signed up for Inbox Hero&apos;s waitlist!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <StandardHeader />
          <Heading as="h2">
            You have signed up for Inbox Hero&apos;s waitlist!
          </Heading>
          <Paragraph>
            You have successfully joined the waitlist! We&apos;ll send you an
            email once our beta is ready.
          </Paragraph>
          <Paragraph>
            If you know anyone who might also be interested in an email
            screening service for Gmail, please share{' '}
            <Link style={anchor} href="https://app.inboxhero.org">
              this link
            </Link>{' '}
            with them 🙏
          </Paragraph>
          <Paragraph>
            Due to a{' '}
            <Link
              style={anchor}
              href="https://support.google.com/cloud/answer/10311615?hl=en#zippy=%2Ctesting:~:text=Projects%20configured%20with%20a%20publishing%20status%20of%20Testing%20are%20limited%20to%20up%20to%20100%20test%20users"
            >
              limitation by Google
            </Link>
            , during the beta, we can only support 100 beta users.
          </Paragraph>
          <Paragraph>
            In the meantime, feel free to reply to this email with any questions
            or feedback. Thank you once again and stay zen in the meantime! 📨
          </Paragraph>
          <Paragraph>— The Inbox Hero team</Paragraph>
          <Hr style={hr} />
          <StandardFooter />
        </Section>
      </Container>
    </Body>
  </Html>
)

export default WaitlistSignup
