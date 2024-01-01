import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { getBaseUrl } from './lib/env-utils'

// export { default } from 'next-auth/middleware'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.redirect(getBaseUrl() + '/login')
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
