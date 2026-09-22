import React from 'react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/': { title: 'Madurai Smart Drainage Platform', sub: 'Welcome & System Overview — Madurai Municipal Corporation' },
  '/dashboard': { title: 'Executive Dashboard', sub: 'Overview of drainage network and blockage statistics' },
  '/map': { title: 'GIS Map', sub: 'Interactive drainage network map — Madurai Study Area' },
  '/drainage-network': { title: 'Drainage Network', sub: 'Drainage segments, junctions, and outlets across Madurai' },
  '/incidents': { title: 'Blockage Incidents', sub: 'Historical blockage incident records & field observations' },
  '/rainfall': { title: 'Rainfall Analysis', sub: 'Rainfall patterns and blockage correlation (IMD Madurai)' },
  '/hotspots': { title: 'Hotspot Analysis', sub: 'Spatial clustering of recurring blockage locations' },
  '/risk': { title: 'Risk Analysis', sub: 'Transparent multi-factor risk scoring per drainage segment' },
  '/analytics': { title: 'Analytics', sub: 'Temporal and statistical blockage analysis' },
  '/ml': { title: 'ML Prediction', sub: 'Machine learning hydro-plastic risk prediction module' },
  '/interventions': { title: 'Interventions', sub: 'Municipal action tracking and before/after evaluation' },
  '/reports': { title: 'Reports', sub: 'Generate summary reports for selected ward/period' },
  '/import': { title: 'Data Import', sub: 'Upload CSV records — drains, incidents, rainfall, cleaning' },
  '/data-sources': { title: 'Data Sources', sub: 'Provenance and verification status of all datasets' },
  '/users': { title: 'Users', sub: 'System user management' },
  '/settings': { title: 'Settings', sub: 'Configure risk weights and system parameters' },
}

export default function TopBar() {
  const { pathname } = useLocation()
  const info = PAGE_TITLES[pathname] || { title: 'Smart Drainage', sub: 'Madurai Corporation' }

  return (
    <header className="topbar" role="banner">
      <div style={{ flex: 1 }}>
        <div className="topbar-title">{info.title}</div>
        <div className="topbar-subtitle">{info.sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '4px 10px', fontWeight: 600 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          LIVE GIS NETWORK
        </span>
        <span className="badge badge-info" style={{ fontSize: '11px', padding: '4px 10px', fontWeight: 600 }}>
          🏛️ MADURAI CORPORATION
        </span>
      </div>
    </header>
  )
}
