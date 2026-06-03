/** Returns the stored thumbnail URL for a tool, or null if none is set. */
export function getToolThumbnailUrl(tool) {
  const url = tool?.thumbnail_url?.trim()
  return url || null
}
