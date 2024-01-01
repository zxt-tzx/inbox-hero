import { Button } from '~/components/Button'

interface JoinTheWaitlistProps {
  className?: string
}
export const JoinTheWaitlist = ({ className }: JoinTheWaitlistProps) => {
  return (
    <Button className={className} href="/waitlist">
      Join the Waitlist
    </Button>
  )
}
