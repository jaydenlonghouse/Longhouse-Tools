import { ExternalLink, Heart } from 'lucide-react'
import DepartmentTags from './DepartmentTags.jsx'
import ToolThumbnail from './ToolThumbnail.jsx'

export default function ToolCard({
  tool,
  onRequestFeature,
  showKindBadge = false,
  isFavorited = false,
  onToggleFavorite,
  favoritePending = false,
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-brand-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative p-4 pb-0">
        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${tool.name}`}
          className="block rounded-xl transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <ToolThumbnail tool={tool} />
        </a>
        {onToggleFavorite ? (
          <button
            type="button"
            onClick={() => onToggleFavorite(tool.id)}
            disabled={favoritePending}
            aria-pressed={isFavorited}
            aria-label={isFavorited ? `Remove ${tool.name} from favorites` : `Favorite ${tool.name}`}
            className={`absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/95 shadow-sm backdrop-blur transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-60 ${
              isFavorited
                ? 'border-red-200 text-red-500 hover:bg-red-50'
                : 'border-brand-100 text-ink-400 hover:border-brand-200 hover:text-red-500'
            }`}
          >
            <Heart
              size={18}
              className={isFavorited ? 'fill-current' : ''}
              aria-hidden
            />
          </button>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5 pt-4">
        <div className="flex flex-wrap items-start gap-2">
          <h2 className="text-lg font-semibold text-ink-900">{tool.name}</h2>
          {showKindBadge && tool.kind === 'gpt' ? (
            <span className="inline-flex shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
              GPT
            </span>
          ) : null}
        </div>
        <DepartmentTags departments={tool.departments} className="mt-2" />
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600 line-clamp-3">
          {tool.description}
        </p>
        {tool.created_by_name ? (
          <p className="mt-3 text-xs text-ink-500">
            Created by{' '}
            <span className="font-medium text-ink-600">{tool.created_by_name}</span>
          </p>
        ) : null}
        <div className="mt-5 flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => onRequestFeature(tool)}
            className="inline-flex min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Request Feature
          </button>
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${tool.name}`}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-800 px-2.5 py-2 text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <ExternalLink size={18} aria-hidden />
          </a>
        </div>
      </div>
    </article>
  )
}
