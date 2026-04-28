type MetadataRecord = Record<string, unknown>

function asRecord(value: unknown): MetadataRecord | null {
  return value && typeof value === 'object' ? (value as MetadataRecord) : null
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return undefined
}

export function getProviderFullName(user: {
  email?: string | null
  user_metadata?: unknown
  identities?: unknown[]
}) {
  const metadata = asRecord(user.user_metadata)
  const identityData = asRecord(asRecord(user.identities?.[0])?.identity_data)

  return firstString(
    metadata?.full_name,
    metadata?.name,
    identityData?.full_name,
    identityData?.name,
    user.email
  )
}

export function getProviderAvatar(user: { user_metadata?: unknown; identities?: unknown[] }) {
  const metadata = asRecord(user.user_metadata)
  const identityData = asRecord(asRecord(user.identities?.[0])?.identity_data)

  return firstString(
    metadata?.avatar_url,
    metadata?.picture,
    metadata?.picture_url,
    identityData?.avatar_url,
    identityData?.picture,
    identityData?.picture_url
  )
}
