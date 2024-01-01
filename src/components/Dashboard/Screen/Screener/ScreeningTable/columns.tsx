import type { ReactNode } from 'react'
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline'
import { type ColumnDef } from '@tanstack/react-table'
import DOMPurify from 'dompurify'
import { MoreHorizontal } from 'lucide-react'
import { RxOpenInNewWindow } from 'react-icons/rx'

import {
  AlertDialog,
  AlertDialogActionGhost,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Separator } from '~/components/ui/separator'
import { toast } from '~/components/ui/use-toast'
import { dayjs } from '~/lib/time/dayjs'
import { cn } from '~/lib/utils'
import { type ScreenSenderData } from '../ScreenerProvider'
import { Thumbs } from './Thumbs'

const LinkToInbox = ({
  children,
  userEmail,
  senderEmail,
  subject,
  underline = true,
}: {
  children: ReactNode
  userEmail: string
  senderEmail: string
  subject?: string
  underline?: boolean
}) => {
  return (
    <a
      href={`https://mail.google.com/mail/u/${userEmail}/#search/from:'${encodeURIComponent(
        senderEmail,
      )}'${subject ? `+subject:'${encodeURIComponent(subject)}'` : ''}`}
      target="_blank"
      rel="noopener noreferrer"
      className={underline ? 'underline' : ''}
    >
      {children}
    </a>
  )
}

export const columns: ColumnDef<ScreenSenderData>[] = [
  {
    id: 'sender',
    filterFn: (row, _columnId, filterValue) => {
      const { senderEmail } = row.original
      return senderEmail.includes((filterValue as string).toLowerCase())
    },
    header: () => <span className="font-semibold">Sender</span>,
    cell: ({ row }) => {
      const {
        fromName,
        senderEmail,
        emailDate: sentAt,
        numEmails,
        userEmail,
        subject,
      } = row.original
      const senderInfo = fromName ? fromName : senderEmail

      const userTimezone = dayjs.tz.guess()
      return (
        <Popover>
          <PopoverTrigger asChild>
            <div
              className={cn(
                'min-w-[80px] max-w-[100px]',
                senderInfo === fromName ? 'break-words' : 'break-all',
              )}
            >
              <p className="cursor-pointer font-medium underline hover:underline ">
                {senderInfo}
              </p>
              <p className="md:hidden">{subject}</p>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="flex justify-between space-x-4">
              <div className="space-y-1">
                {senderInfo === senderEmail ? (
                  <LinkToInbox userEmail={userEmail} senderEmail={senderEmail}>
                    <h4 className="text-sm font-semibold">{senderInfo}</h4>
                  </LinkToInbox>
                ) : (
                  <h4 className="text-sm font-semibold">{senderInfo}</h4>
                )}
                {senderInfo !== senderEmail && (
                  <p className="break-all text-sm">
                    <LinkToInbox
                      userEmail={userEmail}
                      senderEmail={senderEmail}
                    >
                      {senderEmail}
                    </LinkToInbox>
                  </p>
                )}
                <div className="flex items-center pt-2">
                  <span className="text-sm text-muted-foreground">
                    Sent at{' '}
                    {dayjs(sentAt)
                      .tz(userTimezone)
                      .format('ddd, D MMM YYYY, h:mm a')}
                  </span>
                </div>
                {numEmails !== 1 && (
                  <span className="text-xs text-muted-foreground">
                    <span className="text-xs text-muted-foreground">
                      You{' '}
                      <LinkToInbox
                        senderEmail={senderEmail}
                        userEmail={userEmail}
                      >
                        received {numEmails} emails
                      </LinkToInbox>{' '}
                      from this sender.
                    </span>
                  </span>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )
    },
  },
  {
    id: 'email',
    accessorKey: 'senderEmail',
    header: () => <span className="font-semibold">Email</span>,
    cell: ({ row }) => {
      const senderEmail = row.getValue<string>('email')
      return (
        <LinkToInbox
          senderEmail={senderEmail}
          userEmail={row.original.userEmail}
        >
          <p className="max-w-[100px] cursor-pointer break-words underline hover:underline">
            {senderEmail}
          </p>
        </LinkToInbox>
      )
    },
  },
  {
    id: 'subject',
    accessorKey: 'subject',
    header: () => <span className="font-semibold">Subject</span>,
    cell: ({ row }) => {
      const subject = row.getValue<string>('subject')
      return <p className="max-w-[100px] break-words">{subject}</p>
    },
  },
  {
    id: 'preview',
    accessorKey: 'snippet',
    header: () => <span className="font-semibold">Preview</span>,
    cell: ({ row }) => {
      const snippet = row.getValue<string>('preview')
      return (
        <div
          className="max-w-[120px] break-words sm:min-w-[150px] sm:max-w-[200px]"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(snippet) }}
        />
      )
    },
  },
  {
    id: 'In/Out',
    enableHiding: false,
    cell: ({ row }) => {
      const { senderEmail } = row.original
      return <Thumbs senderEmail={senderEmail} />
    },
  },
  {
    id: 'Actions',
    enableHiding: false,
    cell: ({ row }) => {
      const { senderEmail, subject, userEmail } = row.original

      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-[90%] sm:max-w-lg">
            <AlertDialogActionGhost
              className="flex space-x-2"
              onClick={() => {
                toast({
                  title: 'Copied to clipboard!',
                  description:
                    'Paste in the Gmail search bar to find this email.',
                  duration: 2000,
                })
                void navigator.clipboard.writeText(senderEmail)
              }}
            >
              <Input value={senderEmail} className="opacity-50" readOnly />
              <DocumentDuplicateIcon className="h-6 w-6" />
            </AlertDialogActionGhost>
            <AlertDialogActionGhost
              className="flex space-x-2"
              onClick={() => {
                toast({
                  title: 'Copied to clipboard!',
                  description:
                    'Paste in the Gmail search bar to find this email.',
                  duration: 2000,
                })
                void navigator.clipboard.writeText(subject)
              }}
            >
              <Input value={subject} className="opacity-50" readOnly />
              <DocumentDuplicateIcon className="h-6 w-6" />
            </AlertDialogActionGhost>
            <Separator />
            {/* <AlertDialogActionGhost
              onClick={() => navigator.clipboard.writeText(subject)}
            >
              View email body
            </AlertDialogActionGhost> */}
            {/* TODO: render entire email body here */}
            {/* <DropdownMenuItem>View email</DropdownMenuItem> */}
            <div className="flex items-center justify-between">
              <AlertDialogActionGhost>
                <LinkToInbox
                  senderEmail={senderEmail}
                  userEmail={userEmail}
                  subject={subject}
                  underline={false}
                >
                  Browse in Gmail
                  <RxOpenInNewWindow className="ml-2 inline-block h-4 w-4" />
                </LinkToInbox>
              </AlertDialogActionGhost>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )
    },
  },
]
