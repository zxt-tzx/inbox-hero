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
import type { DomainManageStatus } from '~/schemas/domain.schema'
import { useManage } from '../ManageProvider'

export function DomainChangeSummary() {
  const {
    path,
    domain: {
      domainInArray,
      domainOutArray,
      isSlidingOut,
      domainNeitherArray,
      submitManageDomains,
      manageDomainsForm,
    },
  } = useManage()
  const isLoading = submitManageDomains.status === 'loading'
  const { mutate } = submitManageDomains
  const handleSubmit = manageDomainsForm.handleSubmit(() => {
    const domainsDecision = new Map<string, DomainManageStatus>()
    if (path === 'out') {
      domainInArray.forEach((id) => domainsDecision.set(id, 'in'))
    }
    if (path === 'in') {
      domainOutArray.forEach((id) => domainsDecision.set(id, 'out'))
    }
    domainNeitherArray.forEach((id) => domainsDecision.set(id, 'neither'))
    mutate({
      domainsDecision,
    })
  })
  return (
    <Card
      className={cn(
        'sticky bottom-0',
        isSlidingOut ? 'animate-slideOut' : 'animate-slideIn',
      )}
    >
      <FormProvider {...manageDomainsForm}>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Change summary</CardTitle>
          </CardHeader>
          <div className="flex justify-evenly pb-5">
            {path === 'out' && (
              <CardContent className="text-lg sm:text-xl">
                👍 {domainInArray.length}
                <Popover>
                  <PopoverTrigger className="pl-3 align-middle text-sm">
                    ⓘ
                  </PopoverTrigger>
                  <PopoverContent>
                    Future emails from these domains will reach your inbox
                    directly.
                  </PopoverContent>
                </Popover>
              </CardContent>
            )}
            {path === 'in' && (
              <CardContent className="text-lg sm:text-xl">
                👎 {domainOutArray.length}
                <Popover>
                  <PopoverTrigger className="pl-3 align-middle text-sm">
                    ⓘ
                  </PopoverTrigger>
                  <PopoverContent>
                    Future emails from these domains will skip your inbox and be
                    sent to trash.
                  </PopoverContent>
                </Popover>
              </CardContent>
            )}
            <CardContent className="text-lg sm:text-xl">
              🛡️ {domainNeitherArray.length}
              <Popover>
                <PopoverTrigger className="pl-3 align-middle text-sm">
                  ⓘ
                </PopoverTrigger>
                <PopoverContent>
                  Future emails from these domains will skip your inbox and be
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
