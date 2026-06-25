import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ImagePlus } from 'lucide-react'
import { slugifyToolName, TOOL_TIER_HELP } from '../lib/roles.js'
import ToolThumbnail from './ToolThumbnail.jsx'

export const ICON_OPTIONS = [
  'bar-chart-3',
  'users',
  'book-open',
  'wrench',
  'calculator',
  'file-text',
  'globe',
  'settings',
  'layout-grid',
  'box',
]

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  url: '',
  icon: 'wrench',
  sortOrder: '',
  thumbnailUrl: '',
  isActive: true,
  createdBy: '',
  departmentIds: [],
  tierRoleIds: [],
  kind: 'tool',
}

export default function ToolEditorForm({
  mode = 'create',
  initialValues,
  departments = [],
  tierRoles = [],
  profiles = [],
  formOptionsLoading = false,
  formOptionsError = null,
  status = 'idle',
  errorMsg = null,
  onSubmit,
  onCancel,
  onDelete,
  deletePending = false,
}) {
  const [name, setName] = useState(EMPTY.name)
  const [slug, setSlug] = useState(EMPTY.slug)
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState(EMPTY.description)
  const [url, setUrl] = useState(EMPTY.url)
  const [icon, setIcon] = useState(EMPTY.icon)
  const [sortOrder, setSortOrder] = useState(EMPTY.sortOrder)
  const [savedThumbnailUrl, setSavedThumbnailUrl] = useState(EMPTY.thumbnailUrl)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null)
  const [removeThumbnail, setRemoveThumbnail] = useState(false)
  const localPreviewRef = useRef(null)
  const [isActive, setIsActive] = useState(EMPTY.isActive)
  const [createdBy, setCreatedBy] = useState(EMPTY.createdBy)
  const [selectedDeptIds, setSelectedDeptIds] = useState(EMPTY.departmentIds)
  const [selectedTierIds, setSelectedTierIds] = useState(EMPTY.tierRoleIds)
  const [kind, setKind] = useState(EMPTY.kind)

  useEffect(() => {
    const v = { ...EMPTY, ...initialValues }
    setName(v.name)
    setSlug(v.slug)
    setSlugTouched(mode === 'edit')
    setDescription(v.description)
    setUrl(v.url)
    setIcon(v.icon)
    setSortOrder(v.sortOrder === '' || v.sortOrder == null ? '' : String(v.sortOrder))
    setSavedThumbnailUrl(v.thumbnailUrl ?? '')
    setThumbnailFile(null)
    setRemoveThumbnail(false)
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current)
      localPreviewRef.current = null
    }
    setLocalPreviewUrl(null)
    setIsActive(v.isActive !== false)
    setCreatedBy(v.createdBy || '')
    setSelectedDeptIds(v.departmentIds ?? [])
    setSelectedTierIds(v.tierRoleIds ?? [])
    setKind(v.kind === 'gpt' ? 'gpt' : 'tool')
  }, [initialValues, mode])

  useEffect(() => {
    return () => {
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!slugTouched && name && mode === 'create') {
      setSlug(slugifyToolName(name))
    }
  }, [name, slugTouched, mode])

  const canSubmit = useMemo(
    () =>
      name.trim() &&
      slug.trim() &&
      url.trim() &&
      createdBy &&
      selectedDeptIds.length > 0 &&
      selectedTierIds.length > 0,
    [name, slug, url, createdBy, selectedDeptIds, selectedTierIds],
  )

  function toggleDept(id) {
    setSelectedDeptIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    )
  }

  function toggleTier(id) {
    setSelectedTierIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    )
  }

  function handleThumbnailChange(e) {
    const file = e.target.files?.[0]
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current)
      localPreviewRef.current = null
    }

    if (!file) {
      setThumbnailFile(null)
      setLocalPreviewUrl(null)
      return
    }

    const preview = URL.createObjectURL(file)
    localPreviewRef.current = preview
    setThumbnailFile(file)
    setLocalPreviewUrl(preview)
    setRemoveThumbnail(false)
  }

  function handleRemoveThumbnail() {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current)
      localPreviewRef.current = null
    }
    setThumbnailFile(null)
    setLocalPreviewUrl(null)
    setRemoveThumbnail(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit?.({
      name,
      slug,
      description,
      url,
      icon,
      sortOrder: sortOrder ? Number(sortOrder) : 0,
      thumbnailUrl: savedThumbnailUrl,
      thumbnailFile,
      removeThumbnail,
      isActive,
      createdBy,
      departmentIds: selectedDeptIds,
      tierRoleIds: selectedTierIds,
      kind,
    })
  }

  const isGpt = kind === 'gpt'
  const submitLabel =
    status === 'submitting'
      ? mode === 'edit'
        ? 'Saving…'
        : isGpt
          ? 'Creating GPT…'
          : 'Creating…'
      : mode === 'edit'
        ? 'Save changes'
        : isGpt
          ? 'Create GPT'
          : 'Create tool'

  const activePreviewUrl = removeThumbnail
    ? ''
    : localPreviewUrl || savedThumbnailUrl.trim()

  const previewTool = useMemo(
    () => ({
      name: name.trim() || 'Tool preview',
      url: '',
      thumbnail_url: activePreviewUrl,
    }),
    [name, activePreviewUrl],
  )

  const hasPreview = Boolean(activePreviewUrl)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink-900">
          {mode === 'edit' ? 'Edit entry' : 'New entry'}
        </h2>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-ink-600 hover:text-ink-900"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
        <input
          type="checkbox"
          checked={isActive}
          onChange={e => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-brand-300 text-brand-800 focus:ring-brand-500"
        />
        <span>
          <span className="block text-sm font-medium text-ink-900">Visible on hub</span>
          <span className="block text-xs text-ink-500">Uncheck to hide this tool from the hub</span>
        </span>
      </label>

      <fieldset>
        <legend className="block text-sm font-medium text-ink-800">Type</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
            <input
              type="radio"
              name="tool-kind"
              value="tool"
              checked={kind === 'tool'}
              onChange={() => setKind('tool')}
              className="h-4 w-4 border-brand-300 text-brand-800 focus:ring-brand-500"
            />
            <span>
              <span className="block text-sm font-medium text-ink-900">Tool</span>
              <span className="block text-xs text-ink-500">Internal app or utility</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
            <input
              type="radio"
              name="tool-kind"
              value="gpt"
              checked={kind === 'gpt'}
              onChange={() => setKind('gpt')}
              className="h-4 w-4 border-brand-300 text-brand-800 focus:ring-brand-500"
            />
            <span>
              <span className="block text-sm font-medium text-ink-900">GPT</span>
              <span className="block text-xs text-ink-500">Custom GPT from your collection</span>
            </span>
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor="tool-name" className="block text-sm font-medium text-ink-800">
          Name
        </label>
        <input
          id="tool-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          required
        />
      </div>

      <div>
        <label htmlFor="tool-slug" className="block text-sm font-medium text-ink-800">
          Slug
        </label>
        <input
          id="tool-slug"
          type="text"
          value={slug}
          onChange={e => {
            setSlugTouched(true)
            setSlug(e.target.value)
          }}
          className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2.5 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          required
        />
      </div>

      <div>
        <label htmlFor="tool-desc" className="block text-sm font-medium text-ink-800">
          Description
        </label>
        <textarea
          id="tool-desc"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div>
        <label htmlFor="tool-url" className="block text-sm font-medium text-ink-800">
          URL
        </label>
        <input
          id="tool-url"
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://"
          className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tool-icon" className="block text-sm font-medium text-ink-800">
            Icon
          </label>
          <select
            id="tool-icon"
            value={icon}
            onChange={e => setIcon(e.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {ICON_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tool-sort" className="block text-sm font-medium text-ink-800">
            Sort order
          </label>
          <input
            id="tool-sort"
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            placeholder="0"
            className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      <div>
        <label htmlFor="tool-thumb" className="block text-sm font-medium text-ink-800">
          Card preview image
        </label>
        <p className="mt-1 text-xs text-ink-500">
          Upload a screenshot or photo for the tool card (PNG, JPG, or WebP, max 5 MB).
        </p>
        <input
          id="tool-thumb"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleThumbnailChange}
          className="mt-2 block w-full text-sm text-ink-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-800 hover:file:bg-brand-200"
          disabled={status === 'submitting'}
        />
        {hasPreview ? (
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-ink-600">Card preview</p>
              <button
                type="button"
                onClick={handleRemoveThumbnail}
                className="text-xs font-medium text-red-600 hover:text-red-700"
                disabled={status === 'submitting'}
              >
                Remove image
              </button>
            </div>
            <ToolThumbnail tool={previewTool} />
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-8 text-center">
            <ImagePlus size={28} className="mx-auto text-brand-400" aria-hidden />
            <p className="mt-2 text-sm text-ink-500">No preview image yet</p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="tool-created-by" className="block text-sm font-medium text-ink-800">
          Created by
        </label>
        <select
          id="tool-created-by"
          value={createdBy}
          onChange={e => setCreatedBy(e.target.value)}
          className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          required
        >
          <option value="">Select a user…</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>
              {p.display_name ? `${p.display_name} — ${p.email}` : p.email}
            </option>
          ))}
        </select>
      </div>

      {formOptionsError ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>{formOptionsError.message || 'Could not load departments and roles.'}</span>
        </div>
      ) : null}

      <fieldset disabled={formOptionsLoading || Boolean(formOptionsError)}>
        <legend className="text-sm font-medium text-ink-800">Departments</legend>
        <p className="mt-1 text-xs text-ink-500">
          Users must belong to one of these departments to access this tool (unless Leadership or
          Developer).
        </p>
        {formOptionsLoading ? (
          <p className="mt-3 text-sm text-ink-500">Loading departments…</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {departments.map(d => {
            const checked = selectedDeptIds.includes(d.id)
            return (
              <label
                key={d.id}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  checked
                    ? 'border-brand-600 bg-brand-800 text-white'
                    : 'border-brand-200 bg-white text-ink-700 hover:border-brand-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggleDept(d.id)}
                />
                {d.name}
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset disabled={formOptionsLoading || Boolean(formOptionsError)}>
        <legend className="text-sm font-medium text-ink-800">Access tiers</legend>
        <p className="mt-1 text-xs text-ink-500">{TOOL_TIER_HELP}</p>
        {formOptionsLoading ? (
          <p className="mt-3 text-sm text-ink-500">Loading access tiers…</p>
        ) : null}
        <div className="mt-3 space-y-2">
          {tierRoles.map(r => {
            const checked = selectedTierIds.includes(r.id)
            return (
              <label
                key={r.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  checked
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-brand-100 hover:border-brand-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTier(r.id)}
                  className="h-4 w-4 rounded border-brand-300 text-brand-800 focus:ring-brand-500"
                />
                <span>
                  <span className="text-sm font-medium text-ink-900">{r.name}</span>
                  <span className="ml-2 text-xs text-ink-500">rank {r.rank}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {status === 'error' && errorMsg ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          {errorMsg}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit || status === 'submitting' || deletePending}
        className="w-full rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitLabel}
      </button>

      {mode === 'edit' && onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          disabled={status === 'submitting' || deletePending}
          className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deletePending ? 'Deleting…' : 'Delete tool'}
        </button>
      ) : null}
    </form>
  )
}
