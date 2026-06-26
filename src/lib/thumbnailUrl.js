export const GPT_DEFAULT_THUMBNAIL_URL = '/gpt-default.png'

/** Returns the stored thumbnail URL, GPT default image, or null. */
export function getToolThumbnailUrl(tool) {
  const url = tool?.thumbnail_url?.trim()
  if (url) return url
  if (tool?.kind === 'gpt') return GPT_DEFAULT_THUMBNAIL_URL
  return null
}
