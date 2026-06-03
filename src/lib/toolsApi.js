import { getSupabase } from './supabaseClient.js'
import { MOCK_TOOLS } from './mockData.js'
import { useOfflineDemo } from '../config/env.js'

export async function fetchToolsForUser(userId) {
  if (useOfflineDemo) {
    return { data: MOCK_TOOLS, error: null }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('get_tools_for_user')

  if (error) {
    return { data: null, error }
  }

  return { data: data ?? [], error: null }
}

export async function fetchProfile(userId) {
  if (useOfflineDemo) {
    return {
      data: {
        id: userId,
        email: 'demo@longhouse.co',
        display_name: 'Demo User',
        avatar_url: null,
      },
      error: null,
    }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url')
    .eq('id', userId)
    .single()

  return { data, error }
}

export async function submitFeedback({ userId, toolId, message }) {
  if (useOfflineDemo) {
    await new Promise(r => setTimeout(r, 400))
    return { data: { id: 'mock-feedback' }, error: null }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('feedback')
    .insert({
      user_id: userId,
      tool_id: toolId,
      message: message.trim(),
    })
    .select('id')
    .single()

  return { data, error }
}
