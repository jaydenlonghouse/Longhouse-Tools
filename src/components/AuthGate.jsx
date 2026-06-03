import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { skipAuth, supabaseAnonKey, supabaseUrl } from '../config/env.js'
import {
  applyStoredRedirect,
  captureRedirectFromUrl,
} from '../lib/redirectUtils.js'
import LoginPage from '../pages/LoginPage.jsx'
import App from '../App.jsx'

function AuthLoadingScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-950 px-6">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800"
        aria-hidden
      />
      <p className="relative text-sm font-medium text-brand-200/90">Loading…</p>
    </div>
  )
}

export default function AuthGate() {
  const { session, loading, authError, signInWithGoogle } = useAuth()
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    captureRedirectFromUrl()
  }, [])

  useEffect(() => {
    if (session && !loading) {
      applyStoredRedirect()
    }
  }, [session, loading])

  if (skipAuth) {
    return <App />
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-950 px-6">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800"
          aria-hidden
        />
        <p className="relative max-w-md text-center text-sm text-brand-200/90">
          Missing <code className="rounded bg-white/10 px-1 text-brand-100">VITE_SUPABASE_URL</code> or{' '}
          <code className="rounded bg-white/10 px-1 text-brand-100">VITE_SUPABASE_ANON_KEY</code> in{' '}
          <code className="rounded bg-white/10 px-1 text-brand-100">.env</code>. See README, or set{' '}
          <code className="rounded bg-white/10 px-1 text-brand-100">VITE_BYPASS_AUTH=true</code> to skip login.
        </p>
      </div>
    )
  }

  if (loading) {
    return <AuthLoadingScreen />
  }

  if (!session) {
    return (
      <LoginPage
        error={authError}
        signingIn={signingIn}
        onSignIn={async () => {
          setSigningIn(true)
          try {
            await signInWithGoogle()
          } finally {
            setSigningIn(false)
          }
        }}
      />
    )
  }

  return <App />
}
