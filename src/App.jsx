import { useCallback, useState } from 'react'
import AppShell from './components/AppShell.jsx'
import HubPage from './pages/HubPage.jsx'
import FeatureRequestsPage from './pages/FeatureRequestsPage.jsx'
import SubmitBugPage from './pages/SubmitBugPage.jsx'
import ManageToolsPage from './pages/ManageToolsPage.jsx'
import ManageAccessPage from './pages/ManageAccessPage.jsx'

export default function App() {
  const [activeView, setActiveView] = useState('tools')
  const [preselectedFeatureToolId, setPreselectedFeatureToolId] = useState(null)
  const [openFeatureSubmitModal, setOpenFeatureSubmitModal] = useState(false)

  const openFeaturesForTool = useCallback(toolId => {
    setPreselectedFeatureToolId(toolId)
    setOpenFeatureSubmitModal(true)
    setActiveView('features')
  }, [])

  const clearFeatureNavigation = useCallback(() => {
    setPreselectedFeatureToolId(null)
    setOpenFeatureSubmitModal(false)
  }, [])

  const openBugReport = useCallback(() => {
    setActiveView('bugs')
  }, [])

  const goToTools = useCallback(() => {
    setActiveView('tools')
  }, [])

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
        return <SubmitBugPage onBack={goToTools} />
      case 'manage-tools':
        return <ManageToolsPage onNavigate={setActiveView} />
      case 'manage-access':
        return <ManageAccessPage onNavigate={setActiveView} />
      case 'tools':
      default:
        return (
          <HubPage
            onRequestFeature={tool => openFeaturesForTool(tool.id)}
            onSubmitBug={openBugReport}
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
