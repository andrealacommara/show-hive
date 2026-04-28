import { createAdminClient } from '@/lib/supabase/admin'

export async function getUserAccess(email: string | null | undefined) {
  if (!email) return null
  const admin = createAdminClient()
  const { data } = await admin
    .from('allowed_users')
    .select('id, email, role')
    .eq('email', email)
    .maybeSingle()
  return data
}

export async function requireAllowed(email: string | null | undefined) {
  const access = await getUserAccess(email)
  if (!access) {
    throw new Error('Unauthorized')
  }
  return access
}

export async function requireAdmin(email: string | null | undefined) {
  const access = await getUserAccess(email)
  if (!access || access.role !== 'admin') {
    throw new Error('Forbidden')
  }
  return access
}
