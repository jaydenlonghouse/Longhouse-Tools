import { platformIconSrc } from '../lib/platforms.js'

function PlatformIconLink({ platform }) {
  const label = platform.label?.trim() || platform.name
  const href = platform.link_url?.trim()
  const iconSrc = platformIconSrc(platform)
  const title = label ? `${platform.name}: ${label}` : platform.name

  const image = (
    <img
      src={iconSrc}
      alt=""
      className="h-5 w-5 rounded object-contain"
      loading="lazy"
      decoding="async"
    />
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={title}
        aria-label={title}
        className="inline-flex rounded-md p-0.5 transition-colors hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {image}
      </a>
    )
  }

  return (
    <span
      title={title}
      className="inline-flex rounded-md p-0.5"
      aria-label={title}
    >
      {image}
    </span>
  )
}

export default function ToolPlatformsUsed({ platforms = [] }) {
  const rows = Array.isArray(platforms) ? platforms.filter(p => p?.slug || p?.name) : []
  if (!rows.length) return null

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-ink-500">Platforms used</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {rows.map((platform, index) => (
          <PlatformIconLink
            key={`${platform.slug}-${platform.link_url}-${index}`}
            platform={platform}
          />
        ))}
      </div>
    </div>
  )
}
