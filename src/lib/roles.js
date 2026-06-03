/** Role slugs in rank order (1 = lowest). */
export const ROLE_SLUGS = [
  'specialist',
  'results_manager',
  'department_head',
  'leadership',
  'developer',
]

/** Roles that can be selected as tool access tiers (not Leadership/Developer). */
export const TOOL_TIER_SLUGS = ['specialist', 'results_manager', 'department_head']

export const TOOL_TIER_LABELS = {
  specialist: 'Specialist',
  results_manager: 'Results Manager',
  department_head: 'Department Head',
}

export const TOOL_TIER_HELP =
  'Selecting a tier grants access to everyone at that level and above in matching departments. Example: Specialist includes all ranks; Department Head only includes DH, Leadership, and Developer.'

export function isDeveloper(access) {
  return Boolean(access?.is_developer)
}

export function isLeadershipOrAbove(access) {
  return Boolean(access?.is_leadership_or_above)
}

export function userMaxRank(access) {
  return access?.max_rank ?? 0
}

/**
 * Client-side tool access check (mock mode / previews).
 * Real filtering happens in get_tools_for_user RPC.
 */
export function canAccessTool(access, { departments = [], minTierRank = 1 }) {
  if (!access) return false
  if (isLeadershipOrAbove(access)) return true

  const assignments = access.assignments ?? []
  return assignments.some(a => {
    const deptMatch = departments.some(
      d =>
        d === a.department_name ||
        d === a.department_slug ||
        (typeof d === 'string' && d.toLowerCase() === a.department_slug),
    )
    return deptMatch && (a.role_rank ?? 0) >= minTierRank
  })
}

export function slugifyToolName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}
