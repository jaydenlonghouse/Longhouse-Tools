import { Search } from 'lucide-react'

/** @typedef {'all' | 'tool' | 'gpt'} CatalogCategory */

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'tool', label: 'Tools' },
  { id: 'gpt', label: 'GPTs' },
]

export default function ToolCatalogToolbar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  resultCount,
  resultLabel,
}) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Search by name, description, or department…"
            className="w-full rounded-xl border border-brand-200 bg-white py-2.5 pl-10 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            aria-label="Search tools and GPTs"
          />
        </div>

        <div
          className="inline-flex shrink-0 rounded-xl border border-brand-200 bg-white p-1"
          role="group"
          aria-label="Filter by type"
        >
          {CATEGORIES.map(({ id, label }) => {
            const selected = category === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onCategoryChange(id)}
                aria-pressed={selected}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                  selected
                    ? 'bg-brand-800 text-white'
                    : 'text-ink-700 hover:bg-brand-50 hover:text-ink-900'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {typeof resultCount === 'number' ? (
        <p className="text-sm text-ink-500">{resultLabel ?? `${resultCount} results`}</p>
      ) : null}
    </div>
  )
}
