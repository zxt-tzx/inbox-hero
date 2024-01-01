import {
  HandThumbDownIcon as HandThumbDownIconOutline,
  HandThumbUpIcon as HandThumbUpIconOutline,
  ShieldExclamationIcon as ShieldExclamationIconOutline,
} from '@heroicons/react/24/outline'
import {
  HandThumbDownIcon,
  HandThumbUpIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/solid'

import { Button } from '~/components/ui/button'
import { useManage } from '../ManageProvider'

interface OptionsProps {
  domain: string
}

export function DomainOptions({ domain }: OptionsProps) {
  const {
    domain: {
      domainInArray,
      setDomainInArray,
      domainOutArray,
      setDomainOutArray,
      domainNeitherArray,
      setDomainNeitherArray,
    },
  } = useManage()

  const handleThumbUp = () => {
    if (!domainInArray.includes(domain)) {
      setDomainInArray((prev) => [...prev, domain])
    }
    if (domainOutArray.includes(domain)) {
      setDomainOutArray((prev) => prev.filter((id) => id !== domain))
    }
    if (domainNeitherArray.includes(domain)) {
      setDomainNeitherArray((prev) => prev.filter((id) => id !== domain))
    }
  }
  const handleThumbDown = () => {
    if (!domainOutArray.includes(domain)) {
      setDomainOutArray((prev) => [...prev, domain])
    }
    if (domainInArray.includes(domain)) {
      setDomainInArray((prev) => prev.filter((id) => id !== domain))
    }
    if (domainNeitherArray.includes(domain)) {
      setDomainNeitherArray((prev) => prev.filter((id) => id !== domain))
    }
  }

  const handleShield = () => {
    if (!domainNeitherArray.includes(domain)) {
      setDomainNeitherArray((prev) => [...prev, domain])
    }
    if (domainInArray.includes(domain)) {
      setDomainInArray((prev) => prev.filter((id) => id !== domain))
    }
    if (domainOutArray.includes(domain)) {
      setDomainOutArray((prev) => prev.filter((id) => id !== domain))
    }
  }
  return (
    <div className="flex flex-col items-center justify-center space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
      <Button
        onClick={handleThumbUp}
        variant="ghost"
        className="h-8 p-0"
        type="button"
      >
        <span className="sr-only">Whitelist this domain</span>
        {domainInArray.includes(domain) ? (
          <HandThumbUpIcon className="h-6 w-6" />
        ) : (
          <HandThumbUpIconOutline className="h-6 w-6" />
        )}
      </Button>
      <Button
        onClick={handleThumbDown}
        variant="ghost"
        className="h-8 p-0"
        type="button"
      >
        <span className="sr-only">Blacklist this domain</span>
        {domainOutArray.includes(domain) ? (
          <HandThumbDownIcon className="h-6 w-6" />
        ) : (
          <HandThumbDownIconOutline className="h-6 w-6" />
        )}
      </Button>
      <Button
        onClick={handleShield}
        variant="ghost"
        className="h-8 p-0"
        type="button"
      >
        <span className="sr-only">Screen emails from this domain</span>
        {domainNeitherArray.includes(domain) ? (
          <ShieldExclamationIcon className="h-6 w-6" />
        ) : (
          <ShieldExclamationIconOutline className="h-6 w-6" />
        )}
      </Button>
    </div>
  )
}
