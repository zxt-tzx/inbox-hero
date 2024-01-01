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
  sender: string
}

export function SenderOptions({ sender }: OptionsProps) {
  const {
    sender: {
      senderInArray,
      setSenderInArray,
      senderOutArray,
      setSenderOutArray,
      senderNeitherArray,
      setSenderNeitherArray,
    },
  } = useManage()

  const handleThumbUp = () => {
    if (!senderInArray.includes(sender)) {
      setSenderInArray((prev) => [...prev, sender])
    }
    if (senderOutArray.includes(sender)) {
      setSenderOutArray((prev) => prev.filter((id) => id !== sender))
    }
    if (senderNeitherArray.includes(sender)) {
      setSenderNeitherArray((prev) => prev.filter((id) => id !== sender))
    }
  }
  const handleThumbDown = () => {
    if (!senderOutArray.includes(sender)) {
      setSenderOutArray((prev) => [...prev, sender])
    }
    if (senderInArray.includes(sender)) {
      setSenderInArray((prev) => prev.filter((id) => id !== sender))
    }
    if (senderNeitherArray.includes(sender)) {
      setSenderNeitherArray((prev) => prev.filter((id) => id !== sender))
    }
  }

  const handleShield = () => {
    if (!senderNeitherArray.includes(sender)) {
      setSenderNeitherArray((prev) => [...prev, sender])
    }
    if (senderInArray.includes(sender)) {
      setSenderInArray((prev) => prev.filter((id) => id !== sender))
    }
    if (senderOutArray.includes(sender)) {
      setSenderOutArray((prev) => prev.filter((id) => id !== sender))
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
        <span className="sr-only">Whitelist this sender</span>
        {senderInArray.includes(sender) ? (
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
        <span className="sr-only">Blacklist this sender</span>
        {senderOutArray.includes(sender) ? (
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
        <span className="sr-only">Screen emails from this sender</span>
        {senderNeitherArray.includes(sender) ? (
          <ShieldExclamationIcon className="h-6 w-6" />
        ) : (
          <ShieldExclamationIconOutline className="h-6 w-6" />
        )}
      </Button>
    </div>
  )
}
