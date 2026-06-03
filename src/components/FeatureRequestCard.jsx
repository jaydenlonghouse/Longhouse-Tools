import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, MessageCircle, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  addFeatureComment,
  deleteFeatureComment,
  deleteFeatureRequest,
  fetchFeatureRequestComments,
  toggleFeatureVote,
} from '../lib/featuresApi.js'
import VoteButton from './VoteButton.jsx'

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function commentLabel(count) {
  if (count === 1) return '1 comment'
  return `${count} comments`
}

export default function FeatureRequestCard({ request, onVoteChange, onRequestDeleted }) {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [votePending, setVotePending] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [localVoted, setLocalVoted] = useState(request.user_has_voted)
  const [localCount, setLocalCount] = useState(Number(request.vote_count) || 0)
  const [commentCount, setCommentCount] = useState(Number(request.comment_count) || 0)

  const isAuthor = user?.id === request.author_id

  const rpcCommentCount =
    request.comment_count != null ? Number(request.comment_count) : null

  useEffect(() => {
    setLocalVoted(request.user_has_voted)
    setLocalCount(Number(request.vote_count) || 0)
    setCommentCount(Number(request.comment_count) || 0)
  }, [request.id, request.user_has_voted, request.vote_count, request.comment_count])

  const { data: comments = [], isLoading: commentsLoading, refetch } = useQuery({
    queryKey: ['feature-comments', request.id],
    queryFn: async () => {
      const { data, error } = await fetchFeatureRequestComments(request.id)
      if (error) throw error
      return data ?? []
    },
    enabled: expanded || rpcCommentCount === null,
  })

  useEffect(() => {
    if (!commentsLoading && rpcCommentCount === null) {
      setCommentCount(comments.length)
    }
  }, [comments.length, commentsLoading, rpcCommentCount])

  async function handleVote() {
    setVotePending(true)
    const wasVoted = localVoted
    setLocalVoted(!wasVoted)
    setLocalCount(c => (wasVoted ? Math.max(0, c - 1) : c + 1))

    const { error } = await toggleFeatureVote({
      requestId: request.id,
      userId: user.id,
      hasVoted: wasVoted,
    })

    setVotePending(false)

    if (error) {
      setLocalVoted(wasVoted)
      setLocalCount(Number(request.vote_count) || 0)
      return
    }

    onVoteChange?.()
  }

  async function handleCommentSubmit(e) {
    e.preventDefault()
    const trimmed = commentText.trim()
    if (!trimmed) return

    setSubmittingComment(true)
    const { error } = await addFeatureComment({
      requestId: request.id,
      userId: user.id,
      message: trimmed,
    })
    setSubmittingComment(false)

    if (!error) {
      setCommentText('')
      setCommentCount(c => c + 1)
      refetch()
      onVoteChange?.()
    }
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm('Delete this comment?')) return

    const { error } = await deleteFeatureComment({ commentId, userId: user.id })
    if (!error) {
      setCommentCount(c => Math.max(0, c - 1))
      refetch()
      onVoteChange?.()
    }
  }

  async function handleDeleteRequest() {
    if (!window.confirm('Delete this feature request? This cannot be undone.')) return

    setDeletePending(true)
    const { error } = await deleteFeatureRequest({ requestId: request.id, userId: user.id })
    setDeletePending(false)

    if (!error) {
      onRequestDeleted?.()
    }
  }

  const commentsToggleLabel = expanded
    ? `Hide ${commentLabel(commentCount)}`
    : commentLabel(commentCount)

  return (
    <article className="flex gap-4 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-5">
      <VoteButton
        count={localCount}
        voted={localVoted}
        disabled={votePending || deletePending}
        onClick={handleVote}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-ink-900 sm:text-lg">{request.title}</h3>
          {isAuthor ? (
            <button
              type="button"
              onClick={handleDeleteRequest}
              disabled={deletePending}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              aria-label="Delete feature request"
            >
              <Trash2 size={14} aria-hidden />
              Delete
            </button>
          ) : null}
        </div>
        {request.description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-600 whitespace-pre-wrap">
            {request.description}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-ink-400">
          {request.author_name} · {formatDate(request.created_at)}
        </p>

        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          <MessageCircle size={16} aria-hidden />
          {commentsToggleLabel}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expanded ? (
          <div className="mt-4 border-t border-brand-100 pt-4">
            {commentsLoading ? (
              <p className="text-sm text-ink-500">Loading comments…</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-ink-500">No comments yet. Be the first!</p>
            ) : (
              <ul className="space-y-3">
                {comments.map(c => {
                  const canDelete = user?.id === c.author_id
                  return (
                    <li key={c.id} className="rounded-xl bg-brand-50 px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 text-sm text-ink-800">{c.message}</p>
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c.id)}
                            className="shrink-0 rounded p-1 text-ink-400 hover:bg-white hover:text-red-600"
                            aria-label="Delete comment"
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-ink-400">
                        {c.author_name} · {formatDate(c.created_at)}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}

            <form onSubmit={handleCommentSubmit} className="mt-4 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment…"
                className="min-w-0 flex-1 rounded-xl border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                disabled={submittingComment}
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="shrink-0 rounded-xl bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Post
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </article>
  )
}
