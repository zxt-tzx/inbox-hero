import { Container } from '~/components/Container'
import { privacySectionId } from './Header'

export function PrivacyAndSecurity() {
  return (
    <section
      id={`${privacySectionId}`}
      aria-label="Features for simplifying everyday business tasks"
      className="pb-14 pt-20 sm:pb-20 sm:pt-32 lg:pb-32"
    >
      <Container>
        <div className="mx-auto max-w-2xl md:text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Privacy & Security
          </h2>
          <p className="mt-4 text-justify text-lg tracking-tight text-slate-700">
            For our service to work, we require access to your inbox. Any
            information about your emails that is not strictly necessary to
            deliver the service will not be processed or stored.
            <br />
            <br />
            We are also in the process of verifying our application with Google
            and undergoing a security assessment, which will be completed at
            launch.
            <br />
            <br />
            But in case you still don&apos;t trust us, you may consider only
            using Inbox Hero for email accounts that are not associated with any
            sensitive services.
          </p>
          <p className="mt-2 font-display text-xl text-slate-900"></p>
        </div>
      </Container>
    </section>
  )
}
