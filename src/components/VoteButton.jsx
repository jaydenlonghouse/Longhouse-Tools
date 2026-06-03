import { ChevronUp } from 'lucide-react'

export default function VoteButton({ count, voted, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={voted}
      aria-label={voted ? `Remove vote (${count} votes)` : `Vote (${count} votes)`}
      className={`flex shrink-0 flex-col items-center rounded-xl border px-2.5 py-2 transition-colors min-w-[3.25rem] ${
        voted
          ? 'border-brand-500 bg-brand-100 text-brand-800'
          : 'border-brand-200 bg-brand-50 text-ink-600 hover:border-brand-400 hover:bg-brand-100'
      } disabled:opacity-50`}
    >
      <ChevronUp size={22} strokeWidth={2.5} className={voted ? 'text-brand-600' : ''} />
      <span className="mt-0.5 text-sm font-semibold tabular-nums">{count}</span>
    </button>
  )
}
