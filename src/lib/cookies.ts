export function getTenantCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)tenant_slug=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function setTenantCookie(slug: string) {
  document.cookie = `tenant_slug=${encodeURIComponent(slug)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
}
