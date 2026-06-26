import { useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Lightbulb,
  LogOut,
  Menu,
  Boxes,
  UserCog,
  X,
} from 'lucide-react'
import longhouseAdvertisingLogo from '../assets/longhouse-advertising-logo.svg'
import longhouseMark from '../assets/longhouse-mark.svg'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useProfile } from '../hooks/useProfile.js'
import { useUserAccess } from '../hooks/useUserAccess.js'

const NAV_ITEMS = [
  { id: 'tools', label: 'All Tools', icon: LayoutGrid },
  { id: 'features', label: 'Request Feature', icon: Lightbulb },
]

const DEVELOPER_NAV_ITEMS = [
  { id: 'manage-tools', label: 'Manage Tools', icon: Boxes },
  { id: 'manage-access', label: 'Manage Access', icon: UserCog },
]

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

function NavTooltip({ label, children }) {
  const anchorRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  function updatePosition() {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPosition({
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    })
  }

  function show() {
    updatePosition()
    setVisible(true)
  }

  function hide() {
    setVisible(false)
  }

  return (
    <>
      <div
        ref={anchorRef}
        className="hidden lg:flex lg:justify-center"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </div>
      {visible ? (
        <span
          role="tooltip"
          style={{
            top: position.top,
            left: position.left,
            transform: 'translateY(-50%)',
          }}
          className="pointer-events-none fixed z-[100] whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
        >
          {label}
          <span
            className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-ink-900"
            aria-hidden
          />
        </span>
      ) : null}
    </>
  )
}

export default function Sidebar({
  activeView,
  onNavigate,
  mobileOpen,
  collapsed,
  onToggleCollapse,
  onMobileToggle,
}) {
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile()
  const { isDeveloper } = useUserAccess()

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User'
  const email = profile?.email || user?.email || ''
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url

  function handleNav(id) {
    onNavigate(id)
    onMobileToggle?.(false)
  }

  const widthClass = collapsed ? 'lg:w-[4.5rem]' : 'lg:w-60'

  function navButtonClass(active) {
    return [
      'flex w-full rounded-lg text-sm font-medium transition-colors',
      'items-center gap-2.5 px-3 py-2 text-left',
      collapsed ? 'lg:justify-center lg:gap-0 lg:p-2.5' : '',
      active ? 'bg-white/10 text-white' : 'text-brand-100 hover:bg-white/5 hover:text-white',
    ].join(' ')
  }

  function renderNavList(items) {
    return items.map(({ id, label, icon: Icon }) => {
      const active = activeView === id
      const expandedButton = (
        <button type="button" onClick={() => handleNav(id)} className={navButtonClass(active)}>
          <Icon size={20} className="shrink-0" aria-hidden />
          {label}
        </button>
      )

      if (!collapsed) {
        return <li key={id}>{expandedButton}</li>
      }

      return (
        <li key={id}>
          <div className="lg:hidden">{expandedButton}</div>
          <NavTooltip label={label}>
            <button
              type="button"
              onClick={() => handleNav(id)}
              aria-label={label}
              className={`${navButtonClass(active)} hidden lg:flex`}
            >
              <Icon size={20} className="shrink-0" aria-hidden />
            </button>
          </NavTooltip>
        </li>
      )
    })
  }

  const sidebarContent = (
    <>
      <div
        className={`flex items-center border-b border-white/10 ${
          collapsed ? 'justify-between px-4 py-5 lg:justify-center lg:px-2 lg:py-4' : 'justify-between px-4 py-5'
        }`}
      >
        <button
          type="button"
          onClick={() => handleNav('tools')}
          aria-label="All Tools"
          className="shrink-0 rounded-lg transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <img
            src={longhouseAdvertisingLogo}
            alt=""
            className={`h-8 w-auto object-contain ${collapsed ? 'lg:hidden' : ''}`}
          />
          <img
            src={longhouseMark}
            alt=""
            className={`hidden h-8 w-8 object-contain ${collapsed ? 'lg:block' : ''}`}
          />
        </button>
        <button
          type="button"
          className="rounded-lg p-1.5 text-brand-200 hover:bg-white/10 lg:hidden"
          onClick={() => onMobileToggle?.(false)}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <p
          className={`px-3 text-xs font-semibold uppercase tracking-wider text-brand-300/80 ${
            collapsed ? 'lg:hidden' : ''
          }`}
        >
          Hub
        </p>
        <ul className={`mt-2 space-y-1 ${collapsed ? 'lg:mt-2' : ''}`}>{renderNavList(NAV_ITEMS)}</ul>
        {isDeveloper ? (
          <>
            <p
              className={`mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-brand-300/80 ${
                collapsed ? 'lg:hidden' : ''
              }`}
            >
              Admin
            </p>
            <ul className={`mt-2 space-y-1 ${collapsed ? 'lg:mt-2' : ''}`}>
              {renderNavList(DEVELOPER_NAV_ITEMS)}
            </ul>
          </>
        ) : null}
      </nav>

      <div className={`border-t border-white/10 p-4 ${collapsed ? 'lg:p-2' : ''}`}>
        <div
          className={`flex items-center gap-3 ${collapsed ? 'lg:flex-col lg:justify-center lg:gap-2' : ''}`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/20"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white ring-2 ring-white/20">
              {getInitials(displayName, email)}
            </div>
          )}
          <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="truncate text-xs text-brand-200/80">{email}</p>
          </div>
        </div>

        {collapsed ? (
          <>
            <button
              type="button"
              onClick={signOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-brand-100 transition-colors hover:bg-white/10 lg:hidden"
            >
              <LogOut size={16} />
              Sign Out
            </button>
            <NavTooltip label="Sign Out">
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign Out"
                className="mt-3 hidden w-full items-center justify-center rounded-lg border border-white/15 p-2.5 text-brand-100 transition-colors hover:bg-white/10 lg:mt-2 lg:flex"
              >
                <LogOut size={18} />
              </button>
            </NavTooltip>
          </>
        ) : (
          <button
            type="button"
            onClick={signOut}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-brand-100 transition-colors hover:bg-white/10"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        )}
      </div>
    </>
  )

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 rounded-lg bg-brand-800 p-2 text-white shadow-lg lg:hidden"
        onClick={() => onMobileToggle?.(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => onMobileToggle?.(false)}
          aria-label="Close overlay"
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh flex-col transition-[width,transform] duration-200 ease-in-out ${widthClass} w-60 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <aside className="flex h-full w-full flex-col overflow-hidden bg-brand-800">
          {sidebarContent}
        </aside>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute top-1/2 -right-3.5 z-[60] hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-800 shadow-[0_2px_8px_rgba(2,22,61,0.18)] transition-colors hover:border-brand-300 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 lg:flex"
        >
          {collapsed ? (
            <ChevronRight size={17} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={17} strokeWidth={2.5} />
          )}
        </button>
      </div>
    </>
  )
}
