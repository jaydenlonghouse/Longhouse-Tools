export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()
export const allowedEmailDomain = (
  import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN ?? 'longhouse.co'
)
  .trim()
  .toLowerCase()

/** Mock data + no login — for local UI dev only. */
export const useMockData = import.meta.env.VITE_USE_MOCK === 'true'

/** No login screen — open dashboard with a demo session (local dev). */
export const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true'

/** Auth UI and Supabase session checks disabled. */
export const skipAuth = useMockData || bypassAuth

/** Use in-memory fixtures instead of Supabase. */
export const useOfflineDemo = skipAuth
