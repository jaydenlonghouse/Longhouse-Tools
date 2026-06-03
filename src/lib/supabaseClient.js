import { createClient } from '@supabase/supabase-js'
import { supabaseAnonKey, supabaseUrl } from '../config/env.js'

let client = null

export function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. See .env.example.',
    )
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey)
  }
  return client
}
