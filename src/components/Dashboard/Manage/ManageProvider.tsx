import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type FC,
  type PropsWithChildren,
} from 'react'
import { useRouter } from 'next/router'
import { useWindowSize } from '@uidotdev/usehooks'

import { toast } from '~/components/ui/use-toast'
import { useZodForm } from '~/lib/form'
import { trpc, type RouterOutput } from '~/lib/trpc'
import { manageDomainsSchema } from '~/schemas/domain.schema'
import { manageSendersSchema } from '~/schemas/sender.schema'

function parsePath(asPath: string) {
  const inOrOut = asPath.split('/')[3]
  if (!inOrOut) {
    throw new Error('Invalid path')
  }
  return parseInOrOut(inOrOut)
}

function removeParamsFromStatus(status: string) {
  const parsed = status.split('?')[0]
  if (!parsed) {
    throw new Error('Invalid status')
  }
  return parsed
}

export function parseInOrOut(statusRaw: string) {
  const status = removeParamsFromStatus(statusRaw)
  if (status !== 'in' && status !== 'out') {
    throw new Error('invalid status')
  }
  return status
}

export type ManageDomainData =
  RouterOutput['manage']['listByScreenStatus']['domains'][number]

export type ManageSenderData =
  RouterOutput['manage']['listByScreenStatus']['senders'][number]

