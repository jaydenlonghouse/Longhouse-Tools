export const DEFAULT_PLATFORM_ICON = '/platform-icons/default.png'

export function platformIconSrc(platform) {
  const path = platform?.icon_path?.trim()
  return path || DEFAULT_PLATFORM_ICON
}

export function slugifyPlatformName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}
