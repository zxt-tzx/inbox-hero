import { Check } from 'lucide-react'
import { FormProvider } from 'react-hook-form'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { cn } from '~/lib/utils'
import type { SenderManageStatus } from '~/schemas/sender.schema'
import { useManage } from '../ManageProvider'

export function SenderChangeSummary() {
  const {
    path,
    sender: {
      senderInArray,
      senderOutArray,
      isSlidingOut,
      senderNeitherArray,
      submitManageSenders,
      manageSendersForm,
    },
  } = useManage()
  const isLoading = submitManageSenders.status === 'loading'
  const { mutate } = submitManageSenders
  const handleSubmit = manageSendersForm.handleSubmit(() => {
    const sendersDecision = new Map<string, SenderManageStatus>()
    if (path === 'out') {
      senderInArray.forEach((id) => sendersDecision.set(id, 'in'))
    }
    if (path === 'in') {
      senderOutArray.forEach((id) => sendersDecision.set(id, 'out'))
    }
    senderNeitherArray.forEach((id) => sendersDecision.set(id, 'neither'))
    mutate({
      sendersDecision,
    })
  })
  return (
    <Card
      className={cn(
        'sticky bottom-0',
        isSlidingOut ? 'animate-slideOut' : 'animate-slideIn',
      )}
    >
      <FormProvider {...manageSendersForm}>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Change summary</CardTitle>
          </CardHeader>
          <div className="flex justify-evenly pb-5">
            {path === 'out' && (
              <CardContent className="text-lg sm:text-xl">
                👍 {senderInArray.length}
                <Popover>
                  <PopoverTrigger className="pl-3 align-middle text-sm">
                    ⓘ
                  </PopoverTrigger>
                  <PopoverContent>
                    Emails from these senders in the last 30 days will be moved
                    to your inbox and future emails from these senders will not
                    be screened.
                  </PopoverContent>
                </Popover>
              </CardContent>
            )}
            {path === 'in' && (
              <CardContent className="text-lg sm:text-xl">
                👎 {senderOutArray.length}
                <Popover>
                  <PopoverTrigger className="pl-3 align-middle text-sm">
                    ⓘ
                  </PopoverTrigger>
                  <PopoverContent>
                    Future emails from these senders will skip your inbox and be
                    sent to trash.
                  </PopoverContent>
                </Popover>
              </CardContent>
            )}
            <CardContent className="text-lg sm:text-xl">
              🛡️ {senderNeitherArray.length}
              <Popover>
                <PopoverTrigger className="pl-3 align-middle text-sm">
                  ⓘ
                </PopoverTrigger>
                <PopoverContent>
                  Future emails from these senders will skip your inbox and be
                  added to the screener.
                </PopoverContent>
              </Popover>
            </CardContent>
            <Button disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Confirm'}
              {!isLoading && <Check className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Card>
  )
}
