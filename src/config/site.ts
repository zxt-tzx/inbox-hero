export type SiteConfig = {
  name: string
  shortName: string
  tagline: string
  description: string
  url: string
  links: {
    twitter: string
    github?: string
  }
}

export const siteConfig: SiteConfig = {
  name: 'Inbox Hero 📨',
  shortName: 'Inbox Hero',
  tagline: 'Screen emails from first-time senders',
  description: 'Modernize your Gmail. Screen emails from first-time senders.',
  url: 'https://app.inboxhero.org',
  links: {
    twitter: '@inboxheroapp',
  },
}
