import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProviderAvatar, getProviderFullName } from '@/lib/profile-metadata'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const admin = createAdminClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', requestUrl.origin))
    }

    const session = data.session

    if (session?.user) {
      const user = session.user
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      const providerName = getProviderFullName(user)
      const providerAvatar = getProviderAvatar(user)
      const full_name = existingProfile?.full_name || providerName
      const avatar_url = providerAvatar || existingProfile?.avatar_url

      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name,
        avatar_url,
      })

      // Bootstrap first admin if none exists
      const { count: adminCount } = await admin
        .from('allowed_users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')

      if (!adminCount || adminCount === 0) {
        await admin.from('allowed_users').upsert({
          email: user.email,
          role: 'admin',
          created_by: user.id,
        })
      }
    }
  }

  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
