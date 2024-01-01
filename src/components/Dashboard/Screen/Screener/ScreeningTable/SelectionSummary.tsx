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
import type { SenderScreenStatus } from '~/schemas/sender.schema'
import { useScreener } from '../ScreenerProvider'

export function SelectionSummary() {
  const {
    inArray,
    outArray,
    isSlidingOut,
    submitScreenSenders,
    screenSendersForm,
  } = useScreener()

  const isLoading = submitScreenSenders.status === 'loading'
  const { mutate } = submitScreenSenders
  const handleSubmit = screenSendersForm.handleSubmit((data) => {
    const screeningDecisions = new Map<string, SenderScreenStatus>()
    inArray.forEach((id) => screeningDecisions.set(id, 'in'))
    outArray.forEach((id) => screeningDecisions.set(id, 'out'))
    mutate({
      ...data,
      screeningDecisions,
    })
  })
  return (
    <Card
      className={cn(
        'sticky bottom-0',
        isSlidingOut ? 'animate-slideOut' : 'animate-slideIn',
      )}
    >
      <FormProvider {...screenSendersForm}>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Selection summary</CardTitle>
          </CardHeader>
          <div className="flex justify-evenly pb-5">
            <CardContent className="text-lg sm:text-xl">
              👍 {inArray.length}
              <Popover>
                <PopoverTrigger className="pl-3 align-middle text-sm">
                  ⓘ
                </PopoverTrigger>
                <PopoverContent>
                  These emails will be moved to your inbox and future emails
                  from these senders will reach your inbox directly.
                </PopoverContent>
              </Popover>
            </CardContent>
            <CardContent className="text-lg sm:text-xl">
              👎 {outArray.length}
              <Popover>
                <PopoverTrigger className="pl-3 align-middle text-sm">
                  ⓘ
                </PopoverTrigger>
                <PopoverContent>
                  All emails from these senders will skip your inbox and be sent
                  to trash.
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
