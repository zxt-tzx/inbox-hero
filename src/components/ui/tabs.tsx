import * as React from 'react'
import Link, { type LinkProps } from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '~/lib/utils'

interface Context {
  defaultValue: string
  hrefFor: (value: string) => LinkProps['href']
  searchParam: string
  selected: string
}
const TabsContext = React.createContext<Context | undefined>(undefined)

function Tabs(props: {
  children: React.ReactNode
  className?: string
  /**
   * The default tab
   */
  defaultValue: string
  /**
   * Which search param to use
   * @default "tab"
   */
  searchParam?: string
  removeParam?: string
}) {
  const {
    children,
    className,
    searchParam = 'tab',
    removeParam,
    ...other
  } = props
  const searchParams = useSearchParams()

  const selected = searchParams.get(searchParam) || props.defaultValue

  const pathname = usePathname()
  const hrefFor: Context['hrefFor'] = React.useCallback(
    (value) => {
      const params = new URLSearchParams(searchParams.toString())
      if (removeParam) {
        params.delete(removeParam)
      }
      if (value === props.defaultValue) {
        params.delete(searchParam)
      } else {
        params.set(searchParam, value)
      }

      const asString = params.toString()
      return pathname + (asString ? '?' + asString : '')
    },
    [searchParams, removeParam, props.defaultValue, pathname, searchParam],
  )

  return (
    <TabsContext.Provider value={{ ...other, hrefFor, searchParam, selected }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

const useContext = () => {
  const context = React.useContext(TabsContext)
  if (context === undefined) {
    throw new Error(
      'Tabs compound components cannot be rendered outside the Tabs component',
    )
  }

  return context
}

function TabsList(props: { children: React.ReactNode; className?: string }) {
  return (
    <div
      {...props}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        props.className,
      )}
    />
  )
}
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = (props: {
  children: React.ReactNode
  className?: string
  value: string
}) => {
  const context = useContext()

  return (
    <Link
      {...props}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        props.className,
      )}
      data-state={context.selected === props.value ? 'active' : 'inactive'}
      href={context.hrefFor(props.value)}
      scroll={false}
      shallow={true}
    />
  )
}
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

function TabsContent(props: {
  children: React.ReactNode
  className?: string
  value: string
}) {
  const context = useContext()

  if (context.selected !== props.value) {
    return null
  }

  return (
    <div
      {...props}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        props.className,
      )}
    />
  )
}
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
