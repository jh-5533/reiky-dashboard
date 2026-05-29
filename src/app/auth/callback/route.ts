import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')

  // Supabase returned an error (e.g. expired OTP)
  if (error) {
    const desc = searchParams.get('error_description') ?? error
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(desc)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
    )
  }

  // No code and no error — redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}
