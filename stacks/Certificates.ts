import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import type { StackContext } from 'sst/constructs'

export function Certificates({ stack }: StackContext) {
  const amznIssuedCert = Certificate.fromCertificateArn(
    stack,
    amznIssuedCertMetadata.id,
    amznIssuedCertMetadata.arn,
  )
  const cfImportedCert = Certificate.fromCertificateArn(
    stack,
    cfImportedCertMetadata.id,
    cfImportedCertMetadata.arn,
  )
  return { amznIssuedCert, cfImportedCert }
}
const amznIssuedCertMetadata = {
  // this cert covers inboxhero.org and *.inboxhero.org
  id: 'inboxheroDomainCert',
  arn: 'arn:aws:acm:us-east-1:522745012037:certificate/92cd119f-0516-4613-ad9f-42cf6fc157a2',
}

const cfImportedCertMetadata = {
  // this cert covers *.inboxhero.org
  id: 'cfImportedCert',
  arn: 'arn:aws:acm:us-east-1:522745012037:certificate/c6cd7495-a733-47a0-ac62-e2bc6d170994',
}
