import { Fragment } from 'react'
import Link from 'next/link'
import { Popover, Transition } from '@headlessui/react'
import { useSession } from 'next-auth/react'

import { Container } from '~/components/Container'
import { Logo } from '~/components/Logo'
import { Button } from '../Button'
import { MobileNavIcon, MobileNavLink, NavLink } from '../NavLink'
import { JoinTheWaitlist } from './JoinTheWaitlist'

export const howItWorksSectionId = 'how-it-works'
export const privacySectionId = 'privacy'
export const pricingSectionId = 'pricing'

function MobileNavigation() {
  const { data: session } = useSession()

  return (
    <Popover>
      <Popover.Button
        className="relative z-10 flex h-8 w-8 items-center justify-center ui-not-focus-visible:outline-none"
        aria-label="Toggle Navigation"
      >
        {({ open }) => <MobileNavIcon open={open} />}
      </Popover.Button>
      <Transition.Root>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-150 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Popover.Overlay className="fixed inset-0 bg-slate-300/50" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="duration-100 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Popover.Panel
            as="div"
            className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-2xl bg-white p-4 text-lg tracking-tight text-slate-900 shadow-xl ring-1 ring-slate-900/5"
          >
            <MobileNavLink href={`#${howItWorksSectionId}`}>
              How It Works
            </MobileNavLink>
            <MobileNavLink href={`#${pricingSectionId}`}>Pricing</MobileNavLink>
            <MobileNavLink href={`#${privacySectionId}`}>
              Privacy & Security
            </MobileNavLink>
            <hr className="m-2 border-slate-300/40" />
            <MobileNavLink href={session ? '/dashboard/screen' : '/login'}>
              {session ? 'Back to Dashboard' : 'Login'}
            </MobileNavLink>
          </Popover.Panel>
        </Transition.Child>
      </Transition.Root>
    </Popover>
  )
}

export function Header() {
  const { data: session } = useSession()
  return (
    <header className="border-b border-gray-900/10 py-3">
      <Container>
        <nav className="relative z-50 flex justify-between">
          <div className="flex items-center md:gap-x-12">
            <Link
              href={session ? '/dashboard/screen' : '/'}
              aria-label={session ? 'Screen' : 'Home'}
            >
              <Logo className="h-10 w-auto" />
            </Link>
            <div className="hidden md:flex md:gap-x-6">
              <NavLink href={`#${howItWorksSectionId}`}>How It Works</NavLink>
              <NavLink href={`#${pricingSectionId}`}>Pricing</NavLink>
              <NavLink href={`#${privacySectionId}`}>
                Privacy & Security
              </NavLink>
            </div>
          </div>
          <div className="flex items-center gap-x-5 md:gap-x-8">
            <div className="hidden md:block">
              <Button
                variant={session ? 'solid' : 'outline'}
                href={session ? '/dashboard/screen' : '/login'}
              >
                {session ? 'Dashboard' : 'Login'}
              </Button>
            </div>
            {!session && <JoinTheWaitlist />}
            {/* <Button href="/register" color="blue">
              <span>
                Get started <span className="hidden lg:inline">today</span>
              </span>
            </Button> */}
            <div className="-mr-1 md:hidden">
              <MobileNavigation />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  )
}
