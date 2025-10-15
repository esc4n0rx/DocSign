import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServiceClient, verifyJWT } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    let isAuthenticated = false

    if (token) {
      const payload = verifyJWT(token)

      if (payload) {
        const serviceSupabase = createServiceClient()
        const { data: usuario } = await serviceSupabase
          .from('usuarios')
          .select('id')
          .eq('id', payload.sub)
          .eq('status', 'Ativo')
          .single()

        isAuthenticated = !!usuario
      }
    }

    const isAuthPage = request.nextUrl.pathname === '/'
    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')

    // Se não está autenticado e tenta acessar dashboard
    if (!isAuthenticated && isDashboard) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Se está autenticado e tenta acessar página de login
    if (isAuthenticated && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}