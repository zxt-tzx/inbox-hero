import Image from 'next/image'
import Link from 'next/link'

import { Container } from '~/components/Container'
import {
  howItWorksSectionId,
  pricingSectionId,
  privacySectionId,
} from '~/components/LandingPage/Header'
import backgroundImage from '~/images/background-faqs.jpg'

interface FAQ {
  href: string | null
  question: string
  answer: string
}
const faqs: Array<Array<FAQ>> = [
  [
    {
      href: null,
      question: 'Yes means yes, at your own time',
      answer:
        "With Inbox Hero, every email can be a <mark>consensual affair</mark>. The first time someone emails you, their email is removed from your inbox. Each day, at a time of your choosing, Inbox Hero sends you a screener for you to decide whether to hear from them again.<br><br>Yes and their email is back in your inbox. No and you'll never hear from them again. Inbox Hero is border security for your email.",
    },
  ],
  [
    {
      href: null,
      question: 'I already have a spam filter?',
      answer:
        "Yes, but <mark>non-spam emails clutter up your inbox too</mark>. An unsolicited sales pitch, a cold email from a recruiter, a newsletter you never subscribed to... these emails ruin your zen.<br><br>With Inbox Hero, you won't even see these emails until a time of your choosing, ensuring you don't miss important communications among the less relevant ones.",
    },
  ],
  [
    {
      href: `#${pricingSectionId}`,
      question: 'How much does this service cost?',
      answer:
        'Inbox Hero is free throughout the beta (limited to 100 users) and, at launch, early adopters will receive a discount!',
    },
    {
      href: `#${privacySectionId}`,
      question: 'Can I trust you with my inbox?',
      answer:
        '<mark>We will never sell your personal data.</mark> <u>Learn more</u> about our privacy and security practices.',
    },
  ],
]

export function HowItWorks() {
  return (
    <section
      id={`${howItWorksSectionId}`}
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-slate-50 py-20 sm:py-32"
    >
      <Image
        className="absolute left-1/2 top-0 max-w-none -translate-y-1/4 translate-x-[-30%]"
        src={backgroundImage}
        alt=""
        width={1558}
        height={946}
        unoptimized
      />
      <Container className="relative">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2
            id="faq-title"
            className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
          >
            How Inbox Hero works
          </h2>
          {/* <p className="mt-4 text-lg tracking-tight text-slate-700">
            Placeat ut est minus quo consequuntur ut aspernatur sequi provident
            quidem et incidunt. Ex a iste laboriosam provident sit expedita
            odio. Deserunt enim dolore dolor est aut quae possimus sit doloribus
            nisi non deleniti a dolores. Asperiores ut ullam repellat quo id
            asperiores expedita eum dicta eos harum optio dolorum.
          </p> */}
        </div>
        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3"
        >
          {faqs.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="flex flex-col gap-y-8">
                {column.map((faq, faqIndex) => {
                  const item = (
                    <li key={faqIndex}>
                      <h3 className="font-display text-xl font-semibold leading-7 text-slate-900">
                        {faq.question}
                      </h3>
                      <div
                        className="mt-4 text-lg text-slate-700"
                        dangerouslySetInnerHTML={{ __html: faq.answer }}
                      />
                    </li>
                  )
                  return faq.href ? (
                    <Link key={faqIndex} href={faq.href}>
                      {item}
                    </Link>
                  ) : (
                    item
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
