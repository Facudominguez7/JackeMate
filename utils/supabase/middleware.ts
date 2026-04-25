import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { isAnonymousUser } from '@/lib/authz/anonymous'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define which paths require authentication
  // /reportes y /mapa son públicas para que usuarios anónimos puedan ver reportes
  // /reportes/nuevo queda pública para permitir inicio anónimo desde la propia página
  const protectedPaths = ['/dashboard']
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p))

  if (isAnonymousUser(user) && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('modo', 'completar-cuenta')
    return NextResponse.redirect(url)
  }

  if (!user && isProtected) {
    // no user and trying to access a protected route -> redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // Verificar permisos para crear reportes (solo Admin y Ciudadano)
  if (request.nextUrl.pathname.startsWith('/reportes/nuevo')) {
    if (!user || isAnonymousUser(user)) {
      return supabaseResponse
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('rol_id')
      .eq('id', user.id)
      .single()

    const rolId = profileData?.rol_id
    // Solo Admin (1) y Ciudadano (2) pueden crear reportes
    const puedeCrear = rolId === 1 || rolId === 2

    if (!puedeCrear) {
      // Usuario autenticado pero sin permisos -> redirigir al mapa
      const url = request.nextUrl.clone()
      url.pathname = '/mapa'
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
