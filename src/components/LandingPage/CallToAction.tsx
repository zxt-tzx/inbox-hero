import Image from 'next/image'

import { Container } from '~/components/Container'
import backgroundImage from '~/images/background-call-to-action.jpg'
import { JoinTheWaitlist } from './JoinTheWaitlist'

export function CallToAction() {
  return (
    <section
      id="get-started-today"
      className="relative overflow-hidden bg-blue-600 py-32"
    >
      <Image
        className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
        src={backgroundImage}
        alt=""
        width={2347}
        height={1244}
        unoptimized
      />
      <Container className="relative">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight  text-white sm:text-4xl">
            Get started today
          </h2>
          <p className="mt-4 text-lg tracking-tight text-white">
            It&apos;s time to take control of your inbox.
          </p>
          <JoinTheWaitlist className="mt-10" />
          {/* <Button href="/register" color="white" className="mt-10">
            Get two weeks free
          </Button> */}
        </div>
      </Container>
    </section>
  )
}