const useManageProvider = () => {
  const { asPath } = useRouter()
  const path = parsePath(asPath)
  const { width } = useWindowSize()
  const useColumnsMobile = !!width && width < 768
  const [{ domains: domainDataRaw, senders: senderDataRaw }] =
    trpc.manage.listByScreenStatus.useSuspenseQuery({
      screenStatus: path,
    })
  const [domainData, setDomainData] =
    useState<ManageDomainData[]>(domainDataRaw)
  const domainsArray = useMemo(
    () => domainDataRaw.map((d) => d.domain),
    [domainDataRaw],
  )
  const [domainInArray, setDomainInArray] = useState(
    path === 'in' ? domainsArray : [],
  )
  const [domainOutArray, setDomainOutArray] = useState(
    path === 'out' ? domainsArray : [],
  )
  // update state when server state changes
  useEffect(() => {
    setDomainData(domainDataRaw)
    if (path === 'in') {
      setDomainInArray(domainsArray)
    }
    if (path === 'out') {
      setDomainOutArray(domainsArray)
    }
  }, [domainDataRaw, domainsArray, path])
  const [domainNeitherArray, setDomainNeitherArray] = useState<string[]>([])
  const [shouldRenderDomain, setShouldRenderDomain] = useState(false)
  const [isSlidingOutDomain, setIsSlidingOutDomain] = useState(false)

  // manage animation
  useLayoutEffect(() => {
    const currLength =
      path === 'in' ? domainInArray.length : domainOutArray.length
    if (currLength !== domainData.length) {
      setShouldRenderDomain(true)
      setIsSlidingOutDomain(false)
    } else {
      setIsSlidingOutDomain(true)
      setTimeout(() => setShouldRenderDomain(false), 200) // time for animation duration
    }
  }, [
    domainData.length,
    domainInArray.length,
    isSlidingOutDomain,
    domainOutArray.length,
    path,
  ])
  const manageDomainsForm = useZodForm({
    schema: manageDomainsSchema.omit({ domainsDecision: true }),
  })
  const submitManageDomains = trpc.manage.updateDomains.useMutation({
    onSuccess: (_data, variables) => {
      const { domainsDecision } = variables
      toast({
        title: 'Domains updated successfully!',
        duration: 5000,
      })
      const untouchedDomains = domainsArray.filter(
        (d) => !domainsDecision.has(d),
      )
      // only keep row if (1) domain not in neither array and (2) domain not in opposite array
      const updatedDomainData = domainData
        .filter((d) => !domainNeitherArray.includes(d.domain))
        .filter((d) =>
          path === 'in'
            ? !domainOutArray.includes(d.domain)
            : !domainInArray.includes(d.domain),
        )
      setDomainData(updatedDomainData)
      switch (path) {
        case 'in':
          setDomainInArray(untouchedDomains)
          setDomainOutArray([])
          break
        case 'out':
          setDomainOutArray(untouchedDomains)
          setDomainInArray([])
          break
        default:
          throw new Error('Invalid path')
      }
      setDomainNeitherArray([])
    },
  })

  const [senderData, setSenderData] =
    useState<ManageSenderData[]>(senderDataRaw)
  const sendersArray = useMemo(
    () => senderDataRaw.map((s) => s.email),
    [senderDataRaw],
  )
  const [senderInArray, setSenderInArray] = useState(
    path === 'in' ? sendersArray : [],
  )
  const [senderOutArray, setSenderOutArray] = useState(
    path === 'out' ? sendersArray : [],
  )
  useEffect(() => {
    setSenderData(senderDataRaw)
    if (path === 'in') {
      setSenderInArray(sendersArray)
    }
    if (path === 'out') {
      setSenderOutArray(sendersArray)
    }
  }, [senderDataRaw, sendersArray, path])
  const [senderNeitherArray, setSenderNeitherArray] = useState<string[]>([])
  const [shouldRenderSender, setShouldRenderSender] = useState(false)
  const [isSlidingOutSender, setIsSlidingOutSender] = useState(false)
  useLayoutEffect(() => {
    const currLength =
      path === 'in' ? senderInArray.length : senderOutArray.length
    if (currLength !== senderData.length) {
      setShouldRenderSender(true)
      setIsSlidingOutSender(false)
    } else {
      setIsSlidingOutSender(true)
      setTimeout(() => setShouldRenderSender(false), 200) // time for animation duration
    }
  }, [
    senderData.length,
    senderInArray.length,
    isSlidingOutSender,
    senderOutArray.length,
    path,
  ])
  const manageSendersForm = useZodForm({
    schema: manageSendersSchema.omit({ sendersDecision: true }),
  })
  const submitManageSenders = trpc.manage.updateSenders.useMutation({
    onSuccess: (_data, variables) => {
      const { sendersDecision } = variables
      toast({
        title: 'Senders updated successfully!',
        description:
          path === 'out'
            ? 'It may take a few moments before emails from allowed senders show up in your inbox.'
            : undefined,
        duration: 5000,
      })
      const untouchedSenders = sendersArray.filter(
        (s) => !sendersDecision.has(s),
      )
      const updatedSenderData = senderData
        .filter((s) => !senderNeitherArray.includes(s.email))
        .filter((s) =>
          path === 'in'
            ? !senderOutArray.includes(s.email)
            : !senderInArray.includes(s.email),
        )
      setSenderData(updatedSenderData)
      switch (path) {
        case 'in':
          setSenderInArray(untouchedSenders)
          setSenderOutArray([])
          break
        case 'out':
          setSenderOutArray(untouchedSenders)
          setSenderInArray([])
          break
        default:
          throw new Error('Invalid path')
      }
      setSenderNeitherArray([])
    },
  })
  return {
    path,
    useColumnsMobile,
    domain: {
      domainData,
      domainInArray,
      setDomainInArray,
      domainOutArray,
      setDomainOutArray,
      domainNeitherArray,
      setDomainNeitherArray,
      shouldRender: shouldRenderDomain,
      isSlidingOut: isSlidingOutDomain,
      submitManageDomains,
      manageDomainsForm,
    },
    sender: {
      senderData,
      senderInArray,
      setSenderInArray,
      senderOutArray,
      setSenderOutArray,
      senderNeitherArray,
      setSenderNeitherArray,
      shouldRender: shouldRenderSender,
      isSlidingOut: isSlidingOutSender,
      manageSendersForm,
      submitManageSenders,
    },
  } as const
}

type ManageContextReturn = ReturnType<typeof useManageProvider> | undefined

const ManageContext = createContext<ManageContextReturn>(undefined)

export const ManageProvider: FC<PropsWithChildren> = ({ children }) => {
  const values = useManageProvider()
  return (
    <ManageContext.Provider value={values}>{children}</ManageContext.Provider>
  )
}

export const useManage = () => {
  const context = useContext(ManageContext)
  if (context === undefined) {
    throw new Error('useDomain must be used within a DomainProvider')
  }
  return context
}
