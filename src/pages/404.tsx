import Link from 'next/link'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'

import { Button } from '~/components/Button'
import { AuthLayout } from '~/components/LandingPage/AuthLayout'
import { Logo } from '~/components/Logo'

const Custom404 = () => {
  const router = useRouter()
  const notFoundText = 'Page not found'
  return (
    <>
      <NextSeo title={`${notFoundText}`} />
      <AuthLayout>
        <div className="flex">
          <Link href="/" aria-label="Home">
            <Logo className="h-10 w-auto" />
          </Link>
        </div>
        <p className="mt-20 text-2xl font-medium text-gray-700">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900">
          {notFoundText}
        </h1>
        <p className="text-md mt-3 text-gray-700">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <Button onClick={() => router.back()} className="mt-10">
          Go back
        </Button>
      </AuthLayout>
    </>
  )
}

export default Custom404
