import { getSupabase } from './supabaseClient.js'
import { useOfflineDemo } from '../config/env.js'
import {
  MOCK_ACCESS,
  MOCK_DEPARTMENTS,
  MOCK_PROFILES,
  MOCK_ROLES,
} from './mockData.js'
import {
  getMockUserAssignments,
  setMockUserAssignment,
  removeMockUserAssignment,
  addMockTool,
  getMockAdminTools,
  updateMockTool,
  deleteMockTool,
} from './mockAdminStore.js'
import { TOOL_TIER_SLUGS } from './roles.js'

export async function fetchMyAccess() {
  if (useOfflineDemo) {
    return { data: MOCK_ACCESS, error: null }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('get_my_access')

  if (error) {
    return { data: null, error }
  }

  const row = Array.isArray(data) ? data[0] : data
  return { data: row ?? null, error: null }
}

export async function fetchRoles({ toolTiersOnly = false } = {}) {
  if (useOfflineDemo) {
    const roles = toolTiersOnly
      ? MOCK_ROLES.filter(r => TOOL_TIER_SLUGS.includes(r.slug))
      : MOCK_ROLES
    return { data: roles, error: null }
  }

  const supabase = getSupabase()
  let query = supabase.from('roles').select('id, slug, name, rank').order('rank')

  if (toolTiersOnly) {
    query = query.lte('rank', 3)
  }

  const { data, error } = await query
  return { data: data ?? [], error }
}

export async function fetchDepartments() {
  if (useOfflineDemo) {
    return { data: MOCK_DEPARTMENTS, error: null }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('departments')
    .select('id, slug, name, sort_order')
    .order('sort_order')

  return { data: data ?? [], error }
}

export async function fetchProfiles() {
  if (useOfflineDemo) {
    return { data: MOCK_PROFILES, error: null }
  }

  const supabase = getSupabase()
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_users_for_developer')

  if (!rpcError && rpcData) {
    return { data: rpcData, error: null }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .order('email')

  return { data: data ?? [], error }
}

export async function fetchAdminFormOptions() {
  if (useOfflineDemo) {
    return {
      data: {
        departments: MOCK_DEPARTMENTS,
        tier_roles: MOCK_ROLES.filter(r => TOOL_TIER_SLUGS.includes(r.slug)),
      },
      error: null,
    }
  }

  const [deptResult, rolesResult] = await Promise.all([
    fetchDepartments(),
    fetchRoles({ toolTiersOnly: true }),
  ])

  if (deptResult.error) {
    return { data: null, error: deptResult.error }
  }
  if (rolesResult.error) {
    return { data: null, error: rolesResult.error }
  }

  return {
    data: {
      departments: deptResult.data,
      tier_roles: rolesResult.data,
    },
    error: null,
  }
}

export async function fetchToolsForAdmin() {
  if (useOfflineDemo) {
    return { data: getMockAdminTools(), error: null }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('tools')
    .select(
      `
      id,
      name,
      slug,
      description,
      url,
      icon,
      sort_order,
      thumbnail_url,
      is_active,
      created_by,
      kind,
      tool_departments ( department_id ),
      tool_access_tiers ( role_id )
    `,
    )
    .order('sort_order')

  if (error) {
    return { data: null, error }
  }

  const rows = (data ?? []).map(tool => ({
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    url: tool.url,
    icon: tool.icon,
    sort_order: tool.sort_order,
    thumbnail_url: tool.thumbnail_url,
    is_active: tool.is_active,
    created_by: tool.created_by,
    kind: tool.kind ?? 'tool',
    department_ids: (tool.tool_departments ?? []).map(td => td.department_id),
    tier_role_ids: (tool.tool_access_tiers ?? []).map(tat => tat.role_id),
  }))

  return { data: rows, error: null }
}

async function syncToolRelations(supabase, toolId, departmentIds, tierRoleIds) {
  const { error: deleteDeptError } = await supabase
    .from('tool_departments')
    .delete()
    .eq('tool_id', toolId)

  if (deleteDeptError) {
    return deleteDeptError
  }

  const { error: deleteTierError } = await supabase
    .from('tool_access_tiers')
    .delete()
    .eq('tool_id', toolId)

  if (deleteTierError) {
    return deleteTierError
  }

  if (departmentIds?.length) {
    const { error: deptError } = await supabase.from('tool_departments').insert(
      departmentIds.map(department_id => ({
        tool_id: toolId,
        department_id,
      })),
    )
    if (deptError) {
      return deptError
    }
  }

  if (tierRoleIds?.length) {
    const { error: tierError } = await supabase.from('tool_access_tiers').insert(
      tierRoleIds.map(role_id => ({
        tool_id: toolId,
        role_id,
      })),
    )
    if (tierError) {
      return tierError
    }
  }

  return null
}

export async function fetchUserDepartmentRoles(userId) {
  if (useOfflineDemo) {
    return { data: getMockUserAssignments(userId), error: null }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('user_department_roles')
    .select(
      `
      user_id,
      department_id,
      role_id,
      departments ( id, slug, name ),
      roles ( id, slug, name, rank )
    `,
    )
    .eq('user_id', userId)

  if (error) {
    return { data: null, error }
  }

  const rows = (data ?? []).map(row => ({
    user_id: row.user_id,
    department_id: row.department_id,
    role_id: row.role_id,
    department_name: row.departments?.name,
    department_slug: row.departments?.slug,
    role_name: row.roles?.name,
    role_slug: row.roles?.slug,
    role_rank: row.roles?.rank,
  }))

  return { data: rows, error: null }
}

export async function upsertUserDepartmentRole({ userId, departmentId, roleId }) {
  if (useOfflineDemo) {
    setMockUserAssignment(userId, departmentId, roleId)
    return { data: { ok: true }, error: null }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('user_department_roles')
    .upsert(
      { user_id: userId, department_id: departmentId, role_id: roleId },
      { onConflict: 'user_id,department_id' },
    )
    .select()
    .single()

  return { data, error }
}

export async function deleteUserDepartmentRole({ userId, departmentId }) {
  if (useOfflineDemo) {
    removeMockUserAssignment(userId, departmentId)
    return { data: { ok: true }, error: null }
  }

  const supabase = getSupabase()
  const { error } = await supabase
    .from('user_department_roles')
    .delete()
    .eq('user_id', userId)
    .eq('department_id', departmentId)

  return { data: { ok: true }, error }
}

export async function createTool({
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
  kind = 'tool',
}) {
  if (useOfflineDemo) {
    const tool = addMockTool({
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
      kind,
    })
    return { data: tool, error: null }
  }

  const supabase = getSupabase()

  const { data: tool, error: toolError } = await supabase
    .from('tools')
    .insert({
      name: name.trim(),
      slug: slug.trim(),
      description: description?.trim() ?? '',
      url: url.trim(),
      icon: icon || 'wrench',
      sort_order: sortOrder ?? 0,
      thumbnail_url: thumbnailUrl?.trim() || null,
      created_by: createdBy,
      is_active: true,
      kind: kind === 'gpt' ? 'gpt' : 'tool',
    })
    .select('id')
    .single()

  if (toolError) {
    return { data: null, error: toolError }
  }

  if (departmentIds?.length) {
    const { error: deptError } = await supabase.from('tool_departments').insert(
      departmentIds.map(department_id => ({
        tool_id: tool.id,
        department_id,
      })),
    )
    if (deptError) {
      return { data: null, error: deptError }
    }
  }

  if (tierRoleIds?.length) {
    const { error: tierError } = await supabase.from('tool_access_tiers').insert(
      tierRoleIds.map(role_id => ({
        tool_id: tool.id,
        role_id,
      })),
    )
    if (tierError) {
      return { data: null, error: tierError }
    }
  }

  return { data: tool, error: null }
}

export async function updateTool({
  toolId,
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
  kind = 'tool',
}) {
  if (useOfflineDemo) {
    const tool = updateMockTool(toolId, {
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
      kind,
    })
    if (!tool) {
      return { data: null, error: { message: 'Tool not found.' } }
    }
    return { data: tool, error: null }
  }

  const supabase = getSupabase()

  const { error: toolError } = await supabase
    .from('tools')
    .update({
      name: name.trim(),
      slug: slug.trim(),
      description: description?.trim() ?? '',
      url: url.trim(),
      icon: icon || 'wrench',
      sort_order: sortOrder ?? 0,
      thumbnail_url: thumbnailUrl?.trim() || null,
      created_by: createdBy,
      is_active: isActive !== false,
      kind: kind === 'gpt' ? 'gpt' : 'tool',
    })
    .eq('id', toolId)

  if (toolError) {
    return { data: null, error: toolError }
  }

  const relError = await syncToolRelations(supabase, toolId, departmentIds, tierRoleIds)
  if (relError) {
    return { data: null, error: relError }
  }

  return { data: { id: toolId }, error: null }
}

const THUMBNAIL_BUCKET = 'tool-thumbnails'
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024

function thumbnailExtension(file) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName
  }
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  return 'png'
}

export async function uploadToolThumbnail({ file, toolSlug }) {
  if (!file) {
    return { data: null, error: { message: 'No image selected.' } }
  }

  if (file.size > MAX_THUMBNAIL_BYTES) {
    return { data: null, error: { message: 'Image must be 5 MB or smaller.' } }
  }

  if (useOfflineDemo) {
    return { data: { publicUrl: URL.createObjectURL(file) }, error: null }
  }

  const safeSlug = (toolSlug || 'tool')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'tool'

  const ext = thumbnailExtension(file)
  const path = `${safeSlug}/${Date.now()}.${ext}`

  const supabase = getSupabase()
  const { error: uploadError } = await supabase.storage
    .from(THUMBNAIL_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    })

  if (uploadError) {
    const msg = uploadError.message || ''
    if (/bucket not found/i.test(msg)) {
      return {
        data: null,
        error: {
          message:
            'Storage bucket "tool-thumbnails" is not set up yet. In Supabase → SQL Editor, run supabase/migrations/008_tool_thumbnail_storage.sql, then try again.',
        },
      }
    }
    return { data: null, error: uploadError }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(THUMBNAIL_BUCKET).getPublicUrl(path)

  return { data: { publicUrl }, error: null }
}

export async function deleteTool(toolId) {
  if (useOfflineDemo) {
    const ok = deleteMockTool(toolId)
    return ok
      ? { data: { ok: true }, error: null }
      : { data: null, error: { message: 'Tool not found.' } }
  }

  const supabase = getSupabase()
  const { error } = await supabase.from('tools').delete().eq('id', toolId)

  return { data: { ok: true }, error }
}
