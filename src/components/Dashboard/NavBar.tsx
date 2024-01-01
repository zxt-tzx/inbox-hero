import { Fragment } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Popover, Transition } from '@headlessui/react'
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  // CreditCardIcon,
  // QuestionMarkCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/20/solid'
import { signOut, useSession } from 'next-auth/react'

import { Container } from '~/components/Container'
import { Logo } from '~/components/Logo'
import { Avatar, AvatarImage } from '~/components/ui/avatar'
import {
  MobileNavIcon,
  MobileNavLink,
  MobileNavText,
  NavLink,
  NavText,
} from '../NavLink'
import { PrivateBeta } from './PrivateBeta'

function MobileNavigation() {
  const { data: session } = useSession()
  const router = useRouter()
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
            {session?.user.email ? (
              <>
                <div className="flex items-center">{session.user.email}</div>
                <hr className="m-2 border-slate-300/40" />
              </>
            ) : null}
            <div className="flex items-center">
              <CalendarDaysIcon className="h-6 w-6" />
              <MobileNavLink href="/dashboard/schedule">Schedule</MobileNavLink>
            </div>
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6" />
              <MobileNavLink href="/dashboard/screen">Screen</MobileNavLink>
            </div>
            {/* <MobileNavLink href='/dashboard/in-n-out'>
              In-N-Out
            </MobileNavLink> */}
            <hr className="m-2 border-slate-300/40" />
            {/* <div className="flex items-center">
              <QuestionMarkCircleIcon className="h-6 w-6" />
              <MobileNavLink href="/faqs">FAQs</MobileNavLink>
            </div> */}
            {/* <div className="flex items-center">
              <CreditCardIcon className="h-6 w-6" />
              <MobileNavLink href="/dashboard/billing">Billing</MobileNavLink>
            </div> */}
            {/* <hr className="m-2 border-slate-300/40" /> */}
            {session && (
              <div className="flex items-center">
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
                <MobileNavText onClick={signOut}>Log Out</MobileNavText>
              </div>
            )}
            {!session && (
              <div className="flex items-center">
                <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                <MobileNavText onClick={() => router.push('/login')}>
                  Log In
                </MobileNavText>
              </div>
            )}
          </Popover.Panel>
        </Transition.Child>
      </Transition.Root>
    </Popover>
  )
}

export function NavBar() {
  const { data: session } = useSession()
  const router = useRouter()
  return (
    <div className="border-b border-gray-900/10 py-3">
      <Container>
        <nav className="relative z-50 flex justify-between ">
          <div className="flex items-center md:gap-x-12">
            <Link
              href={session ? '/dashboard/screen' : '/'}
              aria-label={session ? 'Screen' : 'Home'}
            >
              <Logo className="h-10 w-auto" />
            </Link>
            <div className="hidden md:flex md:gap-x-6">
              <NavLink href="/dashboard/schedule">Schedule</NavLink>
              <NavLink href="/dashboard/screen">Screen</NavLink>
              {/* <NavLink href='/dashboard/in-n-out'>
              In-N-Out
            </NavLink> */}
            </div>
          </div>
          <div className="flex items-center gap-x-5 md:gap-x-8">
            <PrivateBeta />
            <div className="hidden md:block">
              {/* <NavLink href="/faqs">FAQs</NavLink> */}
              {/* <NavLink href="/dashboard/billing">Billing</NavLink> */}
              {session && <NavText onClick={signOut}>Logout</NavText>}
              {!session && (
                <NavText onClick={() => router.push('/login')}>Login</NavText>
              )}
            </div>
            {session?.user.image ? (
              <Avatar>
                <AvatarImage src={session.user.image} />
              </Avatar>
            ) : null}
            <div className="-mr-1 md:hidden">
              <MobileNavigation />
            </div>
          </div>
        </nav>
      </Container>
    </div>
  )
}
