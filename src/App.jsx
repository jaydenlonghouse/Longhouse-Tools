import { useCallback, useEffect, useState } from 'react'
import AppShell from './components/AppShell.jsx'
import HubPage from './pages/HubPage.jsx'
import FeatureRequestsPage from './pages/FeatureRequestsPage.jsx'
import SubmitBugPage from './pages/SubmitBugPage.jsx'
import ManageToolsPage from './pages/ManageToolsPage.jsx'
import ManageAccessPage from './pages/ManageAccessPage.jsx'
import { captureHubDeepLinkFromUrl, resolveToolIdBySlug } from './lib/hubDeepLink.js'
import { useTools } from './hooks/useTools.js'

export default function App() {
  const { data: tools } = useTools()
  const [activeView, setActiveView] = useState('tools')
  const [preselectedFeatureToolId, setPreselectedFeatureToolId] = useState(null)
  const [openFeatureSubmitModal, setOpenFeatureSubmitModal] = useState(false)
  const [preselectedBugToolId, setPreselectedBugToolId] = useState(null)
  const [pendingDeepLink, setPendingDeepLink] = useState(() =>
    typeof window !== 'undefined' ? captureHubDeepLinkFromUrl() : null,
  )

  const openFeaturesForTool = useCallback(toolId => {
    setPreselectedFeatureToolId(toolId)
    setOpenFeatureSubmitModal(true)
    setActiveView('features')
  }, [])

  const clearFeatureNavigation = useCallback(() => {
    setPreselectedFeatureToolId(null)
    setOpenFeatureSubmitModal(false)
  }, [])

  const openBugReport = useCallback((toolId = null) => {
    if (toolId) setPreselectedBugToolId(toolId)
    setActiveView('bugs')
  }, [])

  const goToTools = useCallback(() => {
    setActiveView('tools')
  }, [])

  useEffect(() => {
    if (!pendingDeepLink) return

    const { view, toolSlug, openSubmit } = pendingDeepLink
    const toolId = resolveToolIdBySlug(tools, toolSlug)

    if (view === 'features') {
      setActiveView('features')
      if (toolId) setPreselectedFeatureToolId(toolId)
      if (openSubmit) setOpenFeatureSubmitModal(true)
      setPendingDeepLink(null)
      return
    }

    if (view === 'bugs') {
      setActiveView('bugs')
      if (toolId) setPreselectedBugToolId(toolId)
      setPendingDeepLink(null)
      return
    }

    if (view === 'tools' || view === 'manage-tools' || view === 'manage-access') {
      setActiveView(view)
      setPendingDeepLink(null)
    }
  }, [pendingDeepLink, tools])

  function renderView() {
    switch (activeView) {
      case 'features':
        return (
          <FeatureRequestsPage
            preselectedToolId={preselectedFeatureToolId}
            openSubmitModal={openFeatureSubmitModal}
            onPreselectConsumed={clearFeatureNavigation}
          />
        )
      case 'bugs':
        return (
          <SubmitBugPage
            onBack={goToTools}
            preselectedToolId={preselectedBugToolId}
            onPreselectConsumed={() => setPreselectedBugToolId(null)}
          />
        )
      case 'manage-tools':
        return <ManageToolsPage onNavigate={setActiveView} />
      case 'manage-access':
        return <ManageAccessPage onNavigate={setActiveView} />
      case 'tools':
      default:
        return (
          <HubPage
            onRequestFeature={tool => openFeaturesForTool(tool.id)}
            onSubmitBug={() => openBugReport()}
          />
        )
    }
  }

  return (
    <AppShell activeView={activeView} onNavigate={setActiveView}>
      {renderView()}
    </AppShell>
  )
}
