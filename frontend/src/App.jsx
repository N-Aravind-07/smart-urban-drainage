import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import DemoBanner from './components/layout/DemoBanner'

// Pages
import DashboardPage from './pages/DashboardPage'
import MapPage from './pages/MapPage'
import DrainageNetworkPage from './pages/DrainageNetworkPage'
import IncidentsPage from './pages/IncidentsPage'
import RainfallPage from './pages/RainfallPage'
import HotspotsPage from './pages/HotspotsPage'
import RiskPage from './pages/RiskPage'
import AnalyticsPage from './pages/AnalyticsPage'
import MLPage from './pages/MLPage'
import InterventionsPage from './pages/InterventionsPage'
import ReportsPage from './pages/ReportsPage'
import DataImportPage from './pages/DataImportPage'
import DataSourcesPage from './pages/DataSourcesPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <DemoBanner />
        <div className="page-content" style={{ padding: 0 }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/drainage-network" element={<DrainageNetworkPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/rainfall" element={<RainfallPage />} />
            <Route path="/hotspots" element={<HotspotsPage />} />
            <Route path="/risk" element={<RiskPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/ml" element={<MLPage />} />
            <Route path="/interventions" element={<InterventionsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/import" element={<DataImportPage />} />
            <Route path="/data-sources" element={<DataSourcesPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
