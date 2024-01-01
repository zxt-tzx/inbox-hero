import { NextSeo } from 'next-seo'

import { Footer } from '~/components/Footer'
import { CallToAction } from '~/components/LandingPage/CallToAction'
import { Header } from '~/components/LandingPage/Header'
import { Hero } from '~/components/LandingPage/Hero'
import { HowItWorks } from '~/components/LandingPage/HowItWorks'
import { Pricing } from '~/components/LandingPage/Pricing'
import { PrivacyAndSecurity } from '~/components/LandingPage/PrivacyAndSecurity'
import { siteConfig } from '~/config/site'

// import { SecondaryFeatures } from '~/components/SecondaryFeatures'

export default function Home() {
  return (
    <>
      <NextSeo title={siteConfig.tagline} />
      <Header />
      <main>
        <Hero name={siteConfig.name} description={siteConfig.description} />
        <HowItWorks />
        <Pricing />
        <PrivacyAndSecurity />
        <CallToAction />
      </main>
      <Footer name={siteConfig.shortName} />
    </>
  )
}
