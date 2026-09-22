import { platformIconSrc } from '../lib/platforms.js'
import AppTooltip from './AppTooltip.jsx'

function platformTooltipContent(platform) {
  const detail = platform.label?.trim()
  const name = platform.name || platform.slug || 'Platform'

  if (detail && detail !== name) {
    return (
      <span className="block text-left">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-brand-200">
          {name}
        </span>
        <span className="mt-0.5 block text-sm font-medium leading-snug text-white">{detail}</span>
      </span>
    )
  }

  return name
}

function PlatformIconLink({ platform }) {
  const href = platform.link_url?.trim()
  const iconSrc = platformIconSrc(platform)
  const tooltip = platformTooltipContent(platform)

  const image = (
    <img
      src={iconSrc}
      alt=""
      className="h-5 w-5 rounded object-contain"
      loading="lazy"
      decoding="async"
    />
  )

  const wrapperClass =
    'inline-flex rounded-md p-0.5 transition-colors hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'

  const ariaDetail = platform.label?.trim() || platform.name

  if (href) {
    return (
      <AppTooltip content={tooltip}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${platform.name}: ${ariaDetail}`}
          className={wrapperClass}
        >
          {image}
        </a>
      </AppTooltip>
    )
  }

  return (
    <AppTooltip content={tooltip}>
      <span aria-label={ariaDetail} className={wrapperClass} tabIndex={0}>
        {image}
      </span>
    </AppTooltip>
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
