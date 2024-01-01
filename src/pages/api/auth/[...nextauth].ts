import NextAuth from 'next-auth'

import { nextAuthConfig } from '~/server/auth/config'

export default NextAuth(nextAuthConfig)
