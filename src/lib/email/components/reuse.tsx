import * as React from 'react'
import {
  Hr,
  Img,
  Link,
  Text,
  Button as UnstyledButton,
} from '@react-email/components'

export const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

export const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

export const box = {
  padding: '0 48px',
}

export const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

export const paragraph = {
  color: '#525f7f',

  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
}

export const anchor = {
  color: '#CF364C',
}

export const button = {
  backgroundColor: '#000',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
}

export const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
}

export const Button = ({
  children,
  href,
}: {
  children: React.ReactNode
  href: string
}) => (
  <UnstyledButton pX={10} pY={10} style={button} href={href}>
    {children}
  </UnstyledButton>
)

export const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <Text style={paragraph}>{children}</Text>
)

const Footer = ({ children }: { children: React.ReactNode }) => (
  <Text style={footer}>{children}</Text>
)

export const StandardFooter = () => (
  <Footer>Built with ❤️ from sunny Singapore.</Footer>
)

export const StandardHeader = () => {
  return (
    <>
      <Link href="https://app.inboxhero.org">
        <Img
          src="https://app.inboxhero.org/images/android-chrome-192x192.png"
          width="50"
          height="50"
          alt="Inbox Hero"
        />
      </Link>
      <Hr style={hr} />
    </>
  )
}
