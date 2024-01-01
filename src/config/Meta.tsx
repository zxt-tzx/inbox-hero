import Head from 'next/head'
import { useRouter } from 'next/router'
import { NextSeo, type DefaultSeoProps } from 'next-seo'

import { siteConfig } from '~/config/site'

export const metadata: DefaultSeoProps = {
  title: siteConfig.name,
  titleTemplate: 'Inbox Hero - %s',
  description: siteConfig.description,
  canonical: siteConfig.url,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/images/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: 'OG Image 512px',
        type: 'image/png',
      },
      {
        url: `${siteConfig.url}/images/android-chrome-192x192.png`,
        width: 192,
        height: 192,
        alt: 'OG Image 192px',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    cardType: 'summary_large_image',
    handle: siteConfig.links.twitter,
    site: 'https://twitter.com/inboxheroapp',
  },
}

export const Meta = () => {
  const router = useRouter()

  return (
    <>
      <Head>
        <meta charSet="UTF-8" key="charset" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1"
          key="viewport"
        />
        <link
          rel="apple-touch-icon"
          href={`${router.basePath}/images/apple-touch-icon.png`}
          key="apple"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={`${router.basePath}/images/favicon-32x32.png`}
          key="icon32"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={`${router.basePath}/images/favicon-16x16.png`}
          key="icon16"
        />
        <link
          rel="icon"
          href={`${router.basePath}/favicon.ico`}
          key="favicon"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </Head>
      <NextSeo
        title={metadata.title}
        titleTemplate={metadata.titleTemplate}
        description={metadata.description}
        canonical={metadata.canonical}
        openGraph={{
          title: metadata.title,
          description: metadata.description,
          url: metadata.canonical,
          locale: metadata.openGraph?.locale,
          siteName: metadata.openGraph?.siteName,
          images: metadata.openGraph?.images,
        }}
        twitter={{
          cardType: metadata.twitter?.cardType,
          handle: metadata.twitter?.handle,
          site: metadata.twitter?.site,
        }}
      />
    </>
  )
}
