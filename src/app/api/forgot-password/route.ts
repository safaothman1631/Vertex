import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectTo = `${appUrl}/reset-password`

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // DEV: generateLink bypasses rate limits — link printed to server terminal only
  if (process.env.NODE_ENV === 'development') {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const token = data?.properties?.hashed_token
    if (token) {
      const link = `${appUrl}/auth/confirm?token_hash=${token}&type=recovery&next=/reset-password`
      console.log('\n' + '━'.repeat(60))
      console.log('🔑  [DEV] Reset Password link (open in browser):')
      console.log(link)
      console.log('━'.repeat(60) + '\n')
    }
    return NextResponse.json({ ok: true })
  }

  // PRODUCTION: send real email
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
