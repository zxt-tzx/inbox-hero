import { type ColumnDef } from '@tanstack/react-table'

import { dayjs } from '~/lib/time/dayjs'
import type { ManageSenderData } from '../ManageProvider'
import { SenderOptions } from './SenderOptions'

export const columns: ColumnDef<ManageSenderData>[] = [
  {
    id: 'sender',
    header: () => <span className="font-semibold">Sender</span>,
    cell: ({ row }) => {
      const { fromName } = row.original
      return (
        <span className="min-w-[80px] max-w-[200px] break-words">
          {fromName ?? '-'}
        </span>
      )
    },
  },
  {
    id: 'email',
    filterFn: (row, _columnId, filterValue) => {
      const { email } = row.original
      return email.includes((filterValue as string).toLowerCase())
    },
    header: () => <span className="font-semibold">Email</span>,
    cell: ({ row }) => {
      const { email } = row.original
      return (
        <div className="min-w-[80px] max-w-[250px] break-words">
          <span>{email}</span>
        </div>
      )
    },
  },
  {
    id: 'updatedAt',
    header: () => <span className="font-semibold">Added on</span>,
    cell: ({ row }) => {
      const { updatedAt } = row.original
      const userTimezone = dayjs.tz.guess()
      const formattedUpdatedAt = dayjs(updatedAt)
        .tz(userTimezone)
        .format('D MMM YYYY')
      return <span>{formattedUpdatedAt}</span>
    },
  },
  {
    id: 'options',
    cell: ({ row }) => {
      const { email: sender } = row.original
      return <SenderOptions sender={sender} />
    },
  },
]
