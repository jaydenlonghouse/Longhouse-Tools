import { getSupabase } from './supabaseClient.js'
import { getMockFeatureRequests, mockFeaturesStore } from './mockFeaturesStore.js'
import { useOfflineDemo } from '../config/env.js'

export async function fetchFeatureRequests(toolId) {
  if (useOfflineDemo) {
    return { data: getMockFeatureRequests(toolId), error: null }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('get_feature_requests', {
    p_tool_id: toolId,
  })

  return { data: data ?? [], error }
}

export async function fetchFeatureRequestComments(requestId) {
  if (useOfflineDemo) {
    return { data: mockFeaturesStore.getComments(requestId), error: null }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('get_feature_request_comments', {
    p_request_id: requestId,
  })

  return { data: data ?? [], error }
}

export async function createFeatureRequest({ userId, toolId, title, description }) {
  if (useOfflineDemo) {
    const row = mockFeaturesStore.createRequest({
      userId,
      toolId,
      title,
      description,
    })
    return { data: row, error: null }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('feature_requests')
    .insert({
      user_id: userId,
      tool_id: toolId,
      title: title.trim(),
      description: description.trim(),
    })
    .select('id')
    .single()

  return { data, error }
}

export async function toggleFeatureVote({ requestId, userId, hasVoted }) {
  if (useOfflineDemo) {
    mockFeaturesStore.toggleVote(requestId, userId)
    return { data: null, error: null }
  }

  const supabase = getSupabase()

  if (hasVoted) {
    const { error } = await supabase
      .from('feature_request_votes')
      .delete()
      .eq('request_id', requestId)
      .eq('user_id', userId)
    return { data: null, error }
  }

  const { error } = await supabase.from('feature_request_votes').insert({
    request_id: requestId,
    user_id: userId,
  })

  return { data: null, error }
}

export async function addFeatureComment({ requestId, userId, message }) {
  if (useOfflineDemo) {
    const row = mockFeaturesStore.addComment({ requestId, userId, message })
    return { data: row, error: null }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('feature_request_comments')
    .insert({
      request_id: requestId,
      user_id: userId,
      message: message.trim(),
    })
    .select('id')
    .single()

  return { data, error }
}

export async function deleteFeatureRequest({ requestId, userId }) {
  if (useOfflineDemo) {
    const ok = mockFeaturesStore.deleteRequest(requestId, userId)
    return ok
      ? { data: { ok: true }, error: null }
      : { data: null, error: new Error('Not allowed') }
  }

  const supabase = getSupabase()
  const { error } = await supabase
    .from('feature_requests')
    .delete()
    .eq('id', requestId)
    .eq('user_id', userId)

  return { data: { ok: true }, error }
}

export async function deleteFeatureComment({ commentId, userId }) {
  if (useOfflineDemo) {
    const ok = mockFeaturesStore.deleteComment({ commentId, userId })
    return ok
      ? { data: { ok: true }, error: null }
      : { data: null, error: new Error('Not allowed') }
  }

  const supabase = getSupabase()
  const { error } = await supabase
    .from('feature_request_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId)

  return { data: { ok: true }, error }
}
