import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getSupabase } from '../lib/supabaseClient.js'
import { isAllowedEmail } from '../lib/authUtils.js'
import { MOCK_USER } from '../lib/mockData.js'
import { allowedEmailDomain, skipAuth, useMockData } from '../config/env.js'

const AuthContext = createContext(null)

const MOCK_SESSION = {
  access_token: 'mock-token',
  user: MOCK_USER,
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(skipAuth ? MOCK_SESSION : null)
  const [loading, setLoading] = useState(!skipAuth)
  const [authError, setAuthError] = useState(null)

  const rejectIfNotAllowed = useCallback(async user => {
    if (!user?.email || !isAllowedEmail(user.email)) {
      if (!skipAuth) {
        const supabase = getSupabase()
        await supabase.auth.signOut()
      }
      setSession(null)
      setAuthError(
        `Sign in with your @${allowedEmailDomain} Google Workspace account.`,
      )
      return false
    }
    setAuthError(null)
    return true
  }, [])

  useEffect(() => {
    if (skipAuth) {
      setLoading(false)
      return undefined
    }

    const supabase = getSupabase()

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s?.user) {
        const ok = await rejectIfNotAllowed(s.user)
        setSession(ok ? s : null)
      } else {
        setSession(null)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (s?.user) {
        const ok = await rejectIfNotAllowed(s.user)
        setSession(ok ? s : null)
      } else {
        setSession(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [rejectIfNotAllowed])

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null)
    if (skipAuth) {
      setSession(MOCK_SESSION)
      return
    }
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          hd: allowedEmailDomain,
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) setAuthError(error.message)
  }, [])

  const signOut = useCallback(async () => {
    if (skipAuth) {
      setSession(MOCK_SESSION)
      setAuthError(null)
      return
    }
    const supabase = getSupabase()
    await supabase.auth.signOut()
    setSession(null)
    setAuthError(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      loading,
      authError,
      signInWithGoogle,
      signOut,
      user: session?.user ?? null,
      accessToken: session?.access_token ?? null,
    }),
    [session, loading, authError, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
