/** Read ?view= & ?tool= & ?submit= from the hub URL (then clean the bar). */
export function captureHubDeepLinkFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const view = params.get('view')?.trim() || null
  const toolSlug = params.get('tool')?.trim() || null
  const openSubmit = params.get('submit') === '1'

  if (!view && !toolSlug && !openSubmit) {
    return { view: null, toolSlug: null, openSubmit: false }
  }

  const clean = new URL(window.location.href)
  clean.searchParams.delete('view')
  clean.searchParams.delete('tool')
  clean.searchParams.delete('submit')
  const next = clean.pathname + clean.search + clean.hash
  window.history.replaceState({}, '', next || '/')

  return { view, toolSlug, openSubmit }
}

export function resolveToolIdBySlug(tools, slug) {
  if (!slug || !tools?.length) return null
  const match = tools.find(t => t.slug === slug)
  return match?.id ?? null
}
