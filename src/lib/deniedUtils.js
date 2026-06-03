const DENIED_KEY = 'lh_tools_denied'

/** Read ?denied= from URL, store briefly, and clean the address bar. */
export function captureDeniedFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const denied = params.get('denied')?.trim()
  if (!denied) return null

  sessionStorage.setItem(DENIED_KEY, denied)
  const clean = new URL(window.location.href)
  clean.searchParams.delete('denied')
  window.history.replaceState({}, '', clean.pathname + clean.search)
  return denied
}

export function consumeDeniedNotice() {
  const slug = sessionStorage.getItem(DENIED_KEY)
  if (slug) sessionStorage.removeItem(DENIED_KEY)
  return slug
}

/** Format slug for display when tool name is unknown. */
export function formatToolSlug(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
