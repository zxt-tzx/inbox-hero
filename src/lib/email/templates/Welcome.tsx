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

export const Welcome = ({ email = 'inboxheroapp@gmail.com' }) => (
  <Html>
    <Head />
    <Preview>Welcome to Inbox Hero&apos;s beta!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <StandardHeader />
          <Heading as="h2">Welcome to Inbox Hero&apos;s beta!</Heading>
          <Paragraph>
            You previously signed up for Inbox Hero&apos;s waitlist using{' '}
            <strong>{email}</strong> and you are receiving this email because
            you have been whitelisted for our private beta. Thank you for your
            patience!
          </Paragraph>
          <Paragraph>
            Our beta is limited to 100 users. You can proceed to create an
            account by clicking on{' '}
            <Link style={anchor} href="https://app.inboxhero.org/login">
              this link
            </Link>
            .
          </Paragraph>
          <Paragraph>
            Please note that if you are on Google Workspace, depending on your
            admin settings, you might have to whitelist Inbox Hero manually.
          </Paragraph>
          <Paragraph>
            Thank you for being a beta tester, please reply to this email let me
            know if you encounter any bugs or have any feedback!
          </Paragraph>
          <Paragraph>
            If you know anyone who might also be interested in an email
            screening service for Gmail, please share{' '}
            <Link style={anchor} href="https://app.inboxhero.org">
              this link
            </Link>{' '}
            with them 🙏
          </Paragraph>
          <Paragraph>— The Inbox Hero team</Paragraph>
          <Hr style={hr} />
          <StandardFooter />
        </Section>
      </Container>
    </Body>
  </Html>
)

export default Welcome
