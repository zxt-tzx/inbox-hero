import Link from 'next/link'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import type { SenderScreenStatus } from '~/schemas/sender.schema'

interface ManageInAndOutProps {
  variant: SenderScreenStatus
}

export function ManageInAndOut({ variant }: ManageInAndOutProps) {
  const cardTitle = (() => {
    switch (variant) {
      case 'in': {
        return `Who's In?`
      }
      case 'out': {
        return `Who's Out?`
      }
      default: {
        variant satisfies never
        throw new Error(`variant must be 'in' or 'out'`)
      }
    }
  })()
  const cardDescription = (() => {
    switch (variant) {
      case 'in': {
        return 'Manage the senders and domains who can email you directly.'
      }
      case 'out': {
        return 'See blocked senders and domains and maybe give them another chance.'
      }
      default: {
        variant satisfies never
        throw new Error(`variant must be 'in' or 'out'`)
      }
    }
  })()
  const ManageInAndOutCard = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription className="pt-2">{cardDescription}</CardDescription>
        </CardHeader>
      </Card>
    )
  }
  return (
    <Link href={`/dashboard/screen/${variant}`}>
      <ManageInAndOutCard />
    </Link>
  )
}
