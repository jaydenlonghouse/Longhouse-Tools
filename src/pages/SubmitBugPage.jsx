import { useState } from 'react'
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTools } from '../hooks/useTools.js'
import { submitBugReport } from '../lib/bugsApi.js'

export default function SubmitBugPage({ onBack }) {
  const { user } = useAuth()
  const { data: tools, isLoading: toolsLoading } = useTools()
  const [toolId, setToolId] = useState('')
  const [description, setDescription] = useState('')
  const [consoleLogs, setConsoleLogs] = useState('')
  const [pageUrl, setPageUrl] = useState(() =>
    typeof window !== 'undefined' ? window.location.href : '',
  )
  const [screenshot, setScreenshot] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState(null)

  function handleScreenshotChange(e) {
    const file = e.target.files?.[0]
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (!file) {
      setScreenshot(null)
      setPreviewUrl(null)
      return
    }
    setScreenshot(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!description.trim()) return

    setStatus('submitting')
    setErrorMsg(null)

    const { error } = await submitBugReport({
      userId: user.id,
      toolId: toolId || null,
      description,
      consoleLogs,
      pageUrl,
      screenshotFile: screenshot,
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message || 'Failed to submit bug report.')
      return
    }

    setStatus('success')
  }

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center rounded-2xl border border-brand-100 bg-white px-6 py-16 text-center shadow-sm">
          <CheckCircle2 size={48} className="text-brand-600" aria-hidden />
          <h1 className="mt-4 text-xl font-semibold text-ink-900">Bug report submitted</h1>
          <p className="mt-2 max-w-md text-sm text-ink-600">
            Thanks — the dev team will review your description, logs, and screenshot.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-8 rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Back to tools
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        <ArrowLeft size={16} aria-hidden />
        Back to tools
      </button>

      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
          Submit a bug
        </h1>
        <p className="mt-1 text-sm text-ink-600 sm:text-base">
          Help us reproduce the issue. Include as much detail as you can — especially console
          output and a screenshot of what you see.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <label htmlFor="bug-tool" className="block text-sm font-medium text-ink-800">
            Which tool?
          </label>
          {toolsLoading ? (
            <div className="mt-2 h-11 animate-pulse rounded-xl bg-brand-100" />
          ) : (
            <select
              id="bug-tool"
              value={toolId}
              onChange={e => setToolId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              disabled={status === 'submitting'}
            >
              <option value="">Select a tool (optional)</option>
              {tools?.map(tool => (
                <option key={tool.id} value={tool.id}>
                  {tool.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="bug-url" className="block text-sm font-medium text-ink-800">
            Page URL
          </label>
          <input
            id="bug-url"
            type="url"
            value={pageUrl}
            onChange={e => setPageUrl(e.target.value)}
            placeholder="https://…"
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            disabled={status === 'submitting'}
          />
        </div>

        <div>
          <label htmlFor="bug-description" className="block text-sm font-medium text-ink-800">
            What went wrong? <span className="text-red-600">*</span>
          </label>
          <textarea
            id="bug-description"
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what you expected vs. what happened, and steps to reproduce…"
            className="mt-2 w-full resize-none rounded-xl border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            required
            disabled={status === 'submitting'}
          />
        </div>

        <div>
          <label htmlFor="bug-console" className="block text-sm font-medium text-ink-800">
            Console logs
          </label>
          <p className="mt-1 text-xs text-ink-500">
            Open DevTools (F12 or right-click → Inspect → Console), copy any errors, and paste
            them here.
          </p>
          <textarea
            id="bug-console"
            rows={6}
            value={consoleLogs}
            onChange={e => setConsoleLogs(e.target.value)}
            placeholder={'Example:\nTypeError: Cannot read property…\n  at Dashboard.jsx:42\n  …'}
            className="mt-2 w-full resize-y rounded-xl border border-brand-200 bg-ink-900 px-3 py-2.5 font-mono text-xs text-brand-50 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            disabled={status === 'submitting'}
          />
        </div>

        <div>
          <label htmlFor="bug-screenshot" className="block text-sm font-medium text-ink-800">
            Screenshot
          </label>
          <p className="mt-1 text-xs text-ink-500">
            Upload a photo or screenshot of what you see on screen (PNG, JPG, or WebP, max 5 MB).
          </p>
          <input
            id="bug-screenshot"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleScreenshotChange}
            className="mt-2 block w-full text-sm text-ink-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-800 hover:file:bg-brand-200"
            disabled={status === 'submitting'}
          />
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Screenshot preview"
              className="mt-3 max-h-64 rounded-xl border border-brand-200 object-contain"
            />
          ) : null}
        </div>

        {errorMsg ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-brand-100 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-600 hover:bg-brand-50"
            disabled={status === 'submitting'}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={status === 'submitting' || !description.trim()}
            className="rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit bug report'}
          </button>
        </div>
      </form>
    </div>
  )
}
