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
  Text,
} from '@react-email/components'

import {
  anchor,
  box,
  Button,
  container,
  hr,
  main,
  Paragraph,
  paragraph,
  StandardFooter,
  StandardHeader,
} from '../components/reuse'

const authRevocationReasons = [
  { reason: "You have revoked Inbox Hero's access to your account." },
  {
    reason: 'You have recently changed your password.',
  },
  {
    reason:
      'Your account has exceeded the maximum number of live refresh tokens.',
  },
  {
    reason:
      "If you're on Google Workspace, your admin policy might have changed.",
  },
]

export const AuthExpired = ({
  baseUrl = 'http://localhost:3000',
}: {
  baseUrl: string
}) => (
  <Html>
    <Head />
    <Preview>Your Inbox Hero authorization has expired</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <StandardHeader />
          <Heading as="h2">Your Inbox Hero authorization has expired</Heading>
          <Paragraph>
            We have detected that your authorization for Inbox Hero to manage
            your email has expired. Without your authorization, Inbox Hero has
            stopped working.
          </Paragraph>
          {/* TODO: when fully launched with payments, add para describing steps to ACTUALLY UNSUBSCRIBE */}
          <Paragraph>
            Your authorization most likely expired because{' '}
            <Link
              style={anchor}
              href="https://developers.google.com/identity/protocols/oauth2#:~:text=is%20issued%20a%20refresh%20token%20expiring%20in%207%20days"
            >
              a limitation by Google
            </Link>{' '}
            means that your previous authorization is only valid for 7 days.
            This limitation will be gone once Inbox Hero is out of beta!
          </Paragraph>
          <Paragraph>
            Other reasons your authorization may have expired are:
          </Paragraph>
          <ol>
            {authRevocationReasons.map((val, idx) => {
              return (
                <li key={idx}>
                  <Paragraph>{val.reason}</Paragraph>
                </li>
              )
            })}
          </ol>
          <Paragraph>
            For more information, please{' '}
            <Link
              style={anchor}
              href="https://developers.google.com/identity/protocols/oauth2#expiration"
            >
              check this out
            </Link>
            .
          </Paragraph>
          <Button href={`${baseUrl}/dashboard/schedule`}>
            Log in to Inbox Hero to reauthorize
          </Button>
          <Paragraph>
            If you encounter any difficulty authorizing Inbox Hero or if you
            have any questions, feel free to reply to this email and we will get
            back to you as soon as possible.
          </Paragraph>
          <Text style={paragraph}>— The Inbox Hero team</Text>
          <Hr style={hr} />
          <StandardFooter />
        </Section>
      </Container>
    </Body>
  </Html>
)

export default AuthExpired
