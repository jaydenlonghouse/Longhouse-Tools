import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { slugifyPlatformName } from '../lib/platforms.js'
import { createPlatform } from '../lib/adminApi.js'

const EMPTY_LINK = { platformId: '', label: '', linkUrl: '' }

export default function ToolPlatformsEditor({
  platforms = [],
  platformLinks = [],
  onChange,
  disabled = false,
  onPlatformsRefresh,
}) {
  const [showNewPlatform, setShowNewPlatform] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newSlugTouched, setNewSlugTouched] = useState(false)
  const [creatingPlatform, setCreatingPlatform] = useState(false)
  const [platformError, setPlatformError] = useState(null)

  function updateLink(index, patch) {
    const next = platformLinks.map((row, i) => (i === index ? { ...row, ...patch } : row))
    onChange?.(next)
  }

  function addLink() {
    onChange?.([...platformLinks, { ...EMPTY_LINK }])
  }

  function removeLink(index) {
    onChange?.(platformLinks.filter((_, i) => i !== index))
  }

  async function handleCreatePlatform(e) {
    e.preventDefault()
    if (!newName.trim()) return

    setCreatingPlatform(true)
    setPlatformError(null)

    const slug = (newSlugTouched ? newSlug : slugifyPlatformName(newName)).trim()
    const { data, error } = await createPlatform({
      name: newName.trim(),
      slug,
    })

    setCreatingPlatform(false)

    if (error) {
      setPlatformError(error.message || 'Could not create platform.')
      return
    }

    await onPlatformsRefresh?.()
    if (data?.id) {
      onChange?.([...platformLinks, { platformId: data.id, label: '', linkUrl: '' }])
    }

    setShowNewPlatform(false)
    setNewName('')
    setNewSlug('')
    setNewSlugTouched(false)
  }

  const usedPlatformIds = new Set(platformLinks.map(l => l.platformId).filter(Boolean))

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="text-sm font-medium text-ink-800">Platforms used</legend>
      <p className="mt-1 text-xs text-ink-500">
        Shown on tool cards for Leadership and Developer roles. Hover shows the label; icons link
        out when a URL is set.
      </p>

      <div className="mt-3 space-y-3">
        {platformLinks.map((link, index) => (
          <div
            key={`platform-link-${index}`}
            className="grid gap-2 rounded-xl border border-brand-100 bg-brand-50/40 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_auto]"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-600">Platform</label>
              <select
                value={link.platformId}
                onChange={e => updateLink(index, { platformId: e.target.value })}
                className="w-full rounded-lg border border-brand-200 bg-white px-2.5 py-2 text-sm"
              >
                <option value="">Select…</option>
                {platforms.map(p => (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={usedPlatformIds.has(p.id) && p.id !== link.platformId}
                  >
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-600">Hover label</label>
              <input
                type="text"
                value={link.label}
                onChange={e => updateLink(index, { label: e.target.value })}
                placeholder="e.g. org/repo name"
                className="w-full rounded-lg border border-brand-200 bg-white px-2.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-600">Link URL</label>
              <input
                type="url"
                value={link.linkUrl}
                onChange={e => updateLink(index, { linkUrl: e.target.value })}
                placeholder="https://github.com/org/repo"
                className="w-full rounded-lg border border-brand-200 bg-white px-2.5 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => removeLink(index)}
                className="inline-flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                aria-label="Remove platform"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addLink}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
        >
          <Plus size={16} aria-hidden />
          Add platform
        </button>
        <button
          type="button"
          onClick={() => setShowNewPlatform(v => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand-300 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-brand-50"
        >
          Register new platform type
        </button>
      </div>

      {showNewPlatform ? (
        <form
          onSubmit={handleCreatePlatform}
          className="mt-3 space-y-3 rounded-xl border border-brand-200 bg-white p-4"
        >
          <p className="text-sm font-medium text-ink-900">New platform type</p>
          <p className="text-xs text-ink-500">
            Adds a reusable platform to the list (e.g. AWS, Railway). Default icon can be updated
            later in the database if needed.
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-600">Name</label>
            <input
              type="text"
              value={newName}
              onChange={e => {
                setNewName(e.target.value)
                if (!newSlugTouched) setNewSlug(slugifyPlatformName(e.target.value))
              }}
              className="w-full rounded-lg border border-brand-200 px-2.5 py-2 text-sm"
              placeholder="Railway"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-600">Slug</label>
            <input
              type="text"
              value={newSlug}
              onChange={e => {
                setNewSlugTouched(true)
                setNewSlug(e.target.value)
              }}
              className="w-full rounded-lg border border-brand-200 px-2.5 py-2 font-mono text-sm"
              required
            />
          </div>
          {platformError ? <p className="text-sm text-red-600">{platformError}</p> : null}
          <button
            type="submit"
            disabled={creatingPlatform}
            className="rounded-lg bg-brand-800 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {creatingPlatform ? 'Creating…' : 'Create platform type'}
          </button>
        </form>
      ) : null}
    </fieldset>
  )
}
