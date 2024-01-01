import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FC,
  type PropsWithChildren,
} from 'react'
import { useRouter } from 'next/router'
import { useWindowSize } from '@uidotdev/usehooks'
import { useSession } from 'next-auth/react'

import { toast } from '~/components/ui/use-toast'
import { useZodForm } from '~/lib/form'
import { trpc, type RouterOutput } from '~/lib/trpc'
import { screenSendersSchema } from '~/schemas/screener.schema'

export type ScreenSenderData =
  RouterOutput['screener']['queryScreenerId']['senders'][number]

const useScreenerProvider = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { userId: userIdRaw, screenerId: screenerIdRaw } = router.query
  const [sendersData, setSendersData] = useState<ScreenSenderData[]>([])
  const [retrieved, setRetrieved] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const userId = String(userIdRaw)
  const screenerId = String(screenerIdRaw)
  const [{ senders, success }] = trpc.screener.queryScreenerId.useSuspenseQuery(
    {
      id: screenerId,
      userId,
    },
  )
  useEffect(() => {
    if (success) {
      setRetrieved(true)
      setSendersData(senders)
    }
  }, [success, senders])
  const { width } = useWindowSize()
  const useColumnsMobile = !!width && width < 768
  const [inArray, setInArray] = useState<string[]>([])
  const [outArray, setOutArray] = useState<string[]>([])
  const [shouldRender, setShouldRender] = useState(false)
  const [isSlidingOut, setIsSlidingOut] = useState(false)
  useEffect(() => {
    const sum = inArray.length + outArray.length
    if (sum > 0) {
      setShouldRender(true)
      setIsSlidingOut(false)
    } else {
      setIsSlidingOut(true)
      setTimeout(() => setShouldRender(false), 200) // time for animation duration
    }
  }, [inArray.length, isSlidingOut, outArray.length])
  const screenSendersForm = useZodForm({
    schema: screenSendersSchema.omit({ screeningDecisions: true }),
    defaultValues: {
      userId,
      screenerId,
    },
  })
  const submitScreenSenders = trpc.screener.screenSenders.useMutation({
    onSuccess: (_data, variables) => {
      const { screeningDecisions } = variables
      toast({
        title: 'Senders screened successfully!',
        description:
          'It may take a few moments before emails from allowed senders show up in your inbox.',
        duration: 5000,
      })
      // remove values form inArray and outArray and sendersData
      const updatedSendersData = sendersData.filter(
        (d) => !screeningDecisions.has(d.senderEmail),
      )
      setSendersData(updatedSendersData)
      setInArray([])
      setOutArray([])
      setShowConfetti(true)
      setTimeout(() => {
        setTimeout(() => setShowConfetti(false), 5000)
      })
    },
  })
  return {
    userId,
    sessionUserId: session ? session.user.id : null,
    screenerId,
    sendersData,
    setSendersData,
    inArray,
    setInArray,
    outArray,
    setOutArray,
    shouldRender,
    isSlidingOut,
    screenSendersForm,
    submitScreenSenders,
    useColumnsMobile,
    setRetrieved,
    retrieved,
    showConfetti,
  }
}

type ScreenerContextReturn = ReturnType<typeof useScreenerProvider> | undefined

const ScreenerContext = createContext<ScreenerContextReturn>(undefined)

export const ScreenerProvider: FC<PropsWithChildren> = ({ children }) => {
  const values = useScreenerProvider()
  return (
    <ScreenerContext.Provider value={values}>
      {children}
    </ScreenerContext.Provider>
  )
}

export const useScreener = () => {
  const context = useContext(ScreenerContext)
  if (context === undefined) {
    throw new Error('useScreener must be used within a ScreenerProvider')
  }
  return context
}
