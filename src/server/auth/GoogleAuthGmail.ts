import type { GoogleProfile } from 'next-auth/providers/google'
import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth'

export function GoogleAuthGmail<P extends GoogleProfile>(
  options: OAuthUserConfig<P>,
): OAuthConfig<P> {
  return {
    id: 'google-auth-gmail',
    name: 'GmailIncrementalAuth',
    type: 'oauth',
    wellKnown: 'https://accounts.google.com/.well-known/openid-configuration',
    authorization: {
      params: {
        scope:
          'openid email profile https://www.googleapis.com/auth/gmail.modify',
        access_type: 'offline',
        prompt: 'consent',
        response_type: 'code',
      },
    },
    idToken: true,
    checks: ['pkce', 'state'],
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      }
    },
    options,
  }
}
