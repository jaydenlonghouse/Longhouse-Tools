import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import ToolGrid from '../components/ToolGrid.jsx'
import ToolCatalogToolbar from '../components/ToolCatalogToolbar.jsx'
import { useTools } from '../hooks/useTools.js'
import { captureDeniedFromUrl, consumeDeniedNotice, formatToolSlug } from '../lib/deniedUtils.js'
import { catalogResultLabel, filterCatalogTools } from '../lib/toolCatalogUtils.js'

export default function HubPage({ onRequestFeature, onSubmitBug }) {
  const { data: tools, isLoading, error } = useTools()
  const [deniedSlug, setDeniedSlug] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  useEffect(() => {
    captureDeniedFromUrl()
    const slug = consumeDeniedNotice()
    if (slug) setDeniedSlug(slug)
  }, [])

  const deniedToolName = useMemo(() => {
    if (!deniedSlug) return null
    const match = tools?.find(t => t.slug === deniedSlug)
    return match?.name ?? formatToolSlug(deniedSlug)
  }, [deniedSlug, tools])

  const filteredTools = useMemo(
    () => filterCatalogTools(tools, category, query),
    [tools, category, query],
  )

  const hasActiveFilters = category !== 'all' || query.trim().length > 0
  const resultLabel = catalogResultLabel(filteredTools.length, category)

  function clearFilters() {
    setQuery('')
    setCategory('all')
  }

  return (
    <>
      {deniedSlug ? (
        <div
          className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="alert"
        >
          <p className="flex-1">
            You don&apos;t have access to{' '}
            <span className="font-medium">{deniedToolName}</span>. Contact your administrator
            if you need permission.
          </p>
          <button
            type="button"
            onClick={() => setDeniedSlug(null)}
            className="shrink-0 rounded-lg p-1 text-amber-800 transition-colors hover:bg-amber-100"
            aria-label="Dismiss"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      ) : null}

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Tools
          </h1>
          <p className="mt-1 text-sm text-ink-600 sm:text-base">
            Internal apps, utilities, and GPTs for the Longhouse team.
          </p>
        </div>
        <button
          type="button"
          onClick={onSubmitBug}
          className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-800 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Submit a bug
        </button>
      </header>

      {!isLoading && !error && (tools?.length ?? 0) > 0 ? (
        <ToolCatalogToolbar
          query={query}
          onQueryChange={setQuery}
          category={category}
          onCategoryChange={setCategory}
          resultCount={filteredTools.length}
          resultLabel={resultLabel}
        />
      ) : null}

      <ToolGrid
        tools={filteredTools}
        isLoading={isLoading}
        error={error}
        onRequestFeature={onRequestFeature}
        hasCatalogFilters={hasActiveFilters}
        totalToolCount={tools?.length ?? 0}
        query={query}
        category={category}
        onClearFilters={clearFilters}
        showKindBadge={category === 'all'}
      />
    </>
  )
}
