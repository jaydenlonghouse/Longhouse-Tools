import { LayoutGrid } from 'lucide-react'

export default function EmptyToolsState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
        <LayoutGrid size={28} aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-ink-900">No tools available</h2>
      <p className="mt-2 max-w-sm text-sm text-ink-600">
        You don&apos;t have access to any tools yet. Contact your administrator to request
        access.
      </p>
    </div>
  )
}
