import { Api, NextjsSite, use, type StackContext } from 'sst/constructs'

import { env } from '~/env.mjs'
import { removeHttp } from '~/lib/utils'
import { Certificates } from './Certificates'
import { Queues } from './Queues'
import { Secrets } from './Secrets'

export function Web({ app, stack }: StackContext) {
  const { resendQueue, gmailQueue } = use(Queues)
  const {
    DATABASE_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_PUBSUB_SUBSCRIPTION,
  } = use(Secrets)
  // keeping this in case I need to rebuild this from scratch once again
  // const customDomain = undefined
  const { amznIssuedCert: certificate } = use(Certificates)
  const customDomainParams = {
    isExternalDomain: true,
    cdk: {
      certificate,
    },
  }
  const customDomainSite =
    app.stage === 'app' || app.stage === 'stg'
      ? {
          ...customDomainParams,
          domainName: removeHttp(env.NEXT_PUBLIC_APP_URL),
        }
      : undefined

  const site = new NextjsSite(stack, 'site', {
    customDomain: customDomainSite,
    warm: 1,
    bind: [resendQueue, gmailQueue],
    logging: 'combined',
  })
  const customDomainApi =
    app.stage === 'app' || app.stage === 'stg'
      ? {
          ...customDomainParams,
          domainName: removeHttp(env.NEXT_PUBLIC_API_URL),
        }
      : undefined
  const api = new Api(stack, 'api', {
    customDomain: customDomainApi,
    defaults: {
      function: {
        timeout: 60,
      },
    },
    routes: {
      'POST /gmail/webhook': 'src/serverless/api/gmail-webhook.handler',
      'POST /welcome': 'src/serverless/api/welcome.handler',
      // 'POST /dev': 'src/serverless/api/dev.handler',
    },
  })
  api.bind([
    DATABASE_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_PUBSUB_SUBSCRIPTION,
    resendQueue,
  ])
  stack.addOutputs({
    CloudfrontSiteUrl: site.url,
    DomainUrl: site.customDomainUrl,
    ApiAwsUrl: api.url,
    ApiUrl: api.customDomainUrl,
  })
  return { site, api }
}
