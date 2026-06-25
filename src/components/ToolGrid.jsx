import ToolCard from './ToolCard.jsx'
import EmptyToolsState from './EmptyToolsState.jsx'
import ToolCatalogEmptyState from './ToolCatalogEmptyState.jsx'

function ToolCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-brand-100 bg-white">
      <div className="p-4 pb-0">
        <div className="aspect-video rounded-xl border border-brand-100 bg-brand-100" />
      </div>
      <div className="p-5 pt-4">
      <div className="h-5 w-2/3 rounded bg-brand-100" />
      <div className="mt-2 h-4 w-full rounded bg-brand-50" />
      <div className="mt-1 h-4 w-4/5 rounded bg-brand-50" />
      <div className="mt-3 h-3 w-24 rounded bg-brand-50" />
      <div className="mt-5 flex gap-2">
        <div className="h-10 flex-1 rounded-xl bg-brand-100" />
        <div className="h-10 flex-1 rounded-xl bg-brand-50" />
      </div>
      </div>
    </div>
  )
}

export default function ToolGrid({
  tools,
  isLoading,
  error,
  onRequestFeature,
  hasCatalogFilters = false,
  totalToolCount = 0,
  query = '',
  category = 'all',
  onClearFilters,
  showKindBadge = false,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map(n => (
          <ToolCardSkeleton key={n} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-800">
        Could not load tools. Please try again later.
      </div>
    )
  }

  if (totalToolCount === 0) {
    return <EmptyToolsState />
  }

  if (!tools?.length) {
    return (
      <ToolCatalogEmptyState
        query={query}
        category={category}
        onClearFilters={hasCatalogFilters ? onClearFilters : undefined}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tools.map(tool => (
        <ToolCard
          key={tool.id}
          tool={tool}
          onRequestFeature={onRequestFeature}
          showKindBadge={showKindBadge}
        />
      ))}
    </div>
  )
}
