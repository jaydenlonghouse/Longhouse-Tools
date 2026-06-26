/** @typedef {'all' | 'tool' | 'gpt'} CatalogCategory */

/**
 * @param {{ name?: string, description?: string, departments?: string[] }} tool
 * @param {string} query
 */
export function toolMatchesQuery(tool, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const name = String(tool.name ?? '').toLowerCase()
  const description = String(tool.description ?? '').toLowerCase()
  const departments = (tool.departments ?? []).join(' ').toLowerCase()

  return name.includes(q) || description.includes(q) || departments.includes(q)
}

/**
 * @param {Array<{ kind?: string }>} tools
 * @param {CatalogCategory} category
 * @param {string} query
 */
export function filterCatalogTools(tools, category, query) {
  return (tools ?? []).filter(tool => {
    const kind = tool.kind === 'gpt' ? 'gpt' : 'tool'
    if (category !== 'all' && kind !== category) return false
    return toolMatchesQuery(tool, query)
  })
}

/**
 * Favorited tools first (in heart order), then default hub sort.
 * @param {Array<{ id: string, sort_order?: number, name?: string }>} tools
 * @param {string[]} favoriteIds
 */
export function sortCatalogTools(tools, favoriteIds = []) {
  const favoriteSet = new Set(favoriteIds)
  const favoriteOrder = new Map(favoriteIds.map((id, index) => [id, index]))

  return [...tools].sort((a, b) => {
    const aFav = favoriteSet.has(a.id)
    const bFav = favoriteSet.has(b.id)

    if (aFav && !bFav) return -1
    if (!aFav && bFav) return 1

    if (aFav && bFav) {
      return (favoriteOrder.get(a.id) ?? 0) - (favoriteOrder.get(b.id) ?? 0)
    }

    const sortDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0)
    if (sortDiff !== 0) return sortDiff
    return String(a.name ?? '').localeCompare(String(b.name ?? ''))
  })
}

/**
 * @param {Array<{ id: string, sort_order?: number, name?: string }>} tools
 * @param {CatalogCategory} category
 * @param {string} query
 * @param {string[]} favoriteIds
 */
export function filterAndSortCatalogTools(tools, category, query, favoriteIds = []) {
  return sortCatalogTools(filterCatalogTools(tools, category, query), favoriteIds)
}

/**
 * @param {number} count
 * @param {CatalogCategory} category
 */
export function catalogResultLabel(count, category) {
  const noun =
    category === 'gpt' ? (count === 1 ? 'GPT' : 'GPTs') : count === 1 ? 'tool' : 'tools'
  if (category === 'all') {
    return count === 1 ? '1 result' : `${count} results`
  }
  return count === 1 ? `1 ${noun}` : `${count} ${noun}`
}
