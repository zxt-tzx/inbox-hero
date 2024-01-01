import {
  HandThumbDownIcon as HandThumbDownIconOutline,
  HandThumbUpIcon as HandThumbUpIconOutline,
} from '@heroicons/react/24/outline'
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/24/solid'

import { Button } from '~/components/ui/button'
import { useScreener } from '../ScreenerProvider'

interface ThumbsProps {
  senderEmail: string
}

export function Thumbs({ senderEmail }: ThumbsProps) {
  const { setInArray, setOutArray, inArray, outArray } = useScreener()
  const handleThumbUp = () => {
    if (inArray.includes(senderEmail)) {
      setInArray((prev) => prev.filter((id) => id !== senderEmail))
    } else {
      setInArray((prev) => [...prev, senderEmail])
    }
    if (outArray.includes(senderEmail)) {
      setOutArray((prev) => prev.filter((id) => id !== senderEmail))
    }
  }
  const handleThumbDown = () => {
    if (outArray.includes(senderEmail)) {
      setOutArray((prev) => prev.filter((id) => id !== senderEmail))
    } else {
      setOutArray((prev) => [...prev, senderEmail])
    }
    if (inArray.includes(senderEmail)) {
      setInArray((prev) => prev.filter((id) => id !== senderEmail))
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
        <span className="sr-only">Allow this sender</span>
        {inArray.includes(senderEmail) ? (
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
        <span className="sr-only">Block this sender</span>
        {outArray.includes(senderEmail) ? (
          <HandThumbDownIcon className="h-6 w-6" />
        ) : (
          <HandThumbDownIconOutline className="h-6 w-6" />
        )}
      </Button>
    </div>
  )
}
