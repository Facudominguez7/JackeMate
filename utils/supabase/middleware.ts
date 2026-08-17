import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { canCreateReports, puedeOperarCuadrillas } from '@/lib/authz/roles'

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
  // /reportes/nuevo sigue protegida porque crear reportes requiere sesión + rol permitido
  const protectedPaths = ['/dashboard', '/reportes/nuevo']
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p))

  if (!user && isProtected) {
    // no user and trying to access a protected route -> redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // Verificar permisos de rol para crear reportes y para operar cuadrillas.
  // Se comparte una única lectura de `profiles` entre ambas guardas.
  const rutaCrearReporte = request.nextUrl.pathname.startsWith('/reportes/nuevo')
  const rutaCuadrillas = request.nextUrl.pathname.startsWith('/dashboard/cuadrillas')

  if (user && (rutaCrearReporte || rutaCuadrillas)) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('rol_id')
      .eq('id', user.id)
      .single()

    // Si falla la lectura del perfil, rolId queda null y ambas guardas deniegan (fail-closed).
    const rolId = profileData?.rol_id ?? null

    if (rutaCrearReporte && !canCreateReports(rolId)) {
      // Usuario autenticado pero sin permisos -> redirigir al mapa
      const url = request.nextUrl.clone()
      url.pathname = '/mapa'
      return NextResponse.redirect(url)
    }

    if (rutaCuadrillas && !puedeOperarCuadrillas(rolId)) {
      // Usuario autenticado pero sin permisos para operar cuadrillas -> redirigir al dashboard
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
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
