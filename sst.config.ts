import { type SSTConfig } from 'sst'
import { Certificates } from 'stacks/Certificates'
import { Crons } from 'stacks/Crons'
import { Queues } from 'stacks/Queues'
import { Secrets } from 'stacks/Secrets'
import { Web } from 'stacks/Web'

export default {
  config(_input) {
    return {
      name: 'inbox-hero',
      region: 'us-east-1',
    }
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      timeout: 30,
      runtime: 'nodejs18.x',
    })
    if (app.stage !== 'app') {
      app.setDefaultRemovalPolicy('destroy')
    }
    app.stack(Secrets).stack(Certificates).stack(Queues).stack(Web).stack(Crons)
  },
} satisfies SSTConfig
