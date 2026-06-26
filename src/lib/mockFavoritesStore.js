const favoritesByUser = new Map()

export function getMockFavoriteToolIds(userId) {
  return [...(favoritesByUser.get(userId) ?? [])]
}

export function toggleMockFavorite(userId, toolId) {
  const current = favoritesByUser.get(userId) ?? []
  const index = current.indexOf(toolId)
  if (index === -1) {
    favoritesByUser.set(userId, [...current, toolId])
    return true
  }
  const next = current.filter(id => id !== toolId)
  favoritesByUser.set(userId, next)
  return false
}
