import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useUserAccess } from '../hooks/useUserAccess.js'
import ToolEditorForm from '../components/ToolEditorForm.jsx'
import {
  createTool,
  deleteTool,
  fetchAdminFormOptions,
  fetchProfiles,
  fetchToolsForAdmin,
  updateTool,
  uploadToolThumbnail,
} from '../lib/adminApi.js'
import { CREATOR_TEAM_LABEL, creatorSelectValue } from '../lib/creators.js'

function toolToFormValues(tool) {
  if (!tool) return undefined
  return {
    name: tool.name,
    slug: tool.slug,
    description: tool.description ?? '',
    url: tool.url,
    icon: tool.icon,
    sortOrder: tool.sort_order,
    thumbnailUrl: tool.thumbnail_url ?? '',
    isActive: tool.is_active !== false,
    createdBy: creatorSelectValue(tool),
    departmentIds: tool.department_ids ?? [],
    tierRoleIds: tool.tier_role_ids ?? [],
    kind: tool.kind ?? 'tool',
  }
}

export default function ManageToolsPage({ onNavigate }) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { isDeveloper, isLoading: accessLoading } = useUserAccess()

  const [panel, setPanel] = useState(null)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState(null)
  const [deletingToolId, setDeletingToolId] = useState(null)

  const {
    data: tools = [],
    isLoading: toolsLoading,
    error: toolsError,
  } = useQuery({
    queryKey: ['adminTools'],
    queryFn: async () => {
      const { data, error } = await fetchToolsForAdmin()
      if (error) throw error
      return data
    },
    enabled: !accessLoading && isDeveloper,
  })

  const { data: formOptions, isLoading: formOptionsLoading, error: formOptionsError } =
    useQuery({
      queryKey: ['adminFormOptions'],
      queryFn: async () => {
        const { data, error } = await fetchAdminFormOptions()
        if (error) throw error
        return data
      },
      enabled: !accessLoading && isDeveloper,
    })

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await fetchProfiles()
      if (error) throw error
      return data
    },
    enabled: !accessLoading && isDeveloper,
  })

  useEffect(() => {
    if (!accessLoading && !isDeveloper) {
      onNavigate?.('tools')
    }
  }, [accessLoading, isDeveloper, onNavigate])

  function openCreate() {
    setPanel({ mode: 'create' })
    setStatus('idle')
    setErrorMsg(null)
  }

  function openEdit(tool) {
    setPanel({ mode: 'edit', toolId: tool.id })
    setStatus('idle')
    setErrorMsg(null)
  }

  function closePanel() {
    setPanel(null)
    setStatus('idle')
    setErrorMsg(null)
  }

  function creatorLabel(tool) {
    if (tool.creator_type === 'team') return CREATOR_TEAM_LABEL
    const p = profiles.find(x => x.id === tool.created_by)
    return p?.display_name || p?.email || null
  }

  async function handleSubmit(values) {
    setStatus('submitting')
    setErrorMsg(null)

    let thumbnailUrl = values.removeThumbnail ? null : values.thumbnailUrl?.trim() || null

    if (values.thumbnailFile) {
      const { data, error: uploadError } = await uploadToolThumbnail({
        file: values.thumbnailFile,
        toolSlug: values.slug,
      })
      if (uploadError) {
        setStatus('error')
        setErrorMsg(uploadError.message || 'Failed to upload preview image.')
        return
      }
      thumbnailUrl = data.publicUrl
    }

    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      url: values.url,
      icon: values.icon,
      sortOrder: values.sortOrder,
      thumbnailUrl,
      departmentIds: values.departmentIds,
      tierRoleIds: values.tierRoleIds,
      createdBy: values.createdBy,
      isActive: values.isActive,
      kind: values.kind,
    }

    const { error } =
      panel?.mode === 'edit'
        ? await updateTool({ toolId: panel.toolId, ...payload })
        : await createTool(payload)

    if (error) {
      setStatus('error')
      setErrorMsg(error.message || 'Failed to save tool.')
      return
    }

    setStatus('idle')
    closePanel()
    queryClient.invalidateQueries({ queryKey: ['adminTools'] })
    queryClient.invalidateQueries({ queryKey: ['tools'] })
  }

  async function handleDelete(tool) {
    const confirmed = window.confirm(
      `Delete "${tool.name}"? This permanently removes the tool and its feature requests. This cannot be undone.`,
    )
    if (!confirmed) return

    setDeletingToolId(tool.id)
    setErrorMsg(null)

    const { error } = await deleteTool(tool.id)

    setDeletingToolId(null)

    if (error) {
      setErrorMsg(error.message || 'Failed to delete tool.')
      return
    }

    if (panel?.mode === 'edit' && panel.toolId === tool.id) {
      closePanel()
    }

    queryClient.invalidateQueries({ queryKey: ['adminTools'] })
    queryClient.invalidateQueries({ queryKey: ['tools'] })
  }

  if (accessLoading) {
    return <p className="text-sm text-ink-600">Loading…</p>
  }

  if (!isDeveloper) {
    return null
  }

  const editingTool =
    panel?.mode === 'edit' ? tools.find(t => t.id === panel.toolId) : null

  const formInitial =
    panel?.mode === 'create'
      ? { createdBy: user?.id ?? '' }
      : toolToFormValues(editingTool)

  return (
    <div className="mx-auto max-w-5xl min-w-0">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Manage tools
          </h1>
          <p className="mt-1 text-sm text-ink-600 sm:text-base">
            Add, edit, hide, or delete tools on the hub.
          </p>
        </div>
        {!panel ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={18} aria-hidden />
            Add tool
          </button>
        ) : null}
      </header>

      {errorMsg && !panel ? (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          {errorMsg}
        </div>
      ) : null}

      {toolsError ? (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          {toolsError.message || 'Could not load tools.'}
        </div>
      ) : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-start">
        <section className="min-w-0 rounded-2xl border border-brand-100 bg-white shadow-sm lg:sticky lg:top-8 lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto">
          <div className="border-b border-brand-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-ink-900">All tools</h2>
          </div>
          {toolsLoading ? (
            <p className="px-4 py-8 text-sm text-ink-500">Loading tools…</p>
          ) : tools.length === 0 ? (
            <p className="px-4 py-8 text-sm text-ink-500">No tools yet. Add your first tool.</p>
          ) : (
            <ul className="divide-y divide-brand-50">
              {tools.map(tool => {
                const isSelected = panel?.mode === 'edit' && panel.toolId === tool.id
                return (
                  <li key={tool.id}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 ${
                        isSelected ? 'bg-brand-50' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium text-ink-900">{tool.name}</p>
                          <span
                            className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                              tool.kind === 'gpt'
                                ? 'bg-violet-100 text-violet-800'
                                : 'bg-brand-100 text-brand-800'
                            }`}
                          >
                            {tool.kind === 'gpt' ? 'GPT' : 'Tool'}
                          </span>
                        </div>
                        <p className="truncate text-xs text-ink-500">{tool.slug}</p>
                        {creatorLabel(tool) ? (
                          <p className="mt-0.5 truncate text-xs text-ink-400">
                            Created by {creatorLabel(tool)}
                          </p>
                        ) : null}
                      </div>
                      {!tool.is_active ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-600">
                          <EyeOff size={12} aria-hidden />
                          Hidden
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openEdit(tool)}
                        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-brand-50"
                      >
                        <Pencil size={14} aria-hidden />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tool)}
                        disabled={deletingToolId === tool.id}
                        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        aria-label={`Delete ${tool.name}`}
                      >
                        <Trash2 size={14} aria-hidden />
                        Delete
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {panel ? (
          <section className="min-w-0 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <ToolEditorForm
              key={panel.mode === 'edit' ? panel.toolId : 'create'}
              mode={panel.mode}
              initialValues={formInitial}
              departments={formOptions?.departments ?? []}
              tierRoles={formOptions?.tier_roles ?? []}
              profiles={profiles}
              formOptionsLoading={formOptionsLoading}
              formOptionsError={formOptionsError}
              status={status}
              errorMsg={errorMsg}
              onSubmit={handleSubmit}
              onCancel={closePanel}
              onDelete={
                panel.mode === 'edit' && editingTool
                  ? () => handleDelete(editingTool)
                  : undefined
              }
              deletePending={deletingToolId === panel.toolId}
            />
          </section>
        ) : (
          <section className="hidden rounded-2xl border border-dashed border-brand-200 bg-brand-50/30 p-8 text-center lg:flex lg:flex-col lg:items-center lg:justify-center">
            <p className="text-sm text-ink-600">
              Select a tool to edit, or click <strong>Add tool</strong> to create one.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
