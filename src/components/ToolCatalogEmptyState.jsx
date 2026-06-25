import { SearchX } from 'lucide-react'

export default function ToolCatalogEmptyState({ query, category, onClearFilters }) {
  const categoryLabel =
    category === 'gpt' ? 'GPTs' : category === 'tool' ? 'tools' : 'tools or GPTs'

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
        <SearchX size={28} aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-ink-900">No results found</h2>
      <p className="mt-2 max-w-sm text-sm text-ink-600">
        {query.trim() ? (
          <>
            Nothing matched &ldquo;{query.trim()}&rdquo;
            {category !== 'all' ? ` in ${categoryLabel}` : ''}.
          </>
        ) : (
          <>No {categoryLabel} match your current filters.</>
        )}
      </p>
      {onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  )
}
