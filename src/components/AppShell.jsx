import { useEffect, useState } from 'react'
import Sidebar from './Sidebar.jsx'

const STORAGE_KEY = 'lh_sidebar_collapsed'

export default function AppShell({ activeView, onNavigate, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {
      // ignore
    }
  }, [collapsed])

  return (
    <div className="flex h-screen max-h-screen overflow-y-hidden">
      <Sidebar
        activeView={activeView}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
        onMobileToggle={open => setMobileOpen(typeof open === 'boolean' ? open : o => !o)}
      />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-brand-50">
        <div className="px-4 pb-8 pt-16 lg:px-8 lg:pt-8">{children}</div>
      </main>
    </div>
  )
}
