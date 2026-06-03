import { useEffect, useState } from 'react'
import { Lightbulb, Plus } from 'lucide-react'
import { useTools } from '../hooks/useTools.js'
import {
  useFeatureRequests,
  useInvalidateFeatureRequests,
} from '../hooks/useFeatureRequests.js'
import FeatureRequestCard from '../components/FeatureRequestCard.jsx'
import SubmitFeatureRequestModal from '../components/SubmitFeatureRequestModal.jsx'
export default function FeatureRequestsPage({
  preselectedToolId,
  openSubmitModal = false,
  onPreselectConsumed,
}) {
  const { data: tools, isLoading: toolsLoading } = useTools()
  const [selectedToolId, setSelectedToolId] = useState(() => preselectedToolId ?? '')
  const [showSubmit, setShowSubmit] = useState(false)
  const invalidate = useInvalidateFeatureRequests()

  const selectedTool = tools?.find(t => t.id === selectedToolId)

  useEffect(() => {
    if (!tools?.length) return

    if (preselectedToolId && tools.some(t => t.id === preselectedToolId)) {
      setSelectedToolId(preselectedToolId)
      if (openSubmitModal) {
        setShowSubmit(true)
      }
      onPreselectConsumed?.()
      return
    }

    setSelectedToolId(prev => {
      if (prev && tools.some(t => t.id === prev)) return prev
      return tools[0].id
    })
  }, [tools, preselectedToolId, openSubmitModal, onPreselectConsumed])

  const {
    data: requests,
    isLoading: requestsLoading,
    error,
    refetch,
  } = useFeatureRequests(selectedToolId)

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Request Feature
          </h1>
          <p className="mt-1 text-sm text-ink-600 sm:text-base">
            Vote on ideas and discuss what to build next for each tool.
          </p>
        </div>
        {selectedTool ? (
          <button
            type="button"
            onClick={() => setShowSubmit(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <Plus size={18} aria-hidden />
            Submit request
          </button>
        ) : null}
      </header>

      <div className="mb-6">
        <label htmlFor="tool-select" className="block text-sm font-medium text-ink-800">
          Select tool
        </label>
        {toolsLoading ? (
          <div className="mt-2 h-11 max-w-md animate-pulse rounded-xl bg-brand-100" />
        ) : !tools?.length ? (
          <p className="mt-2 text-sm text-ink-600">No tools available to request features for.</p>
        ) : (
          <select
            id="tool-select"
            value={selectedToolId}
            onChange={e => setSelectedToolId(e.target.value)}
            className="mt-2 w-full max-w-md rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {tools.map(tool => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {!selectedToolId ? null : requestsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-32 animate-pulse rounded-2xl bg-brand-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-800">
          Could not load feature requests. Please try again.
        </div>
      ) : !requests?.length ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <Lightbulb size={28} aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink-900">No requests yet</h2>
          <p className="mt-2 max-w-sm text-sm text-ink-600">
            Be the first to suggest a feature for {selectedTool?.name}.
          </p>
          <button
            type="button"
            onClick={() => setShowSubmit(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={18} />
            Submit request
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <FeatureRequestCard
              key={request.id}
              request={request}
              onVoteChange={() => {
                invalidate(selectedToolId)
                refetch()
              }}
              onRequestDeleted={() => {
                invalidate(selectedToolId)
                refetch()
              }}
            />
          ))}
        </div>
      )}

      {showSubmit && selectedTool ? (
        <SubmitFeatureRequestModal
          tool={selectedTool}
          onClose={() => setShowSubmit(false)}
          onSubmitted={() => {
            invalidate(selectedToolId)
            refetch()
          }}
        />
      ) : null}
    </>
  )
}
