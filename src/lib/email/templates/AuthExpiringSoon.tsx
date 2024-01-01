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

export const AuthExpiringSoon = ({
  baseUrl = 'http://localhost:3000',
  daysToExpiry,
}: {
  baseUrl: string
  daysToExpiry: 2 | 1
}) => (
  <Html>
    <Head />
    <Preview>Your Inbox Hero authorization is expiring soon...</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <StandardHeader />
          <Heading as="h2">
            Uh oh, your Inbox Hero authorization is expiring soon...
          </Heading>
          <Paragraph>
            There is less than {daysToExpiry === 2 ? '2 days' : '1 day'} before
            your previous authorization will expire. Without your authorization,
            Inbox Hero will stop working.
          </Paragraph>
          <Paragraph>
            Due to{' '}
            <Link
              style={anchor}
              href="https://developers.google.com/identity/protocols/oauth2#:~:text=is%20issued%20a%20refresh%20token%20expiring%20in%207%20days"
            >
              a limitation by Google
            </Link>
            , your authorization for Inbox Hero to manage your email is only
            valid for 7 days. This limitation will no longer apply once Inbox
            Hero is out of beta! We appreciate your patience in the meantime 🙏
          </Paragraph>
          <Paragraph>
            To ensure a seamless experience, please reauthorize Inbox Hero by
            clicking the button below:
          </Paragraph>
          <Button href={`${baseUrl}/dashboard/schedule`}>
            Log in to Inbox Hero to reauthorize
          </Button>
          <Paragraph>
            If you encounter any difficulty authorizing Inbox Hero or if you
            have any questions, feel free to reply to this email and we will get
            back to you as soon as we can.
          </Paragraph>
          <Paragraph>— The Inbox Hero team</Paragraph>
          <Hr style={hr} />
          <StandardFooter />
        </Section>
      </Container>
    </Body>
  </Html>
)

export default AuthExpiringSoon
