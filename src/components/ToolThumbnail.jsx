import { useEffect, useState } from 'react'
import { getToolThumbnailUrl } from '../lib/thumbnailUrl.js'

function ThumbnailFallback({ tool }) {
  return (
    <div className="flex h-full min-h-[9rem] w-full flex-col items-center justify-center bg-gradient-to-br from-brand-100 via-brand-50 to-brand-200 px-4 py-6">
      <p className="text-center text-sm font-semibold text-brand-800">{tool.name}</p>
      <p className="mt-1 text-center text-xs text-brand-600/80">Preview unavailable</p>
    </div>
  )
}

export default function ToolThumbnail({ tool, className = '' }) {
  const src = getToolThumbnailUrl(tool)
  const [status, setStatus] = useState(src ? 'loading' : 'error')

  useEffect(() => {
    setStatus(src ? 'loading' : 'error')
  }, [src])

  const frameClass =
    className || 'overflow-hidden rounded-xl border border-brand-100 shadow-sm'

  if (!src || status === 'error') {
    return (
      <div className={frameClass}>
        <ThumbnailFallback tool={tool} />
      </div>
    )
  }

  return (
    <div className={`relative aspect-video overflow-hidden bg-brand-100 ${frameClass}`}>
      {status === 'loading' ? (
        <div className="absolute inset-0 animate-pulse bg-brand-100" aria-hidden />
      ) : null}
      <img
        key={src}
        src={src}
        alt={`Preview of ${tool.name}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`h-full w-full object-cover object-top transition-opacity duration-300 ${
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
