import { useEffect } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'

import { Input } from '~/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { useManage } from '../ManageProvider'
import { AddSenders } from './AddSenders'
import { columns } from './columns'
import { SenderChangeSummary } from './SenderChangeSummary'

export function SenderTable() {
  const {
    sender: { senderData },
  } = useManage()
  return <DataTable columns={columns} data={senderData} />
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const {
    useColumnsMobile,
    sender: { shouldRender },
  } = useManage()
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })
  useEffect(() => {
    if (useColumnsMobile) {
      table.setColumnVisibility({
        sender: false,
      })
    }
    if (!useColumnsMobile) {
      table.setColumnVisibility({
        sender: true,
      })
    }
  }, [table, useColumnsMobile])
  const filterValue = table.getColumn('email')?.getFilterValue()
  return (
    <div>
      <div className="flex py-4">
        <Input
          placeholder="Filter by email"
          value={(typeof filterValue === 'string' && filterValue) || ''}
          onChange={(event) =>
            table.getColumn('email')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="mx-2" />
        <AddSenders />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {shouldRender && <SenderChangeSummary />}
      </div>
    </div>
  )
}
