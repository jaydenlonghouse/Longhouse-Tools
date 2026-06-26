import { getSupabase } from './supabaseClient.js'
import { useOfflineDemo } from '../config/env.js'
import { getMockFavoriteToolIds, toggleMockFavorite } from './mockFavoritesStore.js'

export async function fetchUserToolFavoriteIds(userId) {
  if (useOfflineDemo) {
    return { data: getMockFavoriteToolIds(userId), error: null }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('user_tool_favorites')
    .select('tool_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: null, error }
  }

  return { data: (data ?? []).map(row => row.tool_id), error: null }
}

export async function toggleToolFavorite({ userId, toolId, isFavorited }) {
  if (useOfflineDemo) {
    toggleMockFavorite(userId, toolId)
    return { data: { ok: true }, error: null }
  }

  const supabase = getSupabase()

  if (isFavorited) {
    const { error } = await supabase
      .from('user_tool_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('tool_id', toolId)
    return { data: { ok: true }, error }
  }

  const { error } = await supabase.from('user_tool_favorites').insert({
    user_id: userId,
    tool_id: toolId,
  })

  return { data: { ok: true }, error }
}
