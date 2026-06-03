import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Pencil, Trash2, UserCog } from 'lucide-react'
import { useUserAccess } from '../hooks/useUserAccess.js'
import {
  deleteUserDepartmentRole,
  fetchDepartments,
  fetchProfiles,
  fetchRoles,
  fetchUserDepartmentRoles,
  upsertUserDepartmentRole,
} from '../lib/adminApi.js'

function getInitials(name, email) {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return '?'
}

export default function ManageAccessPage({ onNavigate }) {
  const queryClient = useQueryClient()
  const { isDeveloper, isLoading: accessLoading } = useUserAccess()

  const [selectedUserId, setSelectedUserId] = useState('')
  const [addDeptId, setAddDeptId] = useState('')
  const [addRoleId, setAddRoleId] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState(null)

  const {
    data: profiles = [],
    isLoading: profilesLoading,
    error: profilesError,
  } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await fetchProfiles()
      if (error) throw error
      return data
    },
    enabled: isDeveloper,
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await fetchDepartments()
      if (error) throw error
      return data
    },
    enabled: isDeveloper,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles', 'all'],
    queryFn: async () => {
      const { data, error } = await fetchRoles()
      if (error) throw error
      return data
    },
    enabled: isDeveloper,
  })

  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ['userDepartmentRoles', selectedUserId],
    queryFn: async () => {
      const { data, error } = await fetchUserDepartmentRoles(selectedUserId)
      if (error) throw error
      return data
    },
    enabled: Boolean(selectedUserId) && isDeveloper,
  })

  useEffect(() => {
    if (!accessLoading && !isDeveloper) {
      onNavigate?.('tools')
    }
  }, [accessLoading, isDeveloper, onNavigate])

  const selectedProfile = useMemo(
    () => profiles.find(p => p.id === selectedUserId),
    [profiles, selectedUserId],
  )

  const availableDepartments = useMemo(() => {
    const assigned = new Set(assignments.map(a => a.department_id))
    return departments.filter(d => !assigned.has(d.id))
  }, [departments, assignments])

  function selectUser(userId) {
    setSelectedUserId(userId)
    setAddDeptId('')
    setAddRoleId('')
    setStatus('idle')
    setErrorMsg(null)
  }

  function closePanel() {
    setSelectedUserId('')
    setAddDeptId('')
    setAddRoleId('')
    setStatus('idle')
    setErrorMsg(null)
  }

  async function handleAddAssignment(e) {
    e.preventDefault()
    if (!selectedUserId || !addDeptId || !addRoleId) return

    setStatus('submitting')
    setErrorMsg(null)

    const { error } = await upsertUserDepartmentRole({
      userId: selectedUserId,
      departmentId: addDeptId,
      roleId: addRoleId,
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message || 'Failed to save assignment.')
      return
    }

    setStatus('idle')
    setAddDeptId('')
    setAddRoleId('')
    await refetchAssignments()
    queryClient.invalidateQueries({ queryKey: ['userAccess'] })
  }

  async function handleRemove(departmentId) {
    setStatus('submitting')
    setErrorMsg(null)

    const { error } = await deleteUserDepartmentRole({
      userId: selectedUserId,
      departmentId,
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message || 'Failed to remove assignment.')
      setStatus('idle')
      return
    }

    setStatus('idle')
    await refetchAssignments()
    queryClient.invalidateQueries({ queryKey: ['userAccess'] })
  }

  if (accessLoading) {
    return <p className="text-sm text-ink-600">Loading…</p>
  }

  if (!isDeveloper) {
    return null
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
          Manage access
        </h1>
        <p className="mt-1 text-sm text-ink-600 sm:text-base">
          Assign one role per department for each team member.
        </p>
      </header>

      {profilesError ? (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          {profilesError.message || 'Could not load users.'}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-brand-100 bg-white shadow-sm">
          <div className="border-b border-brand-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-ink-900">All users</h2>
          </div>
          {profilesLoading ? (
            <p className="px-4 py-8 text-sm text-ink-500">Loading users…</p>
          ) : profiles.length === 0 ? (
            <p className="px-4 py-8 text-sm text-ink-500">No users found.</p>
          ) : (
            <ul className="divide-y divide-brand-50">
              {profiles.map(profile => {
                const isSelected = selectedUserId === profile.id
                const displayName = profile.display_name || profile.email
                return (
                  <li key={profile.id}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 ${
                        isSelected ? 'bg-brand-50' : ''
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
                        {getInitials(profile.display_name, profile.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink-900">{displayName}</p>
                        {profile.display_name ? (
                          <p className="truncate text-xs text-ink-500">{profile.email}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => selectUser(profile.id)}
                        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-brand-50"
                      >
                        <Pencil size={14} aria-hidden />
                        Edit
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {selectedUserId ? (
          <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink-900">
                  {selectedProfile?.display_name || selectedProfile?.email || 'User'}
                </h2>
                {selectedProfile?.display_name ? (
                  <p className="mt-0.5 text-sm text-ink-500">{selectedProfile.email}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="text-sm font-medium text-ink-600 hover:text-ink-900"
              >
                Close
              </button>
            </div>

            <h3 className="text-sm font-semibold text-ink-900">Department roles</h3>

            {assignmentsLoading ? (
              <p className="mt-4 text-sm text-ink-500">Loading assignments…</p>
            ) : assignments.length === 0 ? (
              <p className="mt-4 text-sm text-ink-500">No department roles yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-brand-50 rounded-xl border border-brand-100">
                {assignments.map(row => (
                  <li
                    key={row.department_id}
                    className="flex items-center gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink-900">{row.department_name}</p>
                      <p className="text-xs text-ink-500">
                        {row.role_name} · rank {row.role_rank}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(row.department_id)}
                      disabled={status === 'submitting'}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      aria-label={`Remove ${row.department_name}`}
                    >
                      <Trash2 size={14} aria-hidden />
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {availableDepartments.length > 0 ? (
              <form onSubmit={handleAddAssignment} className="mt-6 border-t border-brand-100 pt-6">
                <h3 className="text-sm font-semibold text-ink-900">Add assignment</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="add-dept" className="block text-xs font-medium text-ink-600">
                      Department
                    </label>
                    <select
                      id="add-dept"
                      value={addDeptId}
                      onChange={e => setAddDeptId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      required
                      disabled={status === 'submitting'}
                    >
                      <option value="">Choose…</option>
                      {availableDepartments.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="add-role" className="block text-xs font-medium text-ink-600">
                      Role
                    </label>
                    <select
                      id="add-role"
                      value={addRoleId}
                      onChange={e => setAddRoleId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      required
                      disabled={status === 'submitting'}
                    >
                      <option value="">Choose…</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} (rank {r.rank})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={status === 'submitting' || !addDeptId || !addRoleId}
                  className="mt-4 w-full rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {status === 'submitting' ? 'Saving…' : 'Add assignment'}
                </button>
              </form>
            ) : selectedUserId && !assignmentsLoading ? (
              <p className="mt-6 text-sm text-ink-500">
                This user has a role in every department. Remove one to reassign.
              </p>
            ) : null}

            {errorMsg ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
                {errorMsg}
              </div>
            ) : null}
          </section>
        ) : (
          <section className="hidden rounded-2xl border border-dashed border-brand-200 bg-brand-50/30 p-8 text-center lg:flex lg:flex-col lg:items-center lg:justify-center">
            <UserCog size={32} className="text-brand-400" aria-hidden />
            <p className="mt-3 text-sm text-ink-600">
              Select a user to manage their department roles.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
