import { Head, Html, Main, NextScript } from 'next/document'

import { metadata } from '~/config/Meta'

export default function Document() {
  return (
    <Html
      className="h-full scroll-smooth bg-white antialiased [font-feature-settings:'ss01']"
      lang={metadata.openGraph?.locale}
    >
      <Head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Lexend:wght@400;500&display=swap"
        />
      </Head>
      <body className="no-scrollbar flex h-full flex-col overflow-y-auto">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
