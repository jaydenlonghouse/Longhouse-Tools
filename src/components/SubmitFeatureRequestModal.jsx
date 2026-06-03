import { useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { createFeatureRequest } from '../lib/featuresApi.js'

export default function SubmitFeatureRequestModal({ tool, onClose, onSubmitted }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return

    setStatus('submitting')
    setErrorMsg(null)

    const { error } = await createFeatureRequest({
      userId: user.id,
      toolId: tool.id,
      title,
      description,
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message || 'Failed to submit request.')
      return
    }

    setStatus('success')
    onSubmitted?.()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-feature-title"
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
            <h2 id="submit-feature-title" className="text-lg font-semibold text-ink-900">
              Submit a feature request
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              For <span className="font-medium text-brand-800">{tool.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-brand-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="mt-6 flex flex-col items-center py-4 text-center">
            <CheckCircle2 size={40} className="text-brand-600" aria-hidden />
            <p className="mt-3 text-sm font-medium text-ink-900">Request submitted!</p>
            <p className="mt-1 text-sm text-ink-600">Team members can vote and comment on it.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-xl bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="feature-title" className="block text-sm font-medium text-ink-800">
                Title
              </label>
              <input
                id="feature-title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Short summary of your idea"
                className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                disabled={status === 'submitting'}
                required
                maxLength={120}
              />
            </div>
            <div>
              <label htmlFor="feature-description" className="block text-sm font-medium text-ink-800">
                Description
              </label>
              <textarea
                id="feature-description"
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the problem and what you’d like to see…"
                className="mt-1 w-full resize-none rounded-xl border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                disabled={status === 'submitting'}
              />
            </div>

            {errorMsg ? (
              <div className="flex items-start gap-2 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
                <span>{errorMsg}</span>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-1">
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
                disabled={status === 'submitting' || !title.trim()}
                className="rounded-xl bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {status === 'submitting' ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
