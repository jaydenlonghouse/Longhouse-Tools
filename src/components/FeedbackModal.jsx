import { useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { submitFeedback } from '../lib/toolsApi.js'

export default function FeedbackModal({ tool, onClose }) {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    setStatus('submitting')
    setErrorMsg(null)

    const { error } = await submitFeedback({
      userId: user.id,
      toolId: tool.id,
      message: trimmed,
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message || 'Failed to submit feedback.')
      return
    }

    setStatus('success')
    setMessage('')
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="feedback-title" className="text-lg font-semibold text-ink-900">
              Send feedback
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              About <span className="font-medium text-brand-800">{tool.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-brand-50 hover:text-ink-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="mt-6 flex flex-col items-center py-4 text-center">
            <CheckCircle2 size={40} className="text-brand-600" aria-hidden />
            <p className="mt-3 text-sm font-medium text-ink-900">Thanks for your feedback!</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-xl bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5">
            <label htmlFor="feedback-message" className="sr-only">
              Your feedback
            </label>
            <textarea
              id="feedback-message"
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Share a bug report, feature idea, or general feedback…"
              className="w-full resize-none rounded-xl border border-brand-200 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              disabled={status === 'submitting'}
              required
            />

            {errorMsg ? (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
                <span>{errorMsg}</span>
              </div>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm font-medium text-ink-600 hover:bg-brand-50"
                disabled={status === 'submitting'}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'submitting' || !message.trim()}
                className="rounded-xl bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {status === 'submitting' ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
