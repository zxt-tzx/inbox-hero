import { type ColumnDef } from '@tanstack/react-table'

import { dayjs } from '~/lib/time/dayjs'
import type { ManageDomainData } from '../ManageProvider'
import { DomainOptions } from './DomainOptions'

export const columns: ColumnDef<ManageDomainData>[] = [
  {
    id: 'domain',
    filterFn: (row, _columnId, filterValue) => {
      const { domain } = row.original
      return domain.includes((filterValue as string).toLowerCase())
    },
    header: () => <span className="font-semibold">Domain</span>,
    cell: ({ row }) => {
      const { domain } = row.original
      return <span>{domain}</span>
    },
  },
  {
    id: 'updatedAt',
    header: () => <span className="font-semibold">Added at</span>,
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
      const { domain } = row.original
      return <DomainOptions domain={domain} />
    },
  },
]
