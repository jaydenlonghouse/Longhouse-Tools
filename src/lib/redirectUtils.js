const REDIRECT_KEY = 'lh_tools_redirect'

export function captureRedirectFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const redirect = params.get('redirect')?.trim()
  if (redirect) {
    try {
      const url = new URL(redirect)
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        sessionStorage.setItem(REDIRECT_KEY, redirect)
        const clean = new URL(window.location.href)
        clean.searchParams.delete('redirect')
        window.history.replaceState({}, '', clean.pathname + clean.search)
      }
    } catch {
      // ignore invalid redirect
    }
  }
}

export function getStoredRedirect() {
  return sessionStorage.getItem(REDIRECT_KEY)
}

export function clearStoredRedirect() {
  sessionStorage.removeItem(REDIRECT_KEY)
}

export function applyStoredRedirect() {
  const redirect = getStoredRedirect()
  if (!redirect) return false
  clearStoredRedirect()
  window.location.href = redirect
  return true
}
