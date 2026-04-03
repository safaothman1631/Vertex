import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const code = searchParams.get('code')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next') ?? '/login'
  // Prevent open redirect — only allow relative paths
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/login'

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // ── PKCE code exchange (triggered by Supabase email redirect OR OAuth) ──
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const isRecovery = type === 'recovery' || next.includes('reset-password')
      if (isRecovery) return NextResponse.redirect(new URL(next, request.url))

      // Email verification (next=/login) → show verified message
      if (next.startsWith('/login')) {
        return NextResponse.redirect(new URL('/login?verified=1', request.url))
      }

      // OAuth sign-in → role-based redirect
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()
        if (profile?.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
      }
      return NextResponse.redirect(new URL(next || '/', request.url))
    }
  }

  // ── OTP / token_hash flow ──
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(new URL(next, request.url))
      }
      return NextResponse.redirect(new URL('/login?verified=1', request.url))
    }
  }

  // Something went wrong
  return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
}
