import {
  MOCK_DEPARTMENTS,
  MOCK_PROFILES,
  MOCK_ROLES,
  MOCK_TOOLS,
} from './mockData.js'

const assignmentsByUser = new Map()

/** Seed demo user as Developer in Advertising. */
assignmentsByUser.set('mock-user-id', [
  {
    user_id: 'mock-user-id',
    department_id: 'dept-advertising',
    role_id: 'role-developer',
    department_name: 'Advertising',
    department_slug: 'advertising',
    role_name: 'Developer',
    role_slug: 'developer',
    role_rank: 5,
  },
])

/** Per-tool admin metadata not stored on hub-facing MOCK_TOOLS rows. */
const mockToolMeta = new Map([
  [
    '1',
    {
      is_active: true,
      created_by: 'mock-user-2',
      department_ids: ['dept-advertising', 'dept-operations'],
      tier_role_ids: ['role-specialist', 'role-results-manager', 'role-department-head'],
    },
  ],
  [
    '2',
    {
      is_active: true,
      created_by: 'mock-user-id',
      department_ids: ['dept-sales', 'dept-operations'],
      tier_role_ids: ['role-specialist', 'role-results-manager'],
    },
  ],
  [
    '3',
    {
      is_active: true,
      created_by: 'mock-user-3',
      department_ids: ['dept-operations', 'dept-branding'],
      tier_role_ids: ['role-specialist', 'role-results-manager', 'role-department-head', 'role-leadership'],
    },
  ],
])

function getMockToolMeta(toolId) {
  return (
    mockToolMeta.get(toolId) ?? {
      is_active: true,
      created_by: 'mock-user-id',
      department_ids: [],
      tier_role_ids: [],
    }
  )
}

export function getMockUserAssignments(userId) {
  return [...(assignmentsByUser.get(userId) ?? [])]
}

export function setMockUserAssignment(userId, departmentId, roleId) {
  const dept = MOCK_DEPARTMENTS.find(d => d.id === departmentId)
  const role = MOCK_ROLES.find(r => r.id === roleId)
  if (!dept || !role) return

  const rows = assignmentsByUser.get(userId) ?? []
  const filtered = rows.filter(r => r.department_id !== departmentId)
  filtered.push({
    user_id: userId,
    department_id: departmentId,
    role_id: roleId,
    department_name: dept.name,
    department_slug: dept.slug,
    role_name: role.name,
    role_slug: role.slug,
    role_rank: role.rank,
  })
  assignmentsByUser.set(userId, filtered)
}

export function removeMockUserAssignment(userId, departmentId) {
  const rows = assignmentsByUser.get(userId) ?? []
  assignmentsByUser.set(
    userId,
    rows.filter(r => r.department_id !== departmentId),
  )
}

export function getMockAdminTools() {
  return MOCK_TOOLS.map(tool => {
    const meta = getMockToolMeta(tool.id)
    return {
      id: tool.id,
      slug: tool.slug,
      name: tool.name,
      description: tool.description ?? '',
      icon: tool.icon,
      url: tool.url,
      sort_order: tool.sort_order,
      thumbnail_url: tool.thumbnail_url ?? null,
      is_active: meta.is_active,
      created_by: meta.created_by,
      department_ids: meta.department_ids,
      tier_role_ids: meta.tier_role_ids,
    }
  }).sort((a, b) => a.sort_order - b.sort_order)
}

export function addMockTool({
  name,
  slug,
  description,
  url,
  icon,
  sortOrder,
  thumbnailUrl,
  departmentIds,
  tierRoleIds,
  createdBy,
  isActive = true,
}) {
  const id = `mock-tool-${Date.now()}`
  const deptNames = (departmentIds ?? [])
    .map(did => MOCK_DEPARTMENTS.find(d => d.id === did)?.name)
    .filter(Boolean)
  const creator = MOCK_PROFILES.find(p => p.id === createdBy)

  const tool = {
    id,
    slug,
    name,
    description: description ?? '',
    icon,
    url,
    sort_order: sortOrder ?? MOCK_TOOLS.length + 1,
    departments: deptNames,
    created_by_name: creator?.display_name || creator?.email || 'Demo User',
    thumbnail_url: thumbnailUrl || null,
  }

  MOCK_TOOLS.push(tool)
  mockToolMeta.set(id, {
    is_active: isActive !== false,
    created_by: createdBy,
    department_ids: departmentIds ?? [],
    tier_role_ids: tierRoleIds ?? [],
  })

  return tool
}

export function updateMockTool(
  toolId,
  {
    name,
    slug,
    description,
    url,
    icon,
    sortOrder,
    thumbnailUrl,
    departmentIds,
    tierRoleIds,
    createdBy,
    isActive,
  },
) {
  const index = MOCK_TOOLS.findIndex(t => t.id === toolId)
  if (index === -1) return null

  const deptNames = (departmentIds ?? [])
    .map(did => MOCK_DEPARTMENTS.find(d => d.id === did)?.name)
    .filter(Boolean)
  const creator = MOCK_PROFILES.find(p => p.id === createdBy)

  MOCK_TOOLS[index] = {
    ...MOCK_TOOLS[index],
    name,
    slug,
    description: description ?? '',
    url,
    icon,
    sort_order: sortOrder ?? MOCK_TOOLS[index].sort_order,
    departments: deptNames,
    created_by_name: creator?.display_name || creator?.email || MOCK_TOOLS[index].created_by_name,
    thumbnail_url: thumbnailUrl || null,
  }

  mockToolMeta.set(toolId, {
    is_active: isActive !== false,
    created_by: createdBy,
    department_ids: departmentIds ?? [],
    tier_role_ids: tierRoleIds ?? [],
  })

  return MOCK_TOOLS[index]
}

export function deleteMockTool(toolId) {
  const index = MOCK_TOOLS.findIndex(t => t.id === toolId)
  if (index === -1) return false
  MOCK_TOOLS.splice(index, 1)
  mockToolMeta.delete(toolId)
  return true
}
