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
